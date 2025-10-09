import { GraphQLClient } from 'graphql-request';

// Hygraph configuration for backend
const HYGRAPH_ENDPOINT = process.env.HYGRAPH_ENDPOINT;
const HYGRAPH_TOKEN = process.env.HYGRAPH_TOKEN;

if (!HYGRAPH_ENDPOINT || !HYGRAPH_TOKEN) {
  console.warn('⚠️ Missing Hygraph configuration. Some features may not work.');
  console.warn('Please set HYGRAPH_ENDPOINT and HYGRAPH_TOKEN environment variables.');
}

// Create GraphQL client for backend (with fallback for development)
export const hygraphClient = new GraphQLClient(
  HYGRAPH_ENDPOINT || 'https://api-dummy.hygraph.com/v2/dummy/master',
  {
    headers: {
      authorization: `Bearer ${HYGRAPH_TOKEN || 'dummy-token'}`,
    },
  }
);

// Export configuration for use in other files
export const hygraphConfig = {
  endpoint: HYGRAPH_ENDPOINT,
  token: HYGRAPH_TOKEN,
};