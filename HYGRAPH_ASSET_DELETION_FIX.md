# Hygraph Asset Deletion Fix

## Problem
When deleting course materials, assignments, or blog posts, the associated files uploaded to Hygraph were not being deleted. This was because:

1. The system was storing only the file URL (e.g., `https://shared-eu-west-2-assets-delivery-a673e0d.s3.eu-west-2.amazonaws.com/...`)
2. When attempting to delete, it tried to extract the Hygraph asset ID from the URL
3. The URL format (S3 URL) didn't contain the asset ID, making extraction impossible
4. Result: Files remained in Hygraph even after content was deleted

## Solution
Store the Hygraph asset ID alongside the URL when uploading files, then use the asset ID directly for deletion.

## Changes Made

### 1. Updated Firestore Interfaces (`src/lib/firestore.ts`)
Added fields to store Hygraph asset IDs:
- `FirestoreCourseMaterial`: Added `fileAssetId?: string`
- `FirestoreAssignment`: Added `assetId?: string` to attachments array
- `FirestoreBlog`: Added `imageAssetId?: string`

### 2. Updated Asset Manager (`src/lib/hygraphAssetManager.ts`)
- Added `extractHygraphAssetIds()` function to extract asset IDs from documents
- Updated `deleteDocumentAssets()` to accept and prioritize asset IDs over URLs
- Added `deleteAssetById()` helper function
- Kept URL-based deletion as fallback for legacy data

### 3. Updated Upload Module (`src/lib/hygraphUpload.ts`)
- Added `deleteHygraphAssetById()` function for direct asset ID deletion
- Refactored `deleteHygraphAsset()` to use the new function internally

### 4. Updated Deletion Functions (`src/lib/firestore.ts`)
Modified all deletion functions to use asset IDs:
- `deleteCourseMaterial()`: Uses `extractHygraphAssetIds()` and passes asset IDs to deletion
- `deleteAssignment()`: Extracts asset IDs from attachments for deletion
- `deleteBlogPost()`: Uses `imageAssetId` for deletion

### 5. Updated Upload Pages
Updated all pages that handle file uploads to store asset IDs:

#### `src/pages/TeacherCourseMaterials.tsx`
- Stores `uploadResult.id` as `fileAssetId` when creating/updating materials

#### `src/pages/TeacherAssignments.tsx`
- Stores `uploadResult.id` as `assetId` in attachment objects

#### `src/pages/Updates.tsx` (Blog posts)
- Stores `uploadResult.id` as `imageAssetId` when creating/updating blogs

#### `src/pages/TeacherCourseDetail.tsx`
- Stores `uploadResult.id` as `fileAssetId` for inline material creation

## How It Works Now

### Upload Flow
1. File is uploaded to Hygraph via `/api/content/upload`
2. Server returns both `url` and `id` (asset ID)
3. Both are stored in Firestore:
   - URL in `fileUrl`/`imageUrl`/`attachments[].url` (for display)
   - Asset ID in `fileAssetId`/`imageAssetId`/`attachments[].assetId` (for deletion)

### Deletion Flow
1. When deleting content, system retrieves the document from Firestore
2. `extractHygraphAssetIds()` extracts all asset IDs from the document
3. `deleteDocumentAssets()` uses asset IDs directly to call `/api/content/delete-asset`
4. If no asset IDs found (legacy data), falls back to URL-based extraction
5. Backend unpublishes and deletes the asset from Hygraph

## Backward Compatibility
- Legacy documents without asset IDs will still work via URL-based extraction
- New uploads will use the more reliable asset ID method
- No data migration required

## Testing
To verify the fix works:

1. **Upload a new course material with a file**
   - Check Firestore: Document should have both `fileUrl` and `fileAssetId`
   
2. **Delete the course material**
   - Check console logs: Should show "Deleting asset by ID: [assetId]"
   - Check Hygraph: Asset should be removed
   
3. **Upload a new assignment with attachment**
   - Check Firestore: Attachment should have both `url` and `assetId`
   
4. **Delete the assignment**
   - Check console logs: Should show asset deletion by ID
   - Check Hygraph: Asset should be removed
   
5. **Upload a new blog post with image**
   - Check Firestore: Document should have both `imageUrl` and `imageAssetId`
   
6. **Delete the blog post**
   - Check console logs: Should show asset deletion by ID
   - Check Hygraph: Asset should be removed

## Expected Console Output
When deleting content with assets:
```
Deleting 1 asset(s) by ID for courseMaterial abc123
Deleting Hygraph asset by ID: cmgxogoyso1iv08mhkc9pd6i7
Attempting to delete asset from Hygraph: cmgxogoyso1iv08mhkc9pd6i7
Unpublishing asset: cmgxogoyso1iv08mhkc9pd6i7
Asset unpublished successfully
Deleting asset: cmgxogoyso1iv08mhkc9pd6i7
Asset deleted successfully from Hygraph: cmgxogoyso1iv08mhkc9pd6i7
Successfully deleted Hygraph asset: cmgxogoyso1iv08mhkc9pd6i7
Deleted asset by ID: cmgxogoyso1iv08mhkc9pd6i7
Deleted 1 Hygraph asset(s) for courseMaterial abc123
```

## Files Modified
- `src/lib/firestore.ts` - Interface definitions and deletion functions
- `src/lib/hygraphAssetManager.ts` - Asset ID extraction and deletion logic
- `src/lib/hygraphUpload.ts` - Direct asset ID deletion function
- `src/pages/TeacherCourseMaterials.tsx` - Store asset IDs on upload
- `src/pages/TeacherAssignments.tsx` - Store asset IDs in attachments
- `src/pages/Updates.tsx` - Store blog image asset IDs
- `src/pages/TeacherCourseDetail.tsx` - Store asset IDs for inline material creation

## Notes
- The fix addresses the root cause: unreliable URL-based asset ID extraction
- Asset IDs are the canonical way to reference Hygraph assets
- The solution is future-proof and backward compatible
- No changes needed to the backend deletion API
