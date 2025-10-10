import { hygraphClient } from '../config/hygraph';
import {
  GET_FORUM_THREADS,
  CREATE_FORUM_THREAD,
  GET_FORUM_POSTS,
  CREATE_FORUM_POST
} from '../lib/hygraphOperations';

// Types for Hygraph data
export interface HygraphForumThread {
  id: string;
  title: string;
  body: string;
  category?: string;
  likes: number;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  isActive: boolean;
  dateCreated: string;
  dateUpdated?: string;
  author?: {
    id: string;
    displayName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
  };
  posts?: HygraphForumPost[];
  lastPost?: {
    id: string;
    body: string;
    dateCreated: string;
    author?: {
      id: string;
      displayName: string;
    };
  };
}

export interface HygraphForumPost {
  id: string;
  body: string;
  likes: number;
  dateCreated: string;
  dateUpdated?: string;
  isActive: boolean;
  author?: {
    id: string;
    displayName: string;
    email: string;
  };
  thread?: {
    id: string;
    title: string;
  };
  parentPost?: {
    id: string;
    body: string;
  };
  replies?: HygraphForumPost[];
}

export interface CreateForumThreadData {
  title: string;
  body: string;
  category?: string;
  authorId: string;
  courseId?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  isActive?: boolean;
}

export interface UpdateForumThreadData {
  title?: string;
  body?: string;
  category?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  isActive?: boolean;
  likes?: number;
  views?: number;
}

export interface CreateForumPostData {
  body: string;
  authorId: string;
  threadId: string;
  parentPostId?: string;
  isActive?: boolean;
}

export interface UpdateForumPostData {
  body?: string;
  isActive?: boolean;
  likes?: number;
}

export interface ForumFilters {
  category?: string;
  courseId?: string;
  authorId?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  isActive?: boolean;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Hygraph Forum Service for Backend
export const hygraphForumService = {
  // ===== FORUM THREAD OPERATIONS =====
  
  // Get all forum threads with pagination and filters
  async getForumThreads(
    limit: number = 100, 
    offset: number = 0, 
    filters?: ForumFilters
  ): Promise<HygraphForumThread[]> {
    try {
      // For development, return mock data
      console.log('Using mock forum data for development');
      
      const mockForumThreads: HygraphForumThread[] = [
        {
          id: '1',
          title: 'Welcome to the School Forum!',
          body: 'This is a place for students and teachers to discuss various topics related to our school community.',
          category: 'General',
          likes: 25,
          views: 150,
          isPinned: true,
          isLocked: false,
          isActive: true,
          dateCreated: '2025-01-01T00:00:00Z',
          dateUpdated: '2025-01-01T00:00:00Z',
          author: {
            id: 'admin1',
            displayName: 'School Administration',
            email: 'admin@school.edu'
          }
        },
        {
          id: '2',
          title: 'Mathematics Study Group',
          body: 'Looking for study partners for the upcoming mathematics exam. We meet every Tuesday and Thursday.',
          category: 'Academic',
          likes: 12,
          views: 85,
          isPinned: false,
          isLocked: false,
          isActive: true,
          dateCreated: '2025-01-02T00:00:00Z',
          dateUpdated: '2025-01-02T00:00:00Z',
          author: {
            id: 'student1',
            displayName: 'John Doe',
            email: 'john@school.edu'
          },
          course: {
            id: 'course1',
            title: 'Algebra I'
          }
        },
        {
          id: '3',
          title: 'Science Fair Ideas',
          body: 'Share your innovative science fair project ideas and get feedback from peers and teachers.',
          category: 'Projects',
          likes: 18,
          views: 120,
          isPinned: false,
          isLocked: false,
          isActive: true,
          dateCreated: '2025-01-03T00:00:00Z',
          dateUpdated: '2025-01-03T00:00:00Z',
          author: {
            id: 'teacher1',
            displayName: 'Dr. Smith',
            email: 'smith@school.edu'
          }
        }
      ];

      // Apply filters
      let filteredThreads = mockForumThreads;
      
      if (filters) {
        if (filters.category) {
          filteredThreads = filteredThreads.filter(thread => thread.category === filters.category);
        }
        if (filters.isActive !== undefined) {
          filteredThreads = filteredThreads.filter(thread => thread.isActive === filters.isActive);
        }
        if (filters.isPinned !== undefined) {
          filteredThreads = filteredThreads.filter(thread => thread.isPinned === filters.isPinned);
        }
        if (filters.isLocked !== undefined) {
          filteredThreads = filteredThreads.filter(thread => thread.isLocked === filters.isLocked);
        }
        if (filters.courseId) {
          filteredThreads = filteredThreads.filter(thread => thread.course?.id === filters.courseId);
        }
        if (filters.authorId) {
          filteredThreads = filteredThreads.filter(thread => thread.author?.id === filters.authorId);
        }
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          filteredThreads = filteredThreads.filter(thread => 
            thread.title.toLowerCase().includes(searchLower) ||
            thread.body.toLowerCase().includes(searchLower)
          );
        }
      }

      // Apply pagination
      const startIndex = offset;
      const endIndex = startIndex + limit;
      return filteredThreads.slice(startIndex, endIndex);
    } catch (error) {
      console.error('Error fetching forum threads from Hygraph:', error);
      throw error;
    }
  },

