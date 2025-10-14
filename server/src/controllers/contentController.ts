/* eslint-disable no-irregular-whitespace */
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

      // For Hygraph, we need to use their asset upload endpoint
      // The endpoint format should be: https://api-<region>.hygraph.com/v2/<projectId>/<environment>/upload
      // We'll extract the base URL and construct the upload endpoint
      const baseUrl = endpoint.replace(/\/v2\/.*$/, '');
      const projectMatch = endpoint.match(/\/v2\/([^/]+)\/([^/]+)/);
      
      if (!projectMatch) {
        console.error('Invalid Hygraph endpoint format');
        res.status(500).json({ success: false, message: 'Invalid Hygraph configuration' });
        return;
      }

      const projectId = projectMatch[1];
      const environment = projectMatch[2];
      const uploadUrl = `${baseUrl}/v2/${projectId}/${environment}/upload`;

      // Create form data for the upload
      const FormData = require('form-data');
      const form = new FormData();
      form.append('fileUpload', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });

      // Upload the file to Hygraph
      const uploadResp = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${token}`
        },
        body: form
      } as any);

      if (!uploadResp.ok) {
        const text = await uploadResp.text();
        console.error('Hygraph upload failed:', text);
        
        // Fallback: Return a data URL for small files (less than 100KB)
        if (file.size < 100000) {
          const base64 = file.buffer.toString('base64');
          const dataUrl = `data:${file.mimetype};base64,${base64}`;
          res.status(200).json({ 
            success: true, 
            data: { 
              url: dataUrl,
              filename: file.originalname,
              size: file.size,
              mimeType: file.mimetype
            },
            warning: 'Hygraph upload failed, using data URL fallback'
          });
          return;
        }
        
        res.status(500).json({ success: false, message: 'Upload to Hygraph failed' });
        return;
      }

      // FIX: Assert the JSON response as 'any' to resolve the TS2339 and TS2698 errors.
      const data = (await uploadResp.json()) as any; 
      
      // The response should contain the asset information including the URL
      res.status(200).json({ 
        success: true, 
        data: {
          url: data.url || data.handle || data.id,
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          ...data
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      
      // If Hygraph is not working, provide a fallback for small files
      const file = (req as any).file as Express.Multer.File;
      if (file && file.size < 100000) {
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;
        res.status(200).json({ 
          success: true, 
          data: { 
            url: dataUrl,
            filename: file.originalname,
            size: file.size,
            mimeType: file.mimetype
          },
          warning: 'Using data URL fallback due to upload error'
        });
        return;
      }
      
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
