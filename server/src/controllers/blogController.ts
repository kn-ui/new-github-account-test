import { Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { hygraphBlogService, BlogFilters } from '../services/hygraphBlogService';
import { hygraphUserService } from '../services/hygraphUserService';
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendPaginatedResponse,
  sendServerError
} from '../utils/response';

export class BlogController {
  // Create a new blog post (authenticated users only)
  async createBlogPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        title, 
        content, 
        excerpt, 
        slug, 
        status, 
        featuredImage, 
        tags, 
        category, 
        isFeatured, 
        allowComments 
      } = req.body;
      const authorId = req.user!.uid;

      // Validate required fields
      if (!title || !content) {
        sendError(res, 'Missing required fields: title, content');
        return;
      }

      // Validate status
      if (status && !['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
        sendError(res, 'Invalid status. Must be DRAFT, PUBLISHED, or ARCHIVED');
        return;
      }

      // Validate tags array
      if (tags && !Array.isArray(tags)) {
        sendError(res, 'Tags must be an array');
        return;
      }

      const postData = {
        title,
        content,
        excerpt,
        slug,
        status: status || 'DRAFT',
        featuredImage,
        tags: tags || [],
        category,
        isFeatured: isFeatured || false,
        allowComments: allowComments !== false, // Default to true
        authorId
      };

      const newPost = await hygraphBlogService.createBlogPost(postData);
      sendCreated(res, 'Blog post created successfully', newPost);
    } catch (error) {
      console.error('Create blog post error:', error);
      sendServerError(res, 'Failed to create blog post');
    }
  }

  // Get all blog posts (admin only)
  async getAllBlogPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const authorId = req.query.authorId as string;
      const category = req.query.category as string;
      const tags = req.query.tags as string;
      const isFeatured = req.query.isFeatured as string;
      const allowComments = req.query.allowComments as string;
      const searchTerm = req.query.search as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;
      const publishedFrom = req.query.publishedFrom as string;
      const publishedTo = req.query.publishedTo as string;

      const skip = (page - 1) * limit;
      const filters: BlogFilters = {};

      if (status) filters.status = status as any;
      if (authorId) filters.authorId = authorId;
      if (category) filters.category = category;
      if (tags) filters.tags = tags.split(',');
      if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true';
      if (allowComments !== undefined) filters.allowComments = allowComments === 'true';
      if (searchTerm) filters.searchTerm = searchTerm;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      if (publishedFrom) filters.publishedFrom = publishedFrom;
      if (publishedTo) filters.publishedTo = publishedTo;

      const posts = await hygraphBlogService.getBlogPosts(limit, skip, filters);
      
      // For now, we'll get all posts to calculate total. In production, implement count query
      const allPosts = await hygraphBlogService.getBlogPosts(1000, 0, filters);
      const total = allPosts.length;

      sendPaginatedResponse(
        res,
        'Blog posts retrieved successfully',
        posts,
        page,
        limit,
        total
      );
    } catch (error) {
      console.error('Get blog posts error:', error);
      sendServerError(res, 'Failed to retrieve blog posts');
    }
  }

  // Get blog post by ID
  async getBlogPostById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;

      const post = await hygraphBlogService.getBlogPostById(postId);
      if (!post) {
        sendNotFound(res, 'Blog post not found');
        return;
      }

      // Increment view count for published posts
      if (post.status === 'PUBLISHED') {
        await hygraphBlogService.incrementBlogPostViews(postId);
      }

      sendSuccess(res, 'Blog post retrieved successfully', post);
    } catch (error) {
      console.error('Get blog post by ID error:', error);
      sendServerError(res, 'Failed to retrieve blog post');
    }
  }

  // Get blog post by slug
  async getBlogPostBySlug(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { slug } = req.params;

      const post = await hygraphBlogService.getBlogPostBySlug(slug);
      if (!post) {
        sendNotFound(res, 'Blog post not found');
        return;
      }

      // Increment view count for published posts
      if (post.status === 'PUBLISHED') {
        await hygraphBlogService.incrementBlogPostViews(post.id);
      }

      sendSuccess(res, 'Blog post retrieved successfully', post);
    } catch (error) {
      console.error('Get blog post by slug error:', error);
      sendServerError(res, 'Failed to retrieve blog post');
    }
  }

  // Update blog post (author/admin only)
  async updateBlogPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const updateData = req.body;
      const userId = req.user!.uid;

      // Get existing post
      const existingPost = await hygraphBlogService.getBlogPostById(postId);
      if (!existingPost) {
        sendNotFound(res, 'Blog post not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingPost.author?.id !== userId) {
        sendError(res, 'You can only update your own blog posts');
        return;
      }

      const updatedPost = await hygraphBlogService.updateBlogPost(postId, updateData);
      sendSuccess(res, 'Blog post updated successfully', updatedPost);
    } catch (error) {
      console.error('Update blog post error:', error);
      sendServerError(res, 'Failed to update blog post');
    }
  }

  // Delete blog post (author/admin only)
  async deleteBlogPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const userId = req.user!.uid;

      // Get existing post
      const existingPost = await hygraphBlogService.getBlogPostById(postId);
      if (!existingPost) {
        sendNotFound(res, 'Blog post not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingPost.author?.id !== userId) {
        sendError(res, 'You can only delete your own blog posts');
        return;
      }

      await hygraphBlogService.deleteBlogPost(postId);
      sendSuccess(res, 'Blog post deleted successfully');
    } catch (error) {
      console.error('Delete blog post error:', error);
      sendServerError(res, 'Failed to delete blog post');
    }
  }

  // ===== PUBLIC ENDPOINTS =====

  // Get published blog posts
  async getPublishedBlogPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;
      const tag = req.query.tag as string;
      const searchTerm = req.query.search as string;

      const skip = (page - 1) * limit;
      const filters: BlogFilters = {
        status: 'PUBLISHED'
      };

      if (category) filters.category = category;
      if (tag) filters.tags = [tag];
      if (searchTerm) filters.searchTerm = searchTerm;

      const posts = await hygraphBlogService.getBlogPosts(limit, skip, filters);
      
      sendPaginatedResponse(
        res,
        'Published blog posts retrieved successfully',
        posts,
        page,
        limit,
        posts.length
      );
    } catch (error) {
      console.error('Get published blog posts error:', error);
      sendServerError(res, 'Failed to retrieve published blog posts');
    }
  }

  // Get featured blog posts
  async getFeaturedBlogPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const posts = await hygraphBlogService.getFeaturedBlogPosts(limit);
      sendSuccess(res, 'Featured blog posts retrieved successfully', posts);
    } catch (error) {
      console.error('Get featured blog posts error:', error);
      sendServerError(res, 'Failed to retrieve featured blog posts');
    }
  }

  // Get recent blog posts
  async getRecentBlogPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const posts = await hygraphBlogService.getRecentBlogPosts(limit);
      sendSuccess(res, 'Recent blog posts retrieved successfully', posts);
    } catch (error) {
      console.error('Get recent blog posts error:', error);
      sendServerError(res, 'Failed to retrieve recent blog posts');
    }
  }

  // Get blog posts by category
  async getBlogPostsByCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const posts = await hygraphBlogService.getBlogPostsByCategory(category, limit);
      sendSuccess(res, 'Blog posts by category retrieved successfully', posts);
    } catch (error) {
      console.error('Get blog posts by category error:', error);
      sendServerError(res, 'Failed to retrieve blog posts by category');
    }
  }

  // Get blog posts by tag
  async getBlogPostsByTag(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { tag } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const posts = await hygraphBlogService.getBlogPostsByTag(tag, limit);
      sendSuccess(res, 'Blog posts by tag retrieved successfully', posts);
    } catch (error) {
      console.error('Get blog posts by tag error:', error);
      sendServerError(res, 'Failed to retrieve blog posts by tag');
    }
  }

  // Search blog posts
  async searchBlogPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { searchTerm } = req.query;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!searchTerm) {
        sendError(res, 'Search term is required');
        return;
      }

      const posts = await hygraphBlogService.searchBlogPosts(searchTerm as string, limit);
      sendSuccess(res, 'Blog posts search results retrieved successfully', posts);
    } catch (error) {
      console.error('Search blog posts error:', error);
      sendServerError(res, 'Failed to search blog posts');
    }
  }

  // ===== BLOG MANAGEMENT =====

  // Publish blog post
  async publishBlogPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const userId = req.user!.uid;

      // Get existing post
      const existingPost = await hygraphBlogService.getBlogPostById(postId);
      if (!existingPost) {
        sendNotFound(res, 'Blog post not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingPost.author?.id !== userId) {
        sendError(res, 'You can only publish your own blog posts');
        return;
      }

      const updatedPost = await hygraphBlogService.publishBlogPost(postId);
      sendSuccess(res, 'Blog post published successfully', updatedPost);
    } catch (error) {
      console.error('Publish blog post error:', error);
      sendServerError(res, 'Failed to publish blog post');
    }
  }

  // Unpublish blog post
  async unpublishBlogPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const userId = req.user!.uid;

      // Get existing post
      const existingPost = await hygraphBlogService.getBlogPostById(postId);
      if (!existingPost) {
        sendNotFound(res, 'Blog post not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingPost.author?.id !== userId) {
        sendError(res, 'You can only unpublish your own blog posts');
        return;
      }

      const updatedPost = await hygraphBlogService.unpublishBlogPost(postId);
      sendSuccess(res, 'Blog post unpublished successfully', updatedPost);
    } catch (error) {
      console.error('Unpublish blog post error:', error);
      sendServerError(res, 'Failed to unpublish blog post');
    }
  }

  // Archive blog post
  async archiveBlogPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const userId = req.user!.uid;

      // Get existing post
      const existingPost = await hygraphBlogService.getBlogPostById(postId);
      if (!existingPost) {
        sendNotFound(res, 'Blog post not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingPost.author?.id !== userId) {
        sendError(res, 'You can only archive your own blog posts');
        return;
      }

      const updatedPost = await hygraphBlogService.archiveBlogPost(postId);
      sendSuccess(res, 'Blog post archived successfully', updatedPost);
    } catch (error) {
      console.error('Archive blog post error:', error);
      sendServerError(res, 'Failed to archive blog post');
    }
  }

  // Toggle featured status
  async toggleFeaturedBlogPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { isFeatured } = req.body;

      const updatedPost = await hygraphBlogService.toggleFeaturedBlogPost(postId, isFeatured);
      sendSuccess(res, `Blog post ${isFeatured ? 'featured' : 'unfeatured'} successfully`, updatedPost);
    } catch (error) {
      console.error('Toggle featured blog post error:', error);
      sendServerError(res, 'Failed to toggle featured status');
    }
  }

  // Toggle comments
  async toggleCommentsBlogPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { allowComments } = req.body;
      const userId = req.user!.uid;

      // Get existing post
      const existingPost = await hygraphBlogService.getBlogPostById(postId);
      if (!existingPost) {
        sendNotFound(res, 'Blog post not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingPost.author?.id !== userId) {
        sendError(res, 'You can only manage comments for your own blog posts');
        return;
      }

      const updatedPost = await hygraphBlogService.toggleCommentsBlogPost(postId, allowComments);
      sendSuccess(res, `Comments ${allowComments ? 'enabled' : 'disabled'} successfully`, updatedPost);
    } catch (error) {
      console.error('Toggle comments blog post error:', error);
      sendServerError(res, 'Failed to toggle comments');
    }
  }

  // Like blog post
  async likeBlogPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;

      const updatedPost = await hygraphBlogService.likeBlogPost(postId);
      sendSuccess(res, 'Blog post liked successfully', updatedPost);
    } catch (error) {
      console.error('Like blog post error:', error);
      sendError(res, error instanceof Error ? error.message : 'Failed to like blog post');
    }
  }

  // Unlike blog post
  async unlikeBlogPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;

      const updatedPost = await hygraphBlogService.unlikeBlogPost(postId);
      sendSuccess(res, 'Blog post unliked successfully', updatedPost);
    } catch (error) {
      console.error('Unlike blog post error:', error);
      sendError(res, error instanceof Error ? error.message : 'Failed to unlike blog post');
    }
  }

  // ===== STATISTICS =====

  // Get blog statistics (admin only)
  async getBlogStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await hygraphBlogService.getBlogStats();
      sendSuccess(res, 'Blog statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get blog stats error:', error);
      sendServerError(res, 'Failed to retrieve blog statistics');
    }
  }

  // Get author's blog statistics
  async getAuthorBlogStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const authorId = req.user!.uid;
      const stats = await hygraphBlogService.getAuthorBlogStats(authorId);
      sendSuccess(res, 'Author blog statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get author blog stats error:', error);
      sendServerError(res, 'Failed to retrieve author blog statistics');
    }
  }
}

export default new BlogController();