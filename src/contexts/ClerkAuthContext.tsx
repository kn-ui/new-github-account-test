/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuthHook, useUser } from '@clerk/clerk-react';
import { hygraphUserService, HygraphUser } from '../lib/hygraphUserService';
import { HygraphUser } from '@/lib/hygraph';
import { setAuthToken, removeAuthToken, api } from '@/lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: any | null; // Clerk user type
  userProfile: HygraphUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, displayName: string, role?: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<HygraphUser>) => Promise<void>;
  createUser: (userData: Omit<HygraphUser, 'createdAt' | 'updatedAt'>, password?: string) => Promise<string>;
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

const ClerkAuthProviderInner: React.FC<AuthProviderProps> = ({ children }) => {
  const { isSignedIn, isLoaded, signOut, getToken } = useClerkAuthHook();
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState<HygraphUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Login function - handled by custom login form
  const login = async (email: string, password: string): Promise<any> => {
    // This is now handled by the custom login form in src/pages/Login.tsx
    // which uses Clerk's useSignIn hook directly
    throw new Error('Login should be handled by the Login page component');
  };

  // Signup function - handled by custom signup form
  const signup = async (email: string, password: string, displayName: string, role?: string): Promise<any> => {
    // This is now handled by the custom signup form
    // which uses Clerk's useSignUp hook directly
    throw new Error('Signup should be handled by the Signup page component');
  };

  // Create user function - for admin use only
  const createUser = async (userData: Omit<HygraphUser, 'createdAt' | 'updatedAt'>, password?: string): Promise<string> => {
    try {
      // Create Hygraph user profile directly
      // Note: This assumes the user was created in Clerk via admin API
      const newUser = await hygraphUserService.createUser({
        uid: userData.uid || userData.id || '',
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role.toUpperCase() as 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN',
        isActive: userData.isActive ?? true,
        passwordChanged: true // Clerk handles password management
      });
      
      toast.success(`User created successfully!`);
      return newUser.id;
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
  const updateUserProfile = async (data: Partial<HygraphUser>): Promise<void> => {
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

      // Update Hygraph user profile
      if (userProfile) {
        await hygraphUserService.updateUser(userProfile.id, {
          ...data,
          role: data.role?.toUpperCase() as 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN'
        });
        
        // Update local state
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

      // Fetch or create user profile in Hygraph
      const fetchUserProfile = async () => {
        try {
          // First try to get user profile by Clerk user ID
          let profile = await hygraphUserService.getUserByUid(user.id);
          
          // If not found, try to find by email
          if (!profile && user.primaryEmailAddress?.emailAddress) {
            profile = await hygraphUserService.getUserByEmail(user.primaryEmailAddress.emailAddress);
          }
          
          if (profile) {
            // Convert HygraphUser to HygraphUser format for compatibility
            const convertedProfile: HygraphUser = {
              uid: profile.uid,
              id: profile.id,
              displayName: profile.displayName,
              email: profile.email,
              role: profile.role.toLowerCase() as 'student' | 'teacher' | 'admin' | 'super_admin',
              isActive: profile.isActive,
              passwordChanged: profile.passwordChanged,
              createdAt: new Date(profile.dateCreated),
              updatedAt: new Date(profile.dateUpdated)
            };
            setUserProfile(convertedProfile);
          } else {
            // Create a new user profile if none exists
            const newProfile = await hygraphUserService.createUser({
              uid: user.id,
              displayName: user.fullName || user.firstName || 'User',
              email: user.primaryEmailAddress?.emailAddress || '',
              role: (user.publicMetadata?.role as 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN') || 'STUDENT',
              isActive: true,
              passwordChanged: true
            });
            
            // Convert HygraphUser to HygraphUser format for compatibility
            const convertedProfile: HygraphUser = {
              uid: newProfile.uid,
              id: newProfile.id,
              displayName: newProfile.displayName,
              email: newProfile.email,
              role: newProfile.role.toLowerCase() as 'student' | 'teacher' | 'admin' | 'super_admin',
              isActive: newProfile.isActive,
              passwordChanged: newProfile.passwordChanged,
              createdAt: new Date(newProfile.dateCreated),
              updatedAt: new Date(newProfile.dateUpdated)
            };
            setUserProfile(convertedProfile);
          }
        } catch (error) {
          console.log('Error fetching/creating user profile:', error);
        }
      };

      fetchUserProfile();
    } else {
      setUserProfile(null);
      removeAuthToken();
    }
  }, [isSignedIn, isLoaded, user, getToken]);

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

// Main ClerkAuthProvider (ClerkProvider is already in main.tsx)
export const ClerkAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <ClerkAuthProviderInner>
      {children}
    </ClerkAuthProviderInner>
  );
};