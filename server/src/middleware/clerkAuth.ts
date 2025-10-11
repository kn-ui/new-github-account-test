import { Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import { hygraphClient } from '../config/hygraph';
import { gql } from 'graphql-request';
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
    
    // Get user data from Hygraph (AppUser) using Clerk user ID
    let userRole = UserRole.STUDENT; // default
    try {
      const query = gql`
        query GetAppUserByUid($uid: String!) {
          appUser(where: { uid: $uid }) {
            uid
            email
            displayName
            role
            isActive
          }
        }
      `;
      const data = await hygraphClient.request<{ appUser: { role?: UserRole } | null }>(query, { uid: payload.sub });
      if (data?.appUser?.role) {
        userRole = data.appUser.role as UserRole;
      }
    } catch (e) {
      console.warn('Hygraph fetch of user failed, defaulting to student:', e);
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