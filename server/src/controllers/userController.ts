import { Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import userService from '../services/userService';
import { createClerkClient } from '@clerk/backend';
import pLimit from 'p-limit';
import { createHygraphUser } from '../lib/hygraph';
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

      // Step 2: Create user in Hygraph using Clerk UID as canonical uid
      try {
        await createHygraphUser({
          uid: clerkUser.id,
          email,
          displayName,
          role: role || UserRole.STUDENT,
          isActive: true,
        });
      } catch (hyErr: any) {
        // Attempt rollback of Clerk user to avoid orphan accounts on failures
        try {
          await clerkClient.users.deleteUser(clerkUser.id);
        } catch (rbErr) {
          console.error('Failed to rollback Clerk user after Hygraph failure', rbErr);
        }
        throw hyErr;
      }

      // Step 3: Create user in Firestore (legacy for read-paths)
      const newUser = await userService.createUser({
        uid: clerkUser.id,
        email,
        displayName,
        role: role || UserRole.STUDENT,
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

  // Admin: Bulk create users with limited concurrency and optional rollback
  async bulkCreateUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const rollbackOnHygraphFail = String(req.query.rollbackOnHygraphFail || 'false') === 'true';
    const maxConcurrency = Math.min(
      Math.max(parseInt(String(req.query.concurrency || '3')) || 3, 1),
      5
    );
    const users: Array<{ email: string; displayName: string; role?: UserRole; isActive?: boolean }> = req.body?.users || [];

    if (!Array.isArray(users) || users.length === 0) {
      sendError(res, 'No users provided');
      return;
    }

    const limit = pLimit(maxConcurrency);
    const results: Array<{
      rowIndex: number;
      email: string;
      clerkResult?: { id: string } | null;
      hygraphResult?: { uid: string } | null;
      rolledBack?: boolean;
      error?: string;
    }> = [];

    await Promise.all(
      users.map((u, index) =>
        limit(async () => {
          const result: any = { rowIndex: index, email: u.email };
          try {
            const clerkUser = await clerkClient.users.createUser({
              emailAddress: [u.email],
              firstName: u.displayName?.split(' ')[0] || '',
              lastName: u.displayName?.split(' ').slice(1).join(' ') || '',
              publicMetadata: { role: u.role || UserRole.STUDENT },
              skipPasswordChecks: true,
              skipPasswordRequirement: true,
            });
            result.clerkResult = { id: clerkUser.id };

            try {
              const created = await createHygraphUser({
                uid: clerkUser.id,
                email: u.email,
                displayName: u.displayName,
                role: u.role || UserRole.STUDENT,
                isActive: u.isActive ?? true,
              });
              result.hygraphResult = { uid: created.uid };
            } catch (hyErr: any) {
              result.error = `Hygraph error: ${hyErr?.message || 'Unknown error'}`;
              if (rollbackOnHygraphFail && result.clerkResult?.id) {
                try {
                  await clerkClient.users.deleteUser(result.clerkResult.id);
                  result.rolledBack = true;
                } catch (rbErr: any) {
                  result.error += ` | Rollback failed: ${rbErr?.message || 'Unknown'}`;
                  result.rolledBack = false;
                }
              }
            }
          } catch (ckErr: any) {
            result.error = `Clerk error: ${ckErr?.message || 'Unknown error'}`;
          } finally {
            results[index] = result;
          }
        })
      )
    );

    const summary = {
      total: users.length,
      successCount: results.filter(r => r.hygraphResult && r.clerkResult && !r.error).length,
      failureCount: results.filter(r => r.error).length,
      results,
    };

    sendSuccess(res, 'Bulk user creation completed', summary);
  }

// Create or update user profile
async createOrUpdateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { displayName, phoneNumber, dateOfBirth, address, profileImage, role } = req.body;
    const uid = req.user!.uid;
    const email = req.user!.email;

    console.log('Creating/updating profile for user:', { uid, email, displayName, role });

    // Check if user already exists by email
    const existingUser = await userService.getUserByEmail(email!);

    if (existingUser) {
      console.log('User exists, updating profile');
      // Update existing user
      const updatedUser = await userService.updateUser(existingUser.uid, {
        displayName,
        phoneNumber,
        dateOfBirth,
        address,
        profileImage,
        role: role || existingUser.role
      });

      sendSuccess(res, 'Profile updated successfully', updatedUser);
    } else {
      console.log('User does not exist, creating new profile');
      // Create new user profile
      const newUser = await userService.createUser({
        uid: uid,
        email: email || '',
        displayName: displayName || 'New User',
        phoneNumber,
        dateOfBirth,
        address,
        profileImage,
        role: role || UserRole.STUDENT
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
      const user = await userService.getUserById(uid);

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

      const updatedUser = await userService.updateUser(uid, {
        displayName,
        phoneNumber,
        dateOfBirth,
        address,
        profileImage
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
      const user = await userService.getUserById(userId);

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

      const result = await userService.getAllUsers(page, limit, role);

      sendPaginatedResponse(
        res,
        'Users retrieved successfully',
        result.users,
        page,
        limit,
        result.total
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

      const result = await userService.searchUsers(searchTerm, page, limit);

      sendPaginatedResponse(
        res,
        'Users search completed',
        result.users,
        page,
        limit,
        result.total
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

      const updatedUser = await userService.updateUserRole(userId, role);
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

      await userService.deactivateUser(userId);
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
      await userService.activateUser(userId);
      sendSuccess(res, 'User activated successfully');
    } catch (error) {
      console.error('Activate user error:', error);
      sendServerError(res, 'Failed to activate user');
    }
  }

  // Get user statistics (admin only)
  async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await userService.getUserStats();
      sendSuccess(res, 'User statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get user stats error:', error);
      sendServerError(res, 'Failed to get user statistics');
    }
  }
}

export default new UserController();