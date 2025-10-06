# Clerk Authentication Setup Guide

## Why Clerk?

Since Hygraph doesn't provide authentication services, we're using Clerk as our authentication provider. Clerk offers:

- ✅ Email/password authentication (matching Firebase Auth)
- ✅ Built-in UI components
- ✅ JWT tokens that work with Hygraph
- ✅ User management dashboard
- ✅ Free tier with 10,000 monthly active users
- ✅ Easy integration with React

## Step 1: Create a Clerk Account

1. Go to [clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application
4. Choose "Email" as the authentication method
5. Note your API keys (we'll need them later)

## Step 2: Install Clerk Dependencies

```bash
npm install @clerk/clerk-react
```

## Step 3: Set Up Environment Variables

Add these to your `.env` file:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Hygraph Configuration
VITE_HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/[project-id]/master
VITE_HYGRAPH_TOKEN=your-read-only-token
VITE_HYGRAPH_MUTATION_TOKEN=your-mutation-token
```

## Step 4: Configure Clerk in Your Application

### Frontend (src/main.tsx)

```typescript
import { ClerkProvider } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
```

### Create Clerk Auth Context (src/contexts/ClerkAuthContext.tsx)

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { userService } from '../lib/hygraphService';

interface AuthContextType {
  currentUser: any | null;
  userProfile: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const ClerkAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const { signIn, signUp, signOut } = useClerk();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (isLoaded && user) {
        try {
          // Try to get user profile from Hygraph
          const profile = await userService.getUserById(user.id);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
      setLoading(false);
    };

    loadUserProfile();
  }, [user, isLoaded]);

  const login = async (email: string, password: string) => {
    await signIn?.create({
      identifier: email,
      password,
    });
  };

  const signup = async (email: string, password: string, displayName: string, role = 'student') => {
    const result = await signUp?.create({
      emailAddress: email,
      password,
      firstName: displayName,
    });

    // Create user profile in Hygraph
    if (result?.createdUserId) {
      await userService.createUser({
        uid: result.createdUserId,
        email,
        displayName,
        role,
        isActive: true,
        passwordChanged: false,
      });
    }
  };

  const logout = async () => {
    await signOut();
    setUserProfile(null);
  };

  const updateUserProfile = async (data: any) => {
    if (!user) throw new Error('No user logged in');
    await userService.updateUser(user.id, data);
    // Reload profile
    const profile = await userService.getUserById(user.id);
    setUserProfile(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser: user,
        userProfile,
        loading,
        login,
        signup,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

## Step 5: Protect Routes

```typescript
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

function ProtectedPage() {
  return (
    <>
      <SignedIn>
        {/* Your protected content */}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
```

## Step 6: Custom Sign In/Sign Up Components

Clerk provides pre-built components, but you can also create custom ones:

```typescript
import { useSignIn } from '@clerk/clerk-react';

function CustomSignIn() {
  const { signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your custom form */}
    </form>
  );
}
```

## Step 7: Backend Integration (Server)

For the backend, use Clerk's Node.js SDK:

```bash
cd server
npm install @clerk/clerk-sdk-node
```

### server/src/middleware/clerkAuth.ts

```typescript
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

export const requireAuth = ClerkExpressRequireAuth({
  // You can customize this
});

// Usage in routes
app.get('/api/protected', requireAuth, (req, res) => {
  const userId = req.auth.userId;
  // Your logic here
});
```

## Step 8: Sync Users Between Clerk and Hygraph

You have two options:

### Option A: Webhooks (Recommended)
Set up Clerk webhooks to automatically sync user data to Hygraph when users are created/updated/deleted.

1. In Clerk Dashboard, go to Webhooks
2. Create a new webhook endpoint
3. Subscribe to `user.created`, `user.updated`, `user.deleted` events
4. Implement webhook handler in your backend

### Option B: Manual Sync
Sync users manually when they first log in (already implemented in the ClerkAuthContext above).

## Step 9: Configure Clerk Dashboard

1. **Appearance**: Customize the sign-in/sign-up forms to match your brand
2. **Email**: Configure email templates and sender
3. **Security**: Set up password requirements
4. **Sessions**: Configure session duration
5. **Organizations**: Enable if you need multi-tenancy

## Step 10: Testing

1. Start your development server
2. Try signing up with a test email
3. Verify the user is created in both Clerk and Hygraph
4. Test sign in/sign out functionality
5. Test protected routes

## User Role Management

Since Clerk doesn't have built-in role management matching your needs, we store roles in Hygraph:

```typescript
// After Clerk creates user, create profile in Hygraph with role
await userService.createUser({
  uid: clerkUserId,
  email,
  displayName,
  role: 'student', // or 'teacher', 'admin', 'super_admin'
  isActive: true,
  passwordChanged: false,
});

// Check role in your app
if (userProfile?.role === 'admin') {
  // Show admin features
}
```

## Migration from Firebase Auth

When migrating existing users:

1. Export users from Firebase Auth
2. Create corresponding users in Clerk
3. Create user profiles in Hygraph
4. Send password reset emails to all users

## Troubleshooting

### Issue: "Publishable key not found"
- Make sure `VITE_CLERK_PUBLISHABLE_KEY` is set in `.env`
- Restart your dev server after adding env variables

### Issue: User profile not found
- Ensure the user was created in Hygraph after Clerk signup
- Check that the UIDs match between Clerk and Hygraph

### Issue: Authentication not persisting
- Check Clerk session configuration
- Verify cookies are working in your browser

## Cost Comparison

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| Clerk | 10,000 MAU | $25/month + $0.02/MAU |
| Firebase Auth | Unlimited | Free |
| Auth0 | 7,500 MAU | $23/month + additional costs |

For this project, Clerk's free tier should be sufficient for development and initial deployment.

## Next Steps

After Clerk is set up:
1. Migrate all authentication-related code from Firebase to Clerk
2. Update the AuthContext to use Clerk
3. Test all authentication flows
4. Update backend API authentication middleware
5. Deploy and monitor
