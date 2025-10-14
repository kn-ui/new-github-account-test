# Hygraph File Upload Setup

This document explains how to set up Hygraph for file uploads in the application.

## Prerequisites

1. A Hygraph account (sign up at https://hygraph.com)
2. A Hygraph project created

## Setup Steps

### 1. Create a Hygraph Project

1. Go to https://hygraph.com and sign in
2. Create a new project
3. Choose a name for your project (e.g., "LMS File Storage")
4. Select your region

### 2. Get Your API Credentials

1. In your Hygraph project dashboard, go to **Settings** → **API Access**
2. Copy your **Content API URL** (this is your `HYGRAPH_ENDPOINT`)
3. Create a new **Permanent Auth Token** with the following permissions:
   - `Asset` - Read, Create, Update, Delete
   - `Asset Upload` - Read, Create, Update, Delete
4. Copy the token (this is your `HYGRAPH_TOKEN`)

### 3. Configure Environment Variables

Update your `server/.env` file with the following:

```env
# Hygraph Configuration
HYGRAPH_ENDPOINT=https://api.hygraph.com/v2/YOUR_PROJECT_ID/master
HYGRAPH_TOKEN=your-permanent-auth-token-here
```

Replace:
- `YOUR_PROJECT_ID` with your actual project ID from the Content API URL
- `your-permanent-auth-token-here` with your actual permanent auth token

### 4. Test the Setup

1. Start your server: `cd server && npm run dev`
2. Try uploading a file through the application
3. Check your Hygraph project's **Assets** section to see if the file appears

## How It Works

### File Upload Process

1. **Frontend**: User selects a file and submits it
2. **Backend**: The file is sent to `/api/content/upload` endpoint
3. **Hygraph Service**: 
   - Creates an asset entry in Hygraph
   - Gets a pre-signed upload URL
   - Uploads the file to Hygraph's storage
   - Returns the final file URL
4. **Database**: The file URL is stored in the appropriate collection (materials, assignments, submissions)

### File Access

- Files uploaded to Hygraph are accessible via their URLs
- The application detects Hygraph URLs and shows appropriate UI elements
- Files can be downloaded or opened directly from the application

## Troubleshooting

### Common Issues

1. **"Hygraph not configured" error**
   - Check that `HYGRAPH_ENDPOINT` and `HYGRAPH_TOKEN` are set in your `.env` file
   - Restart your server after updating environment variables

2. **"Failed to create asset" error**
   - Verify your `HYGRAPH_TOKEN` has the correct permissions
   - Check that your `HYGRAPH_ENDPOINT` URL is correct

3. **"Failed to upload file" error**
   - Check your internet connection
   - Verify the file size is within Hygraph's limits
   - Check server logs for more detailed error messages

4. **Files not appearing in Hygraph**
   - Check the server logs for upload errors
   - Verify the file was actually uploaded (check the response)
   - Ensure the Hygraph project is active

### Fallback Behavior

If Hygraph upload fails, the system will:
- For small files (< 100KB): Use data URL encoding as fallback
- For larger files: Show an error message asking the user to try again

## File Types Supported

The application supports various file types including:
- Documents: PDF, DOC, DOCX
- Images: JPG, PNG, GIF, WebP
- Videos: MP4, AVI, MOV
- Audio: MP3, WAV, OGG
- Archives: ZIP, RAR, 7Z

## Security Considerations

1. **Token Security**: Keep your `HYGRAPH_TOKEN` secure and never commit it to version control
2. **File Validation**: The application validates file types on the frontend
3. **Access Control**: File access is controlled through the application's authentication system
4. **URL Security**: Hygraph URLs are not publicly accessible without proper authentication

## Monitoring

- Check your Hygraph project's **Assets** section to monitor uploaded files
- Use the **API Logs** in Hygraph to debug upload issues
- Monitor your server logs for any upload-related errors

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the server logs for detailed error messages
3. Verify your Hygraph project settings and permissions
4. Contact support if the issue persists