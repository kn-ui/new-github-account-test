/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLClient } from 'graphql-request';

// Initialize Hygraph client
const hygraphClient = new GraphQLClient(
  import.meta.env.VITE_HYGRAPH_ENDPOINT || 'https://api-us-east-1.hygraph.com/v2/your-project/master',
  {
    headers: {
      authorization: `Bearer ${import.meta.env.VITE_HYGRAPH_TOKEN || 'your-token'}`,
    },
  }
);

// Types for Hygraph data
export interface HygraphUser {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  passwordChanged?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HygraphCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  maxStudents: number;
  syllabus: string;
  isActive: boolean;
  instructor?: {
    id: string;
    displayName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HygraphEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  status: 'ACTIVE' | 'COMPLETED';
  progress: number;
  completedLessons: string[];
  enrolledAt: string;
  lastAccessedAt: string;
  isActive: boolean;
  course?: HygraphCourse;
}

export interface HygraphAssignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  instructions?: string;
  teacherId: string;
  attachments?: { type: 'file' | 'link'; url: string; title?: string }[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface HygraphSubmission {
  id: string;
  courseId: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'GRADED';
  grade?: number;
  feedback?: string;
  content: string;
  attachments?: string[];
  maxScore?: number;
  instructions?: string;
  isActive: boolean;
}

export interface HygraphAnnouncement {
  id: string;
  courseId?: string;
  targetAudience?: 'ALL_STUDENTS' | 'COURSE_STUDENTS' | 'SPECIFIC_STUDENT';
  recipientStudentId?: string;
  title: string;
  body: string;
  authorId: string;
  createdAt: string;
  externalLink?: string;
}

export interface HygraphEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  createdBy: string;
  type: string;
  time: string;
  location: string;
  maxAttendees: number;
  currentAttendees: number;
  status: string;
  isActive: boolean;
}

export interface HygraphBlog {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  likes: number;
}

export interface HygraphForumThread {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  lastActivityAt: string;
  category?: string;
  likes?: number;
}

export interface HygraphForumPost {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface HygraphCertificate {
  id: string;
  type: 'TOP_PERFORMER' | 'PERFECT_ATTENDANCE' | 'HOMEWORK_HERO' | 'COURSE_COMPLETION' | 'ACADEMIC_EXCELLENCE' | 'LEADERSHIP' | 'PARTICIPATION' | 'ACHIEVEMENT';
  title: string;
  description?: string;
  status: 'DRAFT' | 'ISSUED' | 'VERIFIED' | 'REVOKED';
  certificateNumber: string;
  issuedAt?: string;
  verifiedAt?: string;
  revokedAt?: string;
  revokedReason?: string;
  issuedBy?: {
    id: string;
    displayName: string;
    email: string;
  };
  user?: {
    id: string;
    displayName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
  };
  verificationCode?: string;
  pdfUrl?: string;
  imageUrl?: string;
}

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Generic API call function
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'API call failed');
  }

  return data.data;
}

