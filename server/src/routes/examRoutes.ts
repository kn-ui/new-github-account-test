import { Router } from 'express';
import examController from '../controllers/examController';
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


// Public routes
router.get('/search', validatePagination, examController.getAllExams);
router.get('/', validatePagination, examController.getAllExams);
router.get('/upcoming', validatePagination, examController.getUpcomingExams);

// Protected routes (authentication required)
router.use(authenticateToken);

// Student routes
router.post('/:examId/start', examController.startExamAttempt);
router.post('/:attemptId/submit', examController.submitExamAttempt);
router.get('/my/attempts', validatePagination, examController.getMyExamAttempts);
router.get('/my/performance', examController.getMyExamPerformance);

// Teacher/Admin routes
router.get('/:examId/attempts', requireTeacherOrAdmin, validatePagination, examController.getExamAttempts);
router.post('/:attemptId/grade', requireTeacherOrAdmin, examController.gradeExamAttempt);
router.post('/:attemptId/auto-grade', requireTeacherOrAdmin, examController.autoGradeExamAttempt);
router.get('/:examId/stats', requireTeacherOrAdmin, examController.getExamStats);

// Course-specific routes
router.get('/course/:courseId', validatePagination, examController.getExamsByCourse);

// Teacher/Admin CRUD routes
router.post('/', requireTeacherOrAdmin, examController.createExam);

// Parameterized routes last
router.get('/:examId', examController.getExamById);
router.put('/:examId', requireTeacherOrAdmin, examController.updateExam);

// Admin only routes
router.delete('/:examId', requireAdmin, examController.deleteExam);

export default router;