import { FormDataEncoder } from 'form-data-encoder';
import fetch, { RequestInit, Response } from 'node-fetch';
import { FormData, Blob } from 'formdata-node';
import { Readable } from 'stream';

export interface HygraphAsset {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  stage: string;
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
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout      
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
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

    // Check file size limit (10MB max)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      throw new Error(`File too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file buffer is valid
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('Invalid file buffer');
    }

    // Check for problematic MIME types
    const problematicMimeTypes = ['application/octet-stream', 'text/plain'];
    if (problematicMimeTypes.includes(file.mimetype)) {
      console.warn(`Warning: File has potentially problematic MIME type: ${file.mimetype}`);
    }

    // Add overall timeout for the entire upload process (90 seconds)
    const uploadTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Upload process timed out after 90 seconds')), 90000);
    });

    try {
      return await Promise.race([
        this.doUpload(file),
        uploadTimeout
      ]);
    } catch (error) {
      console.error('Hygraph upload error:', error);
      if (file.size === 34816) {
        console.log('DEBUG 34KB: Upload error details:', error);
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async doUpload(file: Express.Multer.File): Promise<HygraphUploadResponse> {
    // Step 1: Create asset entry in Hygraph and request POST upload data.
    // FIX: Cleaned up leading whitespace to prevent GraphQL parser errors like "unexpected '<Invalid>'"
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
      console.error('Response status:', createAssetResponse.status);
      console.error('Response headers:', createAssetResponse.headers.raw());
      throw new Error(`Failed to create asset: ${createAssetData.errors?.[0]?.message || createAssetResponse.statusText}`);
    }

    const { id, url, upload } = createAssetData.data.createAsset;
    const postData = upload?.requestPostData;
    const s3UploadUrl = postData?.url;

    console.log('Asset creation response:', {
      id,
      url,
      hasUpload: !!upload,
      hasPostData: !!postData,
      hasS3Url: !!s3UploadUrl
    });

    if (!id) {
      throw new Error('No asset ID received from Hygraph');
    }

    if (!s3UploadUrl) {
      throw new Error('No upload URL received from Hygraph');
    }

    console.log(`Asset created with ID: ${id}`);
    console.log(`S3 upload URL: ${s3UploadUrl}`);
    
    // Validate S3 URL format
    if (!s3UploadUrl.startsWith('https://') || !s3UploadUrl.includes('amazonaws.com')) {
      console.warn('S3 upload URL does not look like a valid AWS S3 URL:', s3UploadUrl);
    }

    // Step 2: Upload file using POST with form fields (S3 pre-signed POST)

    const form = new FormData();
    
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
        console.log(`Added form field: ${field.name} = ${field.value.substring(0, 50)}...`);
      } else {
        console.warn(`Skipping empty form field: ${field.name}`);
      }
    });
    
    // Important: "file" field must be last for S3 upload request
    // Create a File-like object from the buffer for formdata-node
    const fileBlob = new Blob([file.buffer], { type: file.mimetype });
    form.append('file', fileBlob, file.originalname);

    console.log(`Form data prepared with ${s3Fields.length} fields and file: ${file.originalname} (${file.size} bytes)`);

    const encoder = new FormDataEncoder(form);

    // Add specific timeout for S3 upload
    const uploadController = new AbortController();
    const uploadTimeout = setTimeout(() => {
      uploadController.abort();
    }, 20000); // 20 second timeout

    const uploadResponse = await fetch(s3UploadUrl, {
      method: 'POST',
      headers: encoder.headers,
      // FIX: Use 'readable' for node-fetch to properly stream the form data body
      body: Readable.from(encoder), 
      signal: uploadController.signal,
    });

    clearTimeout(uploadTimeout);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('S3 file upload failed:', uploadResponse.status, errorText);
      console.error('Upload URL:', s3UploadUrl);
      console.error('File details:', { name: file.originalname, size: file.size, type: file.mimetype });
      throw new Error(`Failed to upload file to S3: ${uploadResponse.status} ${uploadResponse.statusText}. Response: ${errorText.substring(0, 200)}`);
    }

    // Check if the upload was successful by looking at the response
    const uploadResult = await uploadResponse.text();
    console.log(`S3 upload response: ${uploadResult.substring(0, 500)}`);
    
    if (uploadResult.includes('Error') || uploadResult.includes('error')) {
      console.error('S3 upload returned error:', uploadResult);
      throw new Error(`S3 upload failed: ${uploadResult.substring(0, 200)}`);
    }

    // Check for successful upload indicators
    if (uploadResult.includes('<Error>') || uploadResult.includes('<Code>')) {
      console.error('S3 upload returned XML error:', uploadResult);
      throw new Error(`S3 upload failed: ${uploadResult.substring(0, 200)}`);
    }


    console.log(`File uploaded successfully to: ${s3UploadUrl}`);
    console.log(`File details: ${file.originalname}, ${file.size} bytes, ${file.mimetype}`);
    
    // For debugging 34KB file issue
    if (file.size === 34816) { // 34KB in bytes
      console.log('DEBUG: Processing 34KB file - this is the problematic file size');
      console.log('DEBUG: File buffer length:', file.buffer.length);
      console.log('DEBUG: File MIME type:', file.mimetype);
      console.log('DEBUG: File original name:', file.originalname);
      console.log('DEBUG: File buffer first 100 bytes:', file.buffer.slice(0, 100));
    }
    
    // FIX: Cleaned up leading whitespace
    const getAssetQuery = `
query GetAsset($id: ID!) {
  asset(where: { id: $id }, stage: DRAFT) {
    id
    fileName
    url
    mimeType
    size
    stage
    upload {
      status
      error {
        code
        message
      }
    }
  }
}
    `;
    
    // Step 3: Check if asset is immediately available (sometimes happens for small files)
    console.log('Checking if asset is immediately available...');
    try {
      // NOTE: This uses direct fetch, not safeFetch, so it won't be the source of the safeFetch error log.
      const immediateCheckResponse = await fetch(this.endpoint, {
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

      const immediateData = await immediateCheckResponse.json() as any;
      const immediateAsset = immediateData?.data?.asset;
      
      if (immediateAsset && immediateAsset.url && immediateAsset.stage === 'PUBLISHED') {
        console.log('Asset immediately available and published!');
        return { success: true, asset: immediateAsset };
      }
    } catch (immediateError) {
      console.log('Immediate check failed, proceeding with polling...');
    }

    // Step 4: Poll for the final asset details (Wait for Hygraph internal processing to complete)

    let assetData = null;
    const maxRetries = 15; // Reduced retries for faster response
    let delayMs = 200; // Start with a very short delay

    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, delayMs));

      try {
        // This is a direct fetch, not safeFetch, so it won't be the source of the error log.
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
        
        if (!assetResponse.ok || data.errors) {
          console.warn(`Polling attempt ${i + 1} failed: ${data.errors?.[0]?.message || 'Unknown error'}`);
          // Increase delay for next retry
          delayMs *= 1.5;
          continue;
        }

        // Check for processing errors
        if (asset?.upload?.error) {
          console.error(`Asset processing failed: ${asset.upload.error.message}`);
          throw new Error(`Asset processing failed: ${asset.upload.error.message}`);
        }

        // Check upload status
        if (asset?.upload?.status) {
          console.log(`Upload status: ${asset.upload.status}`);
          if (asset.upload.status === 'FAILED') {
            throw new Error('Asset upload failed according to Hygraph status');
          }
        }

        // Asset is ready when it has a URL
        if (asset && asset.url) {
          assetData = asset;
          console.log(`Asset successfully processed by Hygraph after ${i + 1} attempts.`);
          break; 
        }
        
        // Increase delay for next retry
        delayMs *= 1.5;
        
        console.log(`Attempt ${i + 1}/${maxRetries}: Asset is processing...`);

      } catch (pollError) {
        console.warn(`Polling attempt ${i + 1} failed: ${pollError}`);
        // Increase delay for next retry
        delayMs *= 1.5;
      }
    }
    
    // Step 5: Publish the Asset (Only if the asset is complete)
    if (assetData) {
      // FIX: Cleaned up leading whitespace
      const publishMutation = `
mutation PublishAsset($id: ID!) {
  publishAsset(where: { id: $id }, to: PUBLISHED) {
    id
    stage
  }
}
      `;
      try {
        console.log(`Publishing asset ${assetData.id}...`);
        // This uses safeFetch, which is the line referenced in the error log.
        const publishResponse = await this.safeFetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({
            query: publishMutation,
            variables: { id: assetData.id },
          }),
        });
      
        const publishData = await publishResponse.json() as any;
      
        if (publishResponse.ok && !publishData.errors) {
          console.log(`Asset ${assetData.id} published successfully.`);
          // Update the asset stage in the returned data
          assetData.stage = 'PUBLISHED';
        } else {
          // Retry publishing once more before giving up
          console.warn(`First publish attempt failed, retrying...`);
          try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            const retryPublishResponse = await this.safeFetch(this.endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.token}`,
              },
              body: JSON.stringify({
                query: publishMutation,
                variables: { id: assetData.id },
              }),
            });
            
            const retryPublishData = await retryPublishResponse.json() as any;
            
            if (retryPublishResponse.ok && !retryPublishData.errors) {
              console.log(`Asset ${assetData.id} published successfully on retry.`);
              assetData.stage = 'PUBLISHED';
            } else {
              console.warn(`Failed to publish asset ${assetData.id} after retry:`, retryPublishData.errors || 'Unknown error');
            }
          } catch (retryError) {
            console.warn(`Retry publish attempt failed: ${retryError}`);
          }
        }
      } catch (publishError) {
        console.warn(`An error occurred during asset publishing: ${publishError}`);
      }
      // --- FIX END ---
      
      return { success: true, asset: assetData };
    }


    // If polling fails after all retries, try to get the latest asset data
    console.warn('Asset processing and polling failed after max retries. Attempting to get latest asset data...');
    
    try {
      const finalAssetResponse = await fetch(this.endpoint, {
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

      const finalData = await finalAssetResponse.json() as any;
      const finalAsset = finalData?.data?.asset;
      
      if (finalAsset && finalAsset.url) {
        console.log('Using latest asset data as fallback');
        if (file.size === 34816) {
          console.log('DEBUG 34KB: Using fallback asset data:', JSON.stringify(finalAsset, null, 2));
        }
        
        // Try to publish the fallback asset if it's not already published
        if (finalAsset.stage !== 'PUBLISHED') {
          // FIX: Cleaned up leading whitespace
          const publishMutation = `
mutation PublishAsset($id: ID!) {
  publishAsset(where: { id: $id }, to: PUBLISHED) {
    id
    stage
  }
}
          `;
          try {
            console.log(`Publishing fallback asset ${finalAsset.id}...`);
            const publishResponse = await this.safeFetch(this.endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.token}`,
              },
              body: JSON.stringify({
                query: publishMutation,
                variables: { id: finalAsset.id },
              }),
            });
          
            const publishData = await publishResponse.json() as any;
          
            if (publishResponse.ok && !publishData.errors) {
              console.log(`Fallback asset ${finalAsset.id} published successfully.`);
              finalAsset.stage = 'PUBLISHED';
            }
          } catch (publishError) {
            console.warn(`Failed to publish fallback asset: ${publishError}`);
          }
        }
        
        return {
          success: true,
          asset: finalAsset,
        };
      }
    } catch (fallbackError) {
      console.warn('Fallback asset fetch failed:', fallbackError);
    }

    // Last resort: use initial data and try to publish
    console.warn('Using initial createAsset data as final fallback.');
    if (file.size === 34816) {
      console.log('DEBUG 34KB: Using initial asset data as final fallback');
    }
    
    // FIX: Cleaned up leading whitespace
    const publishMutation = `
mutation PublishAsset($id: ID!) {
  publishAsset(where: { id: $id }, to: PUBLISHED) {
    id
    stage
  }
}
    `;
    let stage = 'DRAFT';
    try {
      console.log(`Publishing initial asset ${id}...`);
      const publishResponse = await this.safeFetch(this.endpoint, {
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
    
      const publishData = await publishResponse.json() as any;
    
      if (publishResponse.ok && !publishData.errors) {
        console.log(`Initial asset ${id} published successfully.`);
        stage = 'PUBLISHED';
      }
    } catch (publishError) {
      console.warn(`Failed to publish initial asset: ${publishError}`);
    }
    
    return {
      success: true,
      asset: {
        id,
        fileName: file.originalname,
        url: url,
        mimeType: file.mimetype,
        size: file.size,
        stage,
      },
    };
  }
  
  // The rest of the methods
  
  async deleteAsset(assetId: string): Promise<boolean> {
    if (!this.endpoint || !this.token) {
      throw new Error('Hygraph not configured');
    }

    try {
      // FIX: Cleaned up leading whitespace
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
      // FIX: Cleaned up leading whitespace
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
