import { Router } from 'express';
import userController from '../controllers/userController';

import { authenticateToken, requireAdmin, requireTeacherOrAdmin, requireAuth, requireAdminOrSuperAdmin, requireSuperAdmin } from '../middleware/auth';
import { validateUserRegistration, validatePagination } from '../middleware/validation';

const router = Router();

// Public routes (no authentication required)
// Note: User registration happens through Firebase Auth on frontend

// Protected routes (authentication required)
router.use(authenticateToken);

// Admin: Create a new user
router.post('/', requireAdmin, validateUserRegistration, userController.createUser);

// User profile routes  
router.post('/profile', userController.createOrUpdateProfile);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Specific routes first (before parameterized routes)
router.post('/generate-student-id', requireAdmin, userController.generateStudentId);
router.post('/check-student-id', requireAdmin, userController.checkStudentId);

router.get('/search', requireTeacherOrAdmin, validatePagination, userController.searchUsers);
router.get('/admin/stats', requireAdminOrSuperAdmin, userController.getUserStats);

// Admin only routes
router.get('/', requireAdminOrSuperAdmin, validatePagination, userController.getAllUsers);

// Parameterized routes last

router.get('/:userId', requireTeacherOrAdmin, userController.getUserById);
router.put('/:userId/role', requireAdminOrSuperAdmin, userController.updateUserRole);
router.put('/:userId/deactivate', requireAdmin, userController.deactivateUser);
router.put('/:userId/activate', requireAdmin, userController.activateUser);


export default router;