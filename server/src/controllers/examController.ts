import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import examService from '../services/examService';
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendPaginatedResponse,
  sendServerError
} from '../utils/response';

export class ExamController {

  /**
   * Create exam - Teachers/Admins only for their courses
   */
  async createExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        title, 
        description, 
        date, 
        startTime,
        durationMinutes,
        courseId,
        questions 
      } = req.body;

      if (!title || !date || !courseId || !questions || !Array.isArray(questions)) {
        sendError(res, 'Missing required fields: title, date, courseId, questions');
        return;
      }

      const examData = {
        title,
        description,
        date: new Date(date),
        startTime: startTime ? new Date(startTime) : undefined,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        courseId,
        questions
      };

      const exam = await examService.createExam(examData);
      sendCreated(res, 'Exam created successfully', exam);
    } catch (error) {
      console.error('Create exam error:', error);
      sendServerError(res, 'Failed to create exam');
    }
  }

  /**
   * Get exam by ID
   */
  async getExamById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { examId } = req.params;
      const exam = await examService.getExamById(examId);

      if (!exam) {
        sendNotFound(res, 'Exam not found');
        return;
      }

      // Students should not see correct answers before taking the exam
      if (req.user!.role === 'student') {
        exam.questions = exam.questions.map(q => ({
          ...q,
          correct: undefined // Hide correct answers
        }));
      }

      sendSuccess(res, 'Exam retrieved successfully', exam);
    } catch (error) {
      console.error('Get exam error:', error);
      sendServerError(res, 'Failed to get exam');
    }
  }

  /**
   * Get exams by course
   */
  async getExamsByCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await examService.getExamsByCourse(courseId, page, limit);

      // Hide correct answers from students
      if (req.user!.role === 'student') {
        result.exams = result.exams.map(exam => ({
          ...exam,
          questions: exam.questions.map(q => ({
            ...q,
            correct: undefined
          }))
        }));
      }

      sendPaginatedResponse(
        res,
        'Exams retrieved successfully',
        result.exams,
        page,
        limit,
        result.total
      );
    } catch (error) {
      console.error('Get exams by course error:', error);
      sendServerError(res, 'Failed to get exams');
    }
  }

  /**
   * Update exam - Teachers/Admins only
   */
  async updateExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { examId } = req.params;
      const { title, description, date, startTime, durationMinutes, questions } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (date !== undefined) updateData.date = new Date(date);
      if (startTime !== undefined) updateData.startTime = new Date(startTime);
      if (durationMinutes !== undefined) updateData.durationMinutes = parseInt(durationMinutes);
      if (questions !== undefined) updateData.questions = questions;

      const exam = await examService.updateExam(examId, updateData);
      sendSuccess(res, 'Exam updated successfully', exam);
    } catch (error) {
      console.error('Update exam error:', error);
      sendServerError(res, 'Failed to update exam');
    }
  }

  /**
   * Delete exam - Teachers/Admins only
   */
  async deleteExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { examId } = req.params;
      await examService.deleteExam(examId);
      sendSuccess(res, 'Exam deleted successfully');
    } catch (error) {
      console.error('Delete exam error:', error);
      sendServerError(res, 'Failed to delete exam');
    }
  }

  /**
   * Start exam attempt - Students only
   */
  async startExamAttempt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { examId } = req.params;
      const studentId = req.user!.uid;

      const attempt = await examService.startExamAttempt(examId, studentId);
      sendCreated(res, 'Exam attempt started successfully', attempt);
    } catch (error) {
      console.error('Start exam attempt error:', error);
      sendServerError(res, 'Failed to start exam attempt');
    }
  }

  /**
   * Submit exam attempt - Students only
   */
  async submitExamAttempt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const { answers } = req.body;

      if (!answers || !Array.isArray(answers)) {
        sendError(res, 'Answers array is required');
        return;
      }

      const attempt = await examService.submitExamAttempt(attemptId, answers);
      sendSuccess(res, 'Exam attempt submitted successfully', attempt);
    } catch (error) {
      console.error('Submit exam attempt error:', error);
      sendServerError(res, 'Failed to submit exam attempt');
    }
  }

  /**
   * Grade exam attempt - Teachers/Admins only
   */
  async gradeExamAttempt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const { manualScore, feedback } = req.body;

      if (manualScore === undefined || manualScore === null) {
        sendError(res, 'Manual score is required');
        return;
      }

      const attempt = await examService.gradeExamAttempt(
        attemptId,
        parseInt(manualScore),
        feedback
      );
      sendSuccess(res, 'Exam attempt graded successfully', attempt);
    } catch (error) {
      console.error('Grade exam attempt error:', error);
      sendServerError(res, 'Failed to grade exam attempt');
    }
  }

  /**
   * Get exam attempts by exam - Teachers/Admins only
   */
  async getExamAttemptsByExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { examId } = req.params;
      const attempts = await examService.getExamAttemptsByExam(examId);
      sendSuccess(res, 'Exam attempts retrieved successfully', attempts);
    } catch (error) {
      console.error('Get exam attempts by exam error:', error);
      sendServerError(res, 'Failed to get exam attempts');
    }
  }

  /**
   * Get exam attempts by student - Students see own, Teachers/Admins see any
   */
  async getExamAttemptsByStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = req.params.studentId || req.user!.uid;
      
      // Check if user can access this student's attempts
      if (studentId !== req.user!.uid && req.user!.role === 'student') {
        sendError(res, 'Access denied. Students can only view their own exam attempts.');
        return;
      }

      const attempts = await examService.getExamAttemptsByStudent(studentId);
      sendSuccess(res, 'Exam attempts retrieved successfully', attempts);
    } catch (error) {
      console.error('Get exam attempts by student error:', error);
      sendServerError(res, 'Failed to get exam attempts');
    }
  }
}

export default new ExamController();