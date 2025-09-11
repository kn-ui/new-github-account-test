import { Router } from 'express';
import courseController from '../controllers/courseController';
import { authenticateToken, requireAdmin, requireTeacherOrAdmin, requireAdminOrSuperAdmin, requireTeacherAdminOrSuperAdmin } from '../middleware/auth';
import { validateCourseCreation, validatePagination } from '../middleware/validation';

const router = Router();

// Test endpoint that doesn't require Firebase (temporary)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Courses test endpoint working',
    data: [
      {
        id: '1',
        title: 'Introduction to Mathematics',
        description: 'Basic mathematics course for beginners',
        instructor: 'John Doe',
        category: 'Mathematics',
        duration: 8,
        maxStudents: 30,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'English Literature',
        description: 'Exploring classic and modern literature',
        instructor: 'Jane Smith',
        category: 'Literature',
        duration: 12,
        maxStudents: 25,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1
    }
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