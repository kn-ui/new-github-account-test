# Hygraph Setup Guide for File Uploads

## Prerequisites

You need to configure Hygraph to enable asset uploads. Here's what you need to set up:

## 1. Asset Management in Hygraph

Hygraph has built-in asset management, but you need to ensure it's properly configured:

### Step 1: Enable Asset Uploads
1. Log in to your Hygraph project dashboard
2. Go to **Project Settings** → **API Access**
3. Make sure your API token has the following permissions:
   - ✅ Read Assets
   - ✅ Create Assets
   - ✅ Update Assets
   - ✅ Delete Assets (optional)

### Step 2: Configure Public Access (Important!)
1. Go to **Project Settings** → **API Access** → **Public Content API**
2. Enable public access for assets if you want them to be publicly accessible
3. Or configure signed URLs if you want private assets

## 2. Create Asset Model (If Not Already Present)

By default, Hygraph includes an `Asset` system model, but if you need custom asset handling:

### Option A: Use Default Asset System (Recommended)
The default Asset system in Hygraph already includes:
- `url` - The public URL of the asset
- `handle` - Unique identifier
- `fileName` - Original filename
- `mimeType` - File type
- `size` - File size in bytes
- `width` & `height` - For images

### Option B: Create Custom Asset Model (If Needed)
If you want to track additional metadata:

1. Go to your Hygraph Schema
2. Create a new model called `FileUpload` or `Document`
3. Add fields:
   ```
   - title (String, required)
   - description (String)
   - fileUrl (String, required) - URL from asset upload
   - assetId (String) - Reference to Asset
   - uploadedBy (String) - User ID
   - uploadedAt (DateTime)
   - courseId (String) - Reference to course
   - type (Enum: document, image, video, other)
   ```

## 3. API Permissions Setup

### Create or Update Your Permanent Auth Token:

1. Go to **Project Settings** → **API Access** → **Permanent Auth Tokens**
2. Create a new token or edit existing
3. Grant these permissions:

   **For Default Asset System:**
   - Read: Asset
   - Create: Asset
   - Update: Asset
   - Delete: Asset (optional)

   **For Custom Model (if created):**
   - Read: FileUpload/Document
   - Create: FileUpload/Document
   - Update: FileUpload/Document
   - Delete: FileUpload/Document

4. Copy the token and add to your `.env`:
   ```env
   HYGRAPH_TOKEN=eyJhbGciOi...your-token-here
   ```

## 4. Update Environment Variables

Make sure your server `.env` file has the correct format:

```env
# Hygraph Configuration
# Format: https://api-[region].hygraph.com/v2/[projectId]/[environment]
HYGRAPH_ENDPOINT=https://api-eu-west-2.hygraph.com/v2/cmfa67lik01gq07wcjfncgxv0/master

# Your permanent auth token with asset permissions
HYGRAPH_TOKEN=eyJhbGciOi...your-full-token-here
```

## 5. Upload Endpoint Configuration

The Hygraph upload endpoint format is:
```
https://api-[region].hygraph.com/v2/[projectId]/[environment]/upload
```

Our code automatically constructs this from your `HYGRAPH_ENDPOINT`.

## 6. Testing Your Setup

### Test via Hygraph Playground:
1. Go to your Hygraph project
2. Open the API Playground
3. Try this mutation to test asset creation:

```graphql
mutation {
  createAsset(data: {
    upload: {
      url: "https://example.com/test.pdf"
    }
  }) {
    id
    url
    fileName
  }
}
```

### Test via cURL:
```bash
curl -X POST \
  https://api-eu-west-2.hygraph.com/v2/YOUR_PROJECT_ID/master/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "fileUpload=@/path/to/your/file.pdf"
```

## 7. File Size Limits

Hygraph has these default limits:
- **Free Plan**: 100MB per file, 1GB total storage
- **Pro Plan**: 500MB per file, 100GB total storage
- **Enterprise**: Custom limits

## 8. Troubleshooting

### If uploads fail:

1. **Check Token Permissions:**
   ```bash
   # Decode your JWT token at jwt.io to see permissions
   ```

2. **Verify Endpoint Format:**
   - Should be: `https://api-[region].hygraph.com/v2/[projectId]/[environment]`
   - NOT: `https://eu-west-2.cdn.hygraph.com/...` (this is read-only CDN)

3. **Check CORS Settings:**
   - Go to **Project Settings** → **API Access**
   - Add your frontend URL to allowed origins:
     - `http://localhost:5173`
     - `http://localhost:3000`
     - Your production domain

4. **Enable Debug Mode:**
   In `server/src/controllers/contentController.ts`, add logging:
   ```typescript
   console.log('Upload URL:', uploadUrl);
   console.log('Token:', token.substring(0, 20) + '...');
   ```

## 9. Alternative: Direct Client Uploads (Optional)

For better performance, you can upload directly from the client:

1. Create a server endpoint to generate signed upload URLs
2. Upload directly from browser to Hygraph
3. Store the returned asset URL in your database

This reduces server load but requires more complex client-side handling.

## Quick Checklist

- [ ] Hygraph project created
- [ ] API token generated with Asset permissions
- [ ] Environment variables set correctly
- [ ] Upload endpoint accessible
- [ ] CORS configured for your domains
- [ ] File size within plan limits

## Need Help?

1. Check Hygraph documentation: https://hygraph.com/docs/api-reference/basics/assets
2. Test in API Playground first
3. Check browser console and server logs for errors
4. Verify token has correct permissions