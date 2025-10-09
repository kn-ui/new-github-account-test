import { GraphQLClient } from 'graphql-request';

// Hygraph configuration
const HYGRAPH_ENDPOINT = import.meta.env.VITE_HYGRAPH_ENDPOINT;
const HYGRAPH_TOKEN = import.meta.env.VITE_HYGRAPH_TOKEN;

if (!HYGRAPH_ENDPOINT || !HYGRAPH_TOKEN) {
  throw new Error('Missing Hygraph configuration. Please check your environment variables.');
}

// Create GraphQL client
export const hygraphClient = new GraphQLClient(HYGRAPH_ENDPOINT, {
  headers: {
    authorization: `Bearer ${HYGRAPH_TOKEN}`,
  },
});

// Export configuration for use in other files
export const hygraphConfig = {
  endpoint: HYGRAPH_ENDPOINT,
  token: HYGRAPH_TOKEN,
};