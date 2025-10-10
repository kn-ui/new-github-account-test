import { Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import { hygraphUserService } from '../services/hygraphUserService';
import { AuthenticatedRequest, UserRole } from '../types';

// Verify Clerk token and extract user info
export const authenticateClerkToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // For development, allow requests without authentication
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Allowing request without authentication');
        req.user = {
          uid: 'dev-user',
          email: 'dev@example.com',
          role: UserRole.STUDENT
        };
        next();
        return;
      }
      
      res.status(401).json({
        success: false,
        message: 'Access token is missing'
      });
      return;
    }

    // For development with dummy token, skip verification
    if (process.env.NODE_ENV === 'development' && token === 'dummy_token_for_development') {
      console.log('Development mode: Using dummy authentication');
      req.user = {
        uid: 'dev-user',
        email: 'dev@example.com',
        role: UserRole.STUDENT
      };
      next();
      return;
    }

    // For development mode, skip Clerk verification and use dummy user
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Skipping Clerk verification');
      req.user = {
        uid: 'dev-user',
        email: 'dev@example.com',
        role: UserRole.ADMIN // Use admin role for development
      };
      next();
      return;
    }

    // Verify the Clerk token (only in production)
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!
    });
    
    // Get user data from Hygraph using Clerk user ID
    const userData = await hygraphUserService.getUserByUid(payload.sub as string);

    let userRole = UserRole.STUDENT; // Default role for new users

    if (userData) {
      userRole = userData.role as UserRole || UserRole.STUDENT;
    } else {
      // User exists in Clerk but not in Hygraph yet
      // This is expected during initial profile creation
      console.log(`User ${payload.sub as string} not found in Hygraph, allowing for profile creation`);
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

// Alias for requireAuth
export const requireStudentOrTeacherOrAdmin = requireAuth;