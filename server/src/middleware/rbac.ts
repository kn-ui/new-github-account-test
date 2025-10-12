import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';

// Role hierarchy for access control
const ROLE_HIERARCHY = {
  [UserRole.STUDENT]: 1,
  [UserRole.TEACHER]: 2, 
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4
};

// Permission matrix for different operations
const PERMISSIONS = {
  // User operations
  'users.create': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'users.read': [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'users.update': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'users.delete': [UserRole.SUPER_ADMIN],
  'users.bulk': [UserRole.SUPER_ADMIN],
  'users.list': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  
  // Course operations
  'courses.create': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'courses.read': [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'courses.update': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN], // Owner or admin
  'courses.delete': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'courses.enroll': [UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'courses.manage': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  
  // Assignment operations
  'assignments.create': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'assignments.read': [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'assignments.update': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'assignments.delete': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'assignments.grade': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  
  // Exam operations
  'exams.create': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'exams.read': [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'exams.update': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'exams.delete': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'exams.take': [UserRole.STUDENT],
  'exams.grade': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  
  // Course Material operations
  'materials.create': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'materials.read': [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'materials.update': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'materials.delete': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  
  // Announcement operations
  'announcements.create': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'announcements.read': [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'announcements.update': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'announcements.delete': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  
  // Event operations  
  'events.create': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'events.read': [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'events.update': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'events.delete': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  
  // File operations
  'files.upload': [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'files.read': [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'files.delete': [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  
  // Admin operations
  'admin.dashboard': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'admin.reports': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'admin.system': [UserRole.SUPER_ADMIN]
};

/**
 * Check if user has permission for a specific operation
 */
export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  const allowedRoles = PERMISSIONS[permission as keyof typeof PERMISSIONS];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
};

/**
 * Check if user has higher or equal role level
 */
export const hasRoleLevel = (userRole: UserRole, minimumRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
};

/**
 * Middleware to require specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: permission,
        userRole: req.user.role
      });
    }

    return next();
  };
};

/**
 * Middleware to require minimum role level
 */
export const requireRole = (minimumRole: UserRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!hasRoleLevel(req.user.role, minimumRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role level',
        required: minimumRole,
        userRole: req.user.role
      });
    }

    return next();
  };
};

/**
 * Middleware to check resource ownership or admin access
 */
export const requireOwnershipOrAdmin = (
  getResourceOwnerId: (req: AuthenticatedRequest) => string | Promise<string>
) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admins and super admins can access any resource
    if (hasRoleLevel(req.user.role, UserRole.ADMIN)) {
      return next();
    }

    try {
      const resourceOwnerId = await getResourceOwnerId(req);
      
      if (req.user.uid === resourceOwnerId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

/**
 * Middleware to check course instructor access
 */
export const requireCourseAccess = (
  getCourseId: (req: AuthenticatedRequest) => string,
  checkInstructor = true
) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admins and super admins can access any course
    if (hasRoleLevel(req.user.role, UserRole.ADMIN)) {
      return next();
    }

    if (checkInstructor && req.user.role === UserRole.TEACHER) {
      try {
        const courseId = getCourseId(req);
        // Import here to avoid circular dependency
        const { default: courseService } = await import('../services/courseService');
        const course = await courseService.getCourseById(courseId);
        
        if (course && course.instructor === req.user.uid) {
          return next();
        }
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error checking course access'
        });
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You must be the course instructor or an admin.'
    });
  };
};

/**
 * Middleware for students to access only their enrolled courses
 */
export const requireStudentEnrollment = (
  getCourseId: (req: AuthenticatedRequest) => string
) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Non-students and admins can access
    if (req.user.role !== UserRole.STUDENT || hasRoleLevel(req.user.role, UserRole.ADMIN)) {
      return next();
    }

    try {
      const courseId = getCourseId(req);
      // Import here to avoid circular dependency
      const { default: courseService } = await import('../services/courseService');
      const enrollments = await courseService.getStudentEnrollments(req.user.uid);
      
      const isEnrolled = enrollments.some(e => e.courseId === courseId && e.status === 'active');
      
      if (isEnrolled) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be enrolled in this course.'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking enrollment status'
      });
    }
  };
};

/**
 * Get user role hierarchy level
 */
export const getRoleLevel = (role: UserRole): number => {
  return ROLE_HIERARCHY[role] || 0;
};

/**
 * Check if operation is allowed based on user role and resource ownership
 */
export const canPerformOperation = (
  userRole: UserRole, 
  operation: string, 
  resourceOwnerId?: string, 
  userId?: string
): boolean => {
  // Check basic permission first
  if (!hasPermission(userRole, operation)) {
    return false;
  }

  // If resource has an owner and user is not admin, check ownership
  if (resourceOwnerId && userId && !hasRoleLevel(userRole, UserRole.ADMIN)) {
    return resourceOwnerId === userId;
  }

  return true;
};

export default {
  hasPermission,
  hasRoleLevel,
  requirePermission,
  requireRole,
  requireOwnershipOrAdmin,
  requireCourseAccess,
  requireStudentEnrollment,
  getRoleLevel,
  canPerformOperation
};