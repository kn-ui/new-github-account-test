/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuthHook, useUser } from '@clerk/clerk-react';
// Import from the new types file instead of firestore
import type { FirestoreUser } from '../lib/types';
import { api, setAuthToken, removeAuthToken } from '@/lib/api';
import { useClerkApiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: any | null; // Clerk user type
  userProfile: FirestoreUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, displayName: string, role?: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<FirestoreUser>) => Promise<void>;
  createUser: (userData: Omit<FirestoreUser, 'createdAt' | 'updatedAt'>, password?: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useClerkAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export useAuth as an alias for backward compatibility
export const useAuth = useClerkAuth;

interface AuthProviderProps {
  children: React.ReactNode;
}


export const ClerkAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isSignedIn, isLoaded, signOut, getToken } = useClerkAuthHook();
  const { user } = useUser();
  const clerkApi = useClerkApiClient(); // Use the new API client with token refresh
  const [userProfile, setUserProfile] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Login function - redirects to Clerk's sign-in
  const login = async (email: string, password: string): Promise<any> => {
    // This should be handled by Clerk's SignIn component
    throw new Error('Use Clerk SignIn component for login');
  };

  // Signup function - redirects to Clerk's sign-up
  const signup = async (
    email: string, 
    password: string, 
    displayName: string,
    role: string = 'student'
  ): Promise<any> => {
    // This should be handled by Clerk's SignUp component
    throw new Error('Use Clerk SignUp component for signup');
  };

  // Create user function - for admin use only
  const createUser = async (userData: Omit<FirestoreUser, 'createdAt' | 'updatedAt'>, password?: string): Promise<string> => {
    try {
      // Create user via backend (Hygraph) using the new API client with token refresh
      const resp = await clerkApi.createUser({
        ...userData,
        uid: userData.uid || userData.id || '',
        isActive: true,
      });
      const userId = resp.data?.uid || userData.uid || '';
      
      toast.success(`User created successfully!`);
      return userId;
    } catch (error: any) {
      toast.error('Failed to create user: ' + error.message);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await signOut();
      removeAuthToken();
      setUserProfile(null);
      toast.success('Successfully logged out!');
    } catch (error: any) {
      toast.error('Logout failed: ' + error.message);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<FirestoreUser>): Promise<void> => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      // Update Clerk user metadata
      await user.update({
        firstName: data.displayName?.split(' ')[0] || user.firstName,
        lastName: data.displayName?.split(' ').slice(1).join(' ') || user.lastName,
        unsafeMetadata: {
          ...user.unsafeMetadata,
          role: data.role || user.unsafeMetadata?.role
        }
      });

      // Update profile via backend (Hygraph) using the new API client with token refresh
      await clerkApi.updateUserProfile({ ...data } as any);
      
      // Update local state
      if (userProfile) {
        setUserProfile({ ...userProfile, ...data });
      }
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    if (!isLoaded) {
      setLoading(true);
      return;
    }

    setLoading(false);

    if (isSignedIn && user) {
      // Set auth token for backend requests
      if (getToken) {
        getToken().then(token => {
          if (token) {
            setAuthToken(token);
          } else {
            removeAuthToken();
          }
        }).catch(error => {
          console.warn('Failed to get auth token:', error);
          removeAuthToken();
        });
      }

      // Fetch user profile via API (do not create automatically)
      const fetchUserProfile = async () => {
        try {
          // Try to get user profile by Clerk user ID
          let profile;
          try {
            const response = await clerkApi.getUserProfile();
            profile = response.data;
          } catch (error: any) {
            // If 404, user doesn't exist in Hygraph
            if (error.message?.includes('404') || error.message?.includes('not found')) {
              console.warn('User profile not found in Hygraph. Please contact an administrator.');
              toast.error('Your account has not been set up yet. Please contact an administrator to create your profile.');
              setUserProfile(null);
              return;
            } else if (error.message?.includes('Access token is missing') || error.message?.includes('401') || error.message?.includes('403')) {
              // Authentication issue - token might not be ready yet
              console.log('Auth token not ready, will retry...');
              return;
            } else {
              throw error;
            }
          }
          
          if (profile) {
            setUserProfile(profile as any);
          }
        } catch (error: any) {
          // Only log non-auth errors
          if (!error.message?.includes('Access token is missing') && !error.message?.includes('401') && !error.message?.includes('403')) {
            console.error('Error fetching user profile:', error);
            toast.error('Failed to load your profile. Please try again.');
          }
        }
      };

      fetchUserProfile();
    } else {
      setUserProfile(null);
      removeAuthToken();
    }
  }, [isSignedIn, isLoaded, user]);

  const value = {
    currentUser: isSignedIn ? user : null,
    userProfile,
    loading,
    login,
    signup,
    logout,
    updateUserProfile,
    createUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};