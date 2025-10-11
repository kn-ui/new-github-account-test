import { hygraphClient } from './hygraph';
import {
  GET_COURSES,
  GET_COURSE_BY_ID,
  CREATE_COURSE,
  UPDATE_COURSE,
  DELETE_COURSE
} from './hygraphOperations';

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
  createdAt: string;
  updatedAt: string;
  instructor?: {
    id: string;
    displayName: string;
    email: string;
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

// Hygraph Course Service
export const hygraphCourseService = {
  // Get all courses with pagination
  async getCourses(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphCourse[]> {
    try {
      const response = await hygraphClient.request(GET_COURSES, {
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
      const response = await hygraphClient.request(GET_COURSE_BY_ID, { id });
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
      const response = await hygraphClient.request(CREATE_COURSE, {
        data: {
          title: courseData.title,
          description: courseData.description,
          category: courseData.category,
          duration: courseData.duration,
          maxStudents: courseData.maxStudents,
          syllabus: courseData.syllabus,
          instructorName: courseData.instructorName,
          isActive: courseData.isActive ?? true,
          ...(courseData.instructorId && { instructor: { connect: { id: courseData.instructorId } } })
        }
      });
      return response.createCourse;
    } catch (error) {
      console.error('Error creating course in Hygraph:', error);
      throw error;
    }
  },

  // Update course
  async updateCourse(id: string, courseData: UpdateCourseData): Promise<HygraphCourse> {
    try {
      const response = await hygraphClient.request(UPDATE_COURSE, {
        id,
        data: {
          ...courseData,
          ...(courseData.instructorId && { instructor: { connect: { id: courseData.instructorId } } })
        }
      });
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

  // Get active courses only
  async getActiveCourses(limit: number = 100): Promise<HygraphCourse[]> {
    try {
      const response = await hygraphClient.request(GET_COURSES, {
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

  // Search courses
  async searchCourses(query: string, limit: number = 50): Promise<HygraphCourse[]> {
    try {
      const response = await hygraphClient.request(GET_COURSES, {
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
      const response = await hygraphClient.request(GET_COURSES, {
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

  // Get courses by instructor
  async getCoursesByInstructor(instructorId: string, limit: number = 100): Promise<HygraphCourse[]> {
    try {
      const response = await hygraphClient.request(GET_COURSES, {
        first: limit,
        skip: 0,
        where: { instructor: { id: instructorId } }
      });
      return response.courses || [];
    } catch (error) {
      console.error('Error fetching courses by instructor from Hygraph:', error);
      throw error;
    }
  }
};