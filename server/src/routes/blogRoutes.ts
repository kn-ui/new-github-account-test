import { Router } from 'express';
import blogController from '../controllers/blogController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin } from '../middleware/clerkAuth';
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
// Note: In production, you might want to add some public blog endpoints

// Protected routes (authentication required)
router.use(authenticateToken);

// Public blog routes
router.get('/posts/published', validatePagination, blogController.getPublishedBlogPosts);
router.get('/posts/featured', blogController.getFeaturedBlogPosts);
router.get('/posts/recent', blogController.getRecentBlogPosts);
router.get('/posts/category/:category', blogController.getBlogPostsByCategory);
router.get('/posts/tag/:tag', blogController.getBlogPostsByTag);
router.get('/posts/search', blogController.searchBlogPosts);

// Blog post routes
router.get('/posts/:postId', blogController.getBlogPostById);
router.get('/posts/slug/:slug', blogController.getBlogPostBySlug);

// CRUD routes (authenticated users)
router.post('/posts', blogController.createBlogPost);
router.put('/posts/:postId', blogController.updateBlogPost);
router.delete('/posts/:postId', blogController.deleteBlogPost);

// Blog management routes
router.patch('/posts/:postId/publish', blogController.publishBlogPost);
router.patch('/posts/:postId/unpublish', blogController.unpublishBlogPost);
router.patch('/posts/:postId/archive', blogController.archiveBlogPost);
router.patch('/posts/:postId/featured', requireAdmin, blogController.toggleFeaturedBlogPost);
router.patch('/posts/:postId/comments', blogController.toggleCommentsBlogPost);

// Like/unlike routes
router.post('/posts/:postId/like', blogController.likeBlogPost);
router.delete('/posts/:postId/like', blogController.unlikeBlogPost);

// Statistics routes
router.get('/stats/author', blogController.getAuthorBlogStats);

// Admin only routes
router.get('/posts', requireAdmin, validatePagination, blogController.getAllBlogPosts);
router.get('/stats/overview', requireAdmin, blogController.getBlogStats);

export default router;