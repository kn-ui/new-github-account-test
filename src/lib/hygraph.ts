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

export interface HygraphCourseMaterial {
  id: string;
  courseId: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'other';
  fileUrl?: string;
  externalLink?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    title: string;
  };
}

export interface HygraphExam {
  id: string;
  title: string;
  description: string;
  courseId: string;
  questions: any[];
  durationMinutes: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    title: string;
  };
}

export interface HygraphExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  status: 'in_progress' | 'submitted' | 'graded';
  answers: any[];
  score?: number;
  maxScore?: number;
  submittedAt?: string;
  gradedAt?: string;
  manualScores?: Record<string, number>;
  manualFeedback?: Record<string, string>;
  isGraded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HygraphGrade {
  id: string;
  studentId: string;
  courseId: string;
  finalGrade: number;
  letterGrade: string;
  notes?: string;
  calculatedBy: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    displayName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
  };
}

export interface HygraphEditRequest {
  id: string;
  submissionId: string;
  assignmentId: string;
  studentId: string;
  teacherId: string;
  request: string;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  teacherResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HygraphSupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Generic API call function with authentication
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get Clerk token from localStorage or use empty string
  const authToken = localStorage.getItem('authToken') || '';
  
  // Debug logging
  console.log('API Call Debug:', {
    endpoint,
    url,
    hasToken: !!authToken,
    tokenLength: authToken.length,
    tokenPreview: authToken ? `${authToken.substring(0, 20)}...` : 'No token'
  });
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    console.error('API Call Failed:', {
      status: response.status,
      statusText: response.statusText,
      url,
      hasToken: !!authToken
    });
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

  async getActiveAnnouncements(limitCount = 20): Promise<HygraphAnnouncement[]> {
    try {
      return apiCall<HygraphAnnouncement[]>(`/announcements/active?limit=${limitCount}`);
    } catch (error) {
      console.warn('Active announcements failed, using test data:', error);
      return apiCall<HygraphAnnouncement[]>(`/announcements/test`);
    }
  },

