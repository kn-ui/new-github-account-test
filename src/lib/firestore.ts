/* eslint-disable @typescript-eslint/no-explicit-any */
// COMPATIBILITY LAYER: This file provides backward compatibility for components 
// that still import from firestore.ts after migration to Hygraph + Clerk

// Re-export all types and interfaces from the new types file
export * from './types';
import { api } from './api';

// Note: All actual data operations now go through the API layer (src/lib/api.ts) 
// which connects to the backend that uses Hygraph for data storage.

console.warn('firestore.ts is deprecated. Please import types from src/lib/types.ts and use src/lib/api.ts for data operations.');

// Stub services that redirect to API calls
export const userService = {
  async getUsers(limitCount?: number) {
    const response = await api.getUsers({ page: 1, limit: limitCount || 1000 });
    return response.data || [];
  },
  async getUserById(uid: string) {
    try {
      const response = await api.getUserProfile();
      if (response.data?.uid === uid) return response.data;
      return null;
    } catch {
      return null;
    }
  },
  async getUserByEmail(email: string) {
    try {
      const response = await api.getUsers({ page: 1, limit: 1 });
      return response.data?.[0] || null;
    } catch {
      return null;
    }
  },
  async createUser(userData: any) {
    const response = await api.createUser(userData);
    return response.data?.uid || userData.uid || '';
  },
  async updateUser(uid: string, updates: any) {
    await api.updateUserProfile(updates);
  },
};

export const courseService = {
  async getCourses(limitCount?: number) {
    const response = await api.getCourses({ page: 1, limit: limitCount || 100 });
    return response.data || [];
  },
  async getCourseById(courseId: string) {
    const response = await api.getCourseById(courseId);
    return response.data || null;
  },
  async getCoursesByInstructor(instructorId: string) {
    const response = await api.getMyCourses({ page: 1, limit: 100 });
    return response.data || [];
  },
  async createCourse(courseData: any) {
    const response = await api.createCourse(courseData);
    return response.data?.id || '';
  },
  async updateCourse(courseId: string, updates: any) {
    await api.updateCourse(courseId, updates);
  },
  async deleteCourse(courseId: string) {
    await api.deleteCourse(courseId);
  },
};

export const enrollmentService = {
  async getEnrollmentsByStudent(studentId: string) {
    try {
      const response = await api.getMyEnrollments();
      return response.data || [];
    } catch {
      return [];
    }
  },
  async getAllEnrollments() {
    try {
      const response = await api.getMyEnrollments();
      return response.data || [];
    } catch {
      return [];
    }
  },
  async createEnrollment(enrollmentData: any) {
    await api.enrollInCourse(enrollmentData.courseId);
    return 'enrollment-id';
  },
};

export const submissionService = {
  async getSubmissionsByStudent(studentId: string) {
    // This would need a new API endpoint
    return [];
  },
  async getSubmissionsByAssignment(assignmentId: string) {
    // This would need a new API endpoint  
    return [];
  },
  async createSubmission(submissionData: any) {
    // This would need a new API endpoint
    return 'submission-id';
  },
  async gradeSubmission(submissionId: string, grade: number, feedback: string) {
    // This would need a new API endpoint
  },
};

export const assignmentService = {
  async getAssignmentsByCourse(courseId: string) {
    // This would need a new API endpoint
    return [];
  },
  async getAssignmentById(assignmentId: string) {
    // This would need a new API endpoint
    return null;
  },
  async createAssignment(assignmentData: any) {
    // This would need a new API endpoint
    return 'assignment-id';
  },
  async updateAssignment(assignmentId: string, updates: any) {
    // This would need a new API endpoint
  },
};

export const announcementService = {
  async getAnnouncements(courseId?: string, limitCount = 10) {
    // This would need a new API endpoint
    return [];
  },
  async createAnnouncement(announcementData: any) {
    // This would need a new API endpoint
    return 'announcement-id';
  },
};

export const eventService = {
  async getEvents(limitCount = 10) {
    const response = await api.getEvents({ page: 1, limit: limitCount });
    return response.data || [];
  },
  async createEvent(eventData: any) {
    // This would need a new API endpoint
    return 'event-id';
  },
};

export const examService = {
  async getExamsByCourse(courseId: string) {
    // This would need a new API endpoint
    return [];
  },
  async getExamById(examId: string) {
    // This would need a new API endpoint
    return null;
  },
};

export const examAttemptService = {
  async getAttemptsByStudent(studentId: string) {
    // This would need a new API endpoint
    return [];
  },
  async createAttempt(examId: string, studentId: string) {
    // This would need a new API endpoint
    return 'attempt-id';
  },
};

export const blogService = {
  async getBlogPosts(limitCount = 10) {
    const response = await api.getBlogPosts({ page: 1, limit: limitCount });
    return response.data || [];
  },
  async createBlogPost(blogData: any) {
    // This would need a new API endpoint
    return 'blog-id';
  },
};

export const forumService = {
  async getForumThreads(limitCount = 10) {
    const response = await api.getForumThreads({ page: 1, limit: limitCount });
    return response.data || [];
  },
  async createForumThread(threadData: any) {
    const response = await api.createForumThread(threadData);
    return response.data?.id || 'thread-id';
  },
};

export const courseMaterialService = {
  async getCourseMaterialsByCourse(courseId: string) {
    // This would need a new API endpoint
    return [];
  },
};

export const analyticsService = {
  async getAdminStats() {
    const response = await api.getAdminUserStats();
    return response.data || {};
  },
  async getTeacherStats(teacherId: string) {
    // This would need a new API endpoint
    return {};
  },
  async getStudentStats(studentId: string) {
    // This would need a new API endpoint
    return {};
  },
};

export const studentDataService = {
  async getStudentDashboardData(studentId: string) {
    // This would need comprehensive dashboard API
    return {};
  },
  async getEnrollmentsWithCourses(studentId: string) {
    const response = await api.getMyEnrollments();
    return response.data || [];
  },
};

export const assignmentEditRequestService = {
  async createEditRequest(data: any) {
    // This would need a new API endpoint
    return 'request-id';
  },
  async getEditRequestsByStudent(studentId: string) {
    // This would need a new API endpoint
    return [];
  },
};

export const gradeService = {
  async getGradesByCourse(courseId: string) {
    // This would need a new API endpoint
    return [];
  },
};

export const certificateService = {
  async getCertificatesForUser(uid: string) {
    // This would need a new API endpoint
    return [];
  },
};

export const activityLogService = {
  async upsertToday(uid: string) {
    // This would need a new API endpoint
  },
  async countDays(uid: string, daysBack: number) {
    // This would need a new API endpoint
    return 0;
  },
};

export const supportTicketService = {
  async createTicket(ticketData: any) {
    const response = await api.createSupportTicket(ticketData);
    return response.data?.id || 'ticket-id';
  },
  async getTickets(limitCount = 100) {
    const response = await api.getMySupportTickets({ page: 1, limit: limitCount });
    return response.data || [];
  },
};