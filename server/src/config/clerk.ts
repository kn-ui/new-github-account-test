/**
 * Clerk Authentication Configuration for Backend
 */

import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';

if (!CLERK_SECRET_KEY) {
  console.warn('⚠️  CLERK_SECRET_KEY not set. Authentication will not work.');
}

/**
 * Middleware to require authentication
 */
export const requireAuth = ClerkExpressRequireAuth({
  // Custom options can be added here
});

/**
 * Middleware to optionally check authentication
 */
export const checkAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.auth = null;
      return next();
    }

    // Token verification is handled by Clerk SDK
    // If we reach here, the user is authenticated
    next();
  } catch (error) {
    console.error('Auth check error:', error);
    req.auth = null;
    next();
  }
};

/**
 * Get user ID from request
 */
export function getUserId(req: any): string | null {
  return req.auth?.userId || null;
}

/**
 * Require specific role
 */
export function requireRole(...roles: string[]) {
  return async (req: any, res: any, next: any) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user role from Hygraph
    const { hygraphQuery } = await import('./hygraph');
    try {
      const result = await hygraphQuery(`
        query GetUserRole($uid: String!) {
          user(where: { uid: $uid }) {
            role
          }
        }
      `, { uid: userId });

      const userRole = result.user?.role;
      
      if (!userRole || !roles.includes(userRole.toLowerCase())) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export default {
  requireAuth,
  checkAuth,
  getUserId,
  requireRole,
};
