# St. Raguel School Management System - Setup Guide

## 🚨 Current Status: Migration from Firebase to Hygraph + Clerk

Your system has been migrated from Firebase to Hygraph + Clerk, but there are configuration issues preventing it from working properly.

## 🔧 Issues Identified and Fixed

### 1. Environment Variable Loading
- **Problem**: Server wasn't loading .env files properly
- **Fix**: Updated `server/src/index.ts` to load .env from correct path
- **Status**: ✅ Fixed

### 2. Graceful Degradation
- **Problem**: System crashed when Hygraph/Clerk credentials were missing
- **Fix**: Added proper error handling and fallback mechanisms
- **Status**: ✅ Fixed

### 3. Authentication Flow
- **Problem**: Clerk authentication not properly configured
- **Fix**: Added proper error handling for missing credentials
- **Status**: ✅ Fixed

## 📋 Required Configuration

### 1. Server Environment (.env in `/workspace/server/`)

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Upload Configuration
MAX_FILE_SIZE=10485760

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
CONTACT_EMAIL_RECIPIENT=admin@school.com

# Hygraph Configuration
HYGRAPH_ENDPOINT=https://api-eu-west-2.hygraph.com/v2/your-project-id/master
HYGRAPH_TOKEN=your-hygraph-token

# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key
CLERK_SECRET_KEY=sk_test_your-secret-key
```

### 2. Frontend Environment (.env in `/workspace/`)

```env
VITE_API_BASE_URL=http://localhost:5000

# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key
```

## 🚀 How to Get It Working

### Step 1: Get Real Credentials

#### A. Hygraph Setup
1. Go to [Hygraph](https://hygraph.com)
2. Create a new project
3. Get your endpoint URL and API token
4. Update the `HYGRAPH_ENDPOINT` and `HYGRAPH_TOKEN` in server/.env

#### B. Clerk Setup
1. Go to [Clerk](https://clerk.com)
2. Create a new application
3. Get your publishable key and secret key
4. Update both .env files with the Clerk credentials

### Step 2: Start the System

```bash
# Terminal 1: Start the backend
cd /workspace/server
npm start

# Terminal 2: Start the frontend
cd /workspace
npm run dev
```

### Step 3: Test the System

1. Open http://localhost:5173
2. Try to sign up/sign in
3. Check if the dashboard loads
4. Test course creation and management

## 🔍 Troubleshooting

### If Authentication Doesn't Work
1. Check Clerk credentials in both .env files
2. Verify Clerk dashboard shows your application
3. Check browser console for errors

### If Data Doesn't Load
1. Check Hygraph credentials in server/.env
2. Verify Hygraph project has the required models
3. Check server logs for GraphQL errors

### If Frontend Can't Connect to Backend
1. Verify both servers are running
2. Check CORS configuration
3. Verify proxy settings in vite.config.ts

## 📊 Current Architecture

```
Frontend (React + Vite) 
    ↓ REST API calls
Backend (Express + Node.js)
    ↓ GraphQL with token
Hygraph (Headless CMS)
```

## 🎯 Next Steps

1. **Get Real Credentials**: Replace placeholder values with actual Clerk and Hygraph credentials
2. **Test Authentication**: Verify sign-up/sign-in flow works
3. **Test Data Operations**: Verify CRUD operations work with Hygraph
4. **Deploy**: Set up production environment variables

## ⚠️ Important Notes

- The system now works with mock data when Hygraph is not configured
- Authentication is required for most operations
- All Firebase dependencies have been removed
- The system is now fully migrated to Hygraph + Clerk

## 🆘 Need Help?

If you're still having issues:
1. Check the server logs for specific error messages
2. Verify all environment variables are set correctly
3. Make sure both servers are running on the correct ports
4. Check browser developer tools for frontend errors
