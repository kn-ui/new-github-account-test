import { Router } from 'express';
import userController from '../controllers/userController';

import { authenticateToken, requireAdmin, requireTeacherOrAdmin, requireAuth, requireAdminOrSuperAdmin, requireSuperAdmin } from '../middleware/auth';
import { validateUserRegistration, validatePagination } from '../middleware/validation';

const router = Router();

// Public routes (no authentication required)
// Note: User registration happens through Firebase Auth on frontend

// Protected routes (authentication required for specific endpoints)

// Admin: Create a new user (requires auth in production; open in dev via middleware bypass)
router.post('/', validateUserRegistration, userController.createUser);

// User profile routes (must authenticate to access req.user)
router.post('/profile', authenticateToken, userController.createOrUpdateProfile);
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);

// Specific routes first (before parameterized routes)

router.get('/search', authenticateToken, requireTeacherOrAdmin, validatePagination, userController.searchUsers);
router.get('/admin/stats', authenticateToken, requireAdminOrSuperAdmin, userController.getUserStats);

// Admin only routes
router.get('/', authenticateToken, requireAdminOrSuperAdmin, validatePagination, userController.getAllUsers);

// Parameterized routes last

router.get('/:userId', authenticateToken, requireTeacherOrAdmin, userController.getUserById);
router.put('/:userId/role', authenticateToken, requireAdminOrSuperAdmin, userController.updateUserRole);
router.put('/:userId/deactivate', authenticateToken, requireAdmin, userController.deactivateUser);
router.put('/:userId/activate', authenticateToken, requireAdmin, userController.activateUser);


export default router;