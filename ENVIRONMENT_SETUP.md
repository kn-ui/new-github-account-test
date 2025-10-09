# Environment Setup Guide

This guide will help you set up the required environment variables for the St. Raguel School Management System.

## Required Environment Variables

### Backend (.env in /server directory)

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Hygraph Configuration
HYGRAPH_ENDPOINT=https://api-<region>-<project>.hygraph.com/v2/<project>/master
HYGRAPH_TOKEN=your_hygraph_token_here

# Firebase Configuration (if still needed for some services)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
CONTACT_TO_EMAIL=admin@school.com
CONTACT_FROM_EMAIL=noreply@school.com
```

### Frontend (.env in root directory)

```env
# Frontend Configuration
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
VITE_HYGRAPH_ENDPOINT=https://api-<region>-<project>.hygraph.com/v2/<project>/master
VITE_HYGRAPH_TOKEN=your_hygraph_token_here
```

## How to Get These Values

### 1. Clerk Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select existing one
3. Go to "API Keys" section
4. Copy the "Publishable key" for frontend
5. Copy the "Secret key" for backend

### 2. Hygraph Configuration

1. Go to [Hygraph Dashboard](https://app.hygraph.com/)
2. Create a new project or select existing one
3. Go to "Settings" → "API Access"
4. Copy the "Content API URL" for HYGRAPH_ENDPOINT
5. Copy the "Permanent Auth Token" for HYGRAPH_TOKEN

### 3. Firebase Configuration (Optional - for legacy services)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Project Settings" → "Service Accounts"
4. Generate a new private key
5. Use the values from the downloaded JSON file

### 4. Email Configuration

For Gmail:
1. Enable 2-Factor Authentication
2. Generate an "App Password"
3. Use your Gmail address and the app password

For other email providers, adjust the SMTP settings accordingly.

## Setup Instructions

1. Copy the example files:
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```

2. Fill in the actual values in both .env files

3. Start the development servers:
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   npm run dev
   ```

## Important Notes

- Never commit .env files to version control
- The .env files are already in .gitignore
- Make sure to use the correct Hygraph endpoint format
- For production, use environment variables provided by your hosting platform
- Test the configuration by running the development servers

## Troubleshooting

### Common Issues

1. **"Missing Hygraph configuration" error**
   - Check that HYGRAPH_ENDPOINT and HYGRAPH_TOKEN are set correctly
   - Verify the endpoint URL format

2. **Clerk authentication errors**
   - Ensure CLERK_SECRET_KEY and VITE_CLERK_PUBLISHABLE_KEY are correct
   - Check that the keys match the same Clerk application

3. **Email sending issues**
   - Verify SMTP credentials
   - Check if 2FA is enabled and app password is used
   - Test with a simple email first

4. **CORS errors**
   - Ensure FRONTEND_URL matches your frontend development server URL
   - Check that both servers are running on the expected ports