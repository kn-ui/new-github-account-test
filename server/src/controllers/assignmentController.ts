import { Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { hygraphAssignmentService } from '../services/hygraphAssignmentService';
import { hygraphUserService } from '../services/hygraphUserService';
import { hygraphCourseService } from '../services/hygraphCourseService';
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendPaginatedResponse,
  sendServerError
} from '../utils/response';

export class AssignmentController {
  // Create a new assignment (teacher/admin only)
  async createAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, instructions, dueDate, maxScore, courseId } = req.body;
      const teacherId = req.user!.uid;

      // Validate required fields
      if (!title || !description || !dueDate || !maxScore || !courseId) {
        sendError(res, 'Missing required fields: title, description, dueDate, maxScore, courseId');
        return;
      }

      // Verify course exists and teacher has access
      const course = await hygraphCourseService.getCourseById(courseId);
      if (!course) {
        sendNotFound(res, 'Course not found');
        return;
      }

      // Check if teacher is the instructor or admin
      if (req.user!.role !== UserRole.ADMIN && course.instructor?.uid !== teacherId) {
        sendError(res, 'You can only create assignments for your own courses');
        return;
      }

      // Get teacher name from Hygraph
      const teacher = await hygraphUserService.getUserByUid(teacherId);
      if (!teacher) {
        sendNotFound(res, 'Teacher not found');
        return;
      }

      const assignmentData = {
        title,
        description,
        instructions,
        dueDate: new Date(dueDate).toISOString(),
        maxScore: parseInt(maxScore),
        courseId,
        teacherId: teacher.id,
        isActive: true
      };

      const newAssignment = await hygraphAssignmentService.createAssignment(assignmentData);
      sendCreated(res, 'Assignment created successfully', newAssignment);
    } catch (error) {
      console.error('Create assignment error:', error);
      sendServerError(res, 'Failed to create assignment');
    }
  }

  // Get all assignments (public catalog)
  async getAllAssignments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const courseId = req.query.courseId as string;
      const teacherId = req.query.teacherId as string;

      const skip = (page - 1) * limit;
      const where: any = { isActive: true };

      if (courseId) {
        where.course = { id: courseId };
      }
      if (teacherId) {
        where.teacher = { id: teacherId };
      }

      const assignments = await hygraphAssignmentService.getAssignments(limit, skip, where);
      
      // For now, we'll get all assignments to calculate total. In production, implement count query
      const allAssignments = await hygraphAssignmentService.getAssignments(1000, 0, where);
      const total = allAssignments.length;

      sendPaginatedResponse(
        res,
        'Assignments retrieved successfully',
        assignments,
        page,
        limit,
        total
      );
    } catch (error) {
      console.error('Get assignments error:', error);
      sendServerError(res, 'Failed to retrieve assignments');
    }
  }

  // Get assignment by ID
  async getAssignmentById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;

      const assignment = await hygraphAssignmentService.getAssignmentById(assignmentId);
      if (!assignment) {
        sendNotFound(res, 'Assignment not found');
        return;
      }

      sendSuccess(res, 'Assignment retrieved successfully', assignment);
    } catch (error) {
      console.error('Get assignment by ID error:', error);
      sendServerError(res, 'Failed to retrieve assignment');
    }
  }

  // Update assignment (teacher/admin only)
  async updateAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const updateData = req.body;
      const userId = req.user!.uid;

      // Get existing assignment
      const existingAssignment = await hygraphAssignmentService.getAssignmentById(assignmentId);
      if (!existingAssignment) {
        sendNotFound(res, 'Assignment not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingAssignment.teacher?.id !== userId) {
        sendError(res, 'You can only update your own assignments');
        return;
      }

      // Convert dueDate to ISO string if provided
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate).toISOString();
      }

      const updatedAssignment = await hygraphAssignmentService.updateAssignment(assignmentId, updateData);
      sendSuccess(res, 'Assignment updated successfully', updatedAssignment);
    } catch (error) {
      console.error('Update assignment error:', error);
      sendServerError(res, 'Failed to update assignment');
    }
  }

  // Delete assignment (teacher/admin only)
  async deleteAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const userId = req.user!.uid;

      // Get existing assignment
      const existingAssignment = await hygraphAssignmentService.getAssignmentById(assignmentId);
      if (!existingAssignment) {
        sendNotFound(res, 'Assignment not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingAssignment.teacher?.id !== userId) {
        sendError(res, 'You can only delete your own assignments');
        return;
      }

      await hygraphAssignmentService.deleteAssignment(assignmentId);
      sendSuccess(res, 'Assignment deleted successfully');
    } catch (error) {
      console.error('Delete assignment error:', error);
      sendServerError(res, 'Failed to delete assignment');
    }
  }

  // Get assignments by course
  async getAssignmentsByCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const assignments = await hygraphAssignmentService.getAssignmentsByCourse(courseId, limit);
      
      sendPaginatedResponse(
        res,
        'Course assignments retrieved successfully',
        assignments,
        page,
        limit,
        assignments.length
      );
    } catch (error) {
      console.error('Get assignments by course error:', error);
      sendServerError(res, 'Failed to retrieve course assignments');
    }
  }

  // Get teacher's assignments
  async getMyAssignments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teacherId = req.user!.uid;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const assignments = await hygraphAssignmentService.getAssignmentsByTeacher(teacherId, limit);
      
      sendPaginatedResponse(
        res,
        'Your assignments retrieved successfully',
        assignments,
        page,
        limit,
        assignments.length
      );
    } catch (error) {
      console.error('Get my assignments error:', error);
      sendServerError(res, 'Failed to retrieve your assignments');
    }
  }

  // ===== SUBMISSION OPERATIONS =====

  // Submit assignment (student only)
  async submitAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const { content } = req.body;
      const studentId = req.user!.uid;

      if (!content) {
        sendError(res, 'Submission content is required');
        return;
      }

      // Get assignment details
      const assignment = await hygraphAssignmentService.getAssignmentById(assignmentId);
      if (!assignment) {
        sendNotFound(res, 'Assignment not found');
        return;
      }

      if (!assignment.isActive) {
        sendError(res, 'Assignment is no longer active');
        return;
      }

      // Check if assignment is past due
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      if (now > dueDate) {
        sendError(res, 'Assignment is past due');
        return;
      }

      // Check if student is enrolled in the course
      if (assignment.course?.id) {
        const enrollments = await hygraphCourseService.getStudentEnrollments(studentId);
        const isEnrolled = enrollments.some(e => e.course?.id === assignment.course?.id);
        if (!isEnrolled) {
          sendError(res, 'You are not enrolled in this course');
          return;
        }
      }

      // Check if submission already exists
      const existingSubmission = await hygraphAssignmentService.getStudentSubmissionForAssignment(
        studentId, 
        assignmentId
      );

      if (existingSubmission) {
        // Update existing submission
        const updatedSubmission = await hygraphAssignmentService.updateSubmission(
          existingSubmission.id,
          { content, submissionStatus: 'SUBMITTED' }
        );
        sendSuccess(res, 'Assignment submission updated successfully', updatedSubmission);
      } else {
        // Create new submission
        const submissionData = {
          content,
          assignmentId,
          studentId,
          courseId: assignment.course?.id || '',
          submissionStatus: 'SUBMITTED' as const
        };

        const newSubmission = await hygraphAssignmentService.createSubmission(submissionData);
        sendCreated(res, 'Assignment submitted successfully', newSubmission);
      }
    } catch (error) {
      console.error('Submit assignment error:', error);
      sendServerError(res, 'Failed to submit assignment');
    }
  }

  // Get student's submissions
  async getMySubmissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.uid;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const submissions = await hygraphAssignmentService.getSubmissionsByStudent(studentId, limit);
      
      sendPaginatedResponse(
        res,
        'Your submissions retrieved successfully',
        submissions,
        page,
        limit,
        submissions.length
      );
    } catch (error) {
      console.error('Get my submissions error:', error);
      sendServerError(res, 'Failed to retrieve your submissions');
    }
  }

  // Get assignment submissions (teacher/admin only)
  async getAssignmentSubmissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Verify assignment exists and user has access
      const assignment = await hygraphAssignmentService.getAssignmentById(assignmentId);
      if (!assignment) {
        sendNotFound(res, 'Assignment not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && assignment.teacher?.id !== req.user!.uid) {
        sendError(res, 'You can only view submissions for your own assignments');
        return;
      }

      const submissions = await hygraphAssignmentService.getSubmissionsByAssignment(assignmentId, limit);
      
      sendPaginatedResponse(
        res,
        'Assignment submissions retrieved successfully',
        submissions,
        page,
        limit,
        submissions.length
      );
    } catch (error) {
      console.error('Get assignment submissions error:', error);
      sendServerError(res, 'Failed to retrieve assignment submissions');
    }
  }

  // Grade submission (teacher/admin only)
  async gradeSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;
      const { grade, feedback } = req.body;

      if (grade === undefined || grade < 0) {
        sendError(res, 'Valid grade is required');
        return;
      }

      // Get submission details
      const submission = await hygraphAssignmentService.getSubmissionById(submissionId);
      if (!submission) {
        sendNotFound(res, 'Submission not found');
        return;
      }

      // Get assignment to verify teacher access
      const assignment = await hygraphAssignmentService.getAssignmentById(submission.assignment?.id || '');
      if (!assignment) {
        sendNotFound(res, 'Assignment not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && assignment.teacher?.id !== req.user!.uid) {
        sendError(res, 'You can only grade submissions for your own assignments');
        return;
      }

      // Check if grade is within valid range
      if (grade > assignment.maxScore) {
        sendError(res, `Grade cannot exceed maximum score of ${assignment.maxScore}`);
        return;
      }

      const gradedSubmission = await hygraphAssignmentService.gradeSubmission(
        submissionId, 
        grade, 
        feedback
      );

      sendSuccess(res, 'Submission graded successfully', gradedSubmission);
    } catch (error) {
      console.error('Grade submission error:', error);
      sendServerError(res, 'Failed to grade submission');
    }
  }

  // Get assignment statistics
  async getAssignmentStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;

      // Verify assignment exists and user has access
      const assignment = await hygraphAssignmentService.getAssignmentById(assignmentId);
      if (!assignment) {
        sendNotFound(res, 'Assignment not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && assignment.teacher?.id !== req.user!.uid) {
        sendError(res, 'You can only view statistics for your own assignments');
        return;
      }

      const stats = await hygraphAssignmentService.getAssignmentStats(assignmentId);
      sendSuccess(res, 'Assignment statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get assignment stats error:', error);
      sendServerError(res, 'Failed to retrieve assignment statistics');
    }
  }

  // Get teacher's assignment statistics
  async getMyAssignmentStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teacherId = req.user!.uid;
      const stats = await hygraphAssignmentService.getTeacherAssignmentStats(teacherId);
      sendSuccess(res, 'Your assignment statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get my assignment stats error:', error);
      sendServerError(res, 'Failed to retrieve your assignment statistics');
    }
  }
}

export default new AssignmentController();