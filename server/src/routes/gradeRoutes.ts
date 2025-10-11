import { Router } from 'express';
import gradeController from '../controllers/gradeController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin, requireStudentOrTeacherOrAdmin } from '../middleware/clerkAuth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service is healthy'
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