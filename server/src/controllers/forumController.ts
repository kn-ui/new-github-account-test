import { Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { hygraphForumService, ForumFilters } from '../services/hygraphForumService';
import { hygraphUserService } from '../services/hygraphUserService';
import { hygraphCourseService } from '../services/hygraphCourseService';
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendPaginatedResponse,
  sendServerError
} from '../utils/response';

export class ForumController {
  // ===== FORUM THREAD OPERATIONS =====

  // Create a new forum thread (authenticated users only)
  async createForumThread(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        title, 
        body, 
        category, 
        courseId, 
        isPinned, 
        isLocked, 
        isActive 
      } = req.body;
      const authorHygraphId = req.user!.hygraphId;

      // Validate required fields
      if (!title || !body) {
        sendError(res, 'Missing required fields: title, body');
        return;
      }

      // Verify course exists if provided
      if (courseId) {
        const course = await hygraphCourseService.getCourseById(courseId);
        if (!course) {
          sendNotFound(res, 'Course not found');
          return;
        }

        // Check permissions for course-specific threads
        if (req.user!.role !== UserRole.ADMIN && course.instructor?.id !== authorHygraphId) {
          // Check if user is enrolled in the course
          const enrollments = await hygraphCourseService.getCourseEnrollments(courseId);
          const isEnrolled = enrollments.some(e => e.student?.id === authorHygraphId);
          
          if (!isEnrolled) {
            sendError(res, 'You can only create threads for courses you are enrolled in or teaching');
            return;
          }
        }
      }

      const threadData = {
        title,
        body,
        category,
        authorId: authorHygraphId || (await hygraphUserService.getUserByUid(req.user!.uid))?.id || req.user!.uid,
        courseId,
        isPinned: isPinned || false,
        isLocked: isLocked || false,
        isActive: isActive !== false // Default to true
      };

