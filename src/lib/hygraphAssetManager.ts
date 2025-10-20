/**
 * Hygraph Asset Manager
 * Manages the relationship between Firestore documents and Hygraph assets
 * Stores asset IDs for reliable deletion
 */

import { doc, setDoc, getDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { deleteHygraphAsset as deleteAsset } from './hygraphUpload';

export interface HygraphAssetRecord {
  assetId: string;
  url: string;
  documentType: 'blog' | 'assignment' | 'courseMaterial' | 'submission';
  documentId: string;
  uploadedAt: Date;
}

/**
 * Store a Hygraph asset record for tracking
 */
export async function storeAssetRecord(
  assetId: string,
  url: string,
  documentType: 'blog' | 'assignment' | 'courseMaterial' | 'submission',
  documentId: string
): Promise<void> {
  try {
    const recordId = `${documentType}_${documentId}_${assetId}`;
    const recordRef = doc(db, 'hygraph_assets', recordId);
    
    await setDoc(recordRef, {
      assetId,
      url,
      documentType,
      documentId,
      uploadedAt: new Date(),
    });
    
    console.log('Stored Hygraph asset record:', recordId);
  } catch (error) {
    console.error('Failed to store asset record:', error);
    // Non-blocking error - continue even if record storage fails
  }
}

/**
 * Delete all Hygraph assets associated with a document
 */
export async function deleteDocumentAssets(
  documentType: 'blog' | 'assignment' | 'courseMaterial' | 'submission',
  documentId: string,
  assetIds?: string[],
  urls?: string[]
): Promise<number> {
  let deletedCount = 0;
  
  try {
    // First, try to delete using asset IDs (preferred method)
    if (assetIds && assetIds.length > 0) {
      console.log(`Deleting ${assetIds.length} asset(s) by ID for ${documentType} ${documentId}`);
      for (const assetId of assetIds) {
        try {
          const deleted = await deleteAssetById(assetId);
          if (deleted) {
            deletedCount++;
            console.log(`Deleted asset by ID: ${assetId}`);
          }
        } catch (error) {
          console.error(`Failed to delete asset by ID ${assetId}:`, error);
        }
      }
    }
    
    // Fall back to URL-based deletion if no asset IDs were provided or deleted
    if (deletedCount === 0 && urls && urls.length > 0) {
      console.log(`Falling back to URL-based deletion for ${documentType} ${documentId}`);
      for (const url of urls) {
        try {
          const deleted = await deleteAsset(url);
          if (deleted) {
            deletedCount++;
            console.log(`Deleted asset from URL: ${url}`);
          }
        } catch (error) {
          console.error(`Failed to delete asset from URL ${url}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error deleting document assets:', error);
  }
  
  return deletedCount;
}

/**
 * Delete a Hygraph asset by its ID directly
 */
async function deleteAssetById(assetId: string): Promise<boolean> {
  try {
    console.log('Deleting asset by ID:', assetId);
    const { deleteHygraphAssetById } = await import('./hygraphUpload');
    return await deleteHygraphAssetById(assetId);
  } catch (error) {
    console.error('Error deleting asset by ID:', error);
    return false;
  }
}

/**
 * Extract all Hygraph asset IDs from a document's data
 */
export function extractHygraphAssetIds(data: any): string[] {
  const assetIds: string[] = [];
  
  // Check for direct asset ID fields (preferred method)
  if (data.imageAssetId) {
    assetIds.push(data.imageAssetId);
  }
  
  if (data.fileAssetId) {
    assetIds.push(data.fileAssetId);
  }
  
  // Check attachments array for asset IDs
  if (data.attachments && Array.isArray(data.attachments)) {
    data.attachments.forEach((attachment: any) => {
      if (attachment.assetId) {
        assetIds.push(attachment.assetId);
      }
    });
  }
  
  return assetIds;
}

/**
 * Extract all Hygraph URLs from a document's data (legacy support)
 */
export function extractHygraphUrls(data: any): string[] {
  const urls: string[] = [];
  
  // Check common fields that might contain Hygraph URLs
  if (data.imageUrl && isHygraphUrl(data.imageUrl)) {
    urls.push(data.imageUrl);
  }
  
  if (data.fileUrl && isHygraphUrl(data.fileUrl)) {
    urls.push(data.fileUrl);
  }
  
  // Check attachments array
  if (data.attachments && Array.isArray(data.attachments)) {
    data.attachments.forEach((attachment: any) => {
      if (attachment.url && isHygraphUrl(attachment.url)) {
        urls.push(attachment.url);
      }
    });
  }
  
  return urls;
}

/**
 * Check if a URL is from Hygraph
 */
function isHygraphUrl(url: string): boolean {
  return url.includes('hygraph.com') || 
         url.includes('hygraph.io') || 
         url.includes('graphassets.com') ||
         url.includes('graphcms.com'); // Legacy domain
}