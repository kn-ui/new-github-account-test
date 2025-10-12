/* eslint-disable @typescript-eslint/no-explicit-any */
import { hygraphClient } from '../config/hygraph';
import { gql } from 'graphql-request';
import { User, UserRole } from '../types';

class UserService {
  // Create or update user in Hygraph
  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const { uid, email = '', displayName = 'New User', role = UserRole.STUDENT, isActive = true } = userData;
      if (!uid) throw new Error('UID is required to create a user');

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

      const resp = await hygraphClient.request<{ upsertAppUser: any }>(mutation, {
        uid,
        email,
        displayName,
        role,
        isActive,
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
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
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
}

export default new UserService();
