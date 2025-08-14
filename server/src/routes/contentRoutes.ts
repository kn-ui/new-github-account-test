import { Router } from 'express';
import contentController from '../controllers/contentController';
import { authenticateToken } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Public content
router.get('/blog', validatePagination, contentController.listBlog);
router.get('/events', validatePagination, contentController.listEvents);
router.get('/forum/threads', validatePagination, contentController.listThreads);
router.get('/forum/threads/:threadId/posts', validatePagination, contentController.listPosts);

// Auth-required actions
router.use(authenticateToken);
router.post('/forum/threads', contentController.createThread);
router.post('/forum/threads/:threadId/posts', contentController.createPost);
router.post('/support/tickets', contentController.createTicket);
router.get('/support/my-tickets', validatePagination, contentController.myTickets);

export default router;
