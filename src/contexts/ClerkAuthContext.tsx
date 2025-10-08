/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuthHook, useUser, ClerkProvider } from '@clerk/nextjs';
import { userService, FirestoreUser } from '../lib/firestore';
import { setAuthToken, removeAuthToken, api } from '@/lib/api';
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

const ClerkAuthProviderInner: React.FC<AuthProviderProps> = ({ children }) => {
  const { isSignedIn, isLoaded, signOut } = useClerkAuthHook();
  const { user } = useUser();
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
      // Create Firestore user profile directly
      // Note: This assumes the user was created in Clerk via admin API
      const userId = await userService.createUser({
        ...userData,
        uid: userData.uid || userData.id || '',
        passwordChanged: true // Clerk handles password management
      });
      
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

      // Update Firestore user profile
      await userService.updateUser(user.id, data);
      
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
      if (typeof user.getToken === 'function') {
        user.getToken().then(token => {
          setAuthToken(token);
        }).catch(error => {
          console.warn('Failed to get auth token:', error);
        });
      } else {
        console.warn('getToken method not available on user object');
      }

      // Fetch or create user profile in Firestore
      const fetchUserProfile = async () => {
        try {
          // First try to get user profile by Clerk user ID
          let profile = await userService.getUserById(user.id);
          
          // If not found, try to find by email
          if (!profile && user.primaryEmailAddress?.emailAddress) {
            profile = await userService.getUserByEmail(user.primaryEmailAddress.emailAddress);
          }
          
          if (profile) {
            setUserProfile(profile);
          } else {
            // Create a new user profile if none exists
            const newProfile = {
              uid: user.id,
              displayName: user.fullName || user.firstName || 'User',
              email: user.primaryEmailAddress?.emailAddress || '',
              role: (user.publicMetadata?.role as 'student' | 'teacher' | 'admin' | 'super_admin') || 'student',
              isActive: true,
              passwordChanged: true,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt)
            };
            
            await userService.createUser(newProfile);
            setUserProfile(newProfile as any);
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

// Main ClerkAuthProvider with ClerkProvider wrapper
export const ClerkAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    return <div>Missing Clerk publishable key</div>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkAuthProviderInner>
        {children}
      </ClerkAuthProviderInner>
    </ClerkProvider>
  ) as React.ReactElement;
};