import { Router } from 'express';
import assignmentController from '../controllers/assignmentController';
import { authenticateClerkToken } from '../middleware/clerkAuth';
import { requirePermission, requireCourseAccess, requireStudentEnrollment } from '../middleware/rbac';

const router = Router();

// All assignment routes require authentication
router.use(authenticateClerkToken);

// Create assignment - Teachers/Admins only, must have course access
router.post('/', 
  requirePermission('assignments.create'),
  assignmentController.createAssignment
);

// Get assignment by ID - All authenticated users (access checked by course enrollment)
router.get('/:assignmentId', 
  requirePermission('assignments.read'),
  assignmentController.getAssignmentById
);

// Update assignment - Teachers/Admins only, must be course instructor or admin
router.put('/:assignmentId', 
  requirePermission('assignments.update'),
  assignmentController.updateAssignment
);

// Delete assignment - Teachers/Admins only, must be course instructor or admin  
router.delete('/:assignmentId', 
  requirePermission('assignments.delete'),
  assignmentController.deleteAssignment
);

// Get assignments by course - All users (with course access check)
router.get('/course/:courseId', 
  requirePermission('assignments.read'),
  requireStudentEnrollment(req => req.params.courseId),
  assignmentController.getAssignmentsByCourse
);

// Get assignments by teacher - Teachers can see own, Admins see any
router.get('/teacher/:teacherId', 
  requirePermission('assignments.read'),
  assignmentController.getAssignmentsByTeacher
);

// Get assignments by current teacher (no teacherId parameter)
router.get('/teacher', 
  requirePermission('assignments.read'),
  assignmentController.getAssignmentsByTeacher
);

// Submit assignment - Students only, must be enrolled in course
router.post('/:assignmentId/submit', 
  requirePermission('assignments.read'), // Students need read permission to submit
  assignmentController.submitAssignment
);

// Grade submission - Teachers/Admins only
router.post('/submissions/:submissionId/grade', 
  requirePermission('assignments.grade'),
  assignmentController.gradeSubmission
);

// Get submissions by assignment - Teachers/Admins only
router.get('/:assignmentId/submissions', 
  requirePermission('assignments.read'),
  assignmentController.getSubmissionsByAssignment
);

// Get submissions by student - Students see own, Teachers/Admins see any
router.get('/submissions/student/:studentId', 
  requirePermission('assignments.read'),
  assignmentController.getSubmissionsByStudent
);

// Get submissions by current student (no studentId parameter)
router.get('/submissions/student', 
  requirePermission('assignments.read'),
  assignmentController.getSubmissionsByStudent
);

export default router;