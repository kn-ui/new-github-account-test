// Enhanced API client that uses Clerk's getToken() for fresh tokens
// This prevents token expiration issues and ensures proper authentication

import { useAuth } from '@clerk/clerk-react';

// In dev, force same-origin so Vite proxy handles CORS. In prod, use VITE_API_BASE_URL
const IS_DEV = import.meta.env.DEV;
const API_BASE_URL = IS_DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '');

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

// Enhanced API client with token refresh handling
export class ClerkApiClient {
  private getToken: (() => Promise<string | null>) | null = null;

  constructor(getTokenFn?: () => Promise<string | null>) {
    this.getToken = getTokenFn || null;
  }

  // Set the getToken function (called from React components)
  setGetToken(getTokenFn: () => Promise<string | null>) {
    this.getToken = getTokenFn;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const url = buildUrl(endpoint);
    
    // Get fresh token from Clerk (tokens are short-lived, so we get them fresh each time)
    let token: string | null = null;
    if (this.getToken) {
      try {
        token = await this.getToken();
      } catch (error) {
        console.warn('Failed to get token from Clerk:', error);
      }
    }
    
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
        // Handle token expiration with automatic retry
        if (response.status === 401 && data.error === 'token_expired' && retryCount === 0) {
          console.log('Token expired, refreshing and retrying...');
          // Get a fresh token and retry once
          if (this.getToken) {
            try {
              const freshToken = await this.getToken();
              if (freshToken) {
                const retryConfig: RequestInit = {
                  ...config,
                  headers: {
                    ...config.headers,
                    Authorization: `Bearer ${freshToken}`,
                  },
                };
                const retryResponse = await fetch(url, retryConfig);
                const retryData = await retryResponse.json();
                
                if (!retryResponse.ok) {
                  throw new Error(retryData.message || `HTTP error! status: ${retryResponse.status}`);
                }
                return retryData;
              }
            } catch (retryError) {
              console.warn('Failed to refresh token for retry:', retryError);
            }
          }
        }

        // Don't log authentication errors for every request
        if (response.status !== 401 && response.status !== 403) {
          console.error('API request failed:', data.message || `HTTP error! status: ${response.status}`);
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      // Only log non-auth errors
      if (error instanceof Error && !error.message.includes('Access token is missing') && !error.message.includes('401') && !error.message.includes('403')) {
        console.error('API request failed:', error);
      }
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  // Users API
  async createUser(userData: any): Promise<ApiResponse<any>> {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.request('/api/users/profile');
  }

  async updateUserProfile(userData: any): Promise<ApiResponse<any>> {
    return this.request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async createOrUpdateProfile(userData: any): Promise<ApiResponse<any>> {
    return this.request('/api/users/profile', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Courses API
  async getCourses(params?: {
    page?: number;
    limit?: number;
    category?: string;
    instructor?: string;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);
    if (params?.instructor) searchParams.append('instructor', params.instructor);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<any[]>(`/api/courses${query}`);
  }

  async createCourse(courseData: any): Promise<ApiResponse<any>> {
    return this.request('/api/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  // Events API
  async getEvents(params?: { page?: number; limit?: number }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<any[]>(`/api/content/events${query}`);
  }

  // File upload API
  async uploadFile(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/api/files/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
      },
    });
  }

  // Contact API (public endpoint)
  async sendContactMessage(payload: { name: string; email: string; subject: string; message: string; }): Promise<ApiResponse<any>> {
    return this.request('/api/content/contact', { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    });
  }
}

// Create a singleton instance
export const clerkApiClient = new ClerkApiClient();

// Hook to use the API client with Clerk authentication
export const useClerkApiClient = () => {
  const { getToken } = useAuth();
  
  // Set the getToken function on the client
  clerkApiClient.setGetToken(getToken);
  
  return clerkApiClient;
};
