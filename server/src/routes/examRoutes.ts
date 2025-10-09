import { Router } from 'express';
import examController from '../controllers/examController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin, requireStudentOrTeacherOrAdmin } from '../middleware/clerkAuth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Test endpoint that doesn't require authentication (temporary)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Exams test endpoint working',
    data: [
      {
        id: '1',
        title: 'Midterm Mathematics Exam',
        description: 'Algebra and geometry concepts',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        startTime: '09:00',
        durationMinutes: 120,
        totalPoints: 100,
        course: {
          id: 'course1',
          title: 'Algebra I'
        },
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Final English Literature Exam',
        description: 'Comprehensive literature analysis',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        startTime: '10:00',
        durationMinutes: 180,
        totalPoints: 150,
        course: {
          id: 'course2',
          title: 'English Literature'
        },
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