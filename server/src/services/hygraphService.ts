
import fetch, { RequestInit, Response } from 'node-fetch';
import FormData from 'form-data';

// Interfaces remain the same
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

  // Helper function for exponential backoff during API calls
  private async safeFetch(url: string, options: RequestInit, retries: number = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }
        // Throw an error if the response is not OK (e.g., 4xx or 5xx)
        throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
      } catch (error) {
        if (i === retries - 1) {
          // Last attempt, re-throw the error
          throw error;
        }
        // Wait using exponential backoff: 2^i * 100ms
        const delay = Math.pow(2, i) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    // Should be unreachable
    throw new Error('Safe fetch failed after multiple retries.');
  }

  async uploadFile(file: Express.Multer.File): Promise<HygraphUploadResponse> {
    if (!this.endpoint || !this.token) {
      throw new Error('Hygraph not configured');
    }

    try {
      // Step 1: Create asset entry in Hygraph and request POST upload data.
      const createAssetMutation = `

        mutation CreateAssetEntry($fileName: String!) {
          createAsset(data: { fileName: $fileName }) {
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
                date
                key
                signature
                algorithm
                policy
                credential
                securityToken
              }
              error { code message }
            }
          }
        }
      `;

      const createAssetResponse = await this.safeFetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          query: createAssetMutation,
          variables: {
            fileName: file.originalname,
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
      const s3UploadUrl = postData?.url;

      if (!s3UploadUrl) {
        throw new Error('No upload URL received from Hygraph');
      }

      // Step 2: Upload file using POST with form fields (S3 pre-signed POST)

      const form = new (FormData as any)();
      
      // Map the GraphQL response fields to the required S3 POST form field names.
      const s3Fields = [
        { name: 'X-Amz-Date', value: postData.date },
        { name: 'key', value: postData.key },
        { name: 'X-Amz-Signature', value: postData.signature },
        { name: 'X-Amz-Algorithm', value: postData.algorithm },
        { name: 'policy', value: postData.policy },
        { name: 'X-Amz-Credential', value: postData.credential },
        { name: 'X-Amz-Security-Token', value: postData.securityToken },
      ];

      // Add all S3 form fields
      s3Fields.forEach(field => {
        if (field.value) {
          form.append(field.name, field.value);
        }
      });
      
      // Important: "file" field must be last for S3 upload request
      form.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      } as any);

      const uploadResponse = await this.safeFetch(s3UploadUrl, {
        method: 'POST',
        body: form as any,

      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Hygraph file upload failed:', uploadResponse.status, errorText);
        throw new Error(`Failed to upload file: ${uploadResponse.statusText}. Response body: ${errorText.substring(0, 200)}`);
      }


      console.log(`File uploaded successfully to: ${s3UploadUrl}`);
      
      
      // Step 3: Poll for the final asset details (Wait for Hygraph internal processing to complete)

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


      let assetData = null;
      // *** Aggressively increased retries to 40 for a maximum wait of 200 seconds (3 minutes 20 seconds) ***
      const maxRetries = 40; 
      const delayMs = 5000; 

      for (let i = 0; i < maxRetries; i++) {
        await new Promise(resolve => setTimeout(resolve, delayMs));

        try {
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

          const data = await assetResponse.json() as any;
          const asset = data?.data?.asset;
          
          // An asset is considered fully processed/ready once the final 'url' field is populated.
          if (assetResponse.ok && asset && asset.url) {
            assetData = asset;
            console.log(`Asset successfully processed by Hygraph after ${i + 1} attempts. Stage: ${asset.stage}`);
            break; 
          }
          
          console.log(`Attempt ${i + 1}/${maxRetries}: Asset is processing...`);

        } catch (pollError) {
          console.warn(`Polling attempt ${i + 1} failed: ${pollError}`);
          // Continue loop if polling fails
        }
      }
      
      // Step 4: Publish the Asset (Only if the asset is complete)
      if (assetData) {
          const publishMutation = `
              mutation PublishAsset($id: ID!) {
                  publishAsset(where: { id: $id }) {
                      id
                  }
              }
          `;

          try {
              console.log('Publishing processed asset...');
              // Using basic fetch here to avoid safeFetch's error throwing on 403
              const publishResponse = await fetch(this.endpoint, { 
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${this.token}`,
                  },
                  body: JSON.stringify({
                      query: publishMutation,
                      variables: { id },
                  }),
              });

              if (!publishResponse.ok) {
                  const errorBody = await publishResponse.text();
                  // Log permissions/API errors but don't crash
                  console.warn(`Asset publishing failed (HTTP ${publishResponse.status}). Error: ${errorBody.substring(0, 200)}`);
              } else {
                  console.log('Asset published successfully.');
              }
          } catch (publishError) {
              console.warn(`Caught error during Asset publishing. Error: ${publishError}`);
          }
          
          return { success: true, asset: assetData };
      }


      // If polling fails after all retries, use the initial data as a fallback.
      console.warn('Asset processing and polling failed after max retries. Using initial createAsset data as fallback. This asset will remain in DRAFT.');
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
      // Ensure the error message is extracted if it's an Error object
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
  
  // The rest of the methods
  
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

      const response = await this.safeFetch(this.endpoint, {
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
      // Added 'stage' here as well, although not used in the return type
      const query = `
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

      const response = await this.safeFetch(this.endpoint, {
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
