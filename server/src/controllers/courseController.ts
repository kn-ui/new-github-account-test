import { Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import courseService from '../services/courseService';
import userService from '../services/userService';
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendPaginatedResponse,
  sendServerError
} from '../utils/response';

export class CourseController {
  // Create a new course (admin only)
  async createCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, syllabus, category, duration, maxStudents, thumbnail, isActive } = req.body;
      const instructorId = req.user!.uid;

      // Get instructor name
      const instructor = await userService.getUserById(instructorId);
      if (!instructor) {
        sendNotFound(res, 'Instructor not found');
        return;
      }

      const isTeacher = req.user?.role === UserRole.TEACHER;
      const courseData = {
        title,
        description,
        syllabus,
        category,
        duration: parseInt(duration) || 8,
        maxStudents: parseInt(maxStudents) || 50,
        thumbnail,

        // Teachers' courses should be pending approval by default
        // Admins can choose, defaulting to true if unspecified
        isActive: typeof isActive === 'boolean' ? isActive : true
      };

      const newCourse = await courseService.createCourse(courseData, instructorId, instructor.displayName);
      sendCreated(res, 'Course created successfully', newCourse);
    } catch (error) {
      console.error('Create course error:', error);
      sendServerError(res, 'Failed to create course');
    }
  }

  // Get all courses (public catalog)
  async getAllCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;
      const instructorId = req.query.instructor as string;

      const result = await courseService.getAllCourses(page, limit, category, instructorId, true);
      console.log('CourseController - getAllCourses result:', result);

      sendPaginatedResponse(
        res,
        'Courses retrieved successfully',
        result.courses,
        page,
        limit,
        result.total
      );
    } catch (error) {
      console.error('Get all courses error:', error);
      sendServerError(res, 'Failed to get courses');
    }
  }

  // Get course by ID
  async getCourseById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const course = await courseService.getCourseById(courseId);

      if (!course) {
        sendNotFound(res, 'Course not found');
        return;
      }

      sendSuccess(res, 'Course retrieved successfully', course);
    } catch (error) {
      console.error('Get course by ID error:', error);
      sendServerError(res, 'Failed to get course');
    }
  }

  // Search courses
  async searchCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { q: searchTerm } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!searchTerm || typeof searchTerm !== 'string') {
        sendError(res, 'Search term is required');
        return;
      }

      const result = await courseService.searchCourses(searchTerm, page, limit);

      sendPaginatedResponse(
        res,
        'Course search completed',
        result.courses,
        page,
        limit,
        result.total
      );
    } catch (error) {
      console.error('Search courses error:', error);
      sendServerError(res, 'Failed to search courses');
    }
  }

  // Update course (instructor/admin only)
  async updateCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { title, description, syllabus, category, duration, maxStudents, thumbnail, isActive } = req.body;
      const instructorId = req.user!.uid;

      const updateData = {
        title,
        description,
        syllabus,
        category,
        duration: duration ? parseInt(duration) : undefined,
        maxStudents: maxStudents ? parseInt(maxStudents) : undefined,
        thumbnail,
        isActive
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      const updatedCourse = await courseService.updateCourse(courseId, updateData, instructorId);
      sendSuccess(res, 'Course updated successfully', updatedCourse);
    } catch (error) {
      console.error('Update course error:', error);
      sendServerError(res, 'Failed to update course');
    }
  }

  // Delete course (admin only)
  async deleteCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      await courseService.deleteCourse(courseId);
      sendSuccess(res, 'Course deleted successfully');
    } catch (error) {
      console.error('Delete course error:', error);
      sendServerError(res, 'Failed to delete course');
    }
  }

  // Enroll in course (student only)
  async enrollInCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const studentId = req.user!.uid;

      const enrollment = await courseService.enrollStudent(studentId, courseId);
      sendCreated(res, 'Successfully enrolled in course', enrollment);
    } catch (error) {
      console.error('Enroll in course error:', error);
      sendServerError(res, 'Failed to enroll in course');
    }
  }

  // Get student's enrollments
  async getMyEnrollments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.uid;
      const enrollments = await courseService.getStudentEnrollments(studentId);

      // Get course details for each enrollment
      const enrollmentsWithCourses = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await courseService.getCourseById(enrollment.courseId);
          return {
            ...enrollment,
            course
          };
        })
      );

      sendSuccess(res, 'Enrollments retrieved successfully', enrollmentsWithCourses);
    } catch (error) {
      console.error('Get my enrollments error:', error);
      sendServerError(res, 'Failed to get enrollments');
    }
  }

  // Get course enrollments (teacher/admin)
  async getCourseEnrollments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const enrollments = await courseService.getCourseEnrollments(courseId);

      // Get student details for each enrollment
      const enrollmentsWithStudents = await Promise.all(
        enrollments.map(async (enrollment) => {
          const student = await userService.getUserById(enrollment.studentId);
          return {
            ...enrollment,
            student
          };
        })
      );

      sendSuccess(res, 'Course enrollments retrieved successfully', enrollmentsWithStudents);
    } catch (error) {
      console.error('Get course enrollments error:', error);
      sendServerError(res, 'Failed to get course enrollments');
    }
  }

  // Update enrollment progress
  async updateProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { enrollmentId } = req.params;
      const { lessonId } = req.body;

      if (!lessonId) {
        sendError(res, 'Lesson ID is required');
        return;
      }

      const updatedEnrollment = await courseService.updateEnrollmentProgress(enrollmentId, lessonId);
      sendSuccess(res, 'Progress updated successfully', updatedEnrollment);
    } catch (error) {
      console.error('Update progress error:', error);
      sendServerError(res, 'Failed to update progress');
    }
  }

  // Get instructor's courses
  async getMyCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user!.uid;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await courseService.getAllCourses(page, limit, undefined, instructorId);

      sendPaginatedResponse(
        res,
        'Instructor courses retrieved successfully',
        result.courses,
        page,
        limit,
        result.total
      );
    } catch (error) {
      console.error('Get my courses error:', error);
      sendServerError(res, 'Failed to get instructor courses');
    }
  }

  // Get course statistics
  async getCourseStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user?.role === 'teacher' ? req.user.uid : undefined;
      const stats = await courseService.getCourseStats(instructorId);

      sendSuccess(res, 'Course statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get course stats error:', error);
      sendServerError(res, 'Failed to get course statistics');
    }
  }
}

export default new CourseController();