import { Response, NextFunction } from 'express';
import { authenticateClerkToken, authorizeRoles, requireAdmin, requireSuperAdmin, requireAdminOrSuperAdmin, requireTeacherOrAdmin, requireTeacherAdminOrSuperAdmin, requireAuth } from './clerkAuth';

// Verify Firebase token and extract user info
// Backwards compatibility export names
export const authenticateToken = authenticateClerkToken;
export { authorizeRoles, requireAdmin, requireSuperAdmin, requireAdminOrSuperAdmin, requireTeacherOrAdmin, requireTeacherAdminOrSuperAdmin, requireAuth };
