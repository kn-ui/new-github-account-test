/**
 * Hygraph file storage utilities
 * Handles file uploads and retrievals from Hygraph storage
 */

export interface HygraphFile {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  id?: string;
  handle?: string;
}

export interface HygraphUploadResponse {
  success: boolean;
  data?: HygraphFile;
  message?: string;
  warning?: string;
}

/**
 * Upload a file to Hygraph storage
 */
export async function uploadToHygraph(file: File, authToken?: string): Promise<HygraphUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/content/upload', {
      method: 'POST',
      body: formData,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Hygraph upload error:', error);
    throw error;
  }
}

/**
 * Get file URL from Hygraph storage
 * This function can be used to construct proper URLs for Hygraph assets
 */
export function getHygraphFileUrl(assetId: string, baseUrl?: string): string {
  // If it's already a full URL, return as is
  if (assetId.startsWith('http')) {
    return assetId;
  }

  // If it's a data URL, return as is
  if (assetId.startsWith('data:')) {
    return assetId;
  }

  // Construct URL from asset ID
  const hygraphBaseUrl = baseUrl || process.env.VITE_HYGRAPH_BASE_URL || 'https://media.hygraph.com';
  return `${hygraphBaseUrl}/assets/${assetId}`;
}

/**
 * Download a file from Hygraph storage
 */
export async function downloadFromHygraph(fileUrl: string, filename?: string): Promise<void> {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

/**
 * Open a file from Hygraph storage in a new tab
 */
export function openHygraphFile(fileUrl: string): void {
  window.open(fileUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Get file type icon based on MIME type
 */
export function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
  return '📎';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}