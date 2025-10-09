import { Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { hygraphExamService } from '../services/hygraphExamService';
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

export class ExamController {
  // Create a new exam (teacher/admin only)
  async createExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, date, startTime, durationMinutes, totalPoints, questions, courseId } = req.body;
      const teacherId = req.user!.uid;

      // Validate required fields
      if (!title || !date || !totalPoints || !courseId) {
        sendError(res, 'Missing required fields: title, date, totalPoints, courseId');
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
        sendError(res, 'You can only create exams for your own courses');
        return;
      }

      const examData = {
        title,
        description,
        date: new Date(date).toISOString(),
        startTime,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        totalPoints: parseInt(totalPoints),
        questions,
        courseId,
        firstAttemptTimestamp: new Date().toISOString()
      };

      const newExam = await hygraphExamService.createExam(examData);
      sendCreated(res, 'Exam created successfully', newExam);
    } catch (error) {
      console.error('Create exam error:', error);
      sendServerError(res, 'Failed to create exam');
    }
  }

  // Get all exams (public catalog)
  async getAllExams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const courseId = req.query.courseId as string;
      const type = req.query.type as string; // 'upcoming' or 'past'

      const skip = (page - 1) * limit;
      const where: any = {};

      if (courseId) {
        where.course = { id: courseId };
      }

      let exams;
      if (type === 'upcoming') {
        exams = await hygraphExamService.getUpcomingExams(limit);
      } else if (type === 'past') {
        exams = await hygraphExamService.getPastExams(limit);
      } else {
        exams = await hygraphExamService.getExams(limit, skip, where);
      }
      
      // For now, we'll get all exams to calculate total. In production, implement count query
      const allExams = await hygraphExamService.getExams(1000, 0, where);
      const total = allExams.length;

      sendPaginatedResponse(
        res,
        'Exams retrieved successfully',
        exams,
        page,
        limit,
        total
      );
    } catch (error) {
      console.error('Get exams error:', error);
      sendServerError(res, 'Failed to retrieve exams');
    }
  }

  // Get exam by ID
  async getExamById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { examId } = req.params;

      const exam = await hygraphExamService.getExamById(examId);
      if (!exam) {
        sendNotFound(res, 'Exam not found');
        return;
      }

      sendSuccess(res, 'Exam retrieved successfully', exam);
    } catch (error) {
      console.error('Get exam by ID error:', error);
      sendServerError(res, 'Failed to retrieve exam');
    }
  }

  // Update exam (teacher/admin only)
  async updateExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { examId } = req.params;
      const updateData = req.body;
      const userId = req.user!.uid;

      // Get existing exam
      const existingExam = await hygraphExamService.getExamById(examId);
      if (!existingExam) {
        sendNotFound(res, 'Exam not found');
        return;
      }

      // Check permissions (simplified - in real app, check course instructor)
      if (req.user!.role !== UserRole.ADMIN) {
        sendError(res, 'Only admins can update exams');
        return;
      }

      // Convert date to ISO string if provided
      if (updateData.date) {
        updateData.date = new Date(updateData.date).toISOString();
      }

      const updatedExam = await hygraphExamService.updateExam(examId, updateData);
      sendSuccess(res, 'Exam updated successfully', updatedExam);
    } catch (error) {
      console.error('Update exam error:', error);
      sendServerError(res, 'Failed to update exam');
    }
  }

  // Delete exam (teacher/admin only)
  async deleteExam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { examId } = req.params;
      const userId = req.user!.uid;

      // Get existing exam
      const existingExam = await hygraphExamService.getExamById(examId);
      if (!existingExam) {
        sendNotFound(res, 'Exam not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN) {
        sendError(res, 'Only admins can delete exams');
        return;
      }

      await hygraphExamService.deleteExam(examId);
      sendSuccess(res, 'Exam deleted successfully');
    } catch (error) {
      console.error('Delete exam error:', error);
      sendServerError(res, 'Failed to delete exam');
    }
  }

  // Get exams by course
  async getExamsByCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const exams = await hygraphExamService.getExamsByCourse(courseId, limit);
      
      sendPaginatedResponse(
        res,
        'Course exams retrieved successfully',
        exams,
        page,
        limit,
        exams.length
      );
    } catch (error) {
      console.error('Get exams by course error:', error);
      sendServerError(res, 'Failed to retrieve course exams');
    }
  }

  // Get upcoming exams
  async getUpcomingExams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const exams = await hygraphExamService.getUpcomingExams(limit);
      
      sendPaginatedResponse(
        res,
        'Upcoming exams retrieved successfully',
        exams,
        page,
        limit,
        exams.length
      );
    } catch (error) {
      console.error('Get upcoming exams error:', error);
      sendServerError(res, 'Failed to retrieve upcoming exams');
    }
  }

  // ===== EXAM ATTEMPT OPERATIONS =====

  // Start exam attempt (student only)
  async startExamAttempt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { examId } = req.params;
      const studentId = req.user!.uid;

      // Get exam details
      const exam = await hygraphExamService.getExamById(examId);
      if (!exam) {
        sendNotFound(res, 'Exam not found');
        return;
      }

      // Check if exam is available (not past due)
      const now = new Date();
      const examDate = new Date(exam.date);
      if (now > examDate) {
        sendError(res, 'Exam is no longer available');
        return;
      }

      // Check if student is enrolled in the course
      if (exam.course?.id) {
        const enrollments = await hygraphCourseService.getStudentEnrollments(studentId);
        const isEnrolled = enrollments.some(e => e.course?.id === exam.course?.id);
        if (!isEnrolled) {
          sendError(res, 'You are not enrolled in this course');
          return;
        }
      }

      // Check if attempt already exists
      const existingAttempt = await hygraphExamService.getStudentExamAttempt(studentId, examId);
      if (existingAttempt) {
        if (existingAttempt.examAttemptStatus === 'IN_PROGRESS') {
          sendError(res, 'You already have an exam attempt in progress');
          return;
        } else if (existingAttempt.examAttemptStatus === 'SUBMITTED' || existingAttempt.examAttemptStatus === 'GRADED') {
          sendError(res, 'You have already completed this exam');
          return;
        }
      }

      // Start new attempt
      const attemptData = {
        examId,
        studentId,
        examAttemptStatus: 'IN_PROGRESS' as const
      };

      const newAttempt = await hygraphExamService.startExamAttempt(attemptData);
      sendCreated(res, 'Exam attempt started successfully', newAttempt);
    } catch (error) {
      console.error('Start exam attempt error:', error);
      sendServerError(res, 'Failed to start exam attempt');
    }
  }

  // Submit exam attempt (student only)
  async submitExamAttempt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const { answers } = req.body;
      const studentId = req.user!.uid;

      if (!answers) {
        sendError(res, 'Answers are required');
        return;
      }

      // Get attempt details
      const attempt = await hygraphExamService.getExamAttemptById(attemptId);
      if (!attempt) {
        sendNotFound(res, 'Exam attempt not found');
        return;
      }

      // Check if attempt belongs to student
      if (attempt.student?.id !== studentId) {
        sendError(res, 'You can only submit your own exam attempts');
        return;
      }

      // Check if attempt is in progress
      if (attempt.examAttemptStatus !== 'IN_PROGRESS') {
        sendError(res, 'Exam attempt is not in progress');
        return;
      }

      // Submit attempt
      const submittedAttempt = await hygraphExamService.submitExamAttempt(attemptId, answers);
      sendSuccess(res, 'Exam attempt submitted successfully', submittedAttempt);
    } catch (error) {
      console.error('Submit exam attempt error:', error);
      sendServerError(res, 'Failed to submit exam attempt');
    }
  }

  // Get student's exam attempts
  async getMyExamAttempts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.uid;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const attempts = await hygraphExamService.getExamAttemptsByStudent(studentId, limit);
      
      sendPaginatedResponse(
        res,
        'Your exam attempts retrieved successfully',
        attempts,
        page,
        limit,
        attempts.length
      );
    } catch (error) {
      console.error('Get my exam attempts error:', error);
      sendServerError(res, 'Failed to retrieve your exam attempts');
    }
  }

  // Get exam attempts (teacher/admin only)
  async getExamAttempts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { examId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Verify exam exists and user has access
      const exam = await hygraphExamService.getExamById(examId);
      if (!exam) {
        sendNotFound(res, 'Exam not found');
        return;
      }

      // Check permissions (simplified - in real app, check course instructor)
      if (req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.TEACHER) {
        sendError(res, 'You can only view attempts for your own exams');
        return;
      }

      const attempts = await hygraphExamService.getExamAttemptsByExam(examId, limit);
      
      sendPaginatedResponse(
        res,
        'Exam attempts retrieved successfully',
        attempts,
        page,
        limit,
        attempts.length
      );
    } catch (error) {
      console.error('Get exam attempts error:', error);
      sendServerError(res, 'Failed to retrieve exam attempts');
    }
  }

  // Grade exam attempt (teacher/admin only)
  async gradeExamAttempt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const { score, feedback } = req.body;

      if (score === undefined || score < 0) {
        sendError(res, 'Valid score is required');
        return;
      }

      // Get attempt details
      const attempt = await hygraphExamService.getExamAttemptById(attemptId);
      if (!attempt) {
        sendNotFound(res, 'Exam attempt not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.TEACHER) {
        sendError(res, 'You can only grade exam attempts');
        return;
      }

      // Check if score is within valid range
      if (attempt.exam?.id) {
        const exam = await hygraphExamService.getExamById(attempt.exam.id);
        if (exam && score > exam.totalPoints) {
          sendError(res, `Score cannot exceed maximum points of ${exam.totalPoints}`);
          return;
        }
      }

      const gradedAttempt = await hygraphExamService.gradeExamAttempt(attemptId, score, feedback);
      sendSuccess(res, 'Exam attempt graded successfully', gradedAttempt);
    } catch (error) {
      console.error('Grade exam attempt error:', error);
      sendServerError(res, 'Failed to grade exam attempt');
    }
  }

  // Auto-grade exam attempt (teacher/admin only)
  async autoGradeExamAttempt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const { answers } = req.body;

      if (!answers) {
        sendError(res, 'Answers are required for auto-grading');
        return;
      }

      // Get attempt details
      const attempt = await hygraphExamService.getExamAttemptById(attemptId);
      if (!attempt) {
        sendNotFound(res, 'Exam attempt not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.TEACHER) {
        sendError(res, 'You can only auto-grade exam attempts');
        return;
      }

      // Get exam questions for auto-grading
      const exam = await hygraphExamService.getExamById(attempt.exam?.id || '');
      if (!exam) {
        sendNotFound(res, 'Exam not found');
        return;
      }

      const autoGradedAttempt = await hygraphExamService.autoGradeExamAttempt(
        attemptId, 
        answers, 
        exam.questions
      );
      sendSuccess(res, 'Exam attempt auto-graded successfully', autoGradedAttempt);
    } catch (error) {
      console.error('Auto-grade exam attempt error:', error);
      sendServerError(res, 'Failed to auto-grade exam attempt');
    }
  }

  // Get exam statistics
  async getExamStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { examId } = req.params;

      // Verify exam exists and user has access
      const exam = await hygraphExamService.getExamById(examId);
      if (!exam) {
        sendNotFound(res, 'Exam not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.TEACHER) {
        sendError(res, 'You can only view statistics for your own exams');
        return;
      }

      const stats = await hygraphExamService.getExamStats(examId);
      sendSuccess(res, 'Exam statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get exam stats error:', error);
      sendServerError(res, 'Failed to retrieve exam statistics');
    }
  }

  // Get student's exam performance
  async getMyExamPerformance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.uid;
      const performance = await hygraphExamService.getStudentExamPerformance(studentId);
      sendSuccess(res, 'Your exam performance retrieved successfully', performance);
    } catch (error) {
      console.error('Get my exam performance error:', error);
      sendServerError(res, 'Failed to retrieve your exam performance');
    }
  }
}

export default new ExamController();