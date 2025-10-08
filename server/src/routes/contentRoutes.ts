import { Router } from 'express';
import contentController from '../controllers/contentController';
import { authenticateClerkToken as authenticateToken } from '../middleware/clerkAuth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Public content
router.get('/blog', validatePagination, contentController.listBlog);
router.get('/events', validatePagination, contentController.listEvents);
router.get('/forum/threads', validatePagination, contentController.listThreads);
router.get('/forum/threads/:threadId/posts', validatePagination, contentController.listPosts);
router.post('/contact', contentController.sendContactEmail);

// Auth-required actions
router.use(authenticateToken);
router.post('/forum/threads', contentController.createThread);
router.post('/forum/threads/:threadId/posts', contentController.createPost);


export default router;
