import { Router } from 'express';
import assignmentController from '../controllers/assignmentController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin, requireStudentOrTeacherOrAdmin } from '../middleware/clerkAuth';
import { validateAssignmentCreation, validatePagination } from '../middleware/validation';

const router = Router();

// Test endpoint that doesn't require authentication (temporary)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Assignments test endpoint working',
    data: [
      {
        id: '1',
        title: 'Math Problem Set 1',
        description: 'Complete the algebra problems',
        instructions: 'Show all your work and submit by the due date',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100,
        isActive: true,
        course: {
          id: 'course1',
          title: 'Algebra I'
        },
        teacher: {
          id: 'teacher1',
          displayName: 'John Doe'
        },
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Essay Assignment',
        description: 'Write a 500-word essay on climate change',
        instructions: 'Use proper citations and follow MLA format',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100,
        isActive: true,
        course: {
          id: 'course2',
          title: 'English Literature'
        },
        teacher: {
          id: 'teacher2',
          displayName: 'Jane Smith'
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