/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  UserCredential,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { userService, FirestoreUser, activityLogService } from '../lib/firestore';
import { setAuthToken, removeAuthToken, api } from '@/lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: FirestoreUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string, displayName: string, role?: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<FirestoreUser>) => Promise<void>;
  createUser: (userData: Omit<FirestoreUser, 'createdAt' | 'updatedAt'>, password?: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Login function
  const login = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user profile from Firestore
      try {
        let profile = await userService.getUserById(result.user.uid);
        
        // If not found by UID, try to find by email (for seeded users)
        if (!profile && result.user.email) {
          profile = await userService.getUserByEmail(result.user.email);
        }
        
        if (profile) {
          setUserProfile(profile);
        } else {
          // Silent in production
        }
      } catch (error) {
        // Silent in production
      }
      
      // Persist a short-lived ID token for backend requests in this session
      try {
        const token = await result.user.getIdToken();
        setAuthToken(token);
      } catch (error) {
        // Silent in production
      }
      
      // Trigger cleanup of old activity logs (runs once per day max)
      try {
        const lastCleanupKey = 'lastActivityLogCleanup';
        const lastCleanup = localStorage.getItem(lastCleanupKey);
        const today = new Date().toISOString().split('T')[0];
        
        if (lastCleanup !== today) {
          // Run cleanup in background - don't await
          activityLogService.cleanupOldLogs().then(deletedCount => {
            if (deletedCount > 0) {
              console.log(`Cleaned up ${deletedCount} old activity log entries`);
            }
            localStorage.setItem(lastCleanupKey, today);
          }).catch(() => {
            // Silent error handling for cleanup
          });
        }
      } catch (error) {
        // Silent error handling for cleanup check
      }

      toast.success('Successfully logged in!');
      return result;
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  // Signup function - DISABLED for public use
  const signup = async (
    email: string, 
    password: string, 
    displayName: string,
    role: string = 'student'
  ): Promise<UserCredential> => {
    // Public signup is disabled - only admins can create users
    throw new Error('Public signup is disabled. Please contact an administrator to create your account.');
  };

  // Create user function - for admin use only
  const createUser = async (userData: Omit<FirestoreUser, 'createdAt' | 'updatedAt'>, password?: string): Promise<string> => {
    try {
      // Set default password based on role if not provided
      const finalPassword = password || (() => {
        const defaultPasswords = {
          student: 'student123',
          teacher: 'teacher123',
          admin: 'admin123',
          super_admin: 'superadmin123'
        };
        return defaultPasswords[userData.role as keyof typeof defaultPasswords] || 'password123';
      })();
      
      // Create Firebase Auth user first
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, finalPassword);
      
      // Create Firestore user profile
      const userId = await userService.createUser({
        ...userData,
        uid: userCredential.user.uid,
        passwordChanged: false // New users must change their password
      });
      
      toast.success(`User created successfully! Default password: ${finalPassword}`);
      return userId;
    } catch (error: any) {
      toast.error('Failed to create user: ' + error.message);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
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
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      await userService.updateUser(currentUser.uid, data);
      
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Check if we should suppress auth redirects (e.g., during admin user creation)
      const suppressRedirect = sessionStorage.getItem('suppressAuthRedirect');
      
      if (suppressRedirect) {
        // Silent in production
        return;
      }
      
      setCurrentUser(user);
      
      if (user) {
        try {
          // First try to get user profile by UID
          let profile = await userService.getUserById(user.uid);
          
          // If not found by UID, try to find by email (for seeded users)
          if (!profile && user.email) {
            profile = await userService.getUserByEmail(user.email);
          }
          
          if (profile) {
            setUserProfile(profile);
          } else {
            // Silent in production
          }
        } catch (error) {
          // Silent in production
        }
      } else {
        setUserProfile(null);
        removeAuthToken();
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
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