/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  UserCredential
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { userService, FirestoreUser } from '../lib/firestore';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: FirestoreUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string, displayName: string, role?: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<FirestoreUser>) => Promise<void>;
  createUser: (userData: Omit<FirestoreUser, 'createdAt' | 'updatedAt'>) => Promise<string>;
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
        const profile = await userService.getUserById(result.user.uid);
        if (profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.log('Profile not found, user may need to complete setup');
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
  const createUser = async (userData: Omit<FirestoreUser, 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const userId = await userService.createUser(userData);
      toast.success('User created successfully!');
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
      setCurrentUser(user);
      
      if (user) {
        try {
          // Fetch user profile from Firestore
          const profile = await userService.getUserById(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.log('Profile not found for user:', user.uid);
        }
      } else {
        setUserProfile(null);
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