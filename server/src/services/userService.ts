/* eslint-disable @typescript-eslint/no-explicit-any */
import { hygraphClient, isHygraphConfigured } from '../config/hygraph';
import { gql } from 'graphql-request';
import { User, UserRole } from '../types';

// Utility function to mask sensitive data in logs
function maskToken(token?: string): string {
  if (!token) return 'MISSING';
  if (token.length < 12) return `${token.slice(0, 3)}... (len:${token.length})`;
  return `${token.slice(0, 6)}...${token.slice(-6)} (len:${token.length})`;
}

// Interface for normalized user data before Hygraph call
interface NormalizedUserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
}

class UserService {
  /**
   * Normalize and validate user data before sending to Hygraph
   * This prevents empty required fields and ensures data consistency
   */
  private normalizeUserForHygraph(userData: Partial<User>): NormalizedUserData {
    const { uid, email = '', displayName = '', role = UserRole.STUDENT, isActive = true } = userData;
    
    if (!uid) {
      throw new Error('UID is required to create a user');
    }

    // Normalize email: trim, lowercase, and handle empty values
    let normalizedEmail = email?.trim().toLowerCase() || '';
    
    // If email is empty or null, create a deterministic fallback
    // This satisfies Hygraph's required & unique constraints
    if (!normalizedEmail) {
      normalizedEmail = `no-email+${uid}@st-raguel.local`;
      console.warn(`Empty email for user ${uid}, using fallback: ${normalizedEmail}`);
    }

    // Validate and normalize role
    let normalizedRole = role;
    if (!Object.values(UserRole).includes(role as UserRole)) {
      console.warn(`Invalid role '${role}' for user ${uid}, defaulting to student`);
      normalizedRole = UserRole.STUDENT;
    }

    // Ensure displayName is not null/undefined
    const normalizedDisplayName = displayName?.trim() || '';

    return {
      uid,
      email: normalizedEmail,
      displayName: normalizedDisplayName,
      role: normalizedRole as UserRole,
      isActive: Boolean(isActive)
    };
  }

