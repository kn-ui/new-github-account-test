const API_BASE_URL = 'http://localhost:5000';

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
  enrolledStudents: string[];
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
  role: 'student' | 'teacher' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  accessToken: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
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