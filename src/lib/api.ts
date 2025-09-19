// In dev, force same-origin so Vite proxy handles CORS. In prod, use VITE_API_BASE_URL
const IS_DEV = !!((import.meta as any).env?.DEV);
const API_BASE_URL = IS_DEV ? '' : (((import.meta as any).env?.VITE_API_BASE_URL as string) || '');

// Helper to build full URL
const buildUrl = (endpoint: string) => {
  if (API_BASE_URL) return `${API_BASE_URL}${endpoint}`;
  // same-origin proxy (configure dev server to proxy /api to backend)
  return endpoint;
};

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

// Course types
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorName: string;
  category: string;
  duration: number;
  maxStudents: number;
  // derived count via enrollments
  currentEnrollmentCount?: number;
  lessons: any[];
  assignments: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syllabus?: string;
}

// User types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  authorName: string;
  category: string;
  readTime?: string;
  image?: string;
  tags?: string[];
  createdAt: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  location: string;
  description?: string;
}

export interface ForumThread {
  id: string;
  title: string;
  category: string;
  createdByName: string;
  createdAt: string;
  lastActivityAt: string;
  pinned?: boolean;
}

export interface ForumThreadPost {
  id: string;
  threadId: string;
  body: string;
  createdByName: string;
  createdAt: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Public contact endpoint
  async sendContactMessage(payload: { name: string; email: string; subject: string; message: string; }): Promise<ApiResponse<any>> {
    return this.request(`/api/content/contact`, { method: 'POST', body: JSON.stringify(payload) });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = buildUrl(endpoint);
    
    // Get auth token from localStorage
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  // Courses API
  async getCourses(params?: {
    page?: number;
    limit?: number;
    category?: string;
    instructor?: string;
  }): Promise<ApiResponse<Course[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);
    if (params?.instructor) searchParams.append('instructor', params.instructor);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<Course[]>(`/api/courses${query}`);
  }

  async getCourseById(id: string): Promise<ApiResponse<Course>> {
    return this.request<Course>(`/api/courses/${id}`);
  }

  async createCourse(courseData: Partial<Course>): Promise<ApiResponse<Course>> {
    return this.request<Course>('/api/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  async updateCourse(id: string, courseData: Partial<Course>): Promise<ApiResponse<Course>> {
    return this.request<Course>(`/api/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  }

  async deleteCourse(id: string): Promise<ApiResponse> {
    return this.request(`/api/courses/${id}`, {
      method: 'DELETE',
    });
  }

  async enrollInCourse(courseId: string): Promise<ApiResponse> {
    return this.request(`/api/courses/${courseId}/enroll`, {
      method: 'POST',
    });
  }

  async searchCourses(query: string, page = 1, limit = 10): Promise<ApiResponse<Course[]>> {
    return this.request<Course[]>(`/api/courses/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  }

  // Users API
  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUsers(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<User[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<User[]>(`/api/users${query}`);
  }

  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/users/profile');
  }

  async updateUserProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async createUserProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/api/users/profile', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // My enrollments
  async getMyEnrollments(): Promise<ApiResponse> {
    return this.request('/api/courses/student/enrollments');
  }

  // My courses (for instructors)
  async getMyCourses(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Course[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<Course[]>(`/api/courses/instructor/my-courses${query}`);
  }

  // Course enrollments (for instructors/admin)
  async getCourseEnrollments(courseId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/courses/${courseId}/enrollments`);
  }

  // Admin stats
  async getAdminUserStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/users/admin/stats');
  }

  async getAdminCourseStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/courses/admin/stats');
  }

  // Content APIs
  async getBlogPosts(params?: { page?: number; limit?: number; q?: string; category?: string; }): Promise<ApiResponse<BlogPost[]>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    if (params?.q) sp.append('q', params.q);
    if (params?.category) sp.append('category', params.category);
    const query = sp.toString() ? `?${sp.toString()}` : '';
    return this.request<BlogPost[]>(`/api/content/blog${query}`);
  }

  async getEvents(params?: { page?: number; limit?: number; type?: string; month?: string; }): Promise<ApiResponse<EventItem[]>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    if (params?.type) sp.append('type', params.type);
    if (params?.month) sp.append('month', params.month);
    const query = sp.toString() ? `?${sp.toString()}` : '';
    return this.request<EventItem[]>(`/api/content/events${query}`);
  }

  async getForumThreads(params?: { page?: number; limit?: number; category?: string; }): Promise<ApiResponse<ForumThread[]>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    if (params?.category) sp.append('category', params.category);
    const query = sp.toString() ? `?${sp.toString()}` : '';
    return this.request<ForumThread[]>(`/api/content/forum/threads${query}`);
  }

  async getForumPosts(threadId: string, params?: { page?: number; limit?: number; }): Promise<ApiResponse<ForumThreadPost[]>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    const query = sp.toString() ? `?${sp.toString()}` : '';
    return this.request<ForumThreadPost[]>(`/api/content/forum/threads/${threadId}/posts${query}`);
  }

  async createForumThread(payload: { title: string; category: string; }): Promise<ApiResponse<any>> {
    return this.request(`/api/content/forum/threads`, { method: 'POST', body: JSON.stringify(payload) });
  }

  async createForumPost(threadId: string, payload: { body: string; }): Promise<ApiResponse<any>> {
    return this.request(`/api/content/forum/threads/${threadId}/posts`, { method: 'POST', body: JSON.stringify(payload) });
  }

  async createSupportTicket(payload: { name: string; email: string; subject: string; message: string; }): Promise<ApiResponse<any>> {
    return this.request(`/api/content/support/tickets`, { method: 'POST', body: JSON.stringify(payload) });
  }

  async getMySupportTickets(params?: { page?: number; limit?: number; }): Promise<ApiResponse<any[]>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    const query = sp.toString() ? `?${sp.toString()}` : '';
    return this.request<any[]>(`/api/content/support/my-tickets${query}`);
  }
}

// Create and export API client instance
export const api = new ApiClient(API_BASE_URL);

// Utility functions
export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};