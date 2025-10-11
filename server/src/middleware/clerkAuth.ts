import { Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import { firestore } from '../config/firebase';
import { AuthenticatedRequest, UserRole } from '../types';

// Verify Clerk token and extract user info
export const authenticateClerkToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isDev = (process.env.NODE_ENV || 'development') !== 'production';
    if (isDev && process.env.CLERK_DEV_BYPASS === 'true') {
      console.warn('Development mode: Skipping Clerk verification. Ensure this is disabled in production.');
      // Minimal user context to proceed; default to admin for local testing only
      req.user = {
        uid: process.env.CLERK_DEV_USER_ID || 'dev-user-uid',
        email: process.env.CLERK_DEV_USER_EMAIL || 'dev@example.com',
        role: UserRole.ADMIN
      };
      return next();
    }
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is missing'
      });
      return;
    }

    // Verify the Clerk token
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!
    });
    
    // Get user data from Firestore using Clerk user ID
    const userDoc = await firestore.collection('users').doc(payload.sub as string).get();

    let userData = null;
    let userRole = UserRole.STUDENT; // Default role for new users

    if (userDoc.exists) {
      userData = userDoc.data();
      userRole = userData?.role || UserRole.STUDENT;
    } else {
      // User exists in Clerk but not in Firestore yet
      // This is expected during initial profile creation
      console.log(`User ${payload.sub as string} not found in Firestore, allowing for profile creation`);
    }

    // Attach user info to request
    req.user = {
      uid: payload.sub as string,
      email: (payload.email as string) || '',
      role: userRole
    };

    next();
  } catch (error) {
    console.error('Clerk authentication error:', error);
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Authorize specific roles (same as before)
export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

// Check if user is admin
export const requireAdmin = authorizeRoles(UserRole.ADMIN);

// Check if user is super admin
export const requireSuperAdmin = authorizeRoles(UserRole.SUPER_ADMIN);

// Check if user is admin or super admin
export const requireAdminOrSuperAdmin = authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN);

// Check if user is teacher or admin
export const requireTeacherOrAdmin = authorizeRoles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN);

// Teacher, Admin, or Super Admin (for read-only stats endpoints)
export const requireTeacherAdminOrSuperAdmin = authorizeRoles(
  UserRole.TEACHER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN
);

// Check if user is student, teacher, or admin (authenticated users)
export const requireAuth = authorizeRoles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN);