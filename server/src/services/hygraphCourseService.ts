import { hygraphClient } from '../config/hygraph';
import {
  GET_COURSES,
  GET_COURSE_BY_ID,
  CREATE_COURSE,
  UPDATE_COURSE,
  DELETE_COURSE,
  GET_ENROLLMENTS,
  CREATE_ENROLLMENT,
  UPDATE_ENROLLMENT
} from '../lib/hygraphOperations';
import { hygraphUserService } from './hygraphUserService';

// Types for Hygraph Course data
export interface HygraphCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  maxStudents: number;
  syllabus: string;
  isActive: boolean;
  instructorName: string;
  dateCreated: string;
  dateUpdated: string;
  instructor?: {
    id: string;
    uid: string;
    displayName: string;
    email: string;
  };
  enrollments?: HygraphEnrollment[];
  assignments?: any[];
  materials?: any[];
  exams?: any[];
}

export interface HygraphEnrollment {
  id: string;
  enrollmentStatus: string;
  progress: number;
  completedLessons: string[];
  isActive: boolean;
  enrolledAt: string;
  lastAccessedAt: string;
  student?: {
    id: string;
    uid: string;
    displayName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    description: string;
  };
}

export interface CreateCourseData {
  title: string;
  description: string;
  category: string;
  duration: number;
  maxStudents: number;
  syllabus: string;
  instructorName: string;
  instructorId?: string;
  isActive?: boolean;
}

export interface UpdateCourseData {
  title?: string;
  description?: string;
  category?: string;
  duration?: number;
  maxStudents?: number;
  syllabus?: string;
  instructorName?: string;
  instructorId?: string;
  isActive?: boolean;
}

// Hygraph Course Service for Backend
export const hygraphCourseService = {
  // Get all courses with pagination and filtering
  async getCourses(
    limit: number = 100,
    offset: number = 0,
    where?: any
  ): Promise<HygraphCourse[]> {
    try {
      const response: any = await hygraphClient.request(GET_COURSES, {
        first: limit,
        skip: offset,
        where: where || {}
      });
      return response.courses || [];
    } catch (error) {
      console.error('Error fetching courses from Hygraph:', error);
      throw error;
    }
  },

  // Get course by ID
  async getCourseById(id: string): Promise<HygraphCourse | null> {
    try {
      const response: any = await hygraphClient.request(GET_COURSE_BY_ID, { id });
      return response.course || null;
    } catch (error) {
      console.error('Error fetching course by ID from Hygraph:', error);
      throw error;
    }
  },

  // Create a new course
  async createCourse(courseData: CreateCourseData): Promise<HygraphCourse> {
    try {
      const now = new Date().toISOString();
      const data: any = {
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        duration: courseData.duration,
        maxStudents: courseData.maxStudents,
        syllabus: courseData.syllabus,
        instructorName: courseData.instructorName,
        isActive: courseData.isActive ?? true,
        dateCreated: now,
        dateUpdated: now
      };

      // Connect to instructor if instructorId provided
      if (courseData.instructorId) {
        // First, find the Hygraph user by UID
        const instructor = await hygraphUserService.getUserByUid(courseData.instructorId);
        if (instructor) {
          data.instructor = { connect: { id: instructor.id } };
        }
      }

      const response: any = await hygraphClient.request(CREATE_COURSE, { data });
      return response.createCourse;
    } catch (error) {
      console.error('Error creating course in Hygraph:', error);
      throw error;
    }
  },

  // Update course
  async updateCourse(id: string, courseData: UpdateCourseData): Promise<HygraphCourse> {
    try {
      const data: any = {
        ...courseData,
        dateUpdated: new Date().toISOString()
      };

      // Connect to instructor if instructorId provided
      if (courseData.instructorId) {
        const instructor = await hygraphUserService.getUserByUid(courseData.instructorId);
        if (instructor) {
          data.instructor = { connect: { id: instructor.id } };
        }
        delete data.instructorId;
      }

      const response: any = await hygraphClient.request(UPDATE_COURSE, { id, data });
      return response.updateCourse;
    } catch (error) {
      console.error('Error updating course in Hygraph:', error);
      throw error;
    }
  },

  // Delete course
  async deleteCourse(id: string): Promise<void> {
    try {
      await hygraphClient.request(DELETE_COURSE, { id });
    } catch (error) {
      console.error('Error deleting course from Hygraph:', error);
      throw error;
    }
  },

  // Search courses
  async searchCourses(query: string, limit: number = 50): Promise<HygraphCourse[]> {
    try {
      const response: any = await hygraphClient.request(GET_COURSES, {
        first: limit,
        skip: 0,
        where: {
          OR: [
            { title_contains: query },
            { description_contains: query },
            { category_contains: query },
            { instructorName_contains: query }
          ]
        }
      });
      return response.courses || [];
    } catch (error) {
      console.error('Error searching courses in Hygraph:', error);
      throw error;
    }
  },

  // Get courses by category
  async getCoursesByCategory(category: string, limit: number = 100): Promise<HygraphCourse[]> {
    try {
      const response: any = await hygraphClient.request(GET_COURSES, {
        first: limit,
        skip: 0,
        where: { category }
      });
      return response.courses || [];
    } catch (error) {
      console.error('Error fetching courses by category from Hygraph:', error);
      throw error;
    }
  },

  // Get courses by instructor UID
  async getCoursesByInstructorUid(instructorUid: string, limit: number = 100): Promise<HygraphCourse[]> {
    try {
      // First get the instructor's Hygraph ID
      const instructor = await hygraphUserService.getUserByUid(instructorUid);
      if (!instructor) {
        return [];
      }

      const response: any = await hygraphClient.request(GET_COURSES, {
        first: limit,
        skip: 0,
        where: { instructor: { id: instructor.id } }
      });
      return response.courses || [];
    } catch (error) {
      console.error('Error fetching courses by instructor from Hygraph:', error);
      throw error;
    }
  },

  // Get active courses only
  async getActiveCourses(limit: number = 100): Promise<HygraphCourse[]> {
    try {
      const response: any = await hygraphClient.request(GET_COURSES, {
        first: limit,
        skip: 0,
        where: { isActive: true }
      });
      return response.courses || [];
    } catch (error) {
      console.error('Error fetching active courses from Hygraph:', error);
      throw error;
    }
  },

  // ===== ENROLLMENT OPERATIONS =====

  // Get enrollments with filtering
  async getEnrollments(
    limit: number = 100,
    offset: number = 0,
    where?: any
  ): Promise<HygraphEnrollment[]> {
    try {
      const response: any = await hygraphClient.request(GET_ENROLLMENTS, {
        first: limit,
        skip: offset,
        where: where || {}
      });
      return response.enrollments || [];
    } catch (error) {
      console.error('Error fetching enrollments from Hygraph:', error);
      throw error;
    }
  },

  // Get enrollments by student UID
  async getStudentEnrollments(studentUid: string): Promise<HygraphEnrollment[]> {
    try {
      // First get the student's Hygraph ID
      const student = await hygraphUserService.getUserByUid(studentUid);
      if (!student) {
        return [];
      }

      const response: any = await hygraphClient.request(GET_ENROLLMENTS, {
        first: 100,
        skip: 0,
        where: { student: { id: student.id } }
      });
      return response.enrollments || [];
    } catch (error) {
      console.error('Error fetching student enrollments from Hygraph:', error);
      throw error;
    }
  },

  // Get enrollments by course ID
  async getCourseEnrollments(courseId: string): Promise<HygraphEnrollment[]> {
    try {
      const response: any = await hygraphClient.request(GET_ENROLLMENTS, {
        first: 100,
        skip: 0,
        where: { course: { id: courseId } }
      });
      return response.enrollments || [];
    } catch (error) {
      console.error('Error fetching course enrollments from Hygraph:', error);
      throw error;
    }
  },

  // Create enrollment
  async createEnrollment(studentUid: string, courseId: string): Promise<HygraphEnrollment> {
    try {
      // Get the student's Hygraph ID
      const student = await hygraphUserService.getUserByUid(studentUid);
      if (!student) {
        throw new Error('Student not found');
      }

      // Get the course to check if it exists and is active
      const course = await this.getCourseById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      if (!course.isActive) {
        throw new Error('Course is not active');
      }

      // Check if student is already enrolled
      const existingEnrollments: any = await hygraphClient.request(GET_ENROLLMENTS, {
        first: 1,
        skip: 0,
        where: {
          AND: [
            { student: { id: student.id } },
            { course: { id: courseId } }
          ]
        }
      });

      if (existingEnrollments.enrollments && existingEnrollments.enrollments.length > 0) {
        throw new Error('Student already enrolled in this course');
      }

      // Check capacity (count active enrollments)
      const activeEnrollments: any = await hygraphClient.request(GET_ENROLLMENTS, {
        first: 1000,
        skip: 0,
        where: {
          AND: [
            { course: { id: courseId } },
            { enrollmentStatus: 'ACTIVE' }
          ]
        }
      });

      const enrollmentCount = activeEnrollments.enrollments?.length || 0;
      if (enrollmentCount >= course.maxStudents) {
        throw new Error('Course is full');
      }

      // Create enrollment
      const now = new Date().toISOString();
      const enrollmentData = {
        student: { connect: { id: student.id } },
        course: { connect: { id: courseId } },
        enrollmentStatus: 'ACTIVE',
        progress: 0,
        completedLessons: [],
        isActive: true,
        enrolledAt: now,
        lastAccessedAt: now
      };

      const response: any = await hygraphClient.request(CREATE_ENROLLMENT, {
        data: enrollmentData
      });

      return response.createEnrollment;
    } catch (error) {
      console.error('Error creating enrollment in Hygraph:', error);
      throw error;
    }
  },

  // Update enrollment progress
  async updateEnrollmentProgress(
    enrollmentId: string,
    completedLessonId: string
  ): Promise<HygraphEnrollment> {
    try {
      // Get current enrollment
      const enrollments: any = await hygraphClient.request(GET_ENROLLMENTS, {
        first: 1,
        skip: 0,
        where: { id: enrollmentId }
      });

      if (!enrollments.enrollments || enrollments.enrollments.length === 0) {
        throw new Error('Enrollment not found');
      }

      const enrollment = enrollments.enrollments[0];
      const completedLessons = enrollment.completedLessons || [];

      // Add lesson to completed lessons if not already there
      if (!completedLessons.includes(completedLessonId)) {
        completedLessons.push(completedLessonId);
      }

      // For now, we'll use a simple progress calculation
      // In a real app, you'd get the total lessons from the course
      const progress = enrollment.progress || 0;

      const updateData = {
        completedLessons,
        progress: Math.min(progress + 10, 100), // Simple increment, adjust as needed
        lastAccessedAt: new Date().toISOString(),
        enrollmentStatus: progress >= 100 ? 'COMPLETED' : 'ACTIVE'
      };

      const response: any = await hygraphClient.request(UPDATE_ENROLLMENT, {
        id: enrollmentId,
        data: updateData
      });

      return response.updateEnrollment;
    } catch (error) {
      console.error('Error updating enrollment progress in Hygraph:', error);
      throw error;
    }
  },

  // Get course statistics
  async getCourseStats(instructorUid?: string): Promise<{
    totalCourses: number;
    activeCourses: number;
    totalEnrollments: number;
    totalStudents: number;
    completionRate: number;
  }> {
    try {
      let courses: HygraphCourse[] = [];

      if (instructorUid) {
        // Get courses for specific instructor
        courses = await this.getCoursesByInstructorUid(instructorUid);
      } else {
        // Get all courses
        courses = await this.getCourses(1000, 0);
      }

      const totalCourses = courses.length;
      const activeCourses = courses.filter(c => c.isActive).length;

      // Get all enrollments for these courses
      const courseIds = courses.map(c => c.id);
      let allEnrollments: HygraphEnrollment[] = [];

      if (courseIds.length > 0) {
        // Note: In a production app, you might need to batch this if you have many courses
        const enrollmentPromises = courseIds.map(courseId =>
          this.getCourseEnrollments(courseId)
        );
        const enrollmentArrays = await Promise.all(enrollmentPromises);
        allEnrollments = enrollmentArrays.flat();
      }

      // Count unique students
      const uniqueStudentIds = new Set(
        allEnrollments.map(e => e.student?.id).filter(Boolean)
      );

      // Calculate completion rate
      let totalProgress = 0;
      allEnrollments.forEach(enrollment => {
        totalProgress += enrollment.progress || 0;
      });

      const completionRate = allEnrollments.length > 0
        ? Math.round(totalProgress / allEnrollments.length)
        : 0;

      return {
        totalCourses,
        activeCourses,
        totalEnrollments: allEnrollments.length,
        totalStudents: uniqueStudentIds.size,
        completionRate
      };
    } catch (error) {
      console.error('Error getting course stats from Hygraph:', error);
      throw error;
    }
  }
};
