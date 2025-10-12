import { hygraphClient } from '../config/hygraph';
import { gql } from 'graphql-request';
import { ForumThread, ForumThreadPost } from '../types';

class ForumService {

  async listThreads(page = 1, limit = 20, category?: string): Promise<{ threads: ForumThread[]; total: number; }> {
    try {
      const skip = (page - 1) * limit;
      const whereClause = category ? `where: { category: "${category}" }` : '';

      const query = gql`
        query GetForumThreads($first: Int!, $skip: Int!) {
          forumThreadsConnection(${whereClause}, first: $first, skip: $skip, orderBy: lastActivityAt_DESC) {
            aggregate { count }
            edges {
              node {
                id
                title
                category
                createdBy
                createdByName
                createdAt
                lastActivityAt
                pinned
                tags
              }
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        forumThreadsConnection: {
          edges: { node: ForumThread }[];
          aggregate: { count: number };
        };
      }>(query, { first: limit, skip });

      const threads = response.forumThreadsConnection.edges.map(edge => edge.node);
      const total = response.forumThreadsConnection.aggregate.count;

      return { threads, total };
    } catch (error) {
      console.error('ForumService.listThreads error:', error);
      return { threads: [], total: 0 };
    }
  }

  async listPosts(threadId: string, page = 1, limit = 50): Promise<{ posts: ForumThreadPost[]; total: number; }> {
    try {
      const skip = (page - 1) * limit;

      const query = gql`
        query GetForumPosts($threadId: String!, $first: Int!, $skip: Int!) {
          forumPostsConnection(
            where: { threadId: $threadId }, 
            first: $first, 
            skip: $skip, 
            orderBy: createdAt_ASC
          ) {
            aggregate { count }
            edges {
              node {
                id
                threadId
                body
                createdBy
                createdByName
                createdAt
              }
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        forumPostsConnection: {
          edges: { node: ForumThreadPost }[];
          aggregate: { count: number };
        };
      }>(query, { threadId, first: limit, skip });

      const posts = response.forumPostsConnection.edges.map(edge => edge.node);
      const total = response.forumPostsConnection.aggregate.count;

      return { posts, total };
    } catch (error) {
      console.error('ForumService.listPosts error:', error);
      return { posts: [], total: 0 };
    }
  }

  async createThread(params: { 
    title: string; 
    category: string; 
    createdBy: string; 
    createdByName: string; 
  }): Promise<ForumThread> {
    try {
      const mutation = gql`
        mutation CreateForumThread(
          $title: String!
          $category: String!
          $createdBy: String!
          $createdByName: String!
        ) {
          createForumThread(data: {
            title: $title
            category: $category
            createdBy: $createdBy
            createdByName: $createdByName
            pinned: false
            tags: []
          }) {
            id
            title
            category
            createdBy
            createdByName
            createdAt
            lastActivityAt
            pinned
            tags
          }
        }
      `;

      const response = await hygraphClient.request<{ createForumThread: ForumThread }>(mutation, params);
      return response.createForumThread;
    } catch (error) {
      console.error('Error creating forum thread:', error);
      throw new Error('Forum threads collection not initialized');
    }
  }

  async createPost(params: { 
    threadId: string; 
    body: string; 
    createdBy: string; 
    createdByName: string; 
  }): Promise<ForumThreadPost> {
    try {
      // Create the post
      const createPostMutation = gql`
        mutation CreateForumPost(
          $threadId: String!
          $body: String!
          $createdBy: String!
          $createdByName: String!
        ) {
          createForumPost(data: {
            threadId: $threadId
            body: $body
            createdBy: $createdBy
            createdByName: $createdByName
          }) {
            id
            threadId
            body
            createdBy
            createdByName
            createdAt
          }
        }
      `;

      const postResponse = await hygraphClient.request<{ createForumPost: ForumThreadPost }>(
        createPostMutation, 
        params
      );

      // Update thread's last activity
      const updateThreadMutation = gql`
        mutation UpdateThreadActivity($id: ID!) {
          updateForumThread(where: { id: $id }, data: { lastActivityAt: "${new Date().toISOString()}" }) {
            id
          }
        }
      `;

      await hygraphClient.request(updateThreadMutation, { id: params.threadId });

      return postResponse.createForumPost;
    } catch (error) {
      console.error('Error creating forum post:', error);
      throw new Error('Forum posts or threads collection not initialized');
    }
  }

  async getThreadById(threadId: string): Promise<ForumThread | null> {
    try {
      const query = gql`
        query GetForumThread($id: ID!) {
          forumThread(where: { id: $id }) {
            id
            title
            category
            createdBy
            createdByName
            createdAt
            lastActivityAt
            pinned
            tags
          }
        }
      `;

      const response = await hygraphClient.request<{ forumThread: ForumThread | null }>(query, { id: threadId });
      return response.forumThread;
    } catch (error) {
      console.error('Error getting forum thread:', error);
      throw new Error('Failed to get forum thread');
    }
  }

  async updateThread(threadId: string, updateData: Partial<ForumThread>): Promise<ForumThread> {
    try {
      const mutation = gql`
        mutation UpdateForumThread($id: ID!, $data: ForumThreadUpdateInput!) {
          updateForumThread(where: { id: $id }, data: $data) {
            id
            title
            category
            createdBy
            createdByName
            createdAt
            lastActivityAt
            pinned
            tags
          }
        }
      `;

      // Filter out undefined values
      const data: Record<string, any> = {};
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          data[key] = value;
        }
      });

      const response = await hygraphClient.request<{ updateForumThread: ForumThread }>(mutation, {
        id: threadId,
        data
      });

      return response.updateForumThread;
    } catch (error) {
      console.error('Error updating forum thread:', error);
      throw new Error('Failed to update forum thread');
    }
  }

  async deleteThread(threadId: string): Promise<void> {
    try {
      const mutation = gql`
        mutation DeleteForumThread($id: ID!) {
          deleteForumThread(where: { id: $id }) { id }
        }
      `;

      await hygraphClient.request(mutation, { id: threadId });
    } catch (error) {
      console.error('Error deleting forum thread:', error);
      throw new Error('Failed to delete forum thread');
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      const mutation = gql`
        mutation DeleteForumPost($id: ID!) {
          deleteForumPost(where: { id: $id }) { id }
        }
      `;

      await hygraphClient.request(mutation, { id: postId });
    } catch (error) {
      console.error('Error deleting forum post:', error);
      throw new Error('Failed to delete forum post');
    }
  }
}

export default new ForumService();