  // Get forum thread by ID
  async getForumThreadById(id: string): Promise<HygraphForumThread | null> {
    try {
      const response = await hygraphClient.request(GET_FORUM_THREADS, {
        first: 1,
        skip: 0,
        where: { id }
      });
      const threads = (response as any).forumThreads || [];
      return threads.length > 0 ? threads[0] : null;
    } catch (error) {
      console.error('Error fetching forum thread by ID from Hygraph:', error);
      throw error;
    }
  },

  // Get forum threads by course
  async getForumThreadsByCourse(courseId: string, limit: number = 100): Promise<HygraphForumThread[]> {
    try {
      const response = await hygraphClient.request(GET_FORUM_THREADS, {
        first: limit,
        skip: 0,
        where: { 
          course: { id: courseId },
          isActive: true
        }
      });
      return (response as any).forumThreads || [];
    } catch (error) {
      console.error('Error fetching forum threads by course from Hygraph:', error);
      throw error;
    }
  },

  // Get forum threads by author
  async getForumThreadsByAuthor(authorId: string, limit: number = 100): Promise<HygraphForumThread[]> {
    try {
      const response = await hygraphClient.request(GET_FORUM_THREADS, {
        first: limit,
        skip: 0,
        where: { author: { id: authorId } }
      });
      return (response as any).forumThreads || [];
    } catch (error) {
      console.error('Error fetching forum threads by author from Hygraph:', error);
      throw error;
    }
  },

  // Get pinned forum threads
  async getPinnedForumThreads(limit: number = 10): Promise<HygraphForumThread[]> {
    try {
      const response = await hygraphClient.request(GET_FORUM_THREADS, {
        first: limit,
        skip: 0,
        where: { 
          isPinned: true,
          isActive: true
        }
      });
      return (response as any).forumThreads || [];
    } catch (error) {
      console.error('Error fetching pinned forum threads from Hygraph:', error);
      throw error;
    }
  },

  // Search forum threads
  async searchForumThreads(searchTerm: string, limit: number = 50): Promise<HygraphForumThread[]> {
    try {
      const response = await hygraphClient.request(GET_FORUM_THREADS, {
        first: limit,
        skip: 0,
        where: {
          isActive: true,
          OR: [
            { title_contains: searchTerm },
            { body_contains: searchTerm }
          ]
        }
      });
      return (response as any).forumThreads || [];
    } catch (error) {
      console.error('Error searching forum threads from Hygraph:', error);
      throw error;
    }
  },

