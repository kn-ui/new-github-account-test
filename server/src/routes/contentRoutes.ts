import { Router } from 'express';
import contentController from '../controllers/contentController';
import { authenticateToken } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';
import multer from 'multer';
const upload = multer();

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
router.post('/upload', upload.single('file'), (req, res) => contentController.upload(req, res));
router.post('/upload-multiple', upload.array('files', 10), (req, res) => contentController.uploadMultiple(req, res));
router.post('/delete-asset', (req, res) => contentController.deleteAsset(req, res));


export default router;
