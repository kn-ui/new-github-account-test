/**
 * Hygraph Asset Upload Utility
 * Handles file uploads to Hygraph's asset management system
 */

const HYGRAPH_ENDPOINT = import.meta.env.VITE_HYGRAPH_ENDPOINT || 'https://api-us-east-1.hygraph.com/v2/your-project/master';
const HYGRAPH_TOKEN = import.meta.env.VITE_HYGRAPH_TOKEN || 'your-token';

export interface UploadResult {
  success: boolean;
  url?: string;
  assetId?: string;
  error?: string;
}

/**
 * Upload a file to Hygraph Asset Management
 * @param file - The file to upload
 * @param folder - Optional folder path in Hygraph
 * @returns UploadResult with URL and asset ID
 */
export async function uploadFileToHygraph(
  file: File,
  folder?: string
): Promise<UploadResult> {
  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('fileUpload', file);

    // Upload to Hygraph using their upload API
    // First, we need to create an asset in Hygraph
    const uploadMutation = `
      mutation CreateAsset($upload: Upload!) {
        createAsset(data: { upload: $upload }) {
          id
          url
          fileName
          mimeType
          size
        }
      }
    `;

    // Hygraph uses a specific upload endpoint
    const uploadEndpoint = HYGRAPH_ENDPOINT.replace('/graphql', '/upload');
    
    // Upload the file
    const uploadResponse = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HYGRAPH_TOKEN}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Hygraph upload error:', errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    const uploadData = await uploadResponse.json();
    
    // The response should contain the asset information
    const assetUrl = uploadData.url || uploadData.data?.createAsset?.url;
    const assetId = uploadData.id || uploadData.data?.createAsset?.id;

    if (!assetUrl) {
      throw new Error('No URL returned from Hygraph upload');
    }

    return {
      success: true,
      url: assetUrl,
      assetId: assetId,
    };
  } catch (error) {
    console.error('Error uploading file to Hygraph:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Upload a file using GraphQL mutation (alternative method)
 * This uses the GraphQL API directly with multipart request
 */
export async function uploadFileViaGraphQL(
  file: File,
  fileName?: string
): Promise<UploadResult> {
  try {
    const operations = {
      query: `
        mutation UploadAsset($file: Upload!) {
          createAsset(data: { upload: $file }) {
            id
            url
            fileName
            mimeType
            size
          }
        }
      `,
      variables: {
        file: null,
      },
    };

    const map = {
      '0': ['variables.file'],
    };

    const formData = new FormData();
    formData.append('operations', JSON.stringify(operations));
    formData.append('map', JSON.stringify(map));
    formData.append('0', file, fileName || file.name);

    const response = await fetch(HYGRAPH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HYGRAPH_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GraphQL upload error:', errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL upload error');
    }

    const asset = result.data?.createAsset;

    if (!asset || !asset.url) {
      throw new Error('No asset data returned from upload');
    }

    return {
      success: true,
      url: asset.url,
      assetId: asset.id,
    };
  } catch (error) {
    console.error('Error uploading via GraphQL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Delete an asset from Hygraph
 * @param assetId - The ID of the asset to delete
 */
export async function deleteAssetFromHygraph(assetId: string): Promise<boolean> {
  try {
    const mutation = `
      mutation DeleteAsset($id: ID!) {
        deleteAsset(where: { id: $id }) {
          id
        }
      }
    `;

    const response = await fetch(HYGRAPH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HYGRAPH_TOKEN}`,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { id: assetId },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('Error deleting asset:', result.errors);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting asset from Hygraph:', error);
    return false;
  }
}

/**
 * Validate file before upload
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10MB)
 * @param allowedTypes - Array of allowed MIME types
 */
export function validateFile(
  file: File,
  maxSizeMB: number = 10,
  allowedTypes?: string[]
): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type if specified
  if (allowedTypes && allowedTypes.length > 0) {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
