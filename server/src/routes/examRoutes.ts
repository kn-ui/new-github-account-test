import { Router } from 'express';
import examController from '../controllers/examController';
import { authenticateClerkToken } from '../middleware/clerkAuth';
import { requirePermission, requireCourseAccess, requireStudentEnrollment } from '../middleware/rbac';

const router = Router();

// All exam routes require authentication
router.use(authenticateClerkToken);

// Create exam - Teachers/Admins only
router.post('/', 
  requirePermission('exams.create'),
  examController.createExam
);

// Get exam by ID - All authenticated users (with appropriate filtering)
router.get('/:examId', 
  requirePermission('exams.read'),
  examController.getExamById
);

// Update exam - Teachers/Admins only
router.put('/:examId', 
  requirePermission('exams.update'),
  examController.updateExam
);

// Delete exam - Teachers/Admins only
router.delete('/:examId', 
  requirePermission('exams.delete'),
  examController.deleteExam
);

// Get exams by course - All users with course access
router.get('/course/:courseId', 
  requirePermission('exams.read'),
  requireStudentEnrollment(req => req.params.courseId),
  examController.getExamsByCourse
);

// Start exam attempt - Students only
router.post('/:examId/start', 
  requirePermission('exams.take'),
  examController.startExamAttempt
);

// Submit exam attempt - Students only
router.post('/attempts/:attemptId/submit', 
  requirePermission('exams.take'),
  examController.submitExamAttempt
);

// Grade exam attempt - Teachers/Admins only
router.post('/attempts/:attemptId/grade', 
  requirePermission('exams.grade'),
  examController.gradeExamAttempt
);

// Get exam attempts by exam - Teachers/Admins only
router.get('/:examId/attempts', 
  requirePermission('exams.read'),
  examController.getExamAttemptsByExam
);

// Get exam attempts by student - Students see own, Teachers/Admins see any
router.get('/attempts/student/:studentId?', 
  requirePermission('exams.read'),
  examController.getExamAttemptsByStudent
);

export default router;