  // Create or update user in Hygraph
  async createUser(userData: Partial<User>): Promise<User> {
    try {
      // Normalize and validate user data before processing
      const normalizedData = this.normalizeUserForHygraph(userData);

      // Check if Hygraph is configured
      if (!isHygraphConfigured()) {
        console.warn('Hygraph not configured - returning mock user data');
        // Return a mock user object for development without Hygraph
        return {
          uid: normalizedData.uid,
          email: normalizedData.email,
          displayName: normalizedData.displayName,
          role: normalizedData.role,
          isActive: normalizedData.isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        } as User;
      }

      const mutation = gql`
        mutation UpsertAppUser($uid: String!, $email: String!, $displayName: String!, $role: UserRole!, $isActive: Boolean!) {
          upsertAppUser(
            where: { uid: $uid }
            upsert: {
              create: { 
                uid: $uid, 
                email: $email, 
                displayName: $displayName, 
                role: $role, 
                isActive: $isActive,
                passwordChanged: false
              }
              update: { 
                email: $email, 
                displayName: $displayName, 
                role: $role, 
                isActive: $isActive 
              }
            }
          ) {
            uid
            email
            displayName
            role
            isActive
            passwordChanged
            createdAt
            updatedAt
          }
        }
      `;

      // Use normalized data for Hygraph request
      const resp = await hygraphClient.request<{ upsertAppUser: any }>(mutation, {
        uid: normalizedData.uid,
        email: normalizedData.email,
        displayName: normalizedData.displayName,
        role: normalizedData.role,
        isActive: normalizedData.isActive,
      });
      
      const user = resp.upsertAppUser;
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      } as User;
    } catch (error: any) {
      // Enhanced error handling with proper logging
      const errorMessage = error.message || 'Unknown error';
      const errorDetails = error.response?.errors || error.response?.status || errorMessage;
      
      console.error('Error creating user:', {
        error: errorDetails,
        uid: userData.uid,
        // Don't log full error stack or sensitive data
      });

      // If Hygraph is not configured, return a mock user for development
      if (error instanceof Error && error.message.includes('endpoint')) {
        const normalizedData = this.normalizeUserForHygraph(userData);
        return {
          uid: normalizedData.uid,
          email: normalizedData.email,
          displayName: normalizedData.displayName,
          role: normalizedData.role,
          isActive: normalizedData.isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        } as User;
      }

      // Re-throw with structured error for controller handling
      const structuredError = new Error('Failed to create user');
      (structuredError as any).isValidationError = error.response?.status === 400;
      (structuredError as any).originalError = errorDetails;
      throw structuredError;
    }
  }

  /**
   * Upsert user in Hygraph (create or update)
   * This method is idempotent and safe for retries
   */
  async upsertUser(userData: Partial<User>): Promise<User> {
    try {
      // Normalize and validate user data before processing
      const normalizedData = this.normalizeUserForHygraph(userData);

      // Check if Hygraph is configured
      if (!isHygraphConfigured()) {
        console.warn('Hygraph not configured - returning mock user data');
        return {
          uid: normalizedData.uid,
          email: normalizedData.email,
          displayName: normalizedData.displayName,
          role: normalizedData.role,
          isActive: normalizedData.isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        } as User;
      }

      const mutation = gql`
        mutation UpsertAppUser($uid: String!, $email: String!, $displayName: String!, $role: UserRole!, $isActive: Boolean!) {
          upsertAppUser(
            where: { uid: $uid }
            upsert: {
              create: { 
                uid: $uid, 
                email: $email, 
                displayName: $displayName, 
                role: $role, 
                isActive: $isActive,
                passwordChanged: false
              }
              update: { 
                email: $email, 
                displayName: $displayName, 
                role: $role, 
                isActive: $isActive 
              }
            }
          ) {
            uid
            email
            displayName
            role
            isActive
            passwordChanged
            createdAt
            updatedAt
          }
        }
      `;

      // Use normalized data for Hygraph request
      const resp = await hygraphClient.request<{ upsertAppUser: any }>(mutation, {
        uid: normalizedData.uid,
        email: normalizedData.email,
        displayName: normalizedData.displayName,
        role: normalizedData.role,
        isActive: normalizedData.isActive,
      });
      
      const user = resp.upsertAppUser;
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      } as User;
    } catch (error: any) {
      // Enhanced error handling with proper logging
      const errorMessage = error.message || 'Unknown error';
      const errorDetails = error.response?.errors || error.response?.status || errorMessage;
      
      console.error('Error upserting user:', {
        error: errorDetails,
        uid: userData.uid,
        // Don't log full error stack or sensitive data
      });

      // If Hygraph is not configured, return a mock user for development
      if (error instanceof Error && error.message.includes('endpoint')) {
        const normalizedData = this.normalizeUserForHygraph(userData);
        return {
          uid: normalizedData.uid,
          email: normalizedData.email,
          displayName: normalizedData.displayName,
          role: normalizedData.role,
          isActive: normalizedData.isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        } as User;
      }

      // Re-throw with structured error for controller handling
      const structuredError = new Error('Failed to upsert user');
      (structuredError as any).isValidationError = error.response?.status === 400;
      (structuredError as any).originalError = errorDetails;
      throw structuredError;
    }
  }

  // Get user by UID
  async getUserById(uid: string): Promise<User | null> {
    try {
      const query = gql`
        query GetAppUser($uid: String!) {
          appUser(where: { uid: $uid }) { 
            uid 
            email 
            displayName 
            role 
            isActive 
            passwordChanged
            createdAt
            updatedAt
          }
        }
      `;
      const data = await hygraphClient.request<{ appUser: any | null }>(query, { uid });
      
      if (!data.appUser) return null;

      const user = data.appUser;
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      // If Hygraph is not available, return null - let the auth context handle user creation
      if (error instanceof Error && error.message.includes('endpoint')) {
        console.warn('Hygraph not configured - returning null for user lookup');
        return null;
      }
      throw new Error('Failed to get user');
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const query = gql`
        query GetAppUserByEmail($email: String!) {
          appUsers(where: { email: $email }, first: 1) { 
            uid 
            email 
            displayName 
            role 
            isActive 
            passwordChanged
            createdAt
            updatedAt
          }
        }
      `;
      const data = await hygraphClient.request<{ appUsers: any[] }>(query, { email });
      
      if (!data.appUsers[0]) return null;

      const user = data.appUsers[0];
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      } as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new Error('Failed to get user');
    }
  }

  // Update user
  async updateUser(uid: string, updateData: Partial<User>): Promise<User> {
    try {
      const mutation = gql`
        mutation UpdateAppUser($uid: String!, $data: AppUserUpdateInput!) {
          updateAppUser(where: { uid: $uid }, data: $data) {
            uid email displayName role isActive
          }
        }
      `;
      const data: Record<string, any> = {};
      for (const [k, v] of Object.entries(updateData)) {
        if (v !== undefined && v !== null) data[k] = v;
      }
      const resp = await hygraphClient.request<{ updateAppUser: User }>(mutation, { uid, data });
      return resp.updateAppUser as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  // Update user role (admin only)
  async updateUserRole(uid: string, newRole: UserRole): Promise<User> {
    try {
      const mutation = gql`
        mutation UpdateAppUserRole($uid: String!, $role: UserRole!) {
          updateAppUser(where: { uid: $uid }, data: { role: $role }) { uid email displayName role isActive }
        }
      `;
      const resp = await hygraphClient.request<{ updateAppUser: User }>(mutation, { uid, role: newRole });
      return resp.updateAppUser as User;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  }

  // Get all users with pagination
  async getAllUsers(page: number = 1, limit: number = 10, role?: UserRole): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const filter = role ? `, where: { role: ${role} }` : '';
      const query = gql`
        query ListAppUsers($first: Int!, $skip: Int!) {
          appUsersConnection(first: $first, skip: $skip${filter}) {
            aggregate { count }
            edges { node { uid email displayName role isActive } }
          }
        }
      `;
      const data = await hygraphClient.request<{ appUsersConnection: { edges: { node: User }[]; aggregate: { count: number }}}>(query, { first: limit, skip });
      const list = data.appUsersConnection.edges.map(e => e.node as User);
      const total = data.appUsersConnection.aggregate.count;
      return { users: list, total, page, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to get users');
    }
  }

  // Search users
  async searchUsers(searchTerm: string, page: number = 1, limit: number = 10): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const query = gql`
        query SearchUsers($search: String!, $first: Int!, $skip: Int!) {
          appUsersConnection(
            where: { OR: [ { email_contains: $search }, { displayName_contains: $search } ] },
            first: $first,
            skip: $skip
          ) {
            aggregate { count }
            edges { node { uid email displayName role isActive } }
          }
        }
      `;
      const data = await hygraphClient.request<{ appUsersConnection: { edges: { node: User }[]; aggregate: { count: number }}}>(query, { search: searchTerm, first: limit, skip });
      const users = data.appUsersConnection.edges.map(e => e.node as User);
      const total = data.appUsersConnection.aggregate.count;
      return { users, total, page, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  async deactivateUser(uid: string): Promise<void> {
    try {
      const mutation = gql`
        mutation DeactivateUser($uid: String!) {
          updateAppUser(where: { uid: $uid }, data: { isActive: false }) { uid }
        }
      `;
      await hygraphClient.request(mutation, { uid });
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw new Error('Failed to deactivate user');
    }
  }

  async activateUser(uid: string): Promise<void> {
    try {
      const mutation = gql`
        mutation ActivateUser($uid: String!) {
          updateAppUser(where: { uid: $uid }, data: { isActive: true }) { uid }
        }
      `;
      await hygraphClient.request(mutation, { uid });
    } catch (error) {
      console.error('Error activating user:', error);
      throw new Error('Failed to activate user');
    }
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
  }> {
    try {
      const query = gql`
        query UserStats {
          totalUsers: appUsersConnection { aggregate { count } }
          active: appUsersConnection(where: { isActive: true }) { aggregate { count } }
          students: appUsersConnection(where: { role: student }) { aggregate { count } }
          teachers: appUsersConnection(where: { role: teacher }) { aggregate { count } }
          admins: appUsersConnection(where: { role: admin }) { aggregate { count } }
        }
      `;
      const data = await hygraphClient.request<{ totalUsers: { aggregate: { count: number } }, active: { aggregate: { count: number } }, students: { aggregate: { count: number } }, teachers: { aggregate: { count: number } }, admins: { aggregate: { count: number } } }>(query);
      return {
        totalUsers: data.totalUsers.aggregate.count,
        activeUsers: data.active.aggregate.count,
        totalStudents: data.students.aggregate.count,
        totalTeachers: data.teachers.aggregate.count,
        totalAdmins: data.admins.aggregate.count,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Failed to get user statistics');
    }
  }

  /**
   * Bulk create users
   */
  async bulkCreateUsers(usersData: Array<{
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    isActive?: boolean;
  }>): Promise<{ created: number; errors: string[] }> {
    const results = { created: 0, errors: [] as string[] };

    // Process users in batches to avoid overwhelming Hygraph
    const batchSize = 10;
    for (let i = 0; i < usersData.length; i += batchSize) {
      const batch = usersData.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (userData) => {
          try {
            await this.createUser(userData);
            results.created++;
          } catch (error) {
            results.errors.push(`Failed to create user ${userData.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        })
      );
    }

    return results;
  }

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(updates: Array<{
    uid: string;
    data: Partial<User>;
  }>): Promise<{ updated: number; errors: string[] }> {
    const results = { updated: 0, errors: [] as string[] };

    // Process updates in batches
    const batchSize = 10;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (update) => {
          try {
            await this.updateUser(update.uid, update.data);
            results.updated++;
          } catch (error) {
            results.errors.push(`Failed to update user ${update.uid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        })
      );
    }

    return results;
  }

  /**
   * Bulk delete users (deactivate)
   */
  async bulkDeleteUsers(userIds: string[]): Promise<{ deleted: number; errors: string[] }> {
    const results = { deleted: 0, errors: [] as string[] };

    // Process deletions in batches
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (uid) => {
          try {
            await this.deactivateUser(uid);
            results.deleted++;
          } catch (error) {
            results.errors.push(`Failed to delete user ${uid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        })
      );
    }

    return results;
  }

  /**
   * Bulk activate users
   */
  async bulkActivateUsers(userIds: string[]): Promise<{ activated: number; errors: string[] }> {
    const results = { activated: 0, errors: [] as string[] };

    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (uid) => {
          try {
            await this.activateUser(uid);
            results.activated++;
          } catch (error) {
            results.errors.push(`Failed to activate user ${uid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        })
      );
    }

    return results;
  }
}

export default new UserService();
