import { hygraphClient } from '../config/hygraph';
import {
  GET_BLOG_POSTS,
  CREATE_BLOG_POST,
  UPDATE_BLOG_POST,
  DELETE_BLOG_POST
} from '../lib/hygraphOperations';

// Types for Hygraph data
export interface HygraphBlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featuredImage?: string;
  tags?: string[];
  category?: string;
  likes: number;
  views: number;
  isFeatured: boolean;
  allowComments: boolean;
  publishedAt?: string;
  dateCreated: string;
  dateUpdated?: string;
  author?: {
    id: string;
    displayName: string;
    email: string;
  };
  comments?: {
    id: string;
    content: string;
    author: {
      id: string;
      displayName: string;
    };
    dateCreated: string;
  }[];
}

export interface CreateBlogPostData {
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featuredImage?: string;
  tags?: string[];
  category?: string;
  isFeatured?: boolean;
  allowComments?: boolean;
  authorId: string;
}

export interface UpdateBlogPostData {
  title?: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featuredImage?: string;
  tags?: string[];
  category?: string;
  isFeatured?: boolean;
  allowComments?: boolean;
  publishedAt?: string;
  likes?: number;
  views?: number;
}

export interface BlogFilters {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  authorId?: string;
  category?: string;
  tags?: string[];
  isFeatured?: boolean;
  allowComments?: boolean;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  publishedFrom?: string;
  publishedTo?: string;
}

