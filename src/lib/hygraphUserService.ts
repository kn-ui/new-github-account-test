import { hygraphClient } from './hygraph';
import {
  GET_USERS,
  GET_USER_BY_ID,
  GET_USER_BY_UID,
  GET_USER_BY_EMAIL,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER
} from './hygraphOperations';

// Types for Hygraph data
export interface HygraphUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  passwordChanged: boolean;
  createdAt: string;
  updatedAt: string;
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

// Hygraph User Service
export const hygraphUserService = {
  // Get all users with pagination
  async getUsers(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphUser[]> {
    try {
      const response = await hygraphClient.request(GET_USERS, {
        first: limit,
        skip: offset,
        where: where || {}
      });
      return response.appUsers || [];
    } catch (error) {
      console.error('Error fetching users from Hygraph:', error);
      throw error;
    }
  },

  // Get user by ID
  async getUserById(id: string): Promise<HygraphUser | null> {
    try {
      const response = await hygraphClient.request(GET_USER_BY_ID, { id });
      return response.appUser || null;
    } catch (error) {
      console.error('Error fetching user by ID from Hygraph:', error);
      throw error;
    }
  },

  // Get user by UID (Clerk user ID)
  async getUserByUid(uid: string): Promise<HygraphUser | null> {
    try {
      const response = await hygraphClient.request(GET_USER_BY_UID, { uid });
      return response.appUser || null;
    } catch (error) {
      console.error('Error fetching user by UID from Hygraph:', error);
      throw error;
    }
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<HygraphUser | null> {
    try {
      const response = await hygraphClient.request(GET_USER_BY_EMAIL, { email });
      return response.appUser || null;
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
        }
      });
      return response.createAppUser;
    } catch (error: any) {
      console.error('Error creating user in Hygraph:', error);
      console.error('Full error details:', error);
      
      // Re-throw the original error for debugging
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
        }
      });
      return response.updateAppUser;
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
      return response.appUsers || [];
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
      return response.appUsers || [];
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
      return response.appUsers || [];
    } catch (error) {
      console.error('Error fetching active users from Hygraph:', error);
      throw error;
    }
  }
};