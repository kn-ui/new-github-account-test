import { Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { hygraphGradeService, GradeCalculator } from '../services/hygraphGradeService';
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

export class GradeController {
  // Create a new grade (teacher/admin only)
  async createGrade(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        studentId, 
        courseId, 
        finalGrade, 
        letterGrade, 
        gradePoints, 
        calculationMethod, 
        assignmentGrades, 
        notes 
      } = req.body;
      const calculatedByUid = req.user!.uid;

      // Validate required fields
      if (!studentId || !courseId || finalGrade === undefined || !letterGrade || gradePoints === undefined) {
        sendError(res, 'Missing required fields: studentId, courseId, finalGrade, letterGrade, gradePoints');
        return;
      }

      // Verify student exists
      const student = await hygraphUserService.getUserByUid(studentId);
      if (!student) {
        sendNotFound(res, 'Student not found');
        return;
      }

      // Verify course exists
      const course = await hygraphCourseService.getCourseById(courseId);
      if (!course) {
        sendNotFound(res, 'Course not found');
        return;
      }

      // Check permissions
      const calculator = await hygraphUserService.getUserByUid(calculatedByUid);
      if (!calculator) {
        sendNotFound(res, 'User not found');
        return;
      }
      if (req.user!.role !== UserRole.ADMIN && course.instructor?.id !== calculator.id) {
        sendError(res, 'You can only create grades for your own courses');
        return;
      }

      const gradeData = {
        studentId: student.id,
        courseId,
        finalGrade: parseFloat(finalGrade),
        letterGrade,
        gradePoints: parseFloat(gradePoints),
        calculationMethod: calculationMethod || 'MANUAL',
        assignmentGrades,
        notes,
        calculatedBy: calculatedByUid
      };

      const newGrade = await hygraphGradeService.createGrade(gradeData);
      sendCreated(res, 'Grade created successfully', newGrade);
    } catch (error) {
      console.error('Create grade error:', error);
      sendServerError(res, 'Failed to create grade');
    }
  }

  // Get all grades (teacher/admin only)
  async getAllGrades(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const studentId = req.query.studentId as string;
      const courseId = req.query.courseId as string;

      const skip = (page - 1) * limit;
      const where: any = {};

      if (studentId) {
        where.student = { id: studentId };
      }
      if (courseId) {
        where.course = { id: courseId };
      }

      const grades = await hygraphGradeService.getGrades(limit, skip, where);
      
      // For now, we'll get all grades to calculate total. In production, implement count query
      const allGrades = await hygraphGradeService.getGrades(1000, 0, where);
      const total = allGrades.length;

      sendPaginatedResponse(
        res,
        'Grades retrieved successfully',
        grades,
        page,
        limit,
        total
      );
    } catch (error) {
      console.error('Get grades error:', error);
      sendServerError(res, 'Failed to retrieve grades');
    }
  }

  // Get grade by ID
  async getGradeById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { gradeId } = req.params;

      const grade = await hygraphGradeService.getGradeById(gradeId);
      if (!grade) {
        sendNotFound(res, 'Grade not found');
        return;
      }

      sendSuccess(res, 'Grade retrieved successfully', grade);
    } catch (error) {
      console.error('Get grade by ID error:', error);
      sendServerError(res, 'Failed to retrieve grade');
    }
  }

  // Update grade (teacher/admin only)
  async updateGrade(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { gradeId } = req.params;
      const updateData = req.body;
      const userUid = req.user!.uid;

      // Get existing grade
      const existingGrade = await hygraphGradeService.getGradeById(gradeId);
      if (!existingGrade) {
        sendNotFound(res, 'Grade not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingGrade.course?.id) {
        const course = await hygraphCourseService.getCourseById(existingGrade.course.id);
        if (course?.instructor?.uid !== userUid && course?.instructor?.id !== req.user!.hygraphId) {
          sendError(res, 'You can only update grades for your own courses');
          return;
        }
      }

      // Recalculate letter grade and grade points if final grade is updated
      if (updateData.finalGrade !== undefined) {
        updateData.letterGrade = GradeCalculator.numericToLetter(updateData.finalGrade);
        updateData.gradePoints = GradeCalculator.letterToGradePoints(updateData.letterGrade);
      }

      const updatedGrade = await hygraphGradeService.updateGrade(gradeId, updateData);
      sendSuccess(res, 'Grade updated successfully', updatedGrade);
    } catch (error) {
      console.error('Update grade error:', error);
      sendServerError(res, 'Failed to update grade');
    }
  }

  // Get student's grades
  async getStudentGrades(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.uid;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const grades = await hygraphGradeService.getGradesByStudent(studentId, limit);
      
      sendPaginatedResponse(
        res,
        'Your grades retrieved successfully',
        grades,
        page,
        limit,
        grades.length
      );
    } catch (error) {
      console.error('Get student grades error:', error);
      sendServerError(res, 'Failed to retrieve your grades');
    }
  }

  // Get grades by course
  async getCourseGrades(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Verify course exists and user has access
      const course = await hygraphCourseService.getCourseById(courseId);
      if (!course) {
        sendNotFound(res, 'Course not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && course.instructor?.uid !== req.user!.uid) {
        sendError(res, 'You can only view grades for your own courses');
        return;
      }

      const grades = await hygraphGradeService.getGradesByCourse(courseId, limit);
      
      sendPaginatedResponse(
        res,
        'Course grades retrieved successfully',
        grades,
        page,
        limit,
        grades.length
      );
    } catch (error) {
      console.error('Get course grades error:', error);
      sendServerError(res, 'Failed to retrieve course grades');
    }
  }

  // Get student's grade for specific course
  async getStudentCourseGrade(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const studentId = req.user!.uid;

      const grade = await hygraphGradeService.getStudentCourseGrade(studentId, courseId);
      if (!grade) {
        sendNotFound(res, 'Grade not found for this course');
        return;
      }

      sendSuccess(res, 'Course grade retrieved successfully', grade);
    } catch (error) {
      console.error('Get student course grade error:', error);
      sendServerError(res, 'Failed to retrieve course grade');
    }
  }

  // ===== GRADE CALCULATION =====

  // Calculate grade for student in course
  async calculateGrade(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { studentId, courseId } = req.body;
      const calculatedBy = req.user!.uid;

      if (!studentId || !courseId) {
        sendError(res, 'Missing required fields: studentId, courseId');
        return;
      }

      // Verify student exists
      const student = await hygraphUserService.getUserByUid(studentId);
      if (!student) {
        sendNotFound(res, 'Student not found');
        return;
      }

      // Verify course exists
      const course = await hygraphCourseService.getCourseById(courseId);
      if (!course) {
        sendNotFound(res, 'Course not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && course.instructor?.uid !== calculatedByUid && course.instructor?.id !== req.user!.hygraphId) {
        sendError(res, 'You can only calculate grades for your own courses');
        return;
      }

      const grade = await hygraphGradeService.autoCalculateGrade(
        student.id,
        courseId,
        60, // Assignment weight
        40, // Exam weight
        undefined, // Participation grade
        undefined, // Participation weight
        calculatedBy
      );

      sendSuccess(res, 'Grade calculated successfully', grade);
    } catch (error) {
      console.error('Calculate grade error:', error);
      sendServerError(res, 'Failed to calculate grade');
    }
  }

  // Calculate grades for all students in course
  async calculateCourseGrades(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const calculatedBy = req.user!.uid;

      // Verify course exists
      const course = await hygraphCourseService.getCourseById(courseId);
      if (!course) {
        sendNotFound(res, 'Course not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && course.instructor?.uid !== calculatedBy) {
        sendError(res, 'You can only calculate grades for your own courses');
        return;
      }

      // Get all enrollments for the course
      const enrollments = await hygraphCourseService.getCourseEnrollments(courseId);
      const results = [];

      for (const enrollment of enrollments) {
        if (enrollment.student?.id) {
          try {
            const grade = await hygraphGradeService.autoCalculateGrade(
              enrollment.student.id,
              courseId,
              60, // Assignment weight
              40, // Exam weight
              undefined, // Participation grade
              undefined, // Participation weight
              calculatedBy
            );
            results.push({ studentId: enrollment.student.id, grade });
          } catch (error) {
            console.error(`Error calculating grade for student ${enrollment.student.id}:`, error);
            results.push({ 
              studentId: enrollment.student.id, 
              error: 'Failed to calculate grade' 
            });
          }
        }
      }

      sendSuccess(res, 'Course grades calculated successfully', { results });
    } catch (error) {
      console.error('Calculate course grades error:', error);
      sendServerError(res, 'Failed to calculate course grades');
    }
  }

  // ===== STATISTICS =====

  // Get student's GPA
  async getStudentGPA(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.uid;
      const gpaData = await hygraphGradeService.getStudentGPA(studentId);
      sendSuccess(res, 'GPA calculated successfully', gpaData);
    } catch (error) {
      console.error('Get student GPA error:', error);
      sendServerError(res, 'Failed to calculate GPA');
    }
  }

  // Get course grade statistics
  async getCourseGradeStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      // Verify course exists and user has access
      const course = await hygraphCourseService.getCourseById(courseId);
      if (!course) {
        sendNotFound(res, 'Course not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && course.instructor?.uid !== req.user!.uid) {
        sendError(res, 'You can only view statistics for your own courses');
        return;
      }

      const stats = await hygraphGradeService.getCourseGradeStats(courseId);
      sendSuccess(res, 'Course grade statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get course grade stats error:', error);
      sendServerError(res, 'Failed to retrieve course grade statistics');
    }
  }

  // Get teacher's grading statistics
  async getTeacherGradingStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teacherId = req.user!.uid;
      const stats = await hygraphGradeService.getTeacherGradingStats(teacherId);
      sendSuccess(res, 'Teacher grading statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get teacher grading stats error:', error);
      sendServerError(res, 'Failed to retrieve teacher grading statistics');
    }
  }

  // ===== UTILITY ENDPOINTS =====

  // Convert numeric grade to letter grade
  async convertToLetterGrade(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { numericGrade } = req.body;

      if (numericGrade === undefined || numericGrade < 0 || numericGrade > 100) {
        sendError(res, 'Valid numeric grade (0-100) is required');
        return;
      }

      const letterGrade = GradeCalculator.numericToLetter(numericGrade);
      const gradePoints = GradeCalculator.letterToGradePoints(letterGrade);

      sendSuccess(res, 'Grade converted successfully', {
        numericGrade,
        letterGrade,
        gradePoints
      });
    } catch (error) {
      console.error('Convert to letter grade error:', error);
      sendServerError(res, 'Failed to convert grade');
    }
  }

  // Calculate weighted average
  async calculateWeightedAverage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        assignmentGrades, 
        examGrades, 
        assignmentWeight, 
        examWeight, 
        participationGrade, 
        participationWeight 
      } = req.body;

      if (!assignmentGrades || !examGrades || assignmentWeight === undefined || examWeight === undefined) {
        sendError(res, 'Missing required fields: assignmentGrades, examGrades, assignmentWeight, examWeight');
        return;
      }

      const calculationData = {
        assignmentGrades,
        examGrades,
        assignmentWeight,
        examWeight,
        participationGrade,
        participationWeight,
        calculationMethod: 'WEIGHTED_AVERAGE' as const
      };

      const finalGrade = GradeCalculator.calculateWeightedAverage(calculationData);
      const letterGrade = GradeCalculator.numericToLetter(finalGrade);
      const gradePoints = GradeCalculator.letterToGradePoints(letterGrade);

      sendSuccess(res, 'Weighted average calculated successfully', {
        finalGrade: Math.round(finalGrade * 100) / 100,
        letterGrade,
        gradePoints
      });
    } catch (error) {
      console.error('Calculate weighted average error:', error);
      sendServerError(res, 'Failed to calculate weighted average');
    }
  }
}

export default new GradeController();