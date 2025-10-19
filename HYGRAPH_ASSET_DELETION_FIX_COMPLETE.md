# Hygraph Asset Deletion Fix - Complete

## Problem
When course materials, assignments, or blog posts were deleted, their associated files uploaded to Hygraph were not being deleted. The error logs showed:
- `Not a Hygraph URL: https://eu-west-2.graphassets.com/...`
- `Failed to extract asset ID from URL`
- Files remained in Hygraph storage after record deletion

## Root Cause
The `isHygraphUrl()` function in `src/lib/hygraphUpload.ts` only checked for `hygraph.com` and `hygraph.io` domains, but Hygraph also uses `graphassets.com` (and legacy `graphcms.com`) domains for asset URLs.

## Solution Implemented

### 1. Fixed URL Recognition
Updated `isHygraphUrl()` function to recognize all Hygraph domain variations:
```typescript
export function isHygraphUrl(url: string): boolean {
  return url.includes('hygraph.com') || 
         url.includes('hygraph.io') || 
         url.includes('graphassets.com') ||
         url.includes('graphcms.com'); // Legacy domain
}
```

### 2. Improved Asset ID Extraction
Enhanced `extractHygraphAssetId()` function to handle various URL patterns:
- `https://media.graphassets.com/[assetId]`
- `https://[region].graphassets.com/[projectId]/[assetId]`
- Similar patterns for `hygraph.io` and `graphcms.com`
- Generic fallback for 20+ character asset IDs

### 3. Existing Infrastructure
The deletion infrastructure was already properly implemented:

#### Course Materials (`src/lib/firestore.ts`)
- `deleteCourseMaterial()` extracts Hygraph URLs and calls `deleteDocumentAssets()`
- Continues with document deletion even if asset deletion fails

#### Assignments (`src/lib/firestore.ts`)
- `deleteAssignment()` handles attachment deletions
- Properly manages arrays of attachments

#### Blog Posts (`src/lib/firestore.ts`)
- `deleteBlogPost()` handles image URL deletion
- Gracefully handles missing images

#### Backend Support (`server/src/`)
- `contentController.deleteAsset()` endpoint available at `/api/content/delete-asset`
- `hygraphService.deleteAsset()` handles unpublishing and deletion via GraphQL

## Testing
Created and ran test script to verify URL parsing:
```javascript
// Test URL from error log
const testUrl = 'https://eu-west-2.graphassets.com/cmfa67mmp113s07ml7dd7fekg/cmgxj4b46mrah07mmh61k2a3g';
// Successfully extracts: cmgxj4b46mrah07mmh61k2a3g
```

## Files Modified
- `src/lib/hygraphUpload.ts` - Fixed URL recognition and asset ID extraction

## No Additional Changes Required
The following were already properly implemented:
- `src/lib/firestore.ts` - Deletion logic for all three entity types
- `src/lib/hygraphAssetManager.ts` - Already had correct URL checking
- `server/src/controllers/contentController.ts` - Delete endpoint exists
- `server/src/services/hygraphService.ts` - Deletion service implemented
- `server/src/routes/contentRoutes.ts` - Route registered

## Result
✅ Course material files will now be deleted from Hygraph when materials are deleted
✅ Assignment attachments will be deleted from Hygraph when assignments are deleted  
✅ Blog images will be deleted from Hygraph when blog posts are deleted
✅ All Hygraph URL formats are now properly recognized
✅ Asset IDs are correctly extracted from various URL patterns