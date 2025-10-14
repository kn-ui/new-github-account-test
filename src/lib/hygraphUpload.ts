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