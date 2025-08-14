import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import blogService from '../services/blogService';
import eventService from '../services/eventService';
import forumService from '../services/forumService';
import supportService from '../services/supportService';
import { sendPaginatedResponse, sendServerError, sendSuccess, sendCreated, sendError } from '../utils/response';

export class ContentController {
  async listBlog(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.q as string) || undefined;
      const category = (req.query.category as string) || undefined;
      const result = await blogService.getPosts(page, limit, search, category);
      sendPaginatedResponse(res, 'Blog posts retrieved', result.posts, page, limit, result.total);
    } catch (e) {
      sendServerError(res, 'Failed to get blog posts');
    }
  }

  async listEvents(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const type = (req.query.type as string) || undefined;
      const month = (req.query.month as string) || undefined;
      const result = await eventService.getEvents(page, limit, type, month);
      sendPaginatedResponse(res, 'Events retrieved', result.events, page, limit, result.total);
    } catch (e) {
      sendServerError(res, 'Failed to get events');
    }
  }

  async listThreads(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = (req.query.category as string) || undefined;
      const result = await forumService.listThreads(page, limit, category);
      sendPaginatedResponse(res, 'Threads retrieved', result.threads, page, limit, result.total);
    } catch (e) {
      sendServerError(res, 'Failed to get threads');
    }
  }

  async listPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const { threadId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await forumService.listPosts(threadId, page, limit);
      sendPaginatedResponse(res, 'Posts retrieved', result.posts, page, limit, result.total);
    } catch (e) {
      sendServerError(res, 'Failed to get posts');
    }
  }

  async createThread(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, category } = req.body;
      if (!title || !category) return sendError(res, 'Missing fields');
      const createdBy = req.user!.uid;
      const createdByName = req.user!.email || 'User';
      const th = await forumService.createThread({ title, category, createdBy, createdByName });
      sendCreated(res, 'Thread created', th);
    } catch (e) {
      sendServerError(res, 'Failed to create thread');
    }
  }

  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const { threadId } = req.params;
      const { body } = req.body;
      if (!threadId || !body) return sendError(res, 'Missing fields');
      const createdBy = req.user!.uid;
      const createdByName = req.user!.email || 'User';
      const post = await forumService.createPost({ threadId, body, createdBy, createdByName });
      sendCreated(res, 'Post created', post);
    } catch (e) {
      sendServerError(res, 'Failed to create post');
    }
  }

  async createTicket(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !subject || !message) return sendError(res, 'Missing fields');
      const ticket = await supportService.create({ name, email, subject, message, userId: req.user?.uid });
      sendCreated(res, 'Ticket created', ticket);
    } catch (e) {
      sendServerError(res, 'Failed to create ticket');
    }
  }

  async myTickets(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const uid = req.user!.uid;
      const { tickets, total } = await supportService.listByUser(uid, page, limit);
      sendPaginatedResponse(res, 'Tickets retrieved', tickets, page, limit, total);
    } catch (e) {
      sendServerError(res, 'Failed to get tickets');
    }
  }
}

export default new ContentController();