  // Create new forum thread
  async createForumThread(threadData: CreateForumThreadData): Promise<HygraphForumThread> {
    try {
      const now = new Date().toISOString();
      const response = await hygraphClient.request(CREATE_FORUM_THREAD, {
        data: {
          title: threadData.title,
          body: threadData.body,
          category: threadData.category,
          likes: 0,
          views: 0,
          isPinned: threadData.isPinned || false,
          isLocked: threadData.isLocked || false,
          isActive: threadData.isActive !== false, // Default to true
          dateCreated: now,
          author: { connect: { id: threadData.authorId } },
          course: threadData.courseId ? { connect: { id: threadData.courseId } } : undefined
        }
      });
      return (response as any).createForumThread;
    } catch (error) {
      console.error('Error creating forum thread in Hygraph:', error);
      throw error;
    }
  },

  // Update forum thread (simplified - in production, implement proper update)
  async updateForumThread(id: string, threadData: UpdateForumThreadData): Promise<HygraphForumThread> {
    try {
      // For now, we'll just return the existing thread
      // In production, implement proper update using Hygraph's update operations
      const existingThread = await this.getForumThreadById(id);
      if (!existingThread) {
        throw new Error('Forum thread not found');
      }
      
      // Merge the update data with existing thread
      const updatedThread = { ...existingThread, ...threadData };
      return updatedThread as HygraphForumThread;
    } catch (error) {
      console.error('Error updating forum thread in Hygraph:', error);
      throw error;
    }
  },

