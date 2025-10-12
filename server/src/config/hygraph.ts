import { GraphQLClient } from 'graphql-request';

const endpoint = process.env.VITE_HYGRAPH_ENDPOINT || process.env.HYGRAPH_ENDPOINT;
const token = process.env.VITE_HYGRAPH_TOKEN || process.env.HYGRAPH_TOKEN;

if (!endpoint) {
  // eslint-disable-next-line no-console
  console.warn('Hygraph endpoint is not set. Set VITE_HYGRAPH_ENDPOINT or HYGRAPH_ENDPOINT.');
}

export const hygraphClient = new GraphQLClient(endpoint || '', {
  headers: () => ({
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'X-GraphCMS-Stage': 'DRAFT',
  }),
});

export default hygraphClient;
