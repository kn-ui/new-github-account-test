import { Router } from 'express';
import blogController from '../controllers/blogController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin } from '../middleware/clerkAuth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Test endpoint that doesn't require authentication (temporary)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Blog test endpoint working',
    data: {
      posts: [
        {
          id: '1',
          title: 'Welcome to Our School Blog!',
          content: 'This is our official school blog where we share news, updates, and insights about our educational community.',
          excerpt: 'Welcome to our official school blog where we share news and updates.',
          slug: 'welcome-to-our-school-blog',
          status: 'PUBLISHED',
          featuredImage: 'https://example.com/featured-image.jpg',
          tags: ['welcome', 'announcement', 'school'],
          category: 'General',
          likes: 25,
          views: 150,
          isFeatured: true,
          allowComments: true,
          publishedAt: new Date().toISOString(),
          author: {
            id: 'admin1',
            displayName: 'School Administration',
            email: 'admin@school.edu'
          }
        },
        {
          id: '2',
          title: 'Mathematics Study Tips for Students',
          content: 'Here are some effective study tips to help students excel in mathematics...',
          excerpt: 'Effective study tips for mathematics students.',
          slug: 'mathematics-study-tips-for-students',
          status: 'PUBLISHED',
          featuredImage: 'https://example.com/math-tips.jpg',
          tags: ['mathematics', 'study-tips', 'education'],
          category: 'Academic',
          likes: 18,
          views: 89,
          isFeatured: false,
          allowComments: true,
          publishedAt: new Date().toISOString(),
          author: {
            id: 'teacher1',
            displayName: 'Dr. Smith',
            email: 'smith@school.edu'
          }
        },
        {
          id: '3',
          title: 'Cultural Festival Highlights',
          content: 'A recap of our amazing cultural festival that showcased the diversity of our school community...',
          excerpt: 'Highlights from our recent cultural festival.',
          slug: 'cultural-festival-highlights',
          status: 'PUBLISHED',
          featuredImage: 'https://example.com/festival.jpg',
          tags: ['culture', 'festival', 'community'],
          category: 'Events',
          likes: 32,
          views: 120,
          isFeatured: true,
          allowComments: true,
          publishedAt: new Date().toISOString(),
          author: {
            id: 'admin1',
            displayName: 'School Administration',
            email: 'admin@school.edu'
          }
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1
      }
    }
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