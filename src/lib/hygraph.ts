/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Hygraph GraphQL Client
 * Provides a centralized GraphQL client for interacting with Hygraph CMS
 */

const HYGRAPH_ENDPOINT = import.meta.env.VITE_HYGRAPH_ENDPOINT || '';
const HYGRAPH_TOKEN = import.meta.env.VITE_HYGRAPH_TOKEN || '';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

interface QueryOptions {
  variables?: Record<string, any>;
  token?: string;
}

/**
 * Execute a GraphQL query against Hygraph
 */
export async function hygraphQuery<T = any>(
  query: string,
  options: QueryOptions = {}
): Promise<T> {
  const { variables, token } = options;

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
  options: QueryOptions = {}
): Promise<T> {
  // Use mutation token if available (has write permissions)
  const mutationToken = import.meta.env.VITE_HYGRAPH_MUTATION_TOKEN || HYGRAPH_TOKEN;
  
  return hygraphQuery<T>(mutation, {
    ...options,
    token: options.token || mutationToken,
  });
}

/**
 * Batch multiple GraphQL operations
 */
export async function hygraphBatch<T = any>(
  operations: Array<{ query: string; variables?: Record<string, any> }>,
  options: QueryOptions = {}
): Promise<T[]> {
  const { token } = options;

  // Hygraph doesn't support batch operations natively,
  // so we execute them in parallel
  const promises = operations.map((op) =>
    hygraphQuery<T>(op.query, { variables: op.variables, token })
  );

  return Promise.all(promises);
}

/**
 * Upload an asset to Hygraph
 */
export async function uploadAsset(
  file: File,
  options: { token?: string } = {}
): Promise<{ id: string; url: string; fileName: string }> {
  const { token } = options;
  const mutationToken = import.meta.env.VITE_HYGRAPH_MUTATION_TOKEN || HYGRAPH_TOKEN;

  const formData = new FormData();
  formData.append('fileUpload', file);

  const uploadEndpoint = HYGRAPH_ENDPOINT.replace('/graphql', '/upload');

  const response = await fetch(uploadEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token || mutationToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Asset upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
}

/**
 * Helper to build pagination variables
 */
export function buildPaginationVars(page = 1, pageSize = 10) {
  return {
    skip: (page - 1) * pageSize,
    first: pageSize,
  };
}

/**
 * Helper to build filter variables
 */
export function buildFilterVars(filters: Record<string, any>) {
  const where: Record<string, any> = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      where[key] = value;
    }
  });
  
  return where;
}

export default {
  query: hygraphQuery,
  mutation: hygraphMutation,
  batch: hygraphBatch,
  uploadAsset,
  buildPaginationVars,
  buildFilterVars,
};
