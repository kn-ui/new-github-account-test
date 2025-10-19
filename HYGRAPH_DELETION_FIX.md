# Hygraph File Deletion Fix

## Problem
The Hygraph file deletion was implemented but not working correctly. When blogs, assignments, or course materials were deleted, their associated files in Hygraph remained, leading to orphaned assets.

## Root Causes Identified

1. **Asset ID Extraction Issues**: The regex pattern for extracting asset IDs from Hygraph URLs may not match all URL formats
2. **Missing Error Handling**: Deletion failures were silently ignored without proper logging
3. **Published Assets**: Assets in Hygraph must be unpublished before they can be deleted
4. **No Asset Tracking**: Only URLs were stored, not the asset IDs, making deletion unreliable

## Solutions Implemented

### 1. Enhanced Asset ID Extraction (`src/lib/hygraphUpload.ts`)
- Added multiple regex patterns to handle different Hygraph URL formats
- Added detailed logging to track extraction success/failure
- Supports various URL patterns:
  - `https://media.graphassets.com/[assetId]`
  - `https://media.graphassets.com/[assetId]/[filename]`
  - Other Hygraph domain variations

### 2. Improved Deletion Logic (`src/lib/hygraphUpload.ts`)
- Added comprehensive logging throughout the deletion process
- Better error reporting to identify why deletions fail
- Validates that URLs are actually from Hygraph before attempting deletion

### 3. Server-Side Improvements (`server/src/services/hygraphService.ts`)
- **Unpublish Before Delete**: Assets are now unpublished before deletion
- Added detailed logging at each step
- Better error handling and reporting
- Complete deletion flow:
  1. Unpublish asset from PUBLISHED stage
  2. Delete the asset
  3. Return clear success/failure status

### 4. Asset Manager Utility (`src/lib/hygraphAssetManager.ts`)
- Created a centralized asset management system
- Extracts all Hygraph URLs from documents
- Provides batch deletion capabilities
- Supports multiple document types (blogs, assignments, course materials)

### 5. Updated Deletion Functions (`src/lib/firestore.ts`)
- **Delete Before Document**: Assets are now deleted BEFORE the document is removed
- **Continue on Failure**: Document deletion proceeds even if asset deletion fails
- **Comprehensive Logging**: Every deletion attempt is logged with results
- Uses the new Asset Manager for more reliable deletion

## Testing Instructions

### 1. Enable Console Logging
Open browser developer tools to see deletion logs.

### 2. Test Blog Image Deletion
1. Create a new blog post with an image
2. Note the image URL in the console
3. Delete the blog post
4. Check console for deletion logs
5. Verify the asset is removed from Hygraph

### 3. Test Assignment Attachment Deletion
1. Create an assignment with file attachments
2. Note the attachment URLs
3. Delete the assignment
4. Check console for deletion logs
5. Verify assets are removed from Hygraph

### 4. Test Course Material Deletion
1. Upload a course material with a file
2. Note the file URL
3. Delete the course material
4. Check console for deletion logs
5. Verify the asset is removed from Hygraph

## Console Log Examples

When deletion works correctly, you should see:
```
Attempting to delete Hygraph asset from URL: https://media.graphassets.com/abc123...
Extracted asset ID from pattern 1: abc123...
Deleting asset with ID: abc123...
Unpublishing asset: abc123...
Asset unpublished successfully
Deleting asset: abc123...
Asset deleted successfully from Hygraph: abc123...
Successfully deleted Hygraph asset: abc123...
Deleted 1 Hygraph asset(s) for blog 12345
```

If deletion fails, you'll see:
```
Failed to extract asset ID from URL: https://...
Failed to delete blog image from Hygraph, but continuing with blog deletion
```

## Verification in Hygraph

To verify assets are actually deleted:

1. Log into your Hygraph dashboard
2. Go to Assets section
3. Note the total count of assets
4. Delete content with files in your app
5. Refresh Hygraph and verify the asset count decreases

## Troubleshooting

### If deletion still doesn't work:

1. **Check URL Format**: 
   - Open console and look for "Attempting to delete Hygraph asset from URL"
   - Copy the URL and test it with the test script: `src/lib/testHygraphUrl.ts`

2. **Check Hygraph Permissions**:
   - Ensure your Hygraph API token has delete permissions
   - Check if assets are locked or protected in Hygraph

3. **Check Asset Stage**:
   - Assets must be unpublished before deletion
   - Check if unpublishing is working in the logs

4. **Manual Cleanup**:
   - If automated deletion fails, you can manually delete orphaned assets from Hygraph dashboard
   - Use the Asset section's filter to find unused assets

## Future Improvements

1. **Store Asset IDs**: Modify upload process to store asset IDs separately in Firestore for 100% reliable deletion
2. **Batch Deletion**: Implement periodic cleanup of orphaned assets
3. **Deletion Queue**: Create a retry mechanism for failed deletions
4. **Asset Usage Tracking**: Track which documents use which assets for better management