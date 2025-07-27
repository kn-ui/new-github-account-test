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
import { api, setAuthToken, removeAuthToken, User } from '../lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string, displayName: string, role?: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
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
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Login function
  const login = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      setAuthToken(token);
      
      // Fetch user profile from backend
      try {
        const profileResponse = await api.getUserProfile();
        if (profileResponse.success && profileResponse.data) {
          setUserProfile(profileResponse.data);
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

  // Signup function
  const signup = async (
    email: string, 
    password: string, 
    displayName: string,
    role: string = 'student'
  ): Promise<UserCredential> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase profile
      await updateProfile(result.user, { displayName });
      
      const token = await result.user.getIdToken();
      setAuthToken(token);

      // Create user profile in backend
      try {
        const profileData = {
          uid: result.user.uid,
          email: result.user.email!,
          displayName,
          role: role as 'student' | 'teacher' | 'admin',
          isActive: true
        };

        console.log('Creating user profile with data:', profileData);
        const profileResponse = await api.createUserProfile(profileData);
        if (profileResponse.success && profileResponse.data) {
          setUserProfile(profileResponse.data);
          console.log('User profile created successfully:', profileResponse.data);
        } else {
          console.error('Profile creation failed:', profileResponse);
        }
      } catch (error) {
        console.error('Failed to create user profile:', error);
        // Even if profile creation fails, we still have a Firebase user
        toast.error('Profile setup incomplete. You can complete it later.');
      }
      
      toast.success('Account created successfully!');
      return result;
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
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
      toast.error(error.message || 'Logout failed');
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<User>): Promise<void> => {
    try {
      const response = await api.updateUserProfile(data);
      if (response.success && response.data) {
        setUserProfile(response.data);
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthToken(token);
          
          // Small delay to ensure token is set
          setTimeout(async () => {
            // Fetch user profile
            try {
              const profileResponse = await api.getUserProfile();
              if (profileResponse.success && profileResponse.data) {
                setUserProfile(profileResponse.data);
              }
            } catch (error) {
              console.log('Profile not found, user may need to complete setup');
              // If profile not found, user might need to complete profile setup
              setUserProfile(null);
            }
          }, 100);
        } catch (error) {
          console.error('Failed to get token:', error);
        }
      } else {
        removeAuthToken();
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    signup,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};