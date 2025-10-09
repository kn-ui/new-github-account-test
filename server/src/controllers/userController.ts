import { Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { hygraphUserService } from '../services/hygraphService';
import { createClerkClient } from '@clerk/backend';
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendPaginatedResponse,
  sendServerError
} from '../utils/response';

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export class UserController {
  // Admin: Create a new user
  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, displayName, role } = req.body;

      // Step 1: Create user in Clerk
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        firstName: displayName.split(' ')[0],
        lastName: displayName.split(' ').slice(1).join(' ') || '',
        publicMetadata: {
          role: role || UserRole.STUDENT
        },
        skipPasswordChecks: true,
        skipPasswordRequirement: true,
      });

      // Step 2: Create user in Hygraph
      const newUser = await hygraphUserService.createUser({
        uid: clerkUser.id,
        email,
        displayName,
        role: (role || UserRole.STUDENT) as 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN',
        isActive: true,
        passwordChanged: true
      });

      sendCreated(res, 'User created successfully', newUser);
    } catch (error: any) {
      console.error('Create user error:', error);
      if (error.message?.includes('email_address_taken')) {
        sendError(res, 'Email already in use', undefined, 409);
      } else {
        sendServerError(res, 'Failed to create user');
      }
    }
  }

// Create or update user profile
async createOrUpdateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { displayName, phoneNumber, dateOfBirth, address, profileImage, role } = req.body;
    const uid = req.user!.uid;
    const email = req.user!.email;

    console.log('Creating/updating profile for user:', { uid, email, displayName, role });

    // Check if user already exists by UID
    const existingUser = await hygraphUserService.getUserByUid(uid);

    if (existingUser) {
      console.log('User exists, updating profile');
      // Update existing user
      const updatedUser = await hygraphUserService.updateUser(existingUser.id, {
        displayName,
        role: (role || existingUser.role) as 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN'
      });

      sendSuccess(res, 'Profile updated successfully', updatedUser);
    } else {
      console.log('User does not exist, creating new profile');
      // Create new user profile
      const newUser = await hygraphUserService.createUser({
        uid: uid,
        email: email || '',
        displayName: displayName || 'New User',
        role: (role || UserRole.STUDENT) as 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN',
        isActive: true,
        passwordChanged: true
      });

      console.log('New user created:', newUser);
      sendCreated(res, 'Profile created successfully', newUser);
    }
  } catch (error) {
    console.error('Create/Update profile error:', error);
    sendServerError(res, 'Failed to create or update profile');
  }
}

  // Get current user profile
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const uid = req.user!.uid;
      const user = await hygraphUserService.getUserByUid(uid);

      if (!user) {
        sendNotFound(res, 'User profile not found');
        return;
      }

      sendSuccess(res, 'Profile retrieved successfully', user);
    } catch (error) {
      console.error('Get profile error:', error);
      sendServerError(res, 'Failed to get profile');
    }
  }

  // Update current user profile
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { displayName, phoneNumber, dateOfBirth, address, profileImage } = req.body;
      const uid = req.user!.uid;

      // First get the user to get their Hygraph ID
      const user = await hygraphUserService.getUserByUid(uid);
      if (!user) {
        sendNotFound(res, 'User not found');
        return;
      }

      const updatedUser = await hygraphUserService.updateUser(user.id, {
        displayName
      });

      sendSuccess(res, 'Profile updated successfully', updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      sendServerError(res, 'Failed to update profile');
    }
  }

  // Get user by ID (admin/teacher access)
  async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await hygraphUserService.getUserById(userId);

      if (!user) {
        sendNotFound(res, 'User not found');
        return;
      }

      sendSuccess(res, 'User retrieved successfully', user);
    } catch (error) {
      console.error('Get user by ID error:', error);
      sendServerError(res, 'Failed to get user');
    }
  }

  // Get all users with pagination and filtering (admin only)
  async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const role = req.query.role as UserRole;

      const skip = (page - 1) * limit;
      const where = role ? { role } : {};
      
      const users = await hygraphUserService.getUsers({ first: limit, skip, where });
      
      // For now, we'll get all users to calculate total. In production, you might want to implement a count query
      const allUsers = await hygraphUserService.getUsers();
      const total = allUsers.length;

      sendPaginatedResponse(
        res,
        'Users retrieved successfully',
        users,
        page,
        limit,
        total
      );
    } catch (error) {
      console.error('Get all users error:', error);
      sendServerError(res, 'Failed to get users');
    }
  }

  // Search users (admin/teacher access)
  async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { q: searchTerm } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!searchTerm || typeof searchTerm !== 'string') {
        sendError(res, 'Search term is required');
        return;
      }

      const users = await hygraphUserService.searchUsers(searchTerm);
      
      // Apply pagination manually since Hygraph search doesn't support pagination directly
      const skip = (page - 1) * limit;
      const paginatedUsers = users.slice(skip, skip + limit);

      sendPaginatedResponse(
        res,
        'Users search completed',
        paginatedUsers,
        page,
        limit,
        users.length
      );
    } catch (error) {
      console.error('Search users error:', error);
      sendServerError(res, 'Failed to search users');
    }
  }

  // Update user role (admin or super admin only)
  async updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!Object.values(UserRole).includes(role)) {
        sendError(res, 'Invalid role specified');
        return;
      }

      const updatedUser = await hygraphUserService.updateUser(userId, {
        role: role as 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN'
      });
      sendSuccess(res, 'User role updated successfully', updatedUser);
    } catch (error) {
      console.error('Update user role error:', error);
      sendServerError(res, 'Failed to update user role');
    }
  }

  // Deactivate user (admin only)
  async deactivateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      // Prevent admin from deactivating themselves
      if (userId === req.user!.uid) {
        sendError(res, 'Cannot deactivate your own account');
        return;
      }

      await hygraphUserService.updateUser(userId, { isActive: false });
      sendSuccess(res, 'User deactivated successfully');
    } catch (error) {
      console.error('Deactivate user error:', error);
      sendServerError(res, 'Failed to deactivate user');
    }
  }

  // Activate user (admin only)
  async activateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      await hygraphUserService.updateUser(userId, { isActive: true });
      sendSuccess(res, 'User activated successfully');
    } catch (error) {
      console.error('Activate user error:', error);
      sendServerError(res, 'Failed to activate user');
    }
  }

  // Get user statistics (admin only)
  async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await hygraphUserService.getUserStats();
      sendSuccess(res, 'User statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get user stats error:', error);
      sendServerError(res, 'Failed to get user statistics');
    }
  }
}

export default new UserController();