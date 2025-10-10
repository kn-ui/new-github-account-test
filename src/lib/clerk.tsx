import { useAuth, useUser } from '@clerk/clerk-react';

// Clerk configuration
export const clerkConfig = {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
};

// Custom hooks for easier migration
export const useClerkAuth = () => {
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const { user } = useUser();

  return {
    currentUser: isSignedIn ? user : null,
    userProfile: user ? {
      uid: user.id,
      id: user.id,
      displayName: user.fullName || user.firstName || 'User',
      email: user.primaryEmailAddress?.emailAddress || '',
      role: user.publicMetadata?.role as string || 'student',
      isActive: true,
      passwordChanged: true, // Clerk handles password management
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } : null,
    loading: !isLoaded,
    login: async (email: string, password: string) => {
      // Handled by custom login form in src/pages/Login.tsx
      throw new Error('Use custom Login page component');
    },
    logout: async () => {
      await signOut();
    },
    updateUserProfile: async (data: any) => {
      if (!user) throw new Error('No user logged in');
      await user.update(data);
    },
    createUser: async (userData: any, password?: string) => {
      // Users created by admins only via UserManager.tsx
      throw new Error('Use admin UserManager to create users');
    }
  };
};