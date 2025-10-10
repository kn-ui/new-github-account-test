import { hygraphClient } from '../config/hygraph';
import {
  GET_USERS,
  GET_USER_BY_ID,
  GET_USER_BY_UID,
  GET_USER_BY_EMAIL,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER
} from '../lib/hygraphOperations';

// Types for Hygraph data
export interface HygraphUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  passwordChanged: boolean;
  dateCreated: string;
  dateUpdated: string;
}

export interface CreateUserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive?: boolean;
  passwordChanged?: boolean;
}

export interface UpdateUserData {
  email?: string;
  displayName?: string;
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive?: boolean;
  passwordChanged?: boolean;
}

// Hygraph User Service for Backend
export const hygraphUserService = {
  // Get all users with pagination
  async getUsers(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphUser[]> {
    try {
      const response = await hygraphClient.request(GET_USERS, {
        first: limit,
        skip: offset,
        where: where || {}
      });
      return (response as any).appUsers || [];
    } catch (error) {
      console.error('Error fetching users from Hygraph:', error);
      throw error;
    }
  },

  // Get user by ID
  async getUserById(id: string): Promise<HygraphUser | null> {
    try {
      const response = await hygraphClient.request(GET_USER_BY_ID, { id });
      return (response as any).appUser || null;
    } catch (error) {
      console.error('Error fetching user by ID from Hygraph:', error);
      throw error;
    }
  },

  // Get user by UID (Clerk user ID)
  async getUserByUid(uid: string): Promise<HygraphUser | null> {
    try {
      const response = await hygraphClient.request(GET_USER_BY_UID, { uid });
      return (response as any).appUser || null;
    } catch (error) {
      console.error('Error fetching user by UID from Hygraph:', error);
      throw error;
    }
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<HygraphUser | null> {
    try {
      const response = await hygraphClient.request(GET_USER_BY_EMAIL, { email });
      return (response as any).appUser || null;
    } catch (error) {
      console.error('Error fetching user by email from Hygraph:', error);
      throw error;
    }
  },

  // Create a new user
  async createUser(userData: CreateUserData): Promise<HygraphUser> {
    try {
      const now = new Date().toISOString();
      const response = await hygraphClient.request(CREATE_USER, {
        data: {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          isActive: userData.isActive ?? true,
          passwordChanged: userData.passwordChanged ?? true,
          dateCreated: now,
          dateUpdated: now
        }
      });
      return (response as any).createAppUser;
    } catch (error) {
      console.error('Error creating user in Hygraph:', error);
      throw error;
    }
  },

  // Update user
  async updateUser(id: string, userData: UpdateUserData): Promise<HygraphUser> {
    try {
      const response = await hygraphClient.request(UPDATE_USER, {
        id,
        data: {
          ...userData,
          dateUpdated: new Date().toISOString()
        }
      });
      return (response as any).updateAppUser;
    } catch (error) {
      console.error('Error updating user in Hygraph:', error);
      throw error;
    }
  },

  // Delete user
  async deleteUser(id: string): Promise<void> {
    try {
      await hygraphClient.request(DELETE_USER, { id });
    } catch (error) {
      console.error('Error deleting user from Hygraph:', error);
      throw error;
    }
  },

  // Search users
  async searchUsers(query: string, limit: number = 50): Promise<HygraphUser[]> {
    try {
      const response = await hygraphClient.request(GET_USERS, {
        first: limit,
        skip: 0,
        where: {
          OR: [
            { displayName_contains: query },
            { email_contains: query }
          ]
        }
      });
      return (response as any).appUsers || [];
    } catch (error) {
      console.error('Error searching users in Hygraph:', error);
      throw error;
    }
  },

  // Get users by role
  async getUsersByRole(role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN', limit: number = 100): Promise<HygraphUser[]> {
    try {
      const response = await hygraphClient.request(GET_USERS, {
        first: limit,
        skip: 0,
        where: { role }
      });
      return (response as any).appUsers || [];
    } catch (error) {
      console.error('Error fetching users by role from Hygraph:', error);
      throw error;
    }
  },

  // Get active users only
  async getActiveUsers(limit: number = 100): Promise<HygraphUser[]> {
    try {
      const response = await hygraphClient.request(GET_USERS, {
        first: limit,
        skip: 0,
        where: { isActive: true }
      });
      return (response as any).appUsers || [];
    } catch (error) {
      console.error('Error fetching active users from Hygraph:', error);
      throw error;
    }
  },

  // Get user statistics
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    students: number;
    teachers: number;
    admins: number;
  }> {
    try {
      const [allUsers, activeUsers, students, teachers, admins] = await Promise.all([
        this.getUsers(1000, 0).catch(err => { console.error('Error fetching all users:', err); return []; }),
        this.getActiveUsers(1000).catch(err => { console.error('Error fetching active users:', err); return []; }),
        this.getUsersByRole('STUDENT', 1000).catch(err => { console.error('Error fetching students:', err); return []; }),
        this.getUsersByRole('TEACHER', 1000).catch(err => { console.error('Error fetching teachers:', err); return []; }),
        this.getUsersByRole('ADMIN', 1000).catch(err => { console.error('Error fetching admins:', err); return []; })
      ]);

      return {
        totalUsers: allUsers.length,
        activeUsers: activeUsers.length,
        students: students.length,
        teachers: teachers.length,
        admins: admins.length
      };
    } catch (error) {
      console.error('Error fetching user stats from Hygraph:', error);
      // Return default values instead of throwing
      return {
        totalUsers: 0,
        activeUsers: 0,
        students: 0,
        teachers: 0,
        admins: 0
      };
    }
  },

  // Get teachers with pagination
  async getTeachers(limit: number = 100, offset: number = 0): Promise<HygraphUser[]> {
    try {
      return await this.getUsers(limit, offset, { role: 'TEACHER' });
    } catch (error) {
      console.error('Error fetching teachers from Hygraph:', error);
      // Return empty array instead of throwing to prevent 500 errors
      return [];
    }
  }
};