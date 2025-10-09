import { GraphQLClient } from 'graphql-request';

// Hygraph configuration for backend
const HYGRAPH_ENDPOINT = process.env.HYGRAPH_ENDPOINT;
const HYGRAPH_TOKEN = process.env.HYGRAPH_TOKEN;

if (!HYGRAPH_ENDPOINT || !HYGRAPH_TOKEN) {
  throw new Error('Missing Hygraph configuration. Please check your environment variables.');
}

// Create GraphQL client for backend
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