import fetch from 'node-fetch';
import { Readable } from 'node:stream';
import { fileFromBuffer, FormData as FormDataNode } from 'formdata-node';
import { FormDataEncoder } from 'form-data-encoder';
import { Readable as ReadableStream } from 'stream';

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
      // Step 1: Create asset entry in Hygraph and request POST upload data (new API)
      const createAssetMutation = `
        mutation CreateAssetEntry($fileName: String!, $mimeType: String!) {
          createAsset(data: { fileName: $fileName, mimeType: $mimeType, stage: DRAFT }) {
            id
            fileName
            url
            mimeType
            size
            upload {
              status
              expiresAt
              requestPostData {
                url
                headers
                fields
              }
              error { code message }
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
      const postData = upload?.requestPostData;

      if (!postData?.url) {
        throw new Error('No upload URL received from Hygraph');
      }

      // Step 2: Upload file using POST with form fields (S3 pre-signed POST)
      // Build a spec-compliant multipart form using formdata-node + encoder
      const form = new FormDataNode();
      const fields = postData.fields || {};
      Object.keys(fields).forEach((k) => form.append(k, fields[k]));
      const filePart = await fileFromBuffer(file.buffer, file.originalname, { type: file.mimetype });
      form.append('file', filePart);

      const encoder = new FormDataEncoder(form);
      const readable = ReadableStream.from(encoder);
      const uploadResponse = await fetch(postData.url, {
        method: 'POST',
        headers: encoder.headers as any,
        body: readable as any,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Hygraph file upload failed:', errorText);
        throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
      }

      // Step 3: Try to publish as soon as possible (ignore errors if still processing)
      const publishMutation = `
        mutation PublishAsset($id: ID!) {
          publishAsset(where: { id: $id }, to: PUBLISHED) { id }
        }
      `;
      try {
        await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ query: publishMutation, variables: { id } }),
        });
      } catch (e) {
        // Ignore; will retry after polling
      }

      // Step 4: Poll for asset to be ready, then ensure it's published
      const getAssetQuery = `
        query GetAsset($id: ID!) {
          asset(where: { id: $id }) {
            id
            fileName
            url
            mimeType
            size
            stage
          }
        }
      `;

      const maxAttempts = 12; // ~8-10s total with backoff
      let attempt = 0;
      let lastAsset: any = null;
      let delayMs = 500;
      while (attempt < maxAttempts) {
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
        if (assetResponse.ok && !assetData.errors && assetData.data?.asset) {
          lastAsset = assetData.data.asset;
          // Consider ready when URL exists and size is available
          if (lastAsset.url && typeof lastAsset.size === 'number' && lastAsset.size >= 0) {
            break;
          }
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs = Math.min(Math.round(delayMs * 1.5), 3000);
        attempt += 1;
      }

      // Ensure publish after processing
      try {
        await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ query: publishMutation, variables: { id } }),
        });
      } catch (e) {
        // Non-fatal; asset direct URL will still work
      }

      // Use the most recent asset data if available, else fallback to initial create response
      if (lastAsset) {
        return {
          success: true,
          asset: lastAsset,
        };
      }
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