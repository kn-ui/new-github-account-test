import { Response, NextFunction } from 'express';
import { auth, firestore } from '../config/firebase';
import { AuthenticatedRequest, UserRole } from '../types';

// Verify Firebase token and extract user info
export const authenticateToken = async (
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

    // Verify the Firebase token for all other cases
    const decodedToken = await auth.verifyIdToken(token);
    
// Get user data from Firestore
const userDoc = await firestore.collection('users').doc(decodedToken.uid).get();

let userData = null;
let userRole = UserRole.STUDENT; // Default role for new users

if (userDoc.exists) {
  userData = userDoc.data();
  userRole = userData?.role || UserRole.STUDENT;
} else {
  // User exists in Firebase Auth but not in Firestore yet
  // This is expected during initial profile creation
  console.log(`User ${decodedToken.uid} not found in Firestore, allowing for profile creation`);
}

// Attach user info to request
req.user = {
  uid: decodedToken.uid,
  email: decodedToken.email || '',
  role: userRole
};

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Authorize specific roles
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
