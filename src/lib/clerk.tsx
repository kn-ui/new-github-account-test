import { useAuth, useUser } from '@clerk/nextjs';

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
      // This will be handled by Clerk's SignIn component
      throw new Error('Use Clerk SignIn component for login');
    },
    signup: async (email: string, password: string, displayName: string, role?: string) => {
      // This will be handled by Clerk's SignUp component
      throw new Error('Use Clerk SignUp component for signup');
    },
    logout: async () => {
      await signOut();
    },
    updateUserProfile: async (data: any) => {
      if (!user) throw new Error('No user logged in');
      await user.update(data);
    },
    createUser: async (userData: any, password?: string) => {
      // This will be handled by Clerk's admin API or SignUp component
      throw new Error('Use Clerk admin API or SignUp component for user creation');
    }
  };
};