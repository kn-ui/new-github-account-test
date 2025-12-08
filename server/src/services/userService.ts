/* eslint-disable @typescript-eslint/no-explicit-any */
import { firestore, auth } from '../config/firebase';
import { User, UserRole } from '../types';

class UserService {
  private usersCollection = firestore?.collection('users');

  // Create a new user in Firestore
  async createUser(userData: Partial<User>): Promise<User> {
    try {
      if (!this.usersCollection) {
        throw new Error('Users collection not initialized');
      }

      const { uid, ...data } = userData;
      if (!uid) {
        throw new Error('UID is required to create a user');
      }

      const newUserDoc = {
        email: data.email || '',
        displayName: data.displayName || 'New User',
        role: data.role || UserRole.STUDENT,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.usersCollection.doc(uid).set(newUserDoc);

      return { uid, ...newUserDoc } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  // Get user by UID
async getUserById(uid: string): Promise<User | null> {
  console.log(`[userService.getUserById] Fetching user doc ${uid}`);

  if (!this.usersCollection) {
    console.error("Users collection not initialized");
    return null;
  }

  const doc = await this.usersCollection.doc(uid).get();

  if (!doc.exists) {
    console.log(`[userService.getUserById] User not found: ${uid}`);
    return null;
  }

  const userData = doc.data();
  return { uid: doc.id, ...userData } as User;
}


  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      if (!this.usersCollection) {
        return null;
      }

      const querySnapshot = await this.usersCollection
        .where('email', '==', email)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return { uid: doc.id, ...doc.data() } as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new Error('Failed to get user');
    }
  }

  // Update user
  async updateUser(uid: string, updateData: Partial<User>): Promise<User> {
    try {
      if (!this.usersCollection) {
        throw new Error('Users collection not initialized');
      }

      // Filter out undefined values
      const updateDoc: any = {
        updatedAt: new Date()
      };

      // Only add defined values to the update object
      Object.keys(updateData).forEach(key => {
        const value = updateData[key as keyof Partial<User>];
        if (value !== undefined && value !== null) {
          updateDoc[key] = value;
        }
      });

      await this.usersCollection.doc(uid).update(updateDoc);
      
      const updatedUser = await this.getUserById(uid);
      if (!updatedUser) {
        throw new Error('User not found after update');
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  // Update user role (admin only)
  async updateUserRole(uid: string, newRole: UserRole): Promise<User> {
    try {
      if (!this.usersCollection) {
        throw new Error('Users collection not initialized');
      }

      const updateData = {
        role: newRole,
        updatedAt: new Date()
      };

      await this.usersCollection.doc(uid).update(updateData);
      
      const updatedUser = await this.getUserById(uid);
      if (!updatedUser) {
        throw new Error('User not found after role update');
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  }

  // Get all users with pagination
  async getAllUsers(page: number = 1, limit: number = 10, role?: UserRole): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      if (!this.usersCollection) {
        return { users: [], total: 0, page, totalPages: 0 };
      }

      let query = this.usersCollection.orderBy('createdAt', 'desc');

      if (role) {
        query = query.where('role', '==', role) as any;
      }

      // Get total count
      const totalSnapshot = await query.get();
      const total = totalSnapshot.size;

      // Get paginated results
      const offset = (page - 1) * limit;
      const snapshot = await query.offset(offset).limit(limit).get();

      const users: User[] = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as User));

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to get users');
    }
  }

  // Search users by name or email
  async searchUsers(searchTerm: string, page: number = 1, limit: number = 10): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      if (!this.usersCollection) {
        return { users: [], total: 0, page, totalPages: 0 };
      }

      // Note: Firestore doesn't support full-text search, so we'll use a basic approach
      // In production, consider using Algolia or Elasticsearch for better search
      
      const emailQuery = this.usersCollection
        .where('email', '>=', searchTerm.toLowerCase())
        .where('email', '<=', searchTerm.toLowerCase() + '\uf8ff');

      const nameQuery = this.usersCollection
        .where('displayName', '>=', searchTerm)
        .where('displayName', '<=', searchTerm + '\uf8ff');

      const [emailResults, nameResults] = await Promise.all([
        emailQuery.get(),
        nameQuery.get()
      ]);

      // Combine and deduplicate results
      const userMap = new Map<string, User>();
      
      emailResults.docs.forEach(doc => {
        userMap.set(doc.id, { uid: doc.id, ...doc.data() } as User);
      });
      
      nameResults.docs.forEach(doc => {
        userMap.set(doc.id, { uid: doc.id, ...doc.data() } as User);
      });

      const allUsers = Array.from(userMap.values());
      const total = allUsers.length;

      // Manual pagination
      const offset = (page - 1) * limit;
      const users = allUsers.slice(offset, offset + limit);

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  // Deactivate user
  async deactivateUser(uid: string): Promise<void> {
    try {
      if (!this.usersCollection) {
        return;
      }

      await this.usersCollection.doc(uid).update({
        isActive: false,
        updatedAt: new Date()
      });

      // Optionally disable the user in Firebase Auth
      if (auth) {
        await auth.updateUser(uid, { disabled: true });
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw new Error('Failed to deactivate user');
    }
  }

  // Activate user
  async activateUser(uid: string): Promise<void> {
    try {
      if (!this.usersCollection) {
        return;
      }

      await this.usersCollection.doc(uid).update({
        isActive: true,
        updatedAt: new Date()
      });

      // Re-enable the user in Firebase Auth
      if (auth) {
        await auth.updateUser(uid, { disabled: false });
      }
    } catch (error) {
      console.error('Error activating user:', error);
      throw new Error('Failed to activate user');
    }
  }

  // Get user statistics
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
  }> {
    try {
      if (!this.usersCollection) {
        return { totalUsers: 0, activeUsers: 0, totalStudents: 0, totalTeachers: 0, totalAdmins: 0 };
      }

      const [
        totalUsersSnapshot,
        activeUsersSnapshot,
        studentsSnapshot,
        teachersSnapshot,
        adminsSnapshot
      ] = await Promise.all([
        this.usersCollection.get(),
        this.usersCollection.where('isActive', '==', true).get(),
        this.usersCollection.where('role', '==', UserRole.STUDENT).get(),
        this.usersCollection.where('role', '==', UserRole.TEACHER).get(),
        this.usersCollection.where('role', '==', UserRole.ADMIN).get()
      ]);

      return {
        totalUsers: totalUsersSnapshot.size,
        activeUsers: activeUsersSnapshot.size,
        totalStudents: studentsSnapshot.size,
        totalTeachers: teachersSnapshot.size,
        totalAdmins: adminsSnapshot.size
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Failed to get user statistics');
    }
  }
}

export default new UserService();