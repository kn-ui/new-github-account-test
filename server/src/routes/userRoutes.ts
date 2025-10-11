import { Router } from 'express';
import userController from '../controllers/userController';

import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin, requireAuth, requireAdminOrSuperAdmin, requireSuperAdmin } from '../middleware/clerkAuth';
import { validateUserRegistration, validatePagination } from '../middleware/validation';

const router = Router();

// Test endpoint for Hygraph connection (must be before authentication middleware)
router.get('/test-hygraph', (req, res) => {
  res.json({
    success: true,
    message: 'User routes test endpoint working',
    hygraphConfig: {
      endpoint: process.env.HYGRAPH_ENDPOINT ? 'Set' : 'Not set',
      token: process.env.HYGRAPH_TOKEN ? 'Set' : 'Not set'
    }
  });
});

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

router.get('/search', requireTeacherOrAdmin, validatePagination, userController.searchUsers);
router.get('/teachers', requireTeacherOrAdmin, validatePagination, userController.getTeachers);
router.get('/admin/stats', requireAdminOrSuperAdmin, userController.getUserStats);

// Student data endpoints
router.get('/dashboard/:userId', requireAuth, userController.getStudentDashboardData);
router.get('/courses/:userId', requireAuth, userController.getStudentCoursesData);
router.get('/assignments/:userId', requireAuth, userController.getStudentAssignmentsData);
router.get('/submissions/:userId', requireAuth, userController.getStudentSubmissionsData);

// Admin only routes
router.get('/', requireAdminOrSuperAdmin, validatePagination, userController.getAllUsers);
router.get('/all', requireAdminOrSuperAdmin, validatePagination, userController.getUsers);

// Parameterized routes last

router.get('/:userId', requireTeacherOrAdmin, userController.getUserById);
router.put('/:userId/role', requireAdminOrSuperAdmin, userController.updateUserRole);
router.put('/:userId/deactivate', requireAdmin, userController.deactivateUser);
router.put('/:userId/activate', requireAdmin, userController.activateUser);


export default router;