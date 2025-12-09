import { Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import userService from '../services/userService';
import { auth as adminAuth, firestore } from '../config/firebase';
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendPaginatedResponse,
  sendServerError
} from '../utils/response';

// Helper to get program code
const getProgramCode = (deliveryMethod?: string, programType?: string): string => {
  if (programType?.toLowerCase().includes('six months')) return 'E6';
  if (deliveryMethod === 'Extension') return 'E';
  if (deliveryMethod === 'Weekend') return 'W';
  if (deliveryMethod === 'Distance') return 'D';
  if (deliveryMethod === 'Online') return 'O';
  if (deliveryMethod === 'Regular') return 'R';
  return 'GEN'; // General/Default
};

export class UserController {
  // Admin: Create a new user
  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, displayName, role } = req.body;

      // Step 1: Create user in Firebase Auth
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName,
      });

      // Step 2: Create user in Firestore
      const newUser = await userService.createUser({
        uid: userRecord.uid,
        email,
        displayName,
        role: role || UserRole.STUDENT,
      });

      sendCreated(res, 'User created successfully', newUser);
    } catch (error: any) {
      console.error('Create user error:', error);
      if (error.code === 'auth/email-already-exists') {
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

  // Generate Student ID
  async generateStudentId(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { deliveryMethod, programType } = req.body;
    try {
      const counterRef = firestore.collection('counters').doc('studentIdCounter');
      let nextIdNumber = 1;

      await firestore.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        if (!counterDoc.exists) {
          transaction.set(counterRef, { lastNumber: 1 });
        } else {
          const lastNumber = counterDoc.data()?.lastNumber || 0;
          nextIdNumber = lastNumber + 1;
          transaction.update(counterRef, { lastNumber: nextIdNumber });
        }
      });

      const programCode = getProgramCode(deliveryMethod, programType);
      const year = new Date().getFullYear();
      const sequentialNumber = String(nextIdNumber).padStart(3, '0');
      const studentId = `DHSR/${programCode}/${year}/${sequentialNumber}`;

      sendSuccess(res, 'Student ID generated successfully', { studentId });
    } catch (error) {
      console.error('Error generating student ID:', error);
      sendServerError(res, 'Failed to generate student ID');
    }
  }

  // Check if Student ID exists
  async checkStudentId(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { studentId } = req.body;
    if (!studentId) {
      sendError(res, 'studentId is required.');
      return;
    }
    try {
      const querySnapshot = await firestore.collection('users').where('studentId', '==', studentId).limit(1).get();
      const exists = !querySnapshot.empty;
      sendSuccess(res, 'Student ID check complete', { exists });
    } catch (error) {
      console.error('Error checking student ID:', error);
      sendServerError(res, 'Failed to check student ID');
    }
  }
}

export default new UserController();