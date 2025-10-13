/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { AuthenticatedRequest } from '../types';
import blogService from '../services/blogService';
import eventService from '../services/eventService';
import forumService from '../services/forumService';
import { sendPaginatedResponse, sendServerError, sendSuccess, sendCreated, sendError } from '../utils/response';
import nodemailer from 'nodemailer';

export class ContentController {
  async upload(req: Request, res: Response): Promise<void> {
    try {
      const file = (req as any).file as Express.Multer.File;
      if (!file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }

      const endpoint = process.env.HYGRAPH_ENDPOINT as string;
      const token = process.env.HYGRAPH_TOKEN as string;
      if (!endpoint || !token) {
        res.status(500).json({ success: false, message: 'Hygraph not configured' });
        return;
      }

      // Hygraph Asset Upload (direct upload API)
      const uploadResp = await fetch(`${endpoint}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: (() => {
          const form = new (require('form-data'))();
          form.append('fileUpload', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
          });
          return form;
        })()
      } as any);

      if (!uploadResp.ok) {
        const text = await uploadResp.text();
        console.error('Hygraph upload failed:', text);
        res.status(500).json({ success: false, message: 'Upload to Hygraph failed' });
        return;
      }

      const data = await uploadResp.json();
      // Respond with the asset URL
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ success: false, message: 'Upload failed' });
    }
  }
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
