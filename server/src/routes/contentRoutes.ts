import { Router } from 'express';
import contentController from '../controllers/contentController';
import { authenticateClerkToken as authenticateToken } from '../middleware/clerkAuth';
import { validatePagination } from '../middleware/validation';
import { hygraphClient } from '../config/hygraph';
import { gql } from 'graphql-request';

const router = Router();

// Public content
router.get('/blog', validatePagination, contentController.listBlog);
router.get('/events', validatePagination, contentController.listEvents);
router.get('/forum/threads', validatePagination, contentController.listThreads);
router.get('/forum/threads/:threadId/posts', validatePagination, contentController.listPosts);
router.post('/contact', contentController.sendContactEmail);

// Hygraph proxy (optional): allow frontend to POST GraphQL queries via backend
router.post('/hygraph', async (req, res) => {
  try {
    const { query, variables } = req.body || {};
    if (!query) return res.status(400).json({ success: false, message: 'Missing query' });
    const data = await hygraphClient.request(query, variables);
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Hygraph request failed', error: e?.message });
  }
});

// Auth-required actions
router.use(authenticateToken);
router.post('/forum/threads', contentController.createThread);
router.post('/forum/threads/:threadId/posts', contentController.createPost);


export default router;
