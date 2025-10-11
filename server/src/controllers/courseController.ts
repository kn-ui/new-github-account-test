import { Response } from 'express';
import { AuthenticatedRequest, UserRole, Course, Enrollment } from '../types';
import { hygraphCourseService } from '../services/hygraphCourseService';
import { hygraphUserService } from '../services/hygraphUserService';
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
      const { title, description, syllabus, category, duration, maxStudents, instructor, instructorName, isActive } = req.body;
      
      // Admins can specify an instructor, otherwise use the authenticated user
      let instructorId = req.user!.uid;
      let finalInstructorName = instructorName;
      
      // If instructor is provided (admin creating course for another instructor)
      if (instructor && req.user!.role === 'admin') {
        instructorId = instructor;
        
        // Get instructor name from Hygraph if not provided
        if (!finalInstructorName) {
          const instructorUser = await hygraphUserService.getUserByUid(instructorId);
          if (!instructorUser) {
            sendNotFound(res, 'Instructor not found');
            return;
          }
          finalInstructorName = instructorUser.displayName;
        }
      } else {
        // Teacher creating their own course - get their name
        const currentUser = await hygraphUserService.getUserByUid(instructorId);
        if (!currentUser) {
          sendNotFound(res, 'User not found');
          return;
        }
        finalInstructorName = currentUser.displayName;
      }

      // Validate required fields
      if (!title || !description || !category || !syllabus) {
        sendError(res, 'Missing required fields: title, description, category, syllabus');
        return;
      }

      const courseData = {
        title,
        description,
        syllabus,
        category,
        duration: parseInt(duration) || 8,
        maxStudents: parseInt(maxStudents) || 50,
        instructorName: finalInstructorName,
        instructorId,
        isActive: typeof isActive === 'boolean' ? isActive : true
      };

      const newCourse = await hygraphCourseService.createCourse(courseData);
      sendCreated(res, 'Course created successfully', newCourse);
    } catch (error: any) {
      console.error('Create course error:', error);
      sendServerError(res, 'Failed to create course: ' + (error.message || 'Unknown error'));
    }
  }

  // Get all courses (public catalog)
  async getAllCourses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;
      const instructorId = req.query.instructor as string;

      // Build where clause for Hygraph
      const where: any = { isActive: true };
      if (category) {
        where.category = category;
      }
      if (instructorId) {
        // Get instructor's Hygraph ID
        const instructor = await hygraphUserService.getUserByUid(instructorId);
        if (instructor) {
          where.instructor = { id: instructor.id };
        }
      }

      const offset = (page - 1) * limit;
      const courses = await hygraphCourseService.getCourses(limit, offset, where);
      
      // Get total count (for now, we'll fetch a large number and count)
      const allCourses = await hygraphCourseService.getCourses(1000, 0, where);
      const total = allCourses.length;

      console.log('CourseController - getAllCourses result:', { courses, total });

      sendPaginatedResponse(
        res,
        'Courses retrieved successfully',
        courses,
        page,
        limit,
        total
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
      const course = await hygraphCourseService.getCourseById(courseId);

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

      const courses = await hygraphCourseService.searchCourses(searchTerm, limit);
      
      // Manual pagination
      const offset = (page - 1) * limit;
      const paginatedCourses = courses.slice(offset, offset + limit);
      const total = courses.length;

      sendPaginatedResponse(
        res,
        'Course search completed',
        paginatedCourses,
        page,
        limit,
        total
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

      // Verify the instructor owns this course or is admin
      const course = await hygraphCourseService.getCourseById(courseId);
      if (!course) {
        sendNotFound(res, 'Course not found');
        return;
      }

      // Check authorization (admin can update any course, instructor can only update their own)
      if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
        if (course.instructor?.uid !== instructorId) {
          sendError(res, 'Unauthorized to update this course');
          return;
        }
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (syllabus !== undefined) updateData.syllabus = syllabus;
      if (category !== undefined) updateData.category = category;
      if (duration !== undefined) updateData.duration = parseInt(duration);
      if (maxStudents !== undefined) updateData.maxStudents = parseInt(maxStudents);
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedCourse = await hygraphCourseService.updateCourse(courseId, updateData);
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
      await hygraphCourseService.deleteCourse(courseId);
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

      const enrollment = await hygraphCourseService.createEnrollment(studentId, courseId);
      sendCreated(res, 'Successfully enrolled in course', enrollment);
    } catch (error) {
      console.error('Enroll in course error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to enroll in course';
      sendServerError(res, errorMessage);
    }
  }

  // Get student's enrollments
  async getMyEnrollments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user!.uid;
      const enrollments = await hygraphCourseService.getStudentEnrollments(studentId);

      sendSuccess(res, 'Enrollments retrieved successfully', enrollments);
    } catch (error) {
      console.error('Get my enrollments error:', error);
      sendServerError(res, 'Failed to get enrollments');
    }
  }

  // Get course enrollments (teacher/admin)
  async getCourseEnrollments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const enrollments = await hygraphCourseService.getCourseEnrollments(courseId);

      sendSuccess(res, 'Course enrollments retrieved successfully', enrollments);
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

      const updatedEnrollment = await hygraphCourseService.updateEnrollmentProgress(enrollmentId, lessonId);
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

      const allCourses = await hygraphCourseService.getCoursesByInstructorUid(instructorId, 1000);
      const total = allCourses.length;
      
      // Manual pagination
      const offset = (page - 1) * limit;
      const courses = allCourses.slice(offset, offset + limit);

      sendPaginatedResponse(
        res,
        'Instructor courses retrieved successfully',
        courses,
        page,
        limit,
        total
      );
    } catch (error) {
      console.error('Get my courses error:', error);
      sendServerError(res, 'Failed to get instructor courses');
    }
  }

  // Get courses by instructor ID
  async getCoursesByInstructor(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { instructorId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Verify user can access this data
      if (req.user!.uid !== instructorId && req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.SUPER_ADMIN) {
        sendError(res, 'Access denied');
        return;
      }

      const courses = await hygraphCourseService.getCoursesByInstructor(instructorId, limit, skip);
      
      sendPaginatedResponse(
        res,
        'Instructor courses retrieved successfully',
        courses,
        page,
        limit,
        courses.length
      );
    } catch (error) {
      console.error('Get courses by instructor error:', error);
      sendServerError(res, 'Failed to get instructor courses');
    }
  }

  // Get course statistics
  async getCourseStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user?.role === 'teacher' ? req.user.uid : undefined;
      const stats = await hygraphCourseService.getCourseStats(instructorId);

      sendSuccess(res, 'Course statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get course stats error:', error);
      sendServerError(res, 'Failed to get course statistics');
    }
  }
}

export default new CourseController();