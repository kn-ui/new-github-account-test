import { Router } from 'express';
import gradeController from '../controllers/gradeController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin, requireStudentOrTeacherOrAdmin } from '../middleware/clerkAuth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Test endpoint that doesn't require authentication (temporary)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Grades test endpoint working',
    data: [
      {
        id: '1',
        finalGrade: 85.5,
        letterGrade: 'B',
        gradePoints: 3.0,
        calculationMethod: 'WEIGHTED_AVERAGE',
        student: {
          id: 'student1',
          displayName: 'John Doe',
          email: 'john@example.com'
        },
        course: {
          id: 'course1',
          title: 'Algebra I'
        },
        calculatedAt: new Date().toISOString()
      },
      {
        id: '2',
        finalGrade: 92.0,
        letterGrade: 'A-',
        gradePoints: 3.7,
        calculationMethod: 'WEIGHTED_AVERAGE',
        student: {
          id: 'student2',
          displayName: 'Jane Smith',
          email: 'jane@example.com'
        },
        course: {
          id: 'course2',
          title: 'English Literature'
        },
        calculatedAt: new Date().toISOString()
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

// Public utility endpoints
router.post('/convert-to-letter', gradeController.convertToLetterGrade);
router.post('/calculate-weighted-average', gradeController.calculateWeightedAverage);

// Protected routes (authentication required)
router.use(authenticateToken);

// Student routes
router.get('/my/grades', validatePagination, gradeController.getStudentGrades);
router.get('/my/gpa', gradeController.getStudentGPA);
router.get('/course/:courseId/my-grade', gradeController.getStudentCourseGrade);

// Teacher/Admin routes
router.get('/course/:courseId', requireTeacherOrAdmin, validatePagination, gradeController.getCourseGrades);
router.get('/course/:courseId/stats', requireTeacherOrAdmin, gradeController.getCourseGradeStats);
router.get('/teacher/stats', requireTeacherOrAdmin, gradeController.getTeacherGradingStats);
router.post('/calculate', requireTeacherOrAdmin, gradeController.calculateGrade);
router.post('/course/:courseId/calculate-all', requireTeacherOrAdmin, gradeController.calculateCourseGrades);

// Teacher/Admin CRUD routes
router.post('/', requireTeacherOrAdmin, gradeController.createGrade);

// Parameterized routes last
router.get('/:gradeId', gradeController.getGradeById);
router.put('/:gradeId', requireTeacherOrAdmin, gradeController.updateGrade);

// Admin only routes
router.get('/', requireAdmin, validatePagination, gradeController.getAllGrades);

export default router;