  async getRecentAnnouncements(limitCount = 20): Promise<HygraphAnnouncement[]> {
    try {
      return apiCall<HygraphAnnouncement[]>(`/announcements/recent?limit=${limitCount}`);
    } catch (error) {
      console.warn('Recent announcements failed, using test data:', error);
      return apiCall<HygraphAnnouncement[]>(`/announcements/test`);
    }
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

  async getPublicEvents(limitCount = 10): Promise<HygraphEvent[]> {
    try {
      return apiCall<HygraphEvent[]>(`/events/public?limit=${limitCount}`);
    } catch (error) {
      console.warn('Public events failed, using test data:', error);
      return apiCall<HygraphEvent[]>(`/events/test`);
    }
  },

  async getUpcomingEvents(limitCount = 10): Promise<HygraphEvent[]> {
    try {
      return apiCall<HygraphEvent[]>(`/events/upcoming?limit=${limitCount}`);
    } catch (error) {
      console.warn('Upcoming events failed, using test data:', error);
      return apiCall<HygraphEvent[]>(`/events/test`);
    }
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

  async getPublishedBlogPosts(limitCount = 10): Promise<HygraphBlog[]> {
    try {
      return apiCall<HygraphBlog[]>(`/blog/posts/published?limit=${limitCount}`);
    } catch (error) {
      console.warn('Published blog posts failed, using test data:', error);
      return apiCall<HygraphBlog[]>(`/blog/test`);
    }
  },

  async getFeaturedBlogPosts(limitCount = 10): Promise<HygraphBlog[]> {
    try {
      return apiCall<HygraphBlog[]>(`/blog/posts/featured?limit=${limitCount}`);
    } catch (error) {
      console.warn('Featured blog posts failed, using test data:', error);
      return apiCall<HygraphBlog[]>(`/blog/test`);
    }
  },

  async getRecentBlogPosts(limitCount = 10): Promise<HygraphBlog[]> {
    try {
      return apiCall<HygraphBlog[]>(`/blog/posts/recent?limit=${limitCount}`);
    } catch (error) {
      console.warn('Recent blog posts failed, using test data:', error);
      return apiCall<HygraphBlog[]>(`/blog/test`);
    }
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
    try {
      return apiCall<HygraphForumThread[]>(`/forum/threads?limit=${limitCount}`);
    } catch (error) {
      console.warn('Forum threads failed, using test data:', error);
      return apiCall<HygraphForumThread[]>(`/forum/test`);
    }
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

// Activity Log Service - For attendance tracking
export const activityLogService = {
  async upsertToday(uid: string): Promise<void> {
    return apiCall(`/activity-logs/upsert-today`, {
      method: 'POST',
      body: JSON.stringify({ userId: uid }),
    });
  },

  async countDays(uid: string, daysBack: number): Promise<number> {
    return apiCall<number>(`/activity-logs/count-days/${uid}?daysBack=${daysBack}`);
  },
};

// Course Material operations
export const courseMaterialService = {
  async createCourseMaterial(materialData: Omit<HygraphCourseMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/course-materials', {
      method: 'POST',
      body: JSON.stringify(materialData),
    });
    return response.id;
  },

  async getCourseMaterialsByCourse(courseId: string, limitCount = 50): Promise<HygraphCourseMaterial[]> {
    return apiCall<HygraphCourseMaterial[]>(`/course-materials/course/${courseId}?limit=${limitCount}`);
  },

  async getMaterialsByTeacher(teacherId: string): Promise<HygraphCourseMaterial[]> {
    return apiCall<HygraphCourseMaterial[]>(`/course-materials/teacher/${teacherId}`);
  },

  async updateCourseMaterial(materialId: string, updates: Partial<HygraphCourseMaterial>): Promise<void> {
    await apiCall(`/course-materials/${materialId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteCourseMaterial(materialId: string): Promise<void> {
    await apiCall(`/course-materials/${materialId}`, {
      method: 'DELETE',
    });
  },
};

// Exam operations
export const examService = {
  async getExamsByCourse(courseId: string): Promise<HygraphExam[]> {
    return apiCall<HygraphExam[]>(`/exams/course/${courseId}`);
  },

  async getExamById(examId: string): Promise<HygraphExam | null> {
    try {
      return await apiCall<HygraphExam>(`/exams/${examId}`);
    } catch (error) {
      return null;
    }
  },

  async createExam(examData: Omit<HygraphExam, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/exams', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
    return response.id;
  },

  async updateExam(examId: string, updates: Partial<HygraphExam>): Promise<void> {
    await apiCall(`/exams/${examId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteExam(examId: string): Promise<void> {
    await apiCall(`/exams/${examId}`, {
      method: 'DELETE',
    });
  },

  async isExamLocked(examId: string): Promise<{ locked: boolean; reason?: string }> {
    return apiCall<{ locked: boolean; reason?: string }>(`/exams/${examId}/lock-status`);
  },
};

// Exam Attempt operations
export const examAttemptService = {
  async getAttemptForStudent(examId: string, studentId: string): Promise<HygraphExamAttempt | null> {
    try {
      return await apiCall<HygraphExamAttempt>(`/exam-attempts/student/${studentId}/exam/${examId}`);
    } catch (error) {
      return null;
    }
  },

  async getAttemptsByStudent(studentId: string): Promise<HygraphExamAttempt[]> {
    return apiCall<HygraphExamAttempt[]>(`/exam-attempts/student/${studentId}`);
  },

  async getAttemptsByExam(examId: string): Promise<HygraphExamAttempt[]> {
    return apiCall<HygraphExamAttempt[]>(`/exam-attempts/exam/${examId}`);
  },

  async createAttempt(examId: string, studentId: string): Promise<string> {
    const response = await apiCall<{ id: string }>('/exam-attempts', {
      method: 'POST',
      body: JSON.stringify({ examId, studentId }),
    });
    return response.id;
  },

  async getAttemptById(attemptId: string): Promise<HygraphExamAttempt | null> {
    try {
      return await apiCall<HygraphExamAttempt>(`/exam-attempts/${attemptId}`);
    } catch (error) {
      return null;
    }
  },

  async saveProgress(attemptId: string, answers: any[]): Promise<void> {
    await apiCall(`/exam-attempts/${attemptId}/save`, {
      method: 'PUT',
      body: JSON.stringify({ answers }),
    });
  },

  async submitAttempt(attemptId: string, data: { answers: any[]; autoScore: number }): Promise<void> {
    await apiCall(`/exam-attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAttempt(attemptId: string, updates: Partial<HygraphExamAttempt>): Promise<void> {
    await apiCall(`/exam-attempts/${attemptId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// Grade operations
export const gradeService = {
  async getGradesByCourse(courseId: string): Promise<HygraphGrade[]> {
    return apiCall<HygraphGrade[]>(`/grades/course/${courseId}`);
  },

  async getGradeByStudentAndCourse(courseId: string, studentId: string): Promise<HygraphGrade | null> {
    try {
      return await apiCall<HygraphGrade>(`/grades/student/${studentId}/course/${courseId}`);
    } catch (error) {
      return null;
    }
  },

  async calculateFinalGrade(courseId: string, studentId: string): Promise<HygraphGrade> {
    return apiCall<HygraphGrade>(`/grades/calculate`, {
      method: 'POST',
      body: JSON.stringify({ courseId, studentId }),
    });
  },

  async createGrade(gradeData: Omit<HygraphGrade, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/grades', {
      method: 'POST',
      body: JSON.stringify(gradeData),
    });
    return response.id;
  },

  async updateGrade(gradeId: string, updates: Partial<HygraphGrade>): Promise<void> {
    await apiCall(`/grades/${gradeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// Assignment Edit Request operations
export const assignmentEditRequestService = {
  async getEditRequestsByStudent(studentId: string): Promise<HygraphEditRequest[]> {
    return apiCall<HygraphEditRequest[]>(`/edit-requests/student/${studentId}`);
  },

  async getEditRequestsByTeacher(teacherId: string): Promise<HygraphEditRequest[]> {
    return apiCall<HygraphEditRequest[]>(`/edit-requests/teacher/${teacherId}`);
  },

  async createEditRequest(requestData: Omit<HygraphEditRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/edit-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    return response.id;
  },

  async updateEditRequest(requestId: string, updates: Partial<HygraphEditRequest>): Promise<void> {
    await apiCall(`/edit-requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async approveEditRequest(requestId: string, response: string): Promise<void> {
    await apiCall(`/edit-requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ teacherResponse: response }),
    });
  },

  async denyEditRequest(requestId: string, response: string): Promise<void> {
    await apiCall(`/edit-requests/${requestId}/deny`, {
      method: 'POST',
      body: JSON.stringify({ teacherResponse: response }),
    });
  },
};

// Support Ticket operations
export const supportTicketService = {
  async getSupportTickets(): Promise<HygraphSupportTicket[]> {
    return apiCall<HygraphSupportTicket[]>('/support-tickets');
  },

  async createSupportTicket(ticketData: Omit<HygraphSupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const response = await apiCall<{ id: string }>('/support-tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
    return response.id;
  },

  async updateSupportTicket(ticketId: string, updates: Partial<HygraphSupportTicket>): Promise<void> {
    await apiCall(`/support-tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteSupportTicket(ticketId: string): Promise<void> {
    await apiCall(`/support-tickets/${ticketId}`, {
      method: 'DELETE',
    });
  },
};

export { hygraphClient };
export default hygraphClient;