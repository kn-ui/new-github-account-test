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
  documentType: 'blog' | 'assignment' | 'courseMaterial';
  documentId: string;
  uploadedAt: Date;
}

/**
 * Store a Hygraph asset record for tracking
 */
export async function storeAssetRecord(
  assetId: string,
  url: string,
  documentType: 'blog' | 'assignment' | 'courseMaterial',
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
  documentType: 'blog' | 'assignment' | 'courseMaterial',
  documentId: string,
  urls?: string[]
): Promise<number> {
  let deletedCount = 0;
  
  try {
    // Try to find asset records in our tracking collection
    const recordPrefix = `${documentType}_${documentId}_`;
    // Note: This would ideally use a query, but for now we'll rely on URL-based deletion
    
    // If URLs are provided, try to delete them
    if (urls && urls.length > 0) {
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
 * Extract all Hygraph URLs from a document's data
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