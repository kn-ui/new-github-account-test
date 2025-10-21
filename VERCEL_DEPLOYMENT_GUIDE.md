# 🚀 Vercel Deployment Guide for St. Raguel School Management System

This guide will walk you through deploying your full-stack school management system to Vercel. Since your project has both a frontend (React/Vite) and backend (Node.js/Express), we'll deploy them separately for optimal performance.

## 📋 Prerequisites

- [Vercel account](https://vercel.com) (free tier available)
- [GitHub account](https://github.com) (if not already connected)
- Your project pushed to a GitHub repository
- Firebase project configured (already set up)

## 🎯 Deployment Strategy

**Frontend (React/Vite)**: Deploy to Vercel as a static site
**Backend (Node.js/Express)**: Deploy to Vercel as a serverless function

## 📁 Project Structure Overview

```
st-raguel-school-management-system/
├── src/                    # Frontend React app (deploy to Vercel)
├── server/                 # Backend Node.js app (deploy separately)
├── package.json           # Frontend dependencies
├── vite.config.ts         # Vite configuration
└── .env                   # Environment variables
```

## 🚀 Step 1: Prepare Your Repository

### 1.1 Ensure Your Code is Pushed to GitHub

```bash
# If not already done, push your code to GitHub
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 1.2 Create Production Environment Files

Create a `.env.production` file for production environment variables:

```bash
# Create production environment file
touch .env.production
```

Add the following content to `.env.production`:

```env
# Production API URL (will be updated after backend deployment)
VITE_API_BASE_URL=https://your-backend-domain.vercel.app/api

# Firebase Configuration (use your production Firebase config)
VITE_FIREBASE_API_KEY=your-production-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 🎨 Step 2: Deploy Frontend to Vercel

### 2.1 Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository
4. Select your repository: `st-raguel-school-management-system`

### 2.2 Configure Frontend Deployment

**Project Settings:**
- **Framework Preset**: Vite
- **Root Directory**: `./` (root of repository)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**Environment Variables:**
Add these in the Vercel dashboard under Settings → Environment Variables:

```
VITE_API_BASE_URL=https://your-backend-domain.vercel.app/api
VITE_FIREBASE_API_KEY=your-production-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 2.3 Deploy Frontend

1. Click **"Deploy"**
2. Wait for the build to complete
3. Note your frontend URL (e.g., `https://your-project.vercel.app`)

## ⚙️ Step 3: Deploy Backend to Vercel

### 3.1 Create Vercel Configuration for Backend

Create a `vercel.json` file in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 3.2 Prepare Backend for Vercel

Create a new file `api/index.js` in your project root (this will be the entry point for Vercel):

```javascript
// This file will be created automatically by Vercel
// It imports your Express app from the server directory
const { app } = require('../server/dist/index.js');

module.exports = app;
```

### 3.3 Update Backend Package.json

Add a build script to your root `package.json`:

```json
{
  "scripts": {
    "build:vercel": "cd server && npm run build",
    "start:vercel": "node api/index.js"
  }
}
```

### 3.4 Deploy Backend

1. In Vercel Dashboard, create a **new project**
2. Select the same repository
3. **Root Directory**: `./` (root of repository)
4. **Framework Preset**: Other
5. **Build Command**: `npm run build:vercel`
6. **Output Directory**: Leave empty
7. **Install Command**: `npm install && cd server && npm install`

**Environment Variables for Backend:**
```
NODE_ENV=production
PORT=3000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend-domain.vercel.app
MAX_FILE_SIZE=10485760
```

## 🔧 Step 4: Configure CORS and Environment

### 4.1 Update Backend CORS Configuration

Update your server CORS configuration to allow your Vercel frontend domain:

```typescript
// In server/src/config/cors.ts or similar file
const corsOptions = {
  origin: [
    'http://localhost:5173', // Development
    'https://your-frontend-domain.vercel.app', // Production
    'https://your-project.vercel.app' // Alternative domain
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 4.2 Update Frontend Environment

After backend deployment, update your frontend environment variables in Vercel:

1. Go to your frontend project in Vercel Dashboard
2. Settings → Environment Variables
3. Update `VITE_API_BASE_URL` to your backend URL

## 🔄 Step 5: Alternative Backend Deployment (Recommended)

For better performance and easier management, consider deploying your backend separately:

### Option A: Deploy Backend as Separate Vercel Project

1. Create a new repository for your backend
2. Move the `server/` directory contents to the new repository root
3. Deploy as a separate Vercel project
4. Update frontend environment variables

### Option B: Use Railway, Render, or Heroku for Backend

These platforms are better suited for Node.js backends:

**Railway (Recommended):**
1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Select the `server/` directory
4. Add environment variables
5. Deploy

**Render:**
1. Go to [Render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Set Root Directory to `server/`
5. Add environment variables
6. Deploy

## 🧪 Step 6: Testing Your Deployment

### 6.1 Test Frontend
1. Visit your Vercel frontend URL
2. Test user registration/login
3. Verify all pages load correctly
4. Check that API calls work

### 6.2 Test Backend
1. Test API endpoints directly
2. Verify CORS is working
3. Check authentication flow
4. Test file uploads (if applicable)

## 🔧 Step 7: Domain Configuration (Optional)

### 7.1 Custom Domain
1. In Vercel Dashboard, go to your project
2. Settings → Domains
3. Add your custom domain
4. Configure DNS settings

### 7.2 Environment-Specific URLs
- **Development**: `http://localhost:5173`
- **Production Frontend**: `https://your-project.vercel.app`
- **Production Backend**: `https://your-backend.vercel.app` or `https://your-backend.railway.app`

## 📊 Step 8: Monitoring and Analytics

### 8.1 Vercel Analytics
1. Enable Vercel Analytics in your project
2. Monitor performance and errors
3. Track user behavior

### 8.2 Error Monitoring
Consider adding error monitoring services:
- Sentry
- LogRocket
- Bugsnag

## 🚨 Common Issues and Solutions

### Issue 1: CORS Errors
**Solution**: Update CORS configuration to include your production domains

### Issue 2: Environment Variables Not Loading
**Solution**: Ensure all environment variables are set in Vercel dashboard

### Issue 3: Build Failures
**Solution**: Check build logs in Vercel dashboard and fix any TypeScript or dependency issues

### Issue 4: API Routes Not Working
**Solution**: Verify your `vercel.json` configuration and API route structure

## 📝 Step 9: Post-Deployment Checklist

- [ ] Frontend loads without errors
- [ ] User authentication works
- [ ] API calls are successful
- [ ] File uploads work (if applicable)
- [ ] All user roles function correctly
- [ ] Database connections are stable
- [ ] Environment variables are properly set
- [ ] CORS is configured correctly
- [ ] SSL certificates are active
- [ ] Performance is acceptable

## 🔄 Step 10: Continuous Deployment

Once set up, Vercel will automatically deploy your changes when you push to your main branch:

1. Make changes to your code
2. Commit and push to GitHub
3. Vercel automatically builds and deploys
4. Your changes go live in minutes

## 📞 Support and Troubleshooting

### Vercel Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/cli)
- [Vercel Support](https://vercel.com/support)

### Firebase Configuration
- [Firebase Console](https://console.firebase.google.com)
- [Firebase Auth Setup](https://firebase.google.com/docs/auth)
- [Firestore Rules](https://firebase.google.com/docs/firestore/security/get-started)

## 🎉 Congratulations!

Your St. Raguel School Management System is now deployed and accessible worldwide! 

**Frontend URL**: `https://your-project.vercel.app`
**Backend URL**: `https://your-backend.vercel.app` (or your chosen platform)

Remember to:
- Monitor your application performance
- Keep your dependencies updated
- Regularly backup your Firebase data
- Monitor your Vercel usage and limits

---

**Need Help?** Check the troubleshooting section above or refer to the Vercel and Firebase documentation for more detailed guidance.