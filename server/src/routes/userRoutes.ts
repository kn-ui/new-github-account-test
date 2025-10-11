import { Router } from 'express';
import userController from '../controllers/userController';

import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin, requireAuth, requireAdminOrSuperAdmin, requireSuperAdmin } from '../middleware/clerkAuth';
import { validateUserRegistration, validatePagination } from '../middleware/validation';

const router = Router();

// Health check endpoint for Hygraph connection
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'User service is healthy',
    hygraphConfig: {
      endpoint: process.env.HYGRAPH_ENDPOINT ? 'Configured' : 'Not configured',
      token: process.env.HYGRAPH_TOKEN ? 'Configured' : 'Not configured'
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

// Additional user lookup routes
router.get('/email/:email', requireTeacherOrAdmin, userController.getUserByEmail);
router.get('/teachers', requireTeacherOrAdmin, validatePagination, userController.getTeachers);
router.get('/students-by-teacher/:teacherId', requireTeacherOrAdmin, validatePagination, userController.getStudentsByTeacher);

// Parameterized routes last

router.get('/:userId', requireTeacherOrAdmin, userController.getUserById);
router.put('/:userId/role', requireAdminOrSuperAdmin, userController.updateUserRole);
router.put('/:userId/deactivate', requireAdmin, userController.deactivateUser);
router.put('/:userId/activate', requireAdmin, userController.activateUser);


export default router;