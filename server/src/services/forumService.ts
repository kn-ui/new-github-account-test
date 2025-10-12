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
                body
                category
                likes
                views
                author { uid displayName }
                createdAt
                lastActivityAt
              }
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        forumThreadsConnection: {
          edges: { node: any }[];
          aggregate: { count: number };
        };
      }>(query, { first: limit, skip });

      const threads: ForumThread[] = response.forumThreadsConnection.edges.map(edge => {
        const thread = edge.node;
        return {
          id: thread.id,
          title: thread.title,
          category: thread.category || 'General',
          createdBy: thread.author?.uid || '',
          createdByName: thread.author?.displayName || 'Unknown User',
          createdAt: new Date(thread.createdAt),
          lastActivityAt: new Date(thread.lastActivityAt),
          pinned: false,
          tags: []
        };
      });
      
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
        query GetForumPosts($threadId: ID!, $first: Int!, $skip: Int!) {
          forumPostsConnection(
            where: { thread: { id: $threadId } }, 
            first: $first, 
            skip: $skip, 
            orderBy: createdAt_ASC
          ) {
            aggregate { count }
            edges {
              node {
                id
                body
                likes
                thread { id }
                author { uid displayName }
                createdAt
              }
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        forumPostsConnection: {
          edges: { node: any }[];
          aggregate: { count: number };
        };
      }>(query, { threadId, first: limit, skip });

      const posts: ForumThreadPost[] = response.forumPostsConnection.edges.map(edge => {
        const post = edge.node;
        return {
          id: post.id,
          threadId: post.thread?.id || threadId,
          body: post.body,
          createdBy: post.author?.uid || '',
          createdByName: post.author?.displayName || 'Unknown User',
          createdAt: new Date(post.createdAt)
        };
      });
      
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
          $body: String!
          $createdBy: String!
        ) {
          createForumThread(data: {
            title: $title
            body: $body
            category: $category
            author: { connect: { uid: $createdBy } }
            likes: 0
            views: 0
            lastActivityAt: "${new Date().toISOString()}"
          }) {
            id
            title
            body
            category
            likes
            views
            author { uid displayName }
            createdAt
            lastActivityAt
          }
        }
      `;

      const response = await hygraphClient.request<{ createForumThread: any }>(mutation, {
        title: params.title,
        category: params.category,
        body: `Started by ${params.createdByName}`,
        createdBy: params.createdBy
      });

      const thread = response.createForumThread;
      return {
        id: thread.id,
        title: thread.title,
        category: thread.category,
        createdBy: thread.author?.uid || params.createdBy,
        createdByName: thread.author?.displayName || params.createdByName,
        createdAt: new Date(thread.createdAt),
        lastActivityAt: new Date(thread.lastActivityAt),
        pinned: false,
        tags: []
      };
    } catch (error) {
      console.error('Error creating forum thread:', error);
      throw new Error('Failed to create forum thread');
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
          $threadId: ID!
          $body: String!
          $createdBy: String!
        ) {
          createForumPost(data: {
            thread: { connect: { id: $threadId } }
            body: $body
            author: { connect: { uid: $createdBy } }
            likes: 0
          }) {
            id
            body
            likes
            thread { id }
            author { uid displayName }
            createdAt
          }
        }
      `;

      const postResponse = await hygraphClient.request<{ createForumPost: any }>(
        createPostMutation, 
        {
          threadId: params.threadId,
          body: params.body,
          createdBy: params.createdBy
        }
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

      const post = postResponse.createForumPost;
      return {
        id: post.id,
        threadId: post.thread?.id || params.threadId,
        body: post.body,
        createdBy: post.author?.uid || params.createdBy,
        createdByName: post.author?.displayName || params.createdByName,
        createdAt: new Date(post.createdAt)
      };
    } catch (error) {
      console.error('Error creating forum post:', error);
      throw new Error('Failed to create forum post');
    }
  }

  async getThreadById(threadId: string): Promise<ForumThread | null> {
    try {
      const query = gql`
        query GetForumThread($id: ID!) {
          forumThread(where: { id: $id }) {
            id
            title
            body
            category
            likes
            views
            author { uid displayName }
            createdAt
            lastActivityAt
          }
        }
      `;

      const response = await hygraphClient.request<{ forumThread: any | null }>(query, { id: threadId });
      
      if (!response.forumThread) return null;

      const thread = response.forumThread;
      return {
        id: thread.id,
        title: thread.title,
        category: thread.category,
        createdBy: thread.author?.uid || '',
        createdByName: thread.author?.displayName || 'Unknown User',
        createdAt: new Date(thread.createdAt),
        lastActivityAt: new Date(thread.lastActivityAt),
        pinned: false,
        tags: []
      };
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
            body
            category
            likes
            views
            author { uid displayName }
            createdAt
            lastActivityAt
          }
        }
      `;

      // Filter out undefined values
      const data: Record<string, any> = {};
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'createdBy' && key !== 'createdByName') {
          data[key] = value;
        }
      });

      const response = await hygraphClient.request<{ updateForumThread: any }>(mutation, {
        id: threadId,
        data
      });

      const thread = response.updateForumThread;
      return {
        id: thread.id,
        title: thread.title,
        category: thread.category,
        createdBy: thread.author?.uid || '',
        createdByName: thread.author?.displayName || 'Unknown User',
        createdAt: new Date(thread.createdAt),
        lastActivityAt: new Date(thread.lastActivityAt),
        pinned: false,
        tags: []
      };
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