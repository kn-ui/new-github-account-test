import { GraphQLClient } from 'graphql-request';

const endpoint = process.env.VITE_HYGRAPH_ENDPOINT || process.env.HYGRAPH_ENDPOINT;
const token = process.env.VITE_HYGRAPH_TOKEN || process.env.HYGRAPH_TOKEN;

if (!endpoint) {
  // eslint-disable-next-line no-console
  console.warn('Hygraph endpoint is not set. Set VITE_HYGRAPH_ENDPOINT or HYGRAPH_ENDPOINT.');
}

// Create a mock client if no endpoint is configured
export const hygraphClient = new GraphQLClient(endpoint || 'https://api.example.com/graphql', {
  headers: () => ({
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'X-GraphCMS-Stage': 'DRAFT',
  }),
});

// Add a method to check if Hygraph is properly configured
export const isHygraphConfigured = () => {
  return !!(endpoint && token);
};

export default hygraphClient;
