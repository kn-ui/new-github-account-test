import { GraphQLClient, gql } from 'graphql-request';

export interface AppUserCreateInput {
  uid: string;
  email: string;
  displayName: string;
  role?: string;
  isActive?: boolean;
  passwordChanged?: boolean;
  deliveryMethod?: string | null;
  deliveryMethodCustom?: string | null;
  studentGroup?: string | null;
  studentGroupCustom?: string | null;
  programType?: string | null;
  programTypeCustom?: string | null;
  roleCustom?: string | null;
}

export interface HygraphCreateUserResponse {
  createAppUser: {
    id: string;
    uid: string;
    email: string;
    displayName: string;
    role: string | null;
    isActive: boolean | null;
  };
}

const endpoint = process.env.HYGRAPH_ENDPOINT;
const token = process.env.HYGRAPH_TOKEN;

export const hygraphClient: GraphQLClient | null = (() => {
  const isProd = (process.env.NODE_ENV || 'development') === 'production';
  if (!endpoint || !token) {
    const msg = 'Hygraph not configured: HYGRAPH_ENDPOINT or HYGRAPH_TOKEN missing';
    if (isProd) {
      throw new Error(msg);
    } else {
      console.warn(`${msg}. Running without Hygraph client in development.`);
      return null;
    }
  }
  return new GraphQLClient(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
})();

// Keep mutation here so model name is easy to switch if needed
const CREATE_APP_USER_MUTATION = gql/* GraphQL */ `
  mutation CreateAppUser($data: AppUserCreateInput!) {
    createAppUser(data: $data) {
      id
      uid
      email
      displayName
      role
      isActive
    }
  }
`;

const GET_APP_USER_BY_UID = gql/* GraphQL */ `
  query GetAppUserByUid($uid: String!) {
    appUsers(where: { uid: $uid }) {
      id
      uid
      email
      displayName
    }
  }
`;

export async function createHygraphUser(payload: AppUserCreateInput): Promise<HygraphCreateUserResponse['createAppUser']> {
  if (!hygraphClient) {
    throw new Error('Hygraph client not initialized. Set HYGRAPH_ENDPOINT and HYGRAPH_TOKEN.');
  }

  try {
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined) data[key] = value;
    }

    const variables = { data };
    const response = await hygraphClient.request<HygraphCreateUserResponse>(CREATE_APP_USER_MUTATION, variables);
    return response.createAppUser;
  } catch (err: any) {
    const error = new Error(`Hygraph createAppUser failed: ${err?.message || 'Unknown error'}`);
    (error as any).cause = err;
    throw error;
  }
}

export async function getHygraphUserByUid(uid: string): Promise<{ id: string; uid: string; email: string; displayName: string } | null> {
  if (!hygraphClient) {
    throw new Error('Hygraph client not initialized. Set HYGRAPH_ENDPOINT and HYGRAPH_TOKEN.');
  }
  const res = await hygraphClient.request<{ appUsers: Array<{ id: string; uid: string; email: string; displayName: string }> }>(GET_APP_USER_BY_UID, { uid });
  return res.appUsers?.[0] || null;
}