  // Delete forum thread (simplified - in production, implement proper delete)
  async deleteForumThread(id: string): Promise<boolean> {
    try {
      // For now, we'll just return true
      // In production, implement proper delete using Hygraph's delete operations
      const existingThread = await this.getForumThreadById(id);
      if (!existingThread) {
        throw new Error('Forum thread not found');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting forum thread from Hygraph:', error);
      throw error;
    }
  },

  // ===== FORUM POST OPERATIONS =====

  // Get all forum posts with pagination and filters
  async getForumPosts(
    limit: number = 100, 
    offset: number = 0, 
    filters?: { threadId?: string; authorId?: string; isActive?: boolean }
  ): Promise<HygraphForumPost[]> {
    try {
      const where: any = {};
      
      if (filters) {
        if (filters.threadId) where.thread = { id: filters.threadId };
        if (filters.authorId) where.author = { id: filters.authorId };
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
      }

      const response = await hygraphClient.request(GET_FORUM_POSTS, {
        first: limit,
        skip: offset,
        where
      });
      return (response as any).forumPosts || [];
    } catch (error) {
      console.error('Error fetching forum posts from Hygraph:', error);
      throw error;
    }
  },

  // Get forum post by ID
  async getForumPostById(id: string): Promise<HygraphForumPost | null> {
    try {
      const response = await hygraphClient.request(GET_FORUM_POSTS, {
        first: 1,
        skip: 0,
        where: { id }
      });
      const posts = (response as any).forumPosts || [];
      return posts.length > 0 ? posts[0] : null;
    } catch (error) {
      console.error('Error fetching forum post by ID from Hygraph:', error);
      throw error;
    }
  },

  // Get forum posts by thread
  async getForumPostsByThread(threadId: string, limit: number = 100): Promise<HygraphForumPost[]> {
    try {
      const response = await hygraphClient.request(GET_FORUM_POSTS, {
        first: limit,
        skip: 0,
        where: { 
          thread: { id: threadId },
          isActive: true
        }
      });
      return (response as any).forumPosts || [];
    } catch (error) {
      console.error('Error fetching forum posts by thread from Hygraph:', error);
      throw error;
    }
  },

  // Get forum posts by author
  async getForumPostsByAuthor(authorId: string, limit: number = 100): Promise<HygraphForumPost[]> {
    try {
      const response = await hygraphClient.request(GET_FORUM_POSTS, {
        first: limit,
        skip: 0,
        where: { author: { id: authorId } }
      });
      return (response as any).forumPosts || [];
    } catch (error) {
      console.error('Error fetching forum posts by author from Hygraph:', error);
      throw error;
    }
  },

  // Create new forum post
  async createForumPost(postData: CreateForumPostData): Promise<HygraphForumPost> {
    try {
      const now = new Date().toISOString();
      const response = await hygraphClient.request(CREATE_FORUM_POST, {
        data: {
          body: postData.body,
          likes: 0,
          dateCreated: now,
          isActive: postData.isActive !== false, // Default to true
          author: { connect: { id: postData.authorId } },
          thread: { connect: { id: postData.threadId } },
          parentPost: postData.parentPostId ? { connect: { id: postData.parentPostId } } : undefined
        }
      });
      return (response as any).createForumPost;
    } catch (error) {
      console.error('Error creating forum post in Hygraph:', error);
      throw error;
    }
  },

  // Update forum post (simplified - in production, implement proper update)
  async updateForumPost(id: string, postData: UpdateForumPostData): Promise<HygraphForumPost> {
    try {
      // For now, we'll just return the existing post
      // In production, implement proper update using Hygraph's update operations
      const existingPost = await this.getForumPostById(id);
      if (!existingPost) {
        throw new Error('Forum post not found');
      }
      
      // Merge the update data with existing post
      const updatedPost = { ...existingPost, ...postData };
      return updatedPost as HygraphForumPost;
    } catch (error) {
      console.error('Error updating forum post in Hygraph:', error);
      throw error;
    }
  },

  // Delete forum post (simplified - in production, implement proper delete)
  async deleteForumPost(id: string): Promise<boolean> {
    try {
      // For now, we'll just return true
      // In production, implement proper delete using Hygraph's delete operations
      const existingPost = await this.getForumPostById(id);
      if (!existingPost) {
        throw new Error('Forum post not found');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting forum post from Hygraph:', error);
      throw error;
    }
  },

  // ===== FORUM MANAGEMENT =====

  // Pin/unpin forum thread
  async togglePinForumThread(id: string, isPinned: boolean): Promise<HygraphForumThread> {
    try {
      return await this.updateForumThread(id, { isPinned });
    } catch (error) {
      console.error('Error toggling pin status for forum thread:', error);
      throw error;
    }
  },

  // Lock/unlock forum thread
  async toggleLockForumThread(id: string, isLocked: boolean): Promise<HygraphForumThread> {
    try {
      return await this.updateForumThread(id, { isLocked });
    } catch (error) {
      console.error('Error toggling lock status for forum thread:', error);
      throw error;
    }
  },

  // Activate/deactivate forum thread
  async toggleActiveForumThread(id: string, isActive: boolean): Promise<HygraphForumThread> {
    try {
      return await this.updateForumThread(id, { isActive });
    } catch (error) {
      console.error('Error toggling active status for forum thread:', error);
      throw error;
    }
  },

  // Like forum thread
  async likeForumThread(id: string): Promise<HygraphForumThread> {
    try {
      const thread = await this.getForumThreadById(id);
      if (!thread) {
        throw new Error('Forum thread not found');
      }

      return await this.updateForumThread(id, { likes: thread.likes + 1 });
    } catch (error) {
      console.error('Error liking forum thread:', error);
      throw error;
    }
  },

  // Unlike forum thread
  async unlikeForumThread(id: string): Promise<HygraphForumThread> {
    try {
      const thread = await this.getForumThreadById(id);
      if (!thread) {
        throw new Error('Forum thread not found');
      }

      return await this.updateForumThread(id, { likes: Math.max(0, thread.likes - 1) });
    } catch (error) {
      console.error('Error unliking forum thread:', error);
      throw error;
    }
  },

  // Like forum post
  async likeForumPost(id: string): Promise<HygraphForumPost> {
    try {
      const post = await this.getForumPostById(id);
      if (!post) {
        throw new Error('Forum post not found');
      }

      return await this.updateForumPost(id, { likes: post.likes + 1 });
    } catch (error) {
      console.error('Error liking forum post:', error);
      throw error;
    }
  },

  // Unlike forum post
  async unlikeForumPost(id: string): Promise<HygraphForumPost> {
    try {
      const post = await this.getForumPostById(id);
      if (!post) {
        throw new Error('Forum post not found');
      }

      return await this.updateForumPost(id, { likes: Math.max(0, post.likes - 1) });
    } catch (error) {
      console.error('Error unliking forum post:', error);
      throw error;
    }
  },

  // Increment thread views
  async incrementThreadViews(id: string): Promise<HygraphForumThread> {
    try {
      const thread = await this.getForumThreadById(id);
      if (!thread) {
        throw new Error('Forum thread not found');
      }

      return await this.updateForumThread(id, { views: thread.views + 1 });
    } catch (error) {
      console.error('Error incrementing thread views:', error);
      throw error;
    }
  },

  // ===== STATISTICS =====

  // Get forum statistics
  async getForumStats(): Promise<{
    totalThreads: number;
    activeThreads: number;
    pinnedThreads: number;
    lockedThreads: number;
    totalPosts: number;
    activePosts: number;
    threadsByCategory: { [category: string]: number };
  }> {
    try {
      const [allThreads, activeThreads, pinnedThreads, lockedThreads, allPosts, activePosts] = await Promise.all([
        this.getForumThreads(1000, 0),
        this.getForumThreads(1000, 0, { isActive: true }),
        this.getForumThreads(1000, 0, { isPinned: true }),
        this.getForumThreads(1000, 0, { isLocked: true }),
        this.getForumPosts(1000, 0),
        this.getForumPosts(1000, 0, { isActive: true })
      ]);

      // Calculate threads by category
      const threadsByCategory: { [category: string]: number } = {};
      allThreads.forEach(thread => {
        const category = thread.category || 'General';
        threadsByCategory[category] = (threadsByCategory[category] || 0) + 1;
      });

      return {
        totalThreads: allThreads.length,
        activeThreads: activeThreads.length,
        pinnedThreads: pinnedThreads.length,
        lockedThreads: lockedThreads.length,
        totalPosts: allPosts.length,
        activePosts: activePosts.length,
        threadsByCategory
      };
    } catch (error) {
      console.error('Error calculating forum statistics:', error);
      throw error;
    }
  },

  // Get author's forum statistics
  async getAuthorForumStats(authorId: string): Promise<{
    totalThreads: number;
    activeThreads: number;
    totalPosts: number;
    activePosts: number;
    totalLikes: number;
  }> {
    try {
      const [allThreads, activeThreads, allPosts, activePosts] = await Promise.all([
        this.getForumThreadsByAuthor(authorId, 1000),
        this.getForumThreads(1000, 0, { authorId, isActive: true }),
        this.getForumPostsByAuthor(authorId, 1000),
        this.getForumPosts(1000, 0, { authorId, isActive: true })
      ]);

      const totalLikes = allThreads.reduce((sum, thread) => sum + thread.likes, 0) +
                       allPosts.reduce((sum, post) => sum + post.likes, 0);

      return {
        totalThreads: allThreads.length,
        activeThreads: activeThreads.length,
        totalPosts: allPosts.length,
        activePosts: activePosts.length,
        totalLikes
      };
    } catch (error) {
      console.error('Error calculating author forum statistics:', error);
      throw error;
    }
  },

  // Get course forum statistics
  async getCourseForumStats(courseId: string): Promise<{
    totalThreads: number;
    activeThreads: number;
    totalPosts: number;
    activePosts: number;
    threadsByCategory: { [category: string]: number };
  }> {
    try {
      const [allThreads, activeThreads, allPosts, activePosts] = await Promise.all([
        this.getForumThreadsByCourse(courseId, 1000),
        this.getForumThreads(1000, 0, { courseId, isActive: true }),
        this.getForumPosts(1000, 0, { threadId: courseId }),
        this.getForumPosts(1000, 0, { threadId: courseId, isActive: true })
      ]);

      // Calculate threads by category
      const threadsByCategory: { [category: string]: number } = {};
      allThreads.forEach(thread => {
        const category = thread.category || 'General';
        threadsByCategory[category] = (threadsByCategory[category] || 0) + 1;
      });

      return {
        totalThreads: allThreads.length,
        activeThreads: activeThreads.length,
        totalPosts: allPosts.length,
        activePosts: activePosts.length,
        threadsByCategory
      };
    } catch (error) {
      console.error('Error calculating course forum statistics:', error);
      throw error;
    }
  }
};