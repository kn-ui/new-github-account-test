import { Router } from 'express';
import fileController from '../controllers/fileController';
import { authenticateClerkToken } from '../middleware/clerkAuth';

const router = Router();

// All file operations require authentication
router.use(authenticateClerkToken);

// Upload single file
router.post('/upload', fileController.uploadMiddleware, fileController.uploadFile);

// Upload multiple files
router.post('/upload-multiple', fileController.uploadMultipleMiddleware, fileController.uploadMultipleFiles);

// Get file info by ID
router.get('/:fileId', fileController.getFile);

// Delete file by ID
router.delete('/:fileId', fileController.deleteFile);

// List all files with pagination
router.get('/', fileController.listFiles);

export default router;