// User operations
export const userService = {
  async getUsers(limitCount?: number): Promise<HygraphUser[]> {
    const limit = limitCount || 10;
    return apiCall<HygraphUser[]>(`/users?limit=${limit}`);
  },

  async getUserById(uid: string): Promise<HygraphUser | null> {
    try {
      return await apiCall<HygraphUser>(`/users/${uid}`);
    } catch (error) {
      return null;
    }
  },

  async getUserByEmail(email: string): Promise<HygraphUser | null> {
    try {
      return await apiCall<HygraphUser>(`/users/email/${email}`);
    } catch (error) {
      return null;
    }
  },

  async getUsersByIds(uids: string[]): Promise<Record<string, HygraphUser | null>> {
    const result: Record<string, HygraphUser | null> = {};
    const unique = Array.from(new Set(uids.filter(Boolean)));
    
    await Promise.all(unique.map(async (uid) => {
      try {
        const found = await this.getUserById(uid);
        result[uid] = found;
      } catch {
        result[uid] = null;
      }
    }));
    
    return result;
  },

  async getTeachers(): Promise<HygraphUser[]> {
    return apiCall<HygraphUser[]>('/users/teachers');
  },

  async getStudentsByTeacher(teacherId: string): Promise<HygraphUser[]> {
    return apiCall<HygraphUser[]>(`/users/students-by-teacher/${teacherId}`);
  },

  async createUser(userData: Omit<HygraphUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.id;
  },

  async updateUser(uid: string, updates: Partial<HygraphUser>): Promise<void> {
    await apiCall(`/users/${uid}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteUser(userId: string): Promise<void> {
    await apiCall(`/users/${userId}`, {
      method: 'DELETE',
    });
  },

  async getInactiveUsers(limitCount?: number): Promise<HygraphUser[]> {
    const limit = limitCount || 10;
    return apiCall<HygraphUser[]>(`/users/inactive?limit=${limit}`);
  },

  async getAllUsersIncludingInactive(limitCount?: number): Promise<HygraphUser[]> {
    const limit = limitCount || 10;
    return apiCall<HygraphUser[]>(`/users/all?limit=${limit}`);
  },
};

// Course operations
export const courseService = {
  async getCourses(limitCount = 10): Promise<HygraphCourse[]> {
    return apiCall<HygraphCourse[]>(`/courses?limit=${limitCount}`);
  },

  async getAllCourses(limitCount = 1000): Promise<HygraphCourse[]> {
    return apiCall<HygraphCourse[]>(`/courses?limit=${limitCount}`);
  },

  async getCourseById(courseId: string): Promise<HygraphCourse | null> {
    try {
      return await apiCall<HygraphCourse>(`/courses/${courseId}`);
    } catch (error) {
      return null;
    }
  },

  async getCoursesByInstructor(instructorId: string): Promise<HygraphCourse[]> {
    return apiCall<HygraphCourse[]>(`/courses/instructor/${instructorId}`);
  },

  async getAllCoursesByInstructor(instructorId: string): Promise<HygraphCourse[]> {
    return apiCall<HygraphCourse[]>(`/courses/instructor/${instructorId}/all`);
  },

  async getCoursesByTitle(title: string): Promise<HygraphCourse | null> {
    try {
      return await apiCall<HygraphCourse>(`/courses/title/${title}`);
    } catch (error) {
      return null;
    }
  },

  async getCoursesByIds(courseIds: string[]): Promise<{ [key: string]: HygraphCourse }> {
    if (courseIds.length === 0) return {};
    
    const coursePromises = courseIds.map(async (courseId) => {
      try {
        const course = await this.getCourseById(courseId);
        return course ? { [courseId]: course } : {};
      } catch (error) {
        console.error(`Error loading course ${courseId}:`, error);
        return {};
      }
    });
    
    const courseResults = await Promise.all(coursePromises);
    return courseResults.reduce((acc, courseObj) => ({ ...acc, ...courseObj }), {});
  },

  async createCourse(courseData: Omit<HygraphCourse, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
    return response.id;
  },

  async updateCourse(courseId: string, updates: Partial<HygraphCourse>): Promise<void> {
    await apiCall(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteCourse(courseId: string): Promise<void> {
    await apiCall(`/courses/${courseId}`, {
      method: 'DELETE',
    });
  },

  async deleteCourseWithDependencies(courseId: string): Promise<void> {
    await apiCall(`/courses/${courseId}/with-dependencies`, {
      method: 'DELETE',
    });
  },
};

// Enrollment operations
export const enrollmentService = {
  async getEnrollmentsByStudent(studentId: string): Promise<(HygraphEnrollment & { course?: HygraphCourse })[]> {
    return apiCall<(HygraphEnrollment & { course?: HygraphCourse })[]>(`/enrollments/student/${studentId}`);
  },

  async getEnrollmentsByCourse(courseId: string): Promise<HygraphEnrollment[]> {
    return apiCall<HygraphEnrollment[]>(`/enrollments/course/${courseId}`);
  },

  async createEnrollment(enrollmentData: Omit<HygraphEnrollment, 'id' | 'enrolledAt' | 'lastAccessedAt' | 'isActive'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/enrollments', {
      method: 'POST',
      body: JSON.stringify(enrollmentData),
    });
    return response.id;
  },

  async getAllEnrollments(): Promise<(HygraphEnrollment & { course?: HygraphCourse })[]> {
    return apiCall<(HygraphEnrollment & { course?: HygraphCourse })[]>('/enrollments');
  },

  async updateEnrollmentProgress(enrollmentId: string, progress: number, completedLessons: string[]): Promise<void> {
    await apiCall(`/enrollments/${enrollmentId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress, completedLessons }),
    });
  },

  async deleteEnrollment(enrollmentId: string): Promise<void> {
    await apiCall(`/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });
  },
};

// Assignment operations
export const assignmentService = {
  async createAssignment(assignmentData: Omit<HygraphAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
    return response.id;
  },

  async getAssignmentsByCourse(courseId: string, limitCount = 50): Promise<HygraphAssignment[]> {
    return apiCall<HygraphAssignment[]>(`/assignments/course/${courseId}?limit=${limitCount}`);
  },
  
  async getAssignmentsByIds(ids: string[]): Promise<Record<string, HygraphAssignment | null>> {
    const results: Record<string, HygraphAssignment | null> = {};
    await Promise.all(ids.map(async (id) => {
      try {
        const assignment = await this.getAssignmentById(id);
        results[id] = assignment;
      } catch {
        results[id] = null;
      }
    }));
    return results;
  },

  async getAssignmentById(assignmentId: string): Promise<HygraphAssignment | null> {
    try {
      return await apiCall<HygraphAssignment>(`/assignments/${assignmentId}`);
    } catch (error) {
      return null;
    }
  },

  async getAssignmentsByTeacher(teacherId: string): Promise<HygraphAssignment[]> {
    return apiCall<HygraphAssignment[]>(`/assignments/teacher/${teacherId}`);
  },

  async updateAssignment(assignmentId: string, updates: Partial<HygraphAssignment>): Promise<void> {
    await apiCall(`/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteAssignment(assignmentId: string): Promise<void> {
    await apiCall(`/assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  },
};

// Submission operations
export const submissionService = {
  async getSubmissionsByStudent(studentId: string): Promise<HygraphSubmission[]> {
    return apiCall<HygraphSubmission[]>(`/submissions/student/${studentId}`);
  },

  async getSubmissionsByAssignment(assignmentId: string): Promise<HygraphSubmission[]> {
    return apiCall<HygraphSubmission[]>(`/submissions/assignment/${assignmentId}`);
  },

  async getSubmissionsByCourse(courseId: string): Promise<HygraphSubmission[]> {
    return apiCall<HygraphSubmission[]>(`/submissions/course/${courseId}`);
  },

  async createSubmission(submissionData: Omit<HygraphSubmission, 'id' | 'submittedAt'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
    return response.id;
  },

  async gradeSubmission(submissionId: string, grade: number, feedback: string): Promise<void> {
    await apiCall(`/submissions/${submissionId}/grade`, {
      method: 'PUT',
      body: JSON.stringify({ grade, feedback }),
    });
  },

  async updateSubmission(submissionId: string, updates: Partial<HygraphSubmission>): Promise<void> {
    await apiCall(`/submissions/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async getSubmission(submissionId: string): Promise<HygraphSubmission | null> {
    try {
      return await apiCall<HygraphSubmission>(`/submissions/${submissionId}`);
    } catch (error) {
      return null;
    }
  },
};

// Announcement operations
export const announcementService = {
  async getAnnouncements(courseId?: string, limitCount = 10): Promise<HygraphAnnouncement[]> {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    params.append('limit', limitCount.toString());
    
    return apiCall<HygraphAnnouncement[]>(`/announcements?${params.toString()}`);
  },

  async getAnnouncementsForStudent(studentId: string, enrolledCourseIds: string[], limitCount = 20): Promise<HygraphAnnouncement[]> {
    return apiCall<HygraphAnnouncement[]>(`/announcements/student/${studentId}?limit=${limitCount}`);
  },

  async getAllAnnouncements(limitCount = 20): Promise<HygraphAnnouncement[]> {
    return apiCall<HygraphAnnouncement[]>(`/announcements?limit=${limitCount}`);
  },

  async getPublicGeneralAnnouncements(limitCount = 30): Promise<HygraphAnnouncement[]> {
    return apiCall<HygraphAnnouncement[]>(`/announcements/public?limit=${limitCount}`);
  },

  async createAnnouncement(announcementData: Omit<HygraphAnnouncement, 'id' | 'createdAt'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcementData),
    });
    return response.id;
  },

  async getAnnouncementsByTeacher(teacherId: string): Promise<HygraphAnnouncement[]> {
    return apiCall<HygraphAnnouncement[]>(`/announcements/teacher/${teacherId}`);
  },

  async getAdminAnnouncements(): Promise<HygraphAnnouncement[]> {
    return apiCall<HygraphAnnouncement[]>('/announcements/admin');
  },

  async getAnnouncementsForUser(userId: string, userRole: string): Promise<HygraphAnnouncement[]> {
    return apiCall<HygraphAnnouncement[]>(`/announcements/user/${userId}?role=${userRole}`);
  },

  async updateAnnouncement(announcementId: string, updates: Partial<HygraphAnnouncement>): Promise<void> {
    await apiCall(`/announcements/${announcementId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteAnnouncement(announcementId: string): Promise<void> {
    await apiCall(`/announcements/${announcementId}`, {
      method: 'DELETE',
    });
  },
};

// Event operations
export const eventService = {
  async getEvents(limitCount = 10): Promise<HygraphEvent[]> {
    return apiCall<HygraphEvent[]>(`/events?limit=${limitCount}`);
  },

  async getAllEvents(): Promise<HygraphEvent[]> {
    return apiCall<HygraphEvent[]>('/events');
  },

  async createEvent(eventData: Omit<HygraphEvent, 'id'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
    return response.id;
  },

  async updateEvent(eventId: string, updates: Partial<HygraphEvent>): Promise<void> {
    await apiCall(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteEvent(eventId: string): Promise<void> {
    await apiCall(`/events/${eventId}`, {
      method: 'DELETE',
    });
  },
};

// Blog operations
export const blogService = {
  async getBlogPosts(limitCount = 10): Promise<HygraphBlog[]> {
    return apiCall<HygraphBlog[]>(`/blog?limit=${limitCount}`);
  },

  async createBlogPost(blogData: Omit<HygraphBlog, 'id' | 'createdAt' | 'likes'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/blog', {
      method: 'POST',
      body: JSON.stringify(blogData),
    });
    return response.id;
  },

  async likeBlogPost(blogId: string): Promise<void> {
    await apiCall(`/blog/${blogId}/like`, {
      method: 'POST',
    });
  },

  async updateBlogPost(blogId: string, blogData: Partial<Omit<HygraphBlog, 'id' | 'createdAt' | 'likes' | 'authorId' | 'authorName'>>): Promise<void> {
    await apiCall(`/blog/${blogId}`, {
      method: 'PUT',
      body: JSON.stringify(blogData),
    });
  },

  async deleteBlogPost(blogId: string): Promise<void> {
    await apiCall(`/blog/${blogId}`, {
      method: 'DELETE',
    });
  },
};

// Forum operations
export const forumService = {
  async getForumThreads(limitCount = 10): Promise<HygraphForumThread[]> {
    return apiCall<HygraphForumThread[]>(`/forum/threads?limit=${limitCount}`);
  },

  async getForumThreadById(threadId: string): Promise<HygraphForumThread | null> {
    try {
      return await apiCall<HygraphForumThread>(`/forum/threads/${threadId}`);
    } catch (error) {
      return null;
    }
  },

  async createForumThread(threadData: Omit<HygraphForumThread, 'id' | 'createdAt' | 'lastActivityAt'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/forum/threads', {
      method: 'POST',
      body: JSON.stringify(threadData),
    });
    return response.id;
  },

  async getForumPosts(threadId: string, limitCount = 10): Promise<HygraphForumPost[]> {
    return apiCall<HygraphForumPost[]>(`/forum/threads/${threadId}/posts?limit=${limitCount}`);
  },

  async createForumPost(threadId: string, postData: Omit<HygraphForumPost, 'id' | 'createdAt'>): Promise<string> {
    const response = await apiCall<{ id: string }>(`/forum/threads/${threadId}/posts`, {
      method: 'POST',
      body: JSON.stringify(postData),
    });
    return response.id;
  },

  async updateForumPost(threadId: string, postId: string, updates: Partial<HygraphForumPost>): Promise<void> {
    await apiCall(`/forum/threads/${threadId}/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteForumPost(threadId: string, postId: string): Promise<void> {
    await apiCall(`/forum/threads/${threadId}/posts/${postId}`, {
      method: 'DELETE',
    });
  },

  async likeThread(threadId: string): Promise<void> {
    await apiCall(`/forum/threads/${threadId}/like`, {
      method: 'POST',
    });
  },

  async likePost(threadId: string, postId: string): Promise<void> {
    await apiCall(`/forum/threads/${threadId}/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  async updateForumThread(threadId: string, updates: Partial<HygraphForumThread>): Promise<void> {
    await apiCall(`/forum/threads/${threadId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteForumThread(threadId: string): Promise<void> {
    await apiCall(`/forum/threads/${threadId}`, {
      method: 'DELETE',
    });
  },
};

// Certificate operations
export const certificateService = {
  async getCertificatesForUser(uid: string): Promise<HygraphCertificate[]> {
    return apiCall<HygraphCertificate[]>(`/certificates/my-certificates`);
  },

  async award(uid: string, cert: Omit<HygraphCertificate, 'id'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/certificates', {
      method: 'POST',
      body: JSON.stringify({ ...cert, userId: uid }),
    });
    return response.id;
  },
};

// Analytics and statistics
export const analyticsService = {
  async getAdminStats() {
    return apiCall('/users/stats/admin');
  },

  async getTeacherStats(teacherId: string) {
    return apiCall(`/users/stats/teacher/${teacherId}`);
  },

  async getStudentStats(studentId: string) {
    return apiCall(`/users/stats/student/${studentId}`);
  },
};

// Student Data Service - Optimized batch loading
export const studentDataService = {
  async getStudentDashboardData(studentId: string) {
    return apiCall(`/users/dashboard/${studentId}`);
  },

  async getStudentCoursesData(studentId: string) {
    return apiCall(`/users/courses/${studentId}`);
  },

  async getStudentAssignmentsData(studentId: string) {
    return apiCall(`/users/assignments/${studentId}`);
  },

  async getStudentSubmissionsData(studentId: string) {
    return apiCall(`/users/submissions/${studentId}`);
  },

  clearStudentCache(studentId: string) {
    // Cache clearing is handled by the backend
    console.log('Cache cleared for student:', studentId);
  }
};

export default hygraphClient;