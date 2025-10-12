import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import assignmentService from '../services/assignmentService';
import { requirePermission, requireCourseAccess } from '../middleware/rbac';
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendPaginatedResponse,
  sendServerError
} from '../utils/response';

export class AssignmentController {
  
  /**
   * Create assignment - Teachers can create for their courses, Admins for any course
   */
  async createAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        title, 
        description, 
        instructions, 
        dueDate, 
        maxScore, 
        courseId,
        attachments 
      } = req.body;

      if (!title || !description || !dueDate || !maxScore || !courseId) {
        sendError(res, 'Missing required fields: title, description, dueDate, maxScore, courseId');
        return;
      }

      const assignmentData = {
        title,
        description,
        instructions,
        dueDate: new Date(dueDate),
        maxScore: parseInt(maxScore),
        courseId,
        teacherId: req.user!.uid,
        attachments
      };

      const assignment = await assignmentService.createAssignment(assignmentData);
      sendCreated(res, 'Assignment created successfully', assignment);
    } catch (error) {
      console.error('Create assignment error:', error);
      sendServerError(res, 'Failed to create assignment');
    }
  }

  /**
   * Get assignment by ID - All users can view if they have course access
   */
  async getAssignmentById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const assignment = await assignmentService.getAssignmentById(assignmentId);

      if (!assignment) {
        sendNotFound(res, 'Assignment not found');
        return;
      }

      sendSuccess(res, 'Assignment retrieved successfully', assignment);
    } catch (error) {
      console.error('Get assignment error:', error);
      sendServerError(res, 'Failed to get assignment');
    }
  }

  /**
   * Get assignments by course - All course members can view
   */
  async getAssignmentsByCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await assignmentService.getAssignmentsByCourse(courseId, page, limit);

      sendPaginatedResponse(
        res,
        'Assignments retrieved successfully',
        result.assignments,
        page,
        limit,
        result.total
      );
    } catch (error) {
      console.error('Get assignments by course error:', error);
      sendServerError(res, 'Failed to get assignments');
    }
  }

  /**
   * Get assignments by teacher - Teachers can view their own, Admins can view any
   */
  async getAssignmentsByTeacher(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teacherId = req.params.teacherId || req.user!.uid;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Check if user can access this teacher's assignments
      if (teacherId !== req.user!.uid && req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
        sendError(res, 'Access denied. You can only view your own assignments.');
        return;
      }

      const result = await assignmentService.getAssignmentsByTeacher(teacherId, page, limit);

      sendPaginatedResponse(
        res,
        'Assignments retrieved successfully',
        result.assignments,
        page,
        limit,
        result.total
      );
    } catch (error) {
      console.error('Get assignments by teacher error:', error);
      sendServerError(res, 'Failed to get assignments');
    }
  }

  /**
   * Update assignment - Only course instructor or admin
   */
  async updateAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const { title, description, instructions, dueDate, maxScore, attachments } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (instructions !== undefined) updateData.instructions = instructions;
      if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
      if (maxScore !== undefined) updateData.maxScore = parseInt(maxScore);
      if (attachments !== undefined) updateData.attachments = attachments;

      const assignment = await assignmentService.updateAssignment(assignmentId, updateData);
      sendSuccess(res, 'Assignment updated successfully', assignment);
    } catch (error) {
      console.error('Update assignment error:', error);
      sendServerError(res, 'Failed to update assignment');
    }
  }

  /**
   * Delete assignment - Only course instructor or admin
   */
  async deleteAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;
      await assignmentService.deleteAssignment(assignmentId);
      sendSuccess(res, 'Assignment deleted successfully');
    } catch (error) {
      console.error('Delete assignment error:', error);
      sendServerError(res, 'Failed to delete assignment');
    }
  }

  /**
   * Submit assignment - Students can submit to assignments in courses they're enrolled in
   */
  async submitAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const { content, attachments } = req.body;

      if (!content) {
        sendError(res, 'Submission content is required');
        return;
      }

      const submissionData = {
        content,
        assignmentId,
        studentId: req.user!.uid,
        attachments
      };

      const submission = await assignmentService.createSubmission(submissionData);
      sendCreated(res, 'Assignment submitted successfully', submission);
    } catch (error) {
      console.error('Submit assignment error:', error);
      sendServerError(res, 'Failed to submit assignment');
    }
  }

  /**
   * Grade submission - Only course instructor or admin
   */
  async gradeSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;
      const { grade, feedback } = req.body;

      if (grade === undefined || grade === null) {
        sendError(res, 'Grade is required');
        return;
      }

      const submission = await assignmentService.gradeSubmission(
        submissionId,
        parseInt(grade),
        feedback
      );
      sendSuccess(res, 'Submission graded successfully', submission);
    } catch (error) {
      console.error('Grade submission error:', error);
      sendServerError(res, 'Failed to grade submission');
    }
  }

  /**
   * Get submissions by assignment - Only course instructor or admin
   */
  async getSubmissionsByAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const submissions = await assignmentService.getSubmissionsByAssignment(assignmentId);
      sendSuccess(res, 'Submissions retrieved successfully', submissions);
    } catch (error) {
      console.error('Get submissions by assignment error:', error);
      sendServerError(res, 'Failed to get submissions');
    }
  }

  /**
   * Get submissions by student - Students can view their own, instructors and admins can view any
   */
  async getSubmissionsByStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = req.params.studentId || req.user!.uid;
      
      // Check if user can access this student's submissions
      if (studentId !== req.user!.uid && req.user!.role === 'student') {
        sendError(res, 'Access denied. Students can only view their own submissions.');
        return;
      }

      const submissions = await assignmentService.getSubmissionsByStudent(studentId);
      sendSuccess(res, 'Submissions retrieved successfully', submissions);
    } catch (error) {
      console.error('Get submissions by student error:', error);
      sendServerError(res, 'Failed to get submissions');
    }
  }
}

export default new AssignmentController();