import fetch from 'node-fetch';
import FormData from 'form-data';

export interface HygraphAsset {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface HygraphUploadResponse {
  success: boolean;
  asset?: HygraphAsset;
  error?: string;
}

class HygraphService {
  private endpoint: string;
  private token: string;

  constructor() {
    this.endpoint = process.env.HYGRAPH_ENDPOINT as string;
    this.token = process.env.HYGRAPH_TOKEN as string;
    
    if (!this.endpoint || !this.token) {
      console.warn('Hygraph configuration missing. File uploads will use fallback methods.');
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<HygraphUploadResponse> {
    if (!this.endpoint || !this.token) {
      throw new Error('Hygraph not configured');
    }

    try {
      // Step 1: Create asset entry in Hygraph
      const createAssetMutation = `
        mutation CreateAssetEntry($fileName: String!, $mimeType: String!) {
          createAsset(data: { fileName: $fileName, mimeType: $mimeType }) {
            id
            fileName
            url
            mimeType
            size
            upload {
              status
              requestPostURL
              requestHeaders
            }
          }
        }
      `;

      const createAssetResponse = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          query: createAssetMutation,
          variables: {
            fileName: file.originalname,
            mimeType: file.mimetype,
          },
        }),
      });

      const createAssetData = await createAssetResponse.json() as any;

      if (!createAssetResponse.ok || createAssetData.errors) {
        console.error('Hygraph create asset failed:', createAssetData.errors || createAssetResponse.statusText);
        throw new Error(`Failed to create asset: ${createAssetData.errors?.[0]?.message || 'Unknown error'}`);
      }

      const { id, url, upload } = createAssetData.data.createAsset;
      const { requestPostURL, requestHeaders } = upload;

      if (!requestPostURL) {
        throw new Error('No upload URL received from Hygraph');
      }

      // Step 2: Upload file to the pre-signed URL
      const uploadResponse = await fetch(requestPostURL, {
        method: 'PUT',
        headers: requestHeaders,
        body: file.buffer,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Hygraph file upload failed:', errorText);
        throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
      }

      // Step 3: Wait a moment for Hygraph to process the file
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Get the final asset details
      const getAssetQuery = `
        query GetAsset($id: ID!) {
          asset(where: { id: $id }) {
            id
            fileName
            url
            mimeType
            size
          }
        }
      `;

      const assetResponse = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          query: getAssetQuery,
          variables: { id },
        }),
      });

      const assetData = await assetResponse.json() as any;

      if (!assetResponse.ok || assetData.errors) {
        console.warn('Could not fetch final asset details, using initial URL');
        return {
          success: true,
          asset: {
            id,
            fileName: file.originalname,
            url: url,
            mimeType: file.mimetype,
            size: file.size,
          },
        };
      }

      return {
        success: true,
        asset: assetData.data.asset,
      };
    } catch (error) {
      console.error('Hygraph upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deleteAsset(assetId: string): Promise<boolean> {
    if (!this.endpoint || !this.token) {
      throw new Error('Hygraph not configured');
    }

    try {
      const deleteMutation = `
        mutation DeleteAsset($id: ID!) {
          deleteAsset(where: { id: $id }) {
            id
          }
        }
      `;

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          query: deleteMutation,
          variables: { id: assetId },
        }),
      });

      const data = await response.json() as any;
      return response.ok && !data.errors;
    } catch (error) {
      console.error('Error deleting asset:', error);
      return false;
    }
  }

  async getAsset(assetId: string): Promise<HygraphAsset | null> {
    if (!this.endpoint || !this.token) {
      throw new Error('Hygraph not configured');
    }

    try {
      const query = `
        query GetAsset($id: ID!) {
          asset(where: { id: $id }) {
            id
            fileName
            url
            mimeType
            size
          }
        }
      `;

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          query,
          variables: { id: assetId },
        }),
      });

      const data = await response.json() as any;

      if (!response.ok || data.errors) {
        return null;
      }

      return data.data.asset;
    } catch (error) {
      console.error('Error fetching asset:', error);
      return null;
    }
  }
}

export default new HygraphService();