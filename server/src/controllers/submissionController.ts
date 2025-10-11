import { Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { hygraphSubmissionService } from '../services/hygraphSubmissionService';
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendPaginatedResponse,
  sendServerError
} from '../utils/response';

export class SubmissionController {
  // Get submissions by student
  async getSubmissionsByStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Check permissions
      if (req.user!.uid !== studentId && req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.SUPER_ADMIN) {
        sendError(res, 'Access denied');
        return;
      }

      const submissions = await hygraphSubmissionService.getSubmissionsByStudent(studentId, limit, skip);
      
      sendPaginatedResponse(
        res,
        'Student submissions retrieved successfully',
        submissions,
        page,
        limit,
        submissions.length
      );
    } catch (error) {
      console.error('Get submissions by student error:', error);
      sendServerError(res, 'Failed to get student submissions');
    }
  }

  // Get submissions by assignment
  async getSubmissionsByAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const submissions = await hygraphSubmissionService.getSubmissionsByAssignment(assignmentId, limit, skip);
      
      sendPaginatedResponse(
        res,
        'Assignment submissions retrieved successfully',
        submissions,
        page,
        limit,
        submissions.length
      );
    } catch (error) {
      console.error('Get submissions by assignment error:', error);
      sendServerError(res, 'Failed to get assignment submissions');
    }
  }

  // Get submissions by course
  async getSubmissionsByCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const submissions = await hygraphSubmissionService.getSubmissionsByCourse(courseId, limit, skip);
      
      sendPaginatedResponse(
        res,
        'Course submissions retrieved successfully',
        submissions,
        page,
        limit,
        submissions.length
      );
    } catch (error) {
      console.error('Get submissions by course error:', error);
      sendServerError(res, 'Failed to get course submissions');
    }
  }

  // Create submission
  async createSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { assignmentId, courseId, content, attachments } = req.body;
      const studentId = req.user!.uid;

      // Validate required fields
      if (!assignmentId || !courseId || !content) {
        sendError(res, 'Missing required fields: assignmentId, courseId, content');
        return;
      }

      const submissionData = {
        assignmentId,
        courseId,
        studentId,
        content,
        attachments: attachments || [],
        submissionStatus: 'SUBMITTED' as const
      };

      const submission = await hygraphSubmissionService.createSubmission(submissionData);
      sendCreated(res, 'Submission created successfully', submission);
    } catch (error) {
      console.error('Create submission error:', error);
      sendServerError(res, 'Failed to create submission');
    }
  }

  // Get submission by ID
  async getSubmissionById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;
      const submission = await hygraphSubmissionService.getSubmissionById(submissionId);

      if (!submission) {
        sendNotFound(res, 'Submission not found');
        return;
      }

      // Check permissions
      if (req.user!.uid !== submission.studentId && req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.SUPER_ADMIN) {
        sendError(res, 'Access denied');
        return;
      }

      sendSuccess(res, 'Submission retrieved successfully', submission);
    } catch (error) {
      console.error('Get submission by ID error:', error);
      sendServerError(res, 'Failed to get submission');
    }
  }

  // Update submission
  async updateSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;
      const { content, attachments } = req.body;

      // Get existing submission to check permissions
      const existingSubmission = await hygraphSubmissionService.getSubmissionById(submissionId);
      if (!existingSubmission) {
        sendNotFound(res, 'Submission not found');
        return;
      }

      // Check permissions
      if (req.user!.uid !== existingSubmission.studentId && req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.SUPER_ADMIN) {
        sendError(res, 'Access denied');
        return;
      }

      const updateData = {
        content,
        attachments
      };

      const updatedSubmission = await hygraphSubmissionService.updateSubmission(submissionId, updateData);
      sendSuccess(res, 'Submission updated successfully', updatedSubmission);
    } catch (error) {
      console.error('Update submission error:', error);
      sendServerError(res, 'Failed to update submission');
    }
  }

  // Delete submission
  async deleteSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;

      // Get existing submission to check permissions
      const existingSubmission = await hygraphSubmissionService.getSubmissionById(submissionId);
      if (!existingSubmission) {
        sendNotFound(res, 'Submission not found');
        return;
      }

      // Check permissions
      if (req.user!.uid !== existingSubmission.studentId && req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.SUPER_ADMIN) {
        sendError(res, 'Access denied');
        return;
      }

      await hygraphSubmissionService.deleteSubmission(submissionId);
      sendSuccess(res, 'Submission deleted successfully');
    } catch (error) {
      console.error('Delete submission error:', error);
      sendServerError(res, 'Failed to delete submission');
    }
  }

  // Grade submission
  async gradeSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;
      const { grade, feedback } = req.body;

      // Validate required fields
      if (grade === undefined || grade === null) {
        sendError(res, 'Grade is required');
        return;
      }

      const submission = await hygraphSubmissionService.gradeSubmission(submissionId, grade, feedback);
      sendSuccess(res, 'Submission graded successfully', submission);
    } catch (error) {
      console.error('Grade submission error:', error);
      sendServerError(res, 'Failed to grade submission');
    }
  }
}

export default new SubmissionController();