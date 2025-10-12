/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuthHook, useUser } from '@clerk/clerk-react';
import { userService, FirestoreUser } from '../lib/firestore';
import { setAuthToken, removeAuthToken } from '@/lib/api';
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
  syncUserWithFirebase: (clerkUser: any) => Promise<FirestoreUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useImprovedClerkAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useImprovedClerkAuth must be used within an ImprovedClerkAuthProvider');
  }
  return context;
};

// Export useAuth as an alias for backward compatibility
export const useAuth = useImprovedClerkAuth;

interface AuthProviderProps {
  children: React.ReactNode;
}

export const ImprovedClerkAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isSignedIn, isLoaded, signOut, getToken } = useClerkAuthHook();
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user with Firebase
  const syncUserWithFirebase = async (clerkUser: any): Promise<FirestoreUser | null> => {
    if (!clerkUser) return null;

    try {
      // First try to get user profile by Clerk user ID
      let profile = await userService.getUserById(clerkUser.id);
      
      // If not found, try to find by email
      if (!profile && clerkUser.primaryEmailAddress?.emailAddress) {
        profile = await userService.getUserByEmail(clerkUser.primaryEmailAddress.emailAddress);
      }
      
      if (profile) {
        // Update the profile with latest Clerk data if needed
        const needsUpdate = 
          profile.displayName !== (clerkUser.fullName || clerkUser.firstName) ||
          profile.email !== clerkUser.primaryEmailAddress?.emailAddress ||
          profile.uid !== clerkUser.id;

        if (needsUpdate) {
          const updatedProfile = {
            ...profile,
            uid: clerkUser.id,
            displayName: clerkUser.fullName || clerkUser.firstName || profile.displayName,
            email: clerkUser.primaryEmailAddress?.emailAddress || profile.email,
            updatedAt: new Date()
          };
          
          await userService.updateUser(clerkUser.id, updatedProfile);
          return updatedProfile as FirestoreUser;
        }
        
        return profile;
      } else {
        // Create a new user profile
        const newProfile = {
          uid: clerkUser.id,
          displayName: clerkUser.fullName || clerkUser.firstName || 'User',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          role: (clerkUser.publicMetadata?.role as 'student' | 'teacher' | 'admin' | 'super_admin') || 
                (clerkUser.unsafeMetadata?.role as 'student' | 'teacher' | 'admin' | 'super_admin') || 
                'student',
          isActive: true,
          passwordChanged: true,
          createdAt: new Date(clerkUser.createdAt),
          updatedAt: new Date(clerkUser.updatedAt)
        };
        
        await userService.createUser(newProfile);
        return newProfile as FirestoreUser;
      }
    } catch (error) {
      console.error('Error syncing user with Firebase:', error);
      toast.error('Failed to sync user data with database');
      return null;
    }
  };

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

      // Sync user with Firebase
      syncUserWithFirebase(user).then(profile => {
        if (profile) {
          setUserProfile(profile);
        }
      }).catch(error => {
        console.error('Failed to sync user with Firebase:', error);
      });
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
    createUser,
    syncUserWithFirebase
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};