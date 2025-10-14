/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { userService, FirestoreUser } from '../lib/firestore';
import { setAuthToken, removeAuthToken, api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth as useClerkAuth, useUser, useSignIn, useClerk } from '@clerk/clerk-react';

interface AuthContextType {
  currentUser: any | null;
  userProfile: FirestoreUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, displayName: string, role?: string) => Promise<any>;
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
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Clerk hooks
  const clerkAuth = useClerkAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signOut: clerkSignOut } = useClerk();

  // Login function (Clerk)
  const login = async (email: string, password: string): Promise<any> => {
    try {
      if (!signInLoaded || !signIn) throw new Error('Auth not ready');
      const res = await signIn.create({ identifier: email, password });
      if (res.status === 'complete') {
        await clerkAuth.setActive?.({ session: res.createdSessionId });
      } else {
        throw new Error('Additional steps required to sign in');
      }

      // Persist Clerk session token for backend API
      try {
        const token = await clerkAuth.getToken?.();
        if (token) setAuthToken(token);
      } catch (err) {
        console.warn('Failed to fetch Clerk token', err);
      }

      // Ensure Firestore profile exists (sync on login)
      try {
        const uid = res.createdUserId || res.userId || clerkAuth.userId;
        let profile: FirestoreUser | null = uid ? await userService.getUserById(uid as string) : null;
        if (!profile) {
          // Fallback by email
          profile = await userService.getUserByEmail(email);
        }
        if (!profile && uid) {
          // Create minimal profile via backend to keep server-side invariants
          try {
            await api.createUserProfile({ displayName: email.split('@')[0], role: 'student' });
            profile = await userService.getUserById(uid as string);
          } catch (createErr) {
            console.warn('Failed to create user profile via backend', createErr);
            // Set a minimal profile to prevent errors
            profile = {
              uid: uid as string,
              email: email,
              displayName: email.split('@')[0],
              role: 'student',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            } as FirestoreUser;
          }
        }
        if (profile) setUserProfile(profile);
      } catch (err) {
        console.error('Error loading user profile after login:', err);
        // Set a minimal profile to prevent errors
        const uid = res.createdUserId || res.userId || clerkAuth.userId;
        if (uid) {
          setUserProfile({
            uid: uid as string,
            email: email,
            displayName: email.split('@')[0],
            role: 'student',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          } as FirestoreUser);
        }
      }

      toast.success('Successfully logged in!');
      return res;
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  // Signup function - DISABLED for public use
  const signup = async (
    _email: string, 
    _password: string, 
    _displayName: string,
    _role: string = 'student'
  ): Promise<any> => {
    // Public signup is disabled - only admins/super admins can create users
    throw new Error('Signup is disabled. Contact an administrator.');
  };

  // Create user function - for admin use only (delegates to backend/Clerk)
  const createUser = async (userData: Omit<FirestoreUser, 'createdAt' | 'updatedAt'>, password?: string): Promise<string> => {
    try {
      const res = await api.createUser({
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        ...(password ? { password } : {})
      });
      toast.success('User created successfully');
      // Return uid when available
      return (res.data as any)?.uid || userData.email;
    } catch (error: any) {
      toast.error('Failed to create user: ' + error.message);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await clerkSignOut();
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

  // Sync Clerk auth state to our context
  useEffect(() => {
    const suppressRedirect = sessionStorage.getItem('suppressAuthRedirect');
    if (suppressRedirect) return;

    const sync = async () => {
      try {
        if (!userLoaded) {
          return; // wait until Clerk user is loaded to avoid flicker/loops
        }
        if (user) {
          const shaped = {
            uid: user.id,
            email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress,
          };
          setCurrentUser(shaped);

          // Ensure API token is present
          try {
            const token = await clerkAuth.getToken?.();
            if (token) setAuthToken(token);
          } catch {}

          // Load profile (by uid, then email)
          try {
            let profile = await userService.getUserById(user.id);
            if (!profile && shaped.email) {
              profile = await userService.getUserByEmail(shaped.email);
            }
            if (!profile) {
              // Create minimal profile via backend
              try {
                await api.createUserProfile({ displayName: user.fullName || shaped.email || 'New User', role: 'student' });
                profile = await userService.getUserById(user.id);
              } catch (createErr) {
                console.warn('Failed to create user profile via backend', createErr);
                // Set a minimal profile to prevent errors
                setUserProfile({
                  uid: user.id,
                  email: shaped.email || '',
                  displayName: user.fullName || shaped.email || 'User',
                  role: 'student',
                  isActive: true,
                  createdAt: new Date(),
                  updatedAt: new Date()
                } as FirestoreUser);
              }
            }
            if (profile) setUserProfile(profile);
          } catch (err) {
            console.error('Failed to load user profile:', err);
            // Set a minimal profile to prevent errors
            setUserProfile({
              uid: user.id,
              email: shaped.email || '',
              displayName: user.fullName || shaped.email || 'User',
              role: 'student',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            } as FirestoreUser);
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
          removeAuthToken();
        }
      } finally {
        // Only stop loading once Clerk user state has resolved
        if (userLoaded) setLoading(false);
      }
    };
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userLoaded]);

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