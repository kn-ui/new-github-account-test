import { Router } from 'express';
import forumController from '../controllers/forumController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin, requireStudentOrTeacherOrAdmin } from '../middleware/clerkAuth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service is healthy'
  });
});


// Public endpoints (no authentication required)
// Note: In production, you might want to add some public forum endpoints

// Protected routes (authentication required)
router.use(authenticateToken);

// Public forum routes
router.get('/threads/public', validatePagination, forumController.getPublicForumThreads);
router.get('/threads/pinned', forumController.getPinnedForumThreads);
router.get('/threads/search', forumController.searchForumThreads);

// Course-specific routes
router.get('/threads/course/:courseId', requireStudentOrTeacherOrAdmin, validatePagination, forumController.getCourseForumThreads);
router.get('/threads/course/:courseId/stats', requireTeacherOrAdmin, forumController.getCourseForumStats);

// Thread CRUD routes
router.post('/threads', forumController.createForumThread);
router.get('/threads/:threadId', forumController.getForumThreadById);
router.put('/threads/:threadId', forumController.updateForumThread);
router.delete('/threads/:threadId', forumController.deleteForumThread);

// Thread management routes
router.patch('/threads/:threadId/pin', requireAdmin, forumController.togglePinForumThread);
router.patch('/threads/:threadId/lock', requireAdmin, forumController.toggleLockForumThread);
router.patch('/threads/:threadId/active', requireAdmin, forumController.toggleActiveForumThread);
router.post('/threads/:threadId/like', forumController.likeForumThread);
router.delete('/threads/:threadId/like', forumController.unlikeForumThread);

// Post routes
router.post('/posts', forumController.createForumPost);
router.get('/threads/:threadId/posts', validatePagination, forumController.getForumPostsByThread);
router.get('/posts/:postId', forumController.getForumPostById);
router.put('/posts/:postId', forumController.updateForumPost);
router.delete('/posts/:postId', forumController.deleteForumPost);
router.post('/posts/:postId/like', forumController.likeForumPost);
router.delete('/posts/:postId/like', forumController.unlikeForumPost);

// Statistics routes
router.get('/stats/author', forumController.getAuthorForumStats);

// Admin only routes
router.get('/threads', requireAdmin, validatePagination, forumController.getAllForumThreads);
router.get('/stats/overview', requireAdmin, forumController.getForumStats);

export default router;