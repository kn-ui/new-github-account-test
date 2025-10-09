import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { hygraphBlogService } from '../services/hygraphBlogService';
import { hygraphEventService } from '../services/hygraphEventService';
import { hygraphForumService } from '../services/hygraphForumService';
import { sendPaginatedResponse, sendServerError, sendSuccess, sendCreated, sendError } from '../utils/response';
import nodemailer from 'nodemailer';

export class ContentController {
  async listBlog(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.q as string) || undefined;
      const category = (req.query.category as string) || undefined;
      
      const skip = (page - 1) * limit;
      const filters = {
        status: 'PUBLISHED' as const,
        ...(category && { category }),
        ...(search && { search })
      };
      
      const posts = await hygraphBlogService.getBlogPosts(limit, skip, filters);
      sendPaginatedResponse(res, 'Blog posts retrieved', posts, page, limit, posts.length);
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
      
      const skip = (page - 1) * limit;
      const filters = {
        ...(type && { type }),
        ...(month && { dateFrom: `${month}-01`, dateTo: `${month}-31` })
      };
      
      const events = await hygraphEventService.getEvents(limit, skip, filters);
      sendPaginatedResponse(res, 'Events retrieved', events, page, limit, events.length);
    } catch (e) {
      sendServerError(res, 'Failed to get events');
    }
  }

  async listThreads(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = (req.query.category as string) || undefined;
      
      const skip = (page - 1) * limit;
      const filters = {
        ...(category && { category })
      };
      
      const threads = await hygraphForumService.getForumThreads(limit, skip, filters);
      sendPaginatedResponse(res, 'Threads retrieved', threads, page, limit, threads.length);
    } catch (e) {
      sendServerError(res, 'Failed to get threads');
    }
  }

  async listPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const { threadId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const posts = await hygraphForumService.getForumPostsByThread(threadId, limit);
      sendPaginatedResponse(res, 'Posts retrieved', posts, page, limit, posts.length);
    } catch (e) {
      sendServerError(res, 'Failed to get posts');
    }
  }

  async createThread(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, category, content } = req.body;
      if (!title || !category || !content) return sendError(res, 'Missing fields');
      const createdBy = req.user!.uid;
      const createdByName = req.user!.email || 'User';
      
      const threadData = {
        title,
        body: content,
        category,
        authorId: createdBy
      };
      
      const th = await hygraphForumService.createForumThread(threadData);
      sendCreated(res, 'Thread created', th);
    } catch (e) {
      sendServerError(res, 'Failed to create thread');
    }
  }

  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const { threadId } = req.params;
      const { content } = req.body;
      if (!threadId || !content) return sendError(res, 'Missing fields');
      const createdBy = req.user!.uid;
      const createdByName = req.user!.email || 'User';
      
      const postData = {
        threadId,
        body: content,
        authorId: createdBy
      };
      
      const post = await hygraphForumService.createForumPost(postData);
      sendCreated(res, 'Post created', post);
    } catch (e) {
      sendServerError(res, 'Failed to create post');
    }
  }

  // Support ticket endpoints removed per client request

  async sendContactEmail(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, email, subject, message } = req.body as any;
      if (!name || !email || !subject || !message) return sendError(res, 'Missing fields');

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Boolean(process.env.SMTP_SECURE === 'true'),
        auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        } : undefined,
      });

      const to = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
      if (!to) return sendError(res, 'Email not configured');

      await transporter.sendMail({
        from: process.env.CONTACT_FROM_EMAIL || email,
        to,
        subject: `[Contact] ${subject}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      });

      sendSuccess(res, 'Message sent');
    } catch (e) {
      console.error(e);
      sendServerError(res, 'Failed to send message');
    }
  }
}

export default new ContentController();
