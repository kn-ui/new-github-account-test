# Fix: Duplicate User Creation on Login

## Problem Summary

When a user logged in with credentials that existed in Clerk (e.g., `kalid@gmail.com`), the system was automatically creating new users in Hygraph instead of retrieving the existing user profile. This resulted in:

1. Duplicate users being created in Hygraph on every login
2. Empty email fields causing fallback emails like `no-email+user_33rcWjEQvIwJPeWsgvdY2vLGlwc@st-raguel.local`
3. Users being created in draft state instead of properly managed through the admin interface

## Root Causes

### 1. Automatic User Creation on Login
- The frontend auth context (`ClerkAuthContext.tsx`) was automatically calling `createOrUpdateProfile()` when a user profile was not found
- This created new users in Hygraph every time someone logged in, even if they shouldn't have access

### 2. Email Extraction Issue
- The Clerk JWT token email was not being extracted correctly in the middleware
- The email field was empty (`''`), causing the system to use a fallback email

### 3. Wrong User Lookup Logic
- The system was looking up users by email first instead of by UID
- With empty emails, it couldn't find existing users

## Changes Made

### 1. **server/src/middleware/clerkAuth.ts**
- **Fixed email extraction** from Clerk JWT tokens
- Now checks multiple possible email fields: `email`, `emailAddress`, `email_address`
- Added better logging for users not found in Hygraph

```typescript
// Before:
email: payload.email as string

// After:
const emailAddress = payload.email || payload.emailAddress || payload.email_address || '';
email: emailAddress as string
```

### 2. **server/src/controllers/userController.ts**
- **Removed automatic user creation** from `createOrUpdateProfile()` endpoint
- Changed to only update existing users
- Returns 404 error if user doesn't exist instead of creating them
- Added UID-first lookup (more reliable than email)
- Improved logging for debugging

```typescript
// Key changes:
// 1. Lookup by UID first (more reliable)
let existingUser = await userService.getUserById(uid);

// 2. Fallback to email only if UID fails
if (!existingUser && email) {
  existingUser = await userService.getUserByEmail(email);
}

// 3. DO NOT create user automatically
if (!existingUser) {
  sendError(res, 'User profile not found. Please contact an administrator to create your account.', undefined, 404);
}
```

### 3. **src/contexts/ClerkAuthContext.tsx**
- **Removed auto-creation logic** from the auth context
- Now only fetches existing user profiles
- Shows user-friendly error message if profile doesn't exist
- Prompts user to contact administrator

```typescript
// Removed the createOrUpdateProfile() call
// Now only shows error message:
if (!profile) {
  toast.error('Your account has not been set up yet. Please contact an administrator to create your profile.');
  return;
}
```

## How It Works Now

### Login Flow (Non-Admin User)
1. User logs in via Clerk
2. Frontend attempts to fetch user profile: `GET /api/users/profile`
3. Backend middleware:
   - Extracts UID from Clerk token
   - Queries Hygraph by UID to check if user exists
   - Extracts email from token (with fallback handling)
4. If user exists in Hygraph:
   - Returns user profile with role, email, etc.
   - User can access the system based on their role
5. If user does NOT exist in Hygraph:
   - Returns 404 error
   - Frontend shows error message: "Your account has not been set up yet. Please contact an administrator."
   - User cannot proceed until admin creates their profile

### User Creation Flow (Admin Only)
1. Admin logs in and navigates to User Manager page
2. Admin creates user via:
   - **Single User Creation**: Fill form with email, name, role
   - **Bulk User Creation**: Upload CSV file with multiple users
3. Backend creates user in:
   - **Clerk** (authentication system)
   - **Hygraph** (database)
4. New user receives credentials and can now log in
5. On login, their profile is found in Hygraph and they get access

## Testing Instructions

### Test 1: Existing User in Hygraph
1. Ensure a user exists in Hygraph with `uid=user_33rcWjEQvIwJPeWsgvdY2vLGlwc`
2. Log in with that user's Clerk credentials
3. **Expected**: User profile loads successfully, no new user created
4. Check Hygraph to verify no duplicate users were created

### Test 2: User in Clerk but NOT in Hygraph
1. Create a user manually in Clerk only (not in Hygraph)
2. Try to log in with those credentials
3. **Expected**: 
   - User sees error: "Your account has not been set up yet. Please contact an administrator."
   - No new user is created in Hygraph
   - Check backend logs for: `User not found in Hygraph: [uid]`

### Test 3: User Creation via Admin Interface
1. Log in as an admin user
2. Navigate to User Manager page
3. Click "Add User" and fill in the form:
   - Email: `test@example.com`
   - Display Name: `Test User`
   - Role: `student`
4. Submit the form
5. **Expected**:
   - User is created in both Clerk and Hygraph
   - User appears in the user list
   - New user can log in successfully
6. Log in as the new user to verify profile loads correctly

### Test 4: Bulk User Creation
1. Log in as admin
2. Navigate to User Manager
3. Upload CSV file with multiple users
4. **Expected**:
   - All users are created in Clerk and Hygraph
   - Users can log in successfully
   - No duplicate users are created

### Test 5: Email Extraction
1. Check backend logs when any user logs in
2. **Expected logs**:
   ```
   Fetching profile for user: { uid: 'user_xxx', email: 'actual-email@example.com' }
   Profile found: { uid: 'user_xxx', email: 'actual-email@example.com', role: 'student' }
   ```
3. Email should NOT be empty unless the user truly has no email in Clerk

## Benefits

✅ **No More Duplicate Users**: Users are only created through the admin interface
✅ **Better Security**: Random logins don't create unauthorized accounts
✅ **Proper Email Handling**: Emails are correctly extracted from Clerk tokens
✅ **Clear Error Messages**: Users know to contact admin if their account isn't set up
✅ **UID-Based Lookup**: More reliable than email-based lookups
✅ **Better Logging**: Easier to debug authentication issues

## Configuration Check

Make sure your Hygraph is configured to:
- Query DRAFT content (already set in `server/src/config/hygraph.ts`)
- Have proper authentication token
- Schema includes `AppUser` model with fields: `uid`, `email`, `displayName`, `role`, `isActive`

## Rollback (If Needed)

If you need to rollback these changes, you can revert the three files:
1. `server/src/middleware/clerkAuth.ts`
2. `server/src/controllers/userController.ts`
3. `src/contexts/ClerkAuthContext.tsx`

However, the old behavior would allow unauthorized user creation, which is a security risk.

## Next Steps

1. ✅ **Test the fix** using the testing instructions above
2. **Clean up Hygraph**: Remove duplicate users that were created during testing
3. **Publish users**: Make sure legitimate users are published in Hygraph (not just in draft state)
4. **Update documentation**: Document the user creation process for other admins

## Support

If you encounter issues:
1. Check backend logs for user lookup messages
2. Verify the user exists in Hygraph with the correct UID
3. Ensure Clerk tokens include the email field (check Clerk dashboard settings)
4. Verify Hygraph API permissions allow querying draft content
