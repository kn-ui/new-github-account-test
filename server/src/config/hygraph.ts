/**
 * Hygraph Configuration for Backend
 */

import fetch from 'node-fetch';

const HYGRAPH_ENDPOINT = process.env.HYGRAPH_ENDPOINT || '';
const HYGRAPH_TOKEN = process.env.HYGRAPH_TOKEN || '';
const HYGRAPH_MUTATION_TOKEN = process.env.HYGRAPH_MUTATION_TOKEN || '';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

/**
 * Execute a GraphQL query against Hygraph
 */
export async function hygraphQuery<T = any>(
  query: string,
  variables?: Record<string, any>,
  token?: string
): Promise<T> {
  const response = await fetch(HYGRAPH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || HYGRAPH_TOKEN}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Hygraph request failed: ${response.statusText}`);
  }

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors) {
    console.error('GraphQL Errors:', result.errors);
    throw new Error(result.errors[0]?.message || 'GraphQL request failed');
  }

  if (!result.data) {
    throw new Error('No data returned from GraphQL query');
  }

  return result.data;
}

/**
 * Execute a GraphQL mutation against Hygraph
 */
export async function hygraphMutation<T = any>(
  mutation: string,
  variables?: Record<string, any>,
  token?: string
): Promise<T> {
  return hygraphQuery<T>(mutation, variables, token || HYGRAPH_MUTATION_TOKEN);
}

/**
 * Upload an asset to Hygraph
 */
export async function uploadAsset(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  token?: string
): Promise<{ id: string; url: string; fileName: string }> {
  const FormData = (await import('form-data')).default;
  const formData = new FormData();
  formData.append('fileUpload', fileBuffer, {
    filename: fileName,
    contentType: mimeType,
  });

  const uploadEndpoint = HYGRAPH_ENDPOINT.replace('/graphql', '/upload');

  const response = await fetch(uploadEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token || HYGRAPH_MUTATION_TOKEN}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Asset upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
}

export default {
  query: hygraphQuery,
  mutation: hygraphMutation,
  uploadAsset,
};