// Hygraph Blog Service for Backend
export const hygraphBlogService = {
  // ===== BLOG POST OPERATIONS =====
  
  // Get all blog posts with pagination and filters
  async getBlogPosts(
    limit: number = 100, 
    offset: number = 0, 
    filters?: BlogFilters
  ): Promise<HygraphBlogPost[]> {
    try {
      const where: any = {};
      
      if (filters) {
        if (filters.status) where.status = filters.status;
        if (filters.authorId) where.author = { id: filters.authorId };
        if (filters.category) where.category = filters.category;
        if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
        if (filters.allowComments !== undefined) where.allowComments = filters.allowComments;
        
        if (filters.tags && filters.tags.length > 0) {
          where.tags_contains_some = filters.tags;
        }
        
        if (filters.searchTerm) {
          where.OR = [
            { title_contains: filters.searchTerm },
            { content_contains: filters.searchTerm },
            { excerpt_contains: filters.searchTerm }
          ];
        }
        
        if (filters.dateFrom || filters.dateTo) {
          where.dateCreated = {};
          if (filters.dateFrom) where.dateCreated.gte = filters.dateFrom;
          if (filters.dateTo) where.dateCreated.lte = filters.dateTo;
        }
        
        if (filters.publishedFrom || filters.publishedTo) {
          where.publishedAt = {};
          if (filters.publishedFrom) where.publishedAt.gte = filters.publishedFrom;
          if (filters.publishedTo) where.publishedAt.lte = filters.publishedTo;
        }
      }

      const response = await hygraphClient.request(GET_BLOG_POSTS, {
        first: limit,
        skip: offset,
        where
      });
      return (response as any).blogPosts || [];
    } catch (error) {
      console.error('Error fetching blog posts from Hygraph:', error);
      throw error;
    }
  },

  // Get blog post by ID
  async getBlogPostById(id: string): Promise<HygraphBlogPost | null> {
    try {
      const response = await hygraphClient.request(GET_BLOG_POSTS, {
        first: 1,
        skip: 0,
        where: { id }
      });
      const posts = (response as any).blogPosts || [];
      return posts.length > 0 ? posts[0] : null;
    } catch (error) {
      console.error('Error fetching blog post by ID from Hygraph:', error);
      throw error;
    }
  },

  // Get blog post by slug
  async getBlogPostBySlug(slug: string): Promise<HygraphBlogPost | null> {
    try {
      const response = await hygraphClient.request(GET_BLOG_POSTS, {
        first: 1,
        skip: 0,
        where: { slug }
      });
      const posts = (response as any).blogPosts || [];
      return posts.length > 0 ? posts[0] : null;
    } catch (error) {
      console.error('Error fetching blog post by slug from Hygraph:', error);
      throw error;
    }
  },

  // Get published blog posts
  async getPublishedBlogPosts(limit: number = 50): Promise<HygraphBlogPost[]> {
    try {
      const response = await hygraphClient.request(GET_BLOG_POSTS, {
        first: limit,
        skip: 0,
        where: { 
          status: 'PUBLISHED'
        }
      });
      return (response as any).blogPosts || [];
    } catch (error) {
      console.error('Error fetching published blog posts from Hygraph:', error);
      throw error;
    }
  },

  // Get blog posts by author
  async getBlogPostsByAuthor(authorId: string, limit: number = 100): Promise<HygraphBlogPost[]> {
    try {
      const response = await hygraphClient.request(GET_BLOG_POSTS, {
        first: limit,
        skip: 0,
        where: { author: { id: authorId } }
      });
      return (response as any).blogPosts || [];
    } catch (error) {
      console.error('Error fetching blog posts by author from Hygraph:', error);
      throw error;
    }
  },

  // Get blog posts by category
  async getBlogPostsByCategory(category: string, limit: number = 100): Promise<HygraphBlogPost[]> {
    try {
      const response = await hygraphClient.request(GET_BLOG_POSTS, {
        first: limit,
        skip: 0,
        where: { 
          category,
          status: 'PUBLISHED'
        }
      });
      return (response as any).blogPosts || [];
    } catch (error) {
      console.error('Error fetching blog posts by category from Hygraph:', error);
      throw error;
    }
  },

  // Get blog posts by tag
  async getBlogPostsByTag(tag: string, limit: number = 100): Promise<HygraphBlogPost[]> {
    try {
      const response = await hygraphClient.request(GET_BLOG_POSTS, {
        first: limit,
        skip: 0,
        where: { 
          tags_contains: [tag],
          status: 'PUBLISHED'
        }
      });
      return (response as any).blogPosts || [];
    } catch (error) {
      console.error('Error fetching blog posts by tag from Hygraph:', error);
      throw error;
    }
  },

  // Get featured blog posts
  async getFeaturedBlogPosts(limit: number = 10): Promise<HygraphBlogPost[]> {
    try {
      const response = await hygraphClient.request(GET_BLOG_POSTS, {
        first: limit,
        skip: 0,
        where: { 
          isFeatured: true,
          status: 'PUBLISHED'
        }
      });
      return (response as any).blogPosts || [];
    } catch (error) {
      console.error('Error fetching featured blog posts from Hygraph:', error);
      throw error;
    }
  },

  // Get recent blog posts
  async getRecentBlogPosts(limit: number = 20): Promise<HygraphBlogPost[]> {
    try {
      const response = await hygraphClient.request(GET_BLOG_POSTS, {
        first: limit,
        skip: 0,
        where: { 
          status: 'PUBLISHED'
        }
      });
      return (response as any).blogPosts || [];
    } catch (error) {
      console.error('Error fetching recent blog posts from Hygraph:', error);
      throw error;
    }
  },

  // Search blog posts
  async searchBlogPosts(searchTerm: string, limit: number = 50): Promise<HygraphBlogPost[]> {
    try {
      const response = await hygraphClient.request(GET_BLOG_POSTS, {
        first: limit,
        skip: 0,
        where: {
          status: 'PUBLISHED',
          OR: [
            { title_contains: searchTerm },
            { content_contains: searchTerm },
            { excerpt_contains: searchTerm }
          ]
        }
      });
      return (response as any).blogPosts || [];
    } catch (error) {
      console.error('Error searching blog posts from Hygraph:', error);
      throw error;
    }
  },

  // Create new blog post
  async createBlogPost(postData: CreateBlogPostData): Promise<HygraphBlogPost> {
    try {
      const now = new Date().toISOString();
      const slug = postData.slug || this.generateSlug(postData.title);
      
      const response = await hygraphClient.request(CREATE_BLOG_POST, {
        data: {
          title: postData.title,
          content: postData.content,
          excerpt: postData.excerpt,
          slug,
          status: postData.status || 'DRAFT',
          featuredImage: postData.featuredImage,
          tags: postData.tags || [],
          category: postData.category,
          likes: 0,
          views: 0,
          isFeatured: postData.isFeatured || false,
          allowComments: postData.allowComments !== false, // Default to true
          publishedAt: postData.status === 'PUBLISHED' ? now : undefined,
          dateCreated: now,
          author: { connect: { id: postData.authorId } }
        }
      });
      return (response as any).createBlogPost;
    } catch (error) {
      console.error('Error creating blog post in Hygraph:', error);
      throw error;
    }
  },

  // Update blog post
  async updateBlogPost(id: string, postData: UpdateBlogPostData): Promise<HygraphBlogPost> {
    try {
      const updateData: any = { 
        ...postData,
        dateUpdated: new Date().toISOString()
      };

      // If status is being changed to PUBLISHED, set publishedAt
      if (postData.status === 'PUBLISHED') {
        updateData.publishedAt = new Date().toISOString();
      }

      const response = await hygraphClient.request(UPDATE_BLOG_POST, {
        id,
        data: updateData
      });
      return (response as any).updateBlogPost;
    } catch (error) {
      console.error('Error updating blog post in Hygraph:', error);
      throw error;
    }
  },

  // Delete blog post
  async deleteBlogPost(id: string): Promise<boolean> {
    try {
      await hygraphClient.request(DELETE_BLOG_POST, { id });
      return true;
    } catch (error) {
      console.error('Error deleting blog post from Hygraph:', error);
      throw error;
    }
  },

  // ===== BLOG MANAGEMENT =====

  // Publish blog post
  async publishBlogPost(id: string): Promise<HygraphBlogPost> {
    try {
      return await this.updateBlogPost(id, { 
        status: 'PUBLISHED',
        publishedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error publishing blog post:', error);
      throw error;
    }
  },

  // Unpublish blog post (move to draft)
  async unpublishBlogPost(id: string): Promise<HygraphBlogPost> {
    try {
      return await this.updateBlogPost(id, { status: 'DRAFT' });
    } catch (error) {
      console.error('Error unpublishing blog post:', error);
      throw error;
    }
  },

  // Archive blog post
  async archiveBlogPost(id: string): Promise<HygraphBlogPost> {
    try {
      return await this.updateBlogPost(id, { status: 'ARCHIVED' });
    } catch (error) {
      console.error('Error archiving blog post:', error);
      throw error;
    }
  },

  // Toggle featured status
  async toggleFeaturedBlogPost(id: string, isFeatured: boolean): Promise<HygraphBlogPost> {
    try {
      return await this.updateBlogPost(id, { isFeatured });
    } catch (error) {
      console.error('Error toggling featured status for blog post:', error);
      throw error;
    }
  },

  // Toggle comments
  async toggleCommentsBlogPost(id: string, allowComments: boolean): Promise<HygraphBlogPost> {
    try {
      return await this.updateBlogPost(id, { allowComments });
    } catch (error) {
      console.error('Error toggling comments for blog post:', error);
      throw error;
    }
  },

  // Like blog post
  async likeBlogPost(id: string): Promise<HygraphBlogPost> {
    try {
      const post = await this.getBlogPostById(id);
      if (!post) {
        throw new Error('Blog post not found');
      }

      return await this.updateBlogPost(id, { likes: post.likes + 1 });
    } catch (error) {
      console.error('Error liking blog post:', error);
      throw error;
    }
  },

  // Unlike blog post
  async unlikeBlogPost(id: string): Promise<HygraphBlogPost> {
    try {
      const post = await this.getBlogPostById(id);
      if (!post) {
        throw new Error('Blog post not found');
      }

      return await this.updateBlogPost(id, { likes: Math.max(0, post.likes - 1) });
    } catch (error) {
      console.error('Error unliking blog post:', error);
      throw error;
    }
  },

  // Increment blog post views
  async incrementBlogPostViews(id: string): Promise<HygraphBlogPost> {
    try {
      const post = await this.getBlogPostById(id);
      if (!post) {
        throw new Error('Blog post not found');
      }

      return await this.updateBlogPost(id, { views: post.views + 1 });
    } catch (error) {
      console.error('Error incrementing blog post views:', error);
      throw error;
    }
  },

  // ===== UTILITY FUNCTIONS =====

  // Generate URL-friendly slug from title
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  },

  // ===== STATISTICS =====

  // Get blog statistics
  async getBlogStats(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    archivedPosts: number;
    featuredPosts: number;
    totalLikes: number;
    totalViews: number;
    postsByCategory: { [category: string]: number };
    postsByTag: { [tag: string]: number };
  }> {
    try {
      const [allPosts, publishedPosts, draftPosts, archivedPosts, featuredPosts] = await Promise.all([
        this.getBlogPosts(1000, 0),
        this.getBlogPosts(1000, 0, { status: 'PUBLISHED' }),
        this.getBlogPosts(1000, 0, { status: 'DRAFT' }),
        this.getBlogPosts(1000, 0, { status: 'ARCHIVED' }),
        this.getBlogPosts(1000, 0, { isFeatured: true })
      ]);

      const totalLikes = allPosts.reduce((sum, post) => sum + post.likes, 0);
      const totalViews = allPosts.reduce((sum, post) => sum + post.views, 0);

      // Calculate posts by category
      const postsByCategory: { [category: string]: number } = {};
      allPosts.forEach(post => {
        const category = post.category || 'Uncategorized';
        postsByCategory[category] = (postsByCategory[category] || 0) + 1;
      });

      // Calculate posts by tag
      const postsByTag: { [tag: string]: number } = {};
      allPosts.forEach(post => {
        if (post.tags) {
          post.tags.forEach(tag => {
            postsByTag[tag] = (postsByTag[tag] || 0) + 1;
          });
        }
      });

      return {
        totalPosts: allPosts.length,
        publishedPosts: publishedPosts.length,
        draftPosts: draftPosts.length,
        archivedPosts: archivedPosts.length,
        featuredPosts: featuredPosts.length,
        totalLikes,
        totalViews,
        postsByCategory,
        postsByTag
      };
    } catch (error) {
      console.error('Error calculating blog statistics:', error);
      throw error;
    }
  },

  // Get author's blog statistics
  async getAuthorBlogStats(authorId: string): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalLikes: number;
    totalViews: number;
    postsByCategory: { [category: string]: number };
  }> {
    try {
      const [allPosts, publishedPosts, draftPosts] = await Promise.all([
        this.getBlogPostsByAuthor(authorId, 1000),
        this.getBlogPosts(1000, 0, { authorId, status: 'PUBLISHED' }),
        this.getBlogPosts(1000, 0, { authorId, status: 'DRAFT' })
      ]);

      const totalLikes = allPosts.reduce((sum, post) => sum + post.likes, 0);
      const totalViews = allPosts.reduce((sum, post) => sum + post.views, 0);

      // Calculate posts by category
      const postsByCategory: { [category: string]: number } = {};
      allPosts.forEach(post => {
        const category = post.category || 'Uncategorized';
        postsByCategory[category] = (postsByCategory[category] || 0) + 1;
      });

      return {
        totalPosts: allPosts.length,
        publishedPosts: publishedPosts.length,
        draftPosts: draftPosts.length,
        totalLikes,
        totalViews,
        postsByCategory
      };
    } catch (error) {
      console.error('Error calculating author blog statistics:', error);
      throw error;
    }
  }
};