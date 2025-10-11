import { Router } from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { hygraphCourseService } from '../services/hygraphCourseService';
import { authenticateClerkToken as authenticateToken } from '../middleware/clerkAuth';
import { sendSuccess, sendServerError } from '../utils/response';

const router = Router();

// Protected routes (authentication required)
router.use(authenticateToken);

// Get all enrollments (for backwards compatibility with frontend)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 1000;
    
    // Get enrollments - this is a simplified version
    // In a real scenario, you'd want to filter based on user role
    const enrollments = await hygraphCourseService.getEnrollments(limit, 0, {});
    
    sendSuccess(res, 'Enrollments retrieved successfully', enrollments);
  } catch (error) {
    console.error('Get enrollments error:', error);
    sendServerError(res, 'Failed to retrieve enrollments');
  }
});

export default router;