      const newThread = await hygraphForumService.createForumThread(threadData);
      sendCreated(res, 'Forum thread created successfully', newThread);
    } catch (error) {
      console.error('Create forum thread error:', error);
      sendServerError(res, 'Failed to create forum thread');
    }
  }

  // Get all forum threads (admin only)
  async getAllForumThreads(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;
      const courseId = req.query.courseId as string;
      const authorId = req.query.authorId as string;
      const isPinned = req.query.isPinned as string;
      const isLocked = req.query.isLocked as string;
      const isActive = req.query.isActive as string;
      const searchTerm = req.query.search as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      const skip = (page - 1) * limit;
      const filters: ForumFilters = {};

      if (category) filters.category = category;
      if (courseId) filters.courseId = courseId;
      if (authorId) filters.authorId = authorId;
      if (isPinned !== undefined) filters.isPinned = isPinned === 'true';
      if (isLocked !== undefined) filters.isLocked = isLocked === 'true';
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (searchTerm) filters.searchTerm = searchTerm;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const threads = await hygraphForumService.getForumThreads(limit, skip, filters);
      
      // For now, we'll get all threads to calculate total. In production, implement count query
      const allThreads = await hygraphForumService.getForumThreads(1000, 0, filters);
      const total = allThreads.length;

      sendPaginatedResponse(
        res,
        'Forum threads retrieved successfully',
        threads,
        page,
        limit,
        total
      );
    } catch (error) {
      console.error('Get forum threads error:', error);
      sendServerError(res, 'Failed to retrieve forum threads');
    }
  }

  // Get forum thread by ID
  async getForumThreadById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;

      const thread = await hygraphForumService.getForumThreadById(threadId);
      if (!thread) {
        sendNotFound(res, 'Forum thread not found');
        return;
      }

      // Increment view count
      await hygraphForumService.incrementThreadViews(threadId);

      sendSuccess(res, 'Forum thread retrieved successfully', thread);
    } catch (error) {
      console.error('Get forum thread by ID error:', error);
      sendServerError(res, 'Failed to retrieve forum thread');
    }
  }

  // Update forum thread (author/admin only)
  async updateForumThread(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;
      const updateData = req.body;
      const userHygraphId = req.user!.hygraphId;

      // Get existing thread
      const existingThread = await hygraphForumService.getForumThreadById(threadId);
      if (!existingThread) {
        sendNotFound(res, 'Forum thread not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingThread.author?.id !== userHygraphId) {
        sendError(res, 'You can only update your own forum threads');
        return;
      }

      const updatedThread = await hygraphForumService.updateForumThread(threadId, updateData);
      sendSuccess(res, 'Forum thread updated successfully', updatedThread);
    } catch (error) {
      console.error('Update forum thread error:', error);
      sendServerError(res, 'Failed to update forum thread');
    }
  }

  // Delete forum thread (author/admin only)
  async deleteForumThread(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;
      const userHygraphId = req.user!.hygraphId;

      // Get existing thread
      const existingThread = await hygraphForumService.getForumThreadById(threadId);
      if (!existingThread) {
        sendNotFound(res, 'Forum thread not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingThread.author?.id !== userHygraphId) {
        sendError(res, 'You can only delete your own forum threads');
        return;
      }

      await hygraphForumService.deleteForumThread(threadId);
      sendSuccess(res, 'Forum thread deleted successfully');
    } catch (error) {
      console.error('Delete forum thread error:', error);
      sendServerError(res, 'Failed to delete forum thread');
    }
  }

  // ===== PUBLIC FORUM ENDPOINTS =====

  // Get public forum threads
  async getPublicForumThreads(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;
      const searchTerm = req.query.search as string;

      const skip = (page - 1) * limit;
      const filters: ForumFilters = {
        isActive: true
      };

      if (category) filters.category = category;
      if (searchTerm) filters.searchTerm = searchTerm;

      const threads = await hygraphForumService.getForumThreads(limit, skip, filters);
      
      sendPaginatedResponse(
        res,
        'Public forum threads retrieved successfully',
        threads,
        page,
        limit,
        threads.length
      );
    } catch (error) {
      console.error('Get public forum threads error:', error);
      sendServerError(res, 'Failed to retrieve public forum threads');
    }
  }

  // Get pinned forum threads
  async getPinnedForumThreads(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const threads = await hygraphForumService.getPinnedForumThreads(10);
      sendSuccess(res, 'Pinned forum threads retrieved successfully', threads);
    } catch (error) {
      console.error('Get pinned forum threads error:', error);
      sendServerError(res, 'Failed to retrieve pinned forum threads');
    }
  }

  // Search forum threads
  async searchForumThreads(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { searchTerm } = req.query;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!searchTerm) {
        sendError(res, 'Search term is required');
        return;
      }

      const threads = await hygraphForumService.searchForumThreads(searchTerm as string, limit);
      sendSuccess(res, 'Forum threads search results retrieved successfully', threads);
    } catch (error) {
      console.error('Search forum threads error:', error);
      sendServerError(res, 'Failed to search forum threads');
    }
  }

  // ===== COURSE FORUM THREADS =====

  // Get forum threads by course
  async getCourseForumThreads(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Verify course exists and user has access
      const course = await hygraphCourseService.getCourseById(courseId);
      if (!course) {
        sendNotFound(res, 'Course not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && course.instructor?.id !== req.user!.hygraphId) {
        // Check if user is enrolled in the course
        const enrollments = await hygraphCourseService.getCourseEnrollments(courseId);
        const isEnrolled = enrollments.some(e => e.student?.id === req.user!.hygraphId);
        
        if (!isEnrolled) {
          sendError(res, 'You can only view forum threads for courses you are enrolled in or teaching');
          return;
        }
      }

      const threads = await hygraphForumService.getForumThreadsByCourse(courseId, limit);
      
      sendPaginatedResponse(
        res,
        'Course forum threads retrieved successfully',
        threads,
        page,
        limit,
        threads.length
      );
    } catch (error) {
      console.error('Get course forum threads error:', error);
      sendServerError(res, 'Failed to retrieve course forum threads');
    }
  }

  // ===== FORUM THREAD MANAGEMENT =====

  // Pin/unpin forum thread (admin only)
  async togglePinForumThread(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;
      const { isPinned } = req.body;

      const updatedThread = await hygraphForumService.togglePinForumThread(threadId, isPinned);
      sendSuccess(res, `Forum thread ${isPinned ? 'pinned' : 'unpinned'} successfully`, updatedThread);
    } catch (error) {
      console.error('Toggle pin forum thread error:', error);
      sendServerError(res, 'Failed to toggle pin status');
    }
  }

  // Lock/unlock forum thread (admin only)
  async toggleLockForumThread(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;
      const { isLocked } = req.body;

      const updatedThread = await hygraphForumService.toggleLockForumThread(threadId, isLocked);
      sendSuccess(res, `Forum thread ${isLocked ? 'locked' : 'unlocked'} successfully`, updatedThread);
    } catch (error) {
      console.error('Toggle lock forum thread error:', error);
      sendServerError(res, 'Failed to toggle lock status');
    }
  }

  // Activate/deactivate forum thread (admin only)
  async toggleActiveForumThread(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;
      const { isActive } = req.body;

      const updatedThread = await hygraphForumService.toggleActiveForumThread(threadId, isActive);
      sendSuccess(res, `Forum thread ${isActive ? 'activated' : 'deactivated'} successfully`, updatedThread);
    } catch (error) {
      console.error('Toggle active forum thread error:', error);
      sendServerError(res, 'Failed to toggle active status');
    }
  }

  // Like forum thread
  async likeForumThread(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;

      const updatedThread = await hygraphForumService.likeForumThread(threadId);
      sendSuccess(res, 'Forum thread liked successfully', updatedThread);
    } catch (error) {
      console.error('Like forum thread error:', error);
      sendError(res, error instanceof Error ? error.message : 'Failed to like forum thread');
    }
  }

  // Unlike forum thread
  async unlikeForumThread(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;

      const updatedThread = await hygraphForumService.unlikeForumThread(threadId);
      sendSuccess(res, 'Forum thread unliked successfully', updatedThread);
    } catch (error) {
      console.error('Unlike forum thread error:', error);
      sendError(res, error instanceof Error ? error.message : 'Failed to unlike forum thread');
    }
  }

  // ===== FORUM POST OPERATIONS =====

  // Create a new forum post (authenticated users only)
  async createForumPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        body, 
        threadId, 
        parentPostId 
      } = req.body;
      const authorId = req.user!.uid;

      // Validate required fields
      if (!body || !threadId) {
        sendError(res, 'Missing required fields: body, threadId');
        return;
      }

      // Verify thread exists
      const thread = await hygraphForumService.getForumThreadById(threadId);
      if (!thread) {
        sendNotFound(res, 'Forum thread not found');
        return;
      }

      // Check if thread is locked
      if (thread.isLocked && req.user!.role !== UserRole.ADMIN) {
        sendError(res, 'Cannot post in locked thread');
        return;
      }

      // Verify parent post exists if provided
      if (parentPostId) {
        const parentPost = await hygraphForumService.getForumPostById(parentPostId);
        if (!parentPost) {
          sendNotFound(res, 'Parent post not found');
          return;
        }
      }

      const postData = {
        body,
        authorId,
        threadId,
        parentPostId,
        isActive: true
      };

      const newPost = await hygraphForumService.createForumPost(postData);
      sendCreated(res, 'Forum post created successfully', newPost);
    } catch (error) {
      console.error('Create forum post error:', error);
      sendServerError(res, 'Failed to create forum post');
    }
  }

  // Get forum posts by thread
  async getForumPostsByThread(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Verify thread exists
      const thread = await hygraphForumService.getForumThreadById(threadId);
      if (!thread) {
        sendNotFound(res, 'Forum thread not found');
        return;
      }

      const posts = await hygraphForumService.getForumPostsByThread(threadId, limit);
      
      sendPaginatedResponse(
        res,
        'Forum posts retrieved successfully',
        posts,
        page,
        limit,
        posts.length
      );
    } catch (error) {
      console.error('Get forum posts by thread error:', error);
      sendServerError(res, 'Failed to retrieve forum posts');
    }
  }

  // Get forum post by ID
  async getForumPostById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;

      const post = await hygraphForumService.getForumPostById(postId);
      if (!post) {
        sendNotFound(res, 'Forum post not found');
        return;
      }

      sendSuccess(res, 'Forum post retrieved successfully', post);
    } catch (error) {
      console.error('Get forum post by ID error:', error);
      sendServerError(res, 'Failed to retrieve forum post');
    }
  }

  // Update forum post (author/admin only)
  async updateForumPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const updateData = req.body;
      const userHygraphId = req.user!.hygraphId;

      // Get existing post
      const existingPost = await hygraphForumService.getForumPostById(postId);
      if (!existingPost) {
        sendNotFound(res, 'Forum post not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingPost.author?.id !== userHygraphId) {
        sendError(res, 'You can only update your own forum posts');
        return;
      }

      const updatedPost = await hygraphForumService.updateForumPost(postId, updateData);
      sendSuccess(res, 'Forum post updated successfully', updatedPost);
    } catch (error) {
      console.error('Update forum post error:', error);
      sendServerError(res, 'Failed to update forum post');
    }
  }

  // Delete forum post (author/admin only)
  async deleteForumPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const userHygraphId = req.user!.hygraphId;

      // Get existing post
      const existingPost = await hygraphForumService.getForumPostById(postId);
      if (!existingPost) {
        sendNotFound(res, 'Forum post not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingPost.author?.id !== userHygraphId) {
        sendError(res, 'You can only delete your own forum posts');
        return;
      }

      await hygraphForumService.deleteForumPost(postId);
      sendSuccess(res, 'Forum post deleted successfully');
    } catch (error) {
      console.error('Delete forum post error:', error);
      sendServerError(res, 'Failed to delete forum post');
    }
  }

  // Like forum post
  async likeForumPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;

      const updatedPost = await hygraphForumService.likeForumPost(postId);
      sendSuccess(res, 'Forum post liked successfully', updatedPost);
    } catch (error) {
      console.error('Like forum post error:', error);
      sendError(res, error instanceof Error ? error.message : 'Failed to like forum post');
    }
  }

  // Unlike forum post
  async unlikeForumPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;

      const updatedPost = await hygraphForumService.unlikeForumPost(postId);
      sendSuccess(res, 'Forum post unliked successfully', updatedPost);
    } catch (error) {
      console.error('Unlike forum post error:', error);
      sendError(res, error instanceof Error ? error.message : 'Failed to unlike forum post');
    }
  }

  // ===== STATISTICS =====

  // Get forum statistics (admin only)
  async getForumStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await hygraphForumService.getForumStats();
      sendSuccess(res, 'Forum statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get forum stats error:', error);
      sendServerError(res, 'Failed to retrieve forum statistics');
    }
  }

  // Get author's forum statistics
  async getAuthorForumStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const authorId = req.user!.uid;
      const stats = await hygraphForumService.getAuthorForumStats(authorId);
      sendSuccess(res, 'Author forum statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get author forum stats error:', error);
      sendServerError(res, 'Failed to retrieve author forum statistics');
    }
  }

  // Get course forum statistics
  async getCourseForumStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      // Verify course exists and user has access
      const course = await hygraphCourseService.getCourseById(courseId);
      if (!course) {
        sendNotFound(res, 'Course not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && course.instructor?.uid !== req.user!.uid) {
        sendError(res, 'You can only view statistics for your own courses');
        return;
      }

      const stats = await hygraphForumService.getCourseForumStats(courseId);
      sendSuccess(res, 'Course forum statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get course forum stats error:', error);
      sendServerError(res, 'Failed to retrieve course forum statistics');
    }
  }
}

export default new ForumController();