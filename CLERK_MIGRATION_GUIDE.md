# Clerk Authentication Migration Guide

This guide documents the migration from Firebase Authentication to Clerk Authentication for the St. Raguel Church School Management System.

## What Was Changed

### 1. Frontend Changes

#### New Files Created:
- `src/lib/clerk.ts` - Clerk configuration and custom hooks
- `src/contexts/ClerkAuthContext.tsx` - New authentication context using Clerk
- `src/components/auth/ClerkSignIn.tsx` - Clerk sign-in component
- `src/components/auth/ClerkSignUp.tsx` - Clerk sign-up component
- `src/components/auth/ClerkUserButton.tsx` - Clerk user button component

#### Files Modified:
- `src/App.tsx` - Updated to use ClerkAuthProvider instead of AuthProvider
- `src/pages/Login.tsx` - Simplified to use ClerkSignIn component
- `src/pages/Signup.tsx` - Simplified to use ClerkSignUp component
- `src/components/ProtectedRoute.tsx` - Updated to use ClerkAuthContext
- `src/components/DashboardWrapper.tsx` - Updated to use ClerkAuthContext
- `src/components/layouts/DashboardLayout.tsx` - Added ClerkUserButton to top bar

### 2. Backend Changes

#### New Files Created:
- `server/src/middleware/clerkAuth.ts` - New authentication middleware using Clerk
- `server/.env` - Server environment variables for Clerk

#### Files Modified:
- `server/src/routes/userRoutes.ts` - Updated to use Clerk authentication
- `server/src/routes/courseRoutes.ts` - Updated to use Clerk authentication
- `server/src/routes/contentRoutes.ts` - Updated to use Clerk authentication

### 3. Environment Variables

#### Frontend (.env):
```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key-here
CLERK_SECRET_KEY=sk_test_your-secret-key-here

# Keep Firebase for Firestore (we'll migrate that separately if needed)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

#### Backend (server/.env):
```env
# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your-secret-key-here

# Keep Firebase for Firestore (we'll migrate that separately if needed)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

## Setup Instructions

### 1. Get Your Clerk Keys

1. Go to your Clerk Dashboard: https://dashboard.clerk.com/apps/app_33mrbhc1DcIVcXeMlZMwymANumA/instances/ins_33mrbkl34PBlTIZyTDkX3HbD50z
2. Navigate to "API Keys" section
3. Copy your Publishable Key and Secret Key
4. Update the environment variables in both `.env` files

### 2. Configure Clerk Application

1. In your Clerk Dashboard, go to "Configure" → "Domains"
2. Add your development domain: `http://localhost:5173`
3. Add your production domain when ready

### 3. Configure User Metadata

1. In Clerk Dashboard, go to "Configure" → "User & Authentication" → "User metadata"
2. Add a public metadata field called "role" with type "String"
3. This will store the user's role (student, teacher, admin, super_admin)

### 4. Install Dependencies

The following packages have been installed:
- Frontend: `@clerk/nextjs`
- Backend: `@clerk/backend`

### 5. Test the Migration

1. Start the development server: `npm run dev`
2. Start the backend server: `npm run dev:backend`
3. Navigate to `/login` and test the sign-in flow
4. Navigate to `/signup` and test the sign-up flow
5. Test protected routes to ensure authentication works

## Key Differences from Firebase

### Authentication Flow
- **Firebase**: Custom login/signup forms with Firebase SDK
- **Clerk**: Pre-built components with built-in UI and validation

### User Management
- **Firebase**: Manual user creation in Firebase Auth + Firestore profile
- **Clerk**: User creation through Clerk UI + automatic Firestore profile sync

### Token Handling
- **Firebase**: Firebase ID tokens
- **Clerk**: Clerk JWT tokens

### User Data
- **Firebase**: User data stored in Firestore with Firebase Auth UID
- **Clerk**: User data stored in Firestore with Clerk user ID, synced automatically

## Migration Benefits

1. **Better UX**: Pre-built, polished authentication UI
2. **Easier Management**: Built-in user management dashboard
3. **More Features**: Social logins, MFA, etc. out of the box
4. **Better Security**: Industry-standard security practices
5. **Less Code**: Reduced custom authentication code

## Next Steps

1. **Test thoroughly** - Ensure all authentication flows work
2. **Update user roles** - Set up proper role management in Clerk
3. **Migrate existing users** - If you have existing Firebase users, you'll need to migrate them
4. **Clean up Firebase** - Once everything is working, remove Firebase Auth dependencies
5. **Consider Firestore migration** - You might want to migrate from Firestore to a different database

## Troubleshooting

### Common Issues

1. **Clerk keys not working**: Make sure you're using the correct keys from your Clerk dashboard
2. **CORS issues**: Ensure your domain is added to Clerk's allowed origins
3. **User not found in Firestore**: The ClerkAuthContext automatically creates Firestore profiles
4. **Role not working**: Make sure the "role" metadata field is set up in Clerk

### Getting Help

- Clerk Documentation: https://clerk.com/docs
- Clerk Discord: https://discord.gg/clerk
- Clerk Support: Available in your dashboard