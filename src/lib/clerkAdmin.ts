import { createClerkClient } from '@clerk/backend';

// Initialize Clerk client with secret key
const clerkClient = createClerkClient({
  secretKey: import.meta.env.VITE_CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY,
});

export interface CreateUserData {
  emailAddress: string[];
  firstName?: string;
  lastName?: string;
  publicMetadata?: Record<string, any>;
  privateMetadata?: Record<string, any>;
  skipPasswordChecks?: boolean;
  skipPasswordRequirement?: boolean;
  password?: string;
}

export interface ClerkUser {
  id: string;
  emailAddresses: Array<{
    emailAddress: string;
    id: string;
  }>;
  firstName: string | null;
  lastName: string | null;
  publicMetadata: Record<string, any>;
  privateMetadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export const clerkAdminService = {
  async createUser(userData: CreateUserData): Promise<ClerkUser> {
    try {
      const user = await clerkClient.users.createUser({
        emailAddress: userData.emailAddress,
        firstName: userData.firstName,
        lastName: userData.lastName,
        publicMetadata: userData.publicMetadata,
        privateMetadata: userData.privateMetadata,
        skipPasswordChecks: userData.skipPasswordChecks || true,
        skipPasswordRequirement: userData.skipPasswordRequirement || true,
        password: userData.password,
      });

      return user as ClerkUser;
    } catch (error) {
      console.error('Error creating user with Clerk:', error);
      throw error;
    }
  },

  async getUserById(userId: string): Promise<ClerkUser | null> {
    try {
      const user = await clerkClient.users.getUser(userId);
      return user as ClerkUser;
    } catch (error) {
      console.error('Error fetching user with Clerk:', error);
      return null;
    }
  },

  async updateUser(userId: string, updates: Partial<CreateUserData>): Promise<ClerkUser> {
    try {
      const user = await clerkClient.users.updateUser(userId, {
        firstName: updates.firstName,
        lastName: updates.lastName,
        publicMetadata: updates.publicMetadata,
        privateMetadata: updates.privateMetadata,
      });

      return user as ClerkUser;
    } catch (error) {
      console.error('Error updating user with Clerk:', error);
      throw error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      await clerkClient.users.deleteUser(userId);
    } catch (error) {
      console.error('Error deleting user with Clerk:', error);
      throw error;
    }
  },

  async getUsers(limit?: number, offset?: number): Promise<ClerkUser[]> {
    try {
      const users = await clerkClient.users.getUserList({
        limit: limit || 100,
        offset: offset || 0,
      });

      return users.data as ClerkUser[];
    } catch (error) {
      console.error('Error fetching users with Clerk:', error);
      throw error;
    }
  }
};