import { Router } from 'express';
import courseController from '../controllers/courseController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin, requireAdminOrSuperAdmin, requireTeacherAdminOrSuperAdmin } from '../middleware/clerkAuth';
import { validateCourseCreation, validatePagination } from '../middleware/validation';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Course service is healthy'
  });
});

// Public routes
router.get('/search', validatePagination, courseController.searchCourses);
router.get('/', validatePagination, courseController.getAllCourses);


// Protected routes (authentication required)
router.use(authenticateToken);

// Specific routes first (before parameterized routes)
router.get('/student/enrollments', courseController.getMyEnrollments);
router.get('/instructor/my-courses', requireTeacherOrAdmin, validatePagination, courseController.getMyCourses);
router.get('/instructor/:instructorId', requireTeacherOrAdmin, validatePagination, courseController.getCoursesByInstructor);
router.get('/admin/stats', requireTeacherAdminOrSuperAdmin, courseController.getCourseStats);

router.put('/enrollments/:enrollmentId/progress', courseController.updateProgress);

// Teacher/Admin routes

router.post('/', requireAdmin, validateCourseCreation, courseController.createCourse);

// Parameterized routes last
router.get('/:courseId', courseController.getCourseById);
router.post('/:courseId/enroll', courseController.enrollInCourse);
router.put('/:courseId', requireTeacherOrAdmin, courseController.updateCourse);
router.get('/:courseId/enrollments', requireTeacherAdminOrSuperAdmin, courseController.getCourseEnrollments);


// Admin only routes
router.delete('/:courseId', requireAdmin, courseController.deleteCourse);

export default router;