/* eslint-disable @typescript-eslint/no-explicit-any */
import { firestore, auth, isTestMode } from '../config/firebase';
import { User, UserRole } from '../types';

class UserService {
  private usersCollection = firestore?.collection('users');
  
  // In-memory store for test mode
  private testUsers: Map<string, User> = new Map();

// Create a new user in Firestore
async createUser(userData: Partial<User>): Promise<User> {
  try {
    if (isTestMode || !this.usersCollection) {
      console.log('Test mode: User creation simulated');
      const newUser: User = {
        uid: userData.uid!,
        email: userData.email!,
        displayName: userData.displayName!,
        role: userData.role || UserRole.STUDENT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store in memory for consistency in test mode
      this.testUsers.set(newUser.uid, newUser);
      console.log('Test user stored:', newUser);
      
      return newUser;
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
  try {
    if (isTestMode || !this.usersCollection) {
      // In test mode, check the in-memory store
      const testUser = this.testUsers.get(uid);
      console.log('Test mode: getUserById for', uid, 'found:', !!testUser);
      return testUser || null;
    }

    const userDoc = await this.usersCollection.doc(uid).get();
    
    if (!userDoc.exists) {
      return null;
    }

    return { uid, ...userDoc.data() } as User;
  } catch (error) {
    console.error('Error getting user:', error);
    throw new Error('Failed to get user');
  }
}

// Get user by email
async getUserByEmail(email: string): Promise<User | null> {
  try {
    if (isTestMode || !this.usersCollection) {
      // In test mode, search the in-memory store
      for (const user of this.testUsers.values()) {
        if (user.email === email) {
          console.log('Test mode: getUserByEmail found user for', email);
          return user;
        }
      }
      console.log('Test mode: getUserByEmail - no user found for', email);
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
    if (isTestMode || !this.usersCollection) {
      console.log('Test mode: User update simulated');
      // Return mock updated user
      return {
        uid,
        email: 'test@example.com',
        displayName: updateData.displayName || 'Test User',
        role: updateData.role || UserRole.STUDENT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
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
      // Return mock data in test mode
      if (isTestMode || !this.usersCollection) {
        const mockUsers: User[] = [
          {
            uid: 'user-1',
            email: 'student@demo.com',
            displayName: 'John Student',
            role: UserRole.STUDENT,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            uid: 'user-2',
            email: 'teacher@demo.com',
            displayName: 'Jane Teacher',
            role: UserRole.TEACHER,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            uid: 'user-3',
            email: 'admin@demo.com',
            displayName: 'Admin User',
            role: UserRole.ADMIN,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        // Filter by role if specified
        let filteredUsers = mockUsers;
        if (role) {
          filteredUsers = mockUsers.filter(user => user.role === role);
        }

        const offset = (page - 1) * limit;
        const paginatedUsers = filteredUsers.slice(offset, offset + limit);

        return {
          users: paginatedUsers,
          total: filteredUsers.length,
          page,
          totalPages: Math.ceil(filteredUsers.length / limit)
        };
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
      if (isTestMode || !this.usersCollection) {
        console.log('Test mode: User deactivation simulated');
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
      if (isTestMode || !this.usersCollection) {
        console.log('Test mode: User activation simulated');
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