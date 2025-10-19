import { getAuthToken } from './api';

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  id?: string;
  error?: string;
  warning?: string;
}

export async function uploadToHygraph(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = getAuthToken();
    const response = await fetch('/api/content/upload', {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    const contentType = response.headers.get('content-type') || '';

    // Handle non-OK responses robustly, without assuming JSON body
    if (!response.ok) {
      let message = `Upload failed (${response.status} ${response.statusText})`;
      if (contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          message = (errorData && (errorData.message || errorData.error)) || message;
        } catch {
          // Fall back to text below
        }
      }

      if (!contentType || !contentType.includes('application/json')) {
        try {
          const text = await response.text();
          if (text) {
            try {
              const parsed = JSON.parse(text);
              message = (parsed && (parsed.message || parsed.error)) || message;
            } catch {
              message = text.slice(0, 300);
            }
          }
        } catch {
          // ignore
        }
      }

      throw new Error(message);
    }

    // OK response: expect JSON; guard against empty/non-JSON
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (data.success) {
        return {
          success: true,
          url: data.data.url,
          filename: data.data.filename,
          size: data.data.size,
          mimeType: data.data.mimeType,
          id: data.data.id,
          warning: data.warning
        };
      } else {
        return {
          success: false,
          error: data.message || 'Upload failed'
        };
      }
    } else {
      const text = await response.text().catch(() => '');
      const snippet = text ? text.slice(0, 300) : '';
      return {
        success: false,
        error: snippet ? `Unexpected response from server: ${snippet}` : 'Unexpected empty response from server'
      };
    }
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export function isHygraphUrl(url: string): boolean {
  return url.includes('hygraph.com') || url.includes('hygraph.io');
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function getFileIcon(filename: string): string {
  const extension = getFileExtension(filename);
  
  switch (extension) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'ppt':
    case 'pptx':
      return '📊';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return '🖼️';
    case 'mp4':
    case 'avi':
    case 'mov':
      return '🎥';
    case 'mp3':
    case 'wav':
    case 'ogg':
      return '🎵';
    case 'zip':
    case 'rar':
    case '7z':
      return '📦';
    default:
      return '📎';
  }
}

export function extractHygraphAssetId(url: string): string | null {
  if (!isHygraphUrl(url)) {
    console.log('Not a Hygraph URL:', url);
    return null;
  }
  
  // Extract asset ID from Hygraph URL
  // Hygraph URLs can have different patterns:
  // 1. https://media.graphassets.com/[assetId]
  // 2. https://media.graphassets.com/[assetId]/[filename]
  // 3. https://[region].graphassets.com/[projectId]/[assetId]
  
  // Try different patterns
  let match = url.match(/media\.graphassets\.com\/([a-zA-Z0-9]+)/);
  if (match) {
    console.log('Extracted asset ID from pattern 1:', match[1]);
    return match[1];
  }
  
  // Try pattern with filename
  match = url.match(/\/([a-zA-Z0-9-_]+)\/[^/]*$/);
  if (match) {
    console.log('Extracted asset ID from pattern 2:', match[1]);
    return match[1];
  }
  
  // Try to extract from any Hygraph URL
  match = url.match(/\/([a-zA-Z0-9]{20,})/);
  if (match) {
    console.log('Extracted asset ID from pattern 3:', match[1]);
    return match[1];
  }
  
  console.error('Could not extract asset ID from URL:', url);
  return null;
}

export async function deleteHygraphAsset(url: string): Promise<boolean> {
  try {
    console.log('Attempting to delete Hygraph asset from URL:', url);
    
    const assetId = extractHygraphAssetId(url);
    if (!assetId) {
      console.error('Failed to extract asset ID from URL:', url);
      return false;
    }

    console.log('Deleting asset with ID:', assetId);
    
    const token = getAuthToken();
    const response = await fetch('/api/content/delete-asset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ assetId })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Successfully deleted Hygraph asset:', assetId);
    } else {
      console.error('Failed to delete Hygraph asset:', result.message || 'Unknown error');
    }
    
    return result.success;
  } catch (error) {
    console.error('Error deleting Hygraph asset:', error);
    return false;
  }
}