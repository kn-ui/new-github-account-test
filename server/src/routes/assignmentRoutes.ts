import { Router } from 'express';
import assignmentController from '../controllers/assignmentController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin, requireStudentOrTeacherOrAdmin } from '../middleware/clerkAuth';
import { validateAssignmentCreation, validatePagination } from '../middleware/validation';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Assignment service is healthy'
  });
});

// Public routes
router.get('/search', validatePagination, assignmentController.getAllAssignments);
router.get('/', validatePagination, assignmentController.getAllAssignments);

// Protected routes (authentication required)
router.use(authenticateToken);

// Student routes
router.post('/:assignmentId/submit', assignmentController.submitAssignment);
router.get('/my/submissions', validatePagination, assignmentController.getMySubmissions);

// Teacher/Admin routes
router.get('/my/assignments', requireTeacherOrAdmin, validatePagination, assignmentController.getMyAssignments);
router.get('/my/stats', requireTeacherOrAdmin, assignmentController.getMyAssignmentStats);
router.get('/:assignmentId/submissions', requireTeacherOrAdmin, validatePagination, assignmentController.getAssignmentSubmissions);
router.post('/:submissionId/grade', requireTeacherOrAdmin, assignmentController.gradeSubmission);
router.get('/:assignmentId/stats', requireTeacherOrAdmin, assignmentController.getAssignmentStats);

// Course-specific routes
router.get('/course/:courseId', validatePagination, assignmentController.getAssignmentsByCourse);

// Teacher/Admin CRUD routes
router.post('/', requireTeacherOrAdmin, validateAssignmentCreation, assignmentController.createAssignment);

// Parameterized routes last
router.get('/:assignmentId', assignmentController.getAssignmentById);
router.put('/:assignmentId', requireTeacherOrAdmin, assignmentController.updateAssignment);

// Admin only routes
router.delete('/:assignmentId', requireAdmin, assignmentController.deleteAssignment);

export default router;