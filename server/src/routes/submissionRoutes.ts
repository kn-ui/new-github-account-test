import { Router } from 'express';
import submissionController from '../controllers/submissionController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin, requireStudentOrTeacherOrAdmin } from '../middleware/clerkAuth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Submission service is healthy'
  });
});

// Protected routes (authentication required)
router.use(authenticateToken);

// Student routes
router.get('/student/:studentId', requireStudentOrTeacherOrAdmin, validatePagination, submissionController.getSubmissionsByStudent);
router.get('/assignment/:assignmentId', requireStudentOrTeacherOrAdmin, validatePagination, submissionController.getSubmissionsByAssignment);
router.get('/course/:courseId', requireStudentOrTeacherOrAdmin, validatePagination, submissionController.getSubmissionsByCourse);

// CRUD routes
router.post('/', requireStudentOrTeacherOrAdmin, submissionController.createSubmission);
router.get('/:submissionId', requireStudentOrTeacherOrAdmin, submissionController.getSubmissionById);
router.put('/:submissionId', requireStudentOrTeacherOrAdmin, submissionController.updateSubmission);
router.delete('/:submissionId', requireTeacherOrAdmin, submissionController.deleteSubmission);

// Grading routes
router.put('/:submissionId/grade', requireTeacherOrAdmin, submissionController.gradeSubmission);

export default router;