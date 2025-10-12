import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import fileService from '../services/fileService';
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendServerError
} from '../utils/response';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

export class FileController {
  // Multer middleware for single file upload
  uploadMiddleware = upload.single('file');

  // Upload a single file
  async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'No file provided');
        return;
      }

      const { buffer, originalname, mimetype } = req.file;
      
      // Generate a unique filename to avoid conflicts
      const timestamp = Date.now();
      const filename = `${timestamp}-${originalname}`;

      const uploadedFile = await fileService.uploadFile(buffer, filename, mimetype);

      sendCreated(res, 'File uploaded successfully', {
        id: uploadedFile.id,
        url: uploadedFile.url,
        fileName: uploadedFile.fileName,
        size: uploadedFile.size,
        mimeType: uploadedFile.mimeType
      });
    } catch (error) {
      console.error('File upload error:', error);
      sendServerError(res, 'Failed to upload file');
    }
  }

  // Multer middleware for multiple file uploads
  uploadMultipleMiddleware = upload.array('files', 10); // Max 10 files

  // Upload multiple files
  async uploadMultipleFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        sendError(res, 'No files provided');
        return;
      }

      // Upload all files in parallel
      const uploadPromises = files.map(async (file) => {
        const timestamp = Date.now();
        const filename = `${timestamp}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
        return fileService.uploadFile(file.buffer, filename, file.mimetype);
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      sendCreated(res, 'Files uploaded successfully', {
        files: uploadedFiles.map(file => ({
          id: file.id,
          url: file.url,
          fileName: file.fileName,
          size: file.size,
          mimeType: file.mimeType
        }))
      });
    } catch (error) {
      console.error('Multiple file upload error:', error);
      sendServerError(res, 'Failed to upload files');
    }
  }

  // Delete a file
  async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        sendError(res, 'File ID is required');
        return;
      }

      await fileService.deleteFile(fileId);
      sendSuccess(res, 'File deleted successfully');
    } catch (error) {
      console.error('File delete error:', error);
      sendServerError(res, 'Failed to delete file');
    }
  }

  // Get file information
  async getFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        sendError(res, 'File ID is required');
        return;
      }

      const file = await fileService.getAsset(fileId);

      if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
      }

      sendSuccess(res, 'File retrieved successfully', file);
    } catch (error) {
      console.error('Get file error:', error);
      sendServerError(res, 'Failed to get file');
    }
  }

  // List all files with pagination
  async listFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await fileService.listAssets(page, limit);

      res.json({
        success: true,
        message: 'Files retrieved successfully',
        data: result.assets,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error('List files error:', error);
      sendServerError(res, 'Failed to list files');
    }
  }
}

export default new FileController();