import { Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import { hygraphClient } from '../config/hygraph';
import { gql } from 'graphql-request';
import { AuthenticatedRequest, UserRole } from '../types';

// Utility function to mask sensitive data in logs
function maskToken(token?: string): string {
  if (!token) return 'MISSING';
  if (token.length < 12) return `${token.slice(0, 3)}... (len:${token.length})`;
  return `${token.slice(0, 6)}...${token.slice(-6)} (len:${token.length})`;
}

// Interface for Clerk user payload attached to request
interface ClerkUserPayload {
  uid: string;
  email?: string;
  displayName?: string;
}

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
        message: 'Access token is missing',
        error: 'token_missing'
      });
      return;
    }

    // Check if Clerk secret key is configured
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      console.warn('CLERK_SECRET_KEY not configured - authentication disabled');
      res.status(500).json({
        success: false,
        message: 'Authentication service not configured',
        error: 'auth_not_configured'
      });
      return;
    }

    // Verify the Clerk token with proper error handling
    let payload: any;
    try {
      payload = await verifyToken(token, {
        secretKey: clerkSecretKey
      });
    } catch (verifyError: any) {
      // Distinguish between expired and invalid tokens
      const errorReason = verifyError.reason || verifyError.message || 'unknown';
      
      if (errorReason.includes('expired') || errorReason.includes('exp')) {
        console.warn(`Token expired for request: ${maskToken(token)}`);
        res.status(401).json({
          success: false,
          message: 'Token has expired',
          error: 'token_expired'
        });
        return;
      } else {
        console.warn(`Invalid token for request: ${maskToken(token)}, reason: ${errorReason}`);
        res.status(403).json({
          success: false,
          message: 'Invalid token',
          error: 'token_invalid'
        });
        return;
      }
    }
    
    // Extract user info from Clerk payload
    const clerkUser: ClerkUserPayload = {
      uid: payload.sub as string,
      email: payload.email as string,
      displayName: payload.name as string || payload.first_name as string
    };

    // Attach Clerk user to request for use in services
    (req as any).clerkUser = clerkUser;
    
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
      const data = await hygraphClient.request<{ appUser: { role?: UserRole } | null }>(query, { uid: clerkUser.uid });
      if (data?.appUser?.role) {
        userRole = data.appUser.role as UserRole;
      }
    } catch (e) {
      console.warn('Hygraph fetch of user failed, defaulting to student:', e);
    }

    // Attach user info to request (legacy format for backward compatibility)
    req.user = {
      uid: clerkUser.uid,
      email: clerkUser.email || '',
      role: userRole
    };

    next();
  } catch (error: any) {
    // Catch any unexpected errors
    const errorMessage = error.message || 'Unknown authentication error';
    console.error('Unexpected Clerk authentication error:', errorMessage);
    res.status(500).json({
      success: false,
      message: 'Authentication service error',
      error: 'auth_service_error'
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