import { Router } from 'express';
import forumController from '../controllers/forumController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin, requireStudentOrTeacherOrAdmin } from '../middleware/clerkAuth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Test endpoint that doesn't require authentication (temporary)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Forum test endpoint working',
    data: {
      threads: [
        {
          id: '1',
          title: 'Welcome to the School Forum!',
          body: 'This is a place for students and teachers to discuss various topics related to our school community.',
          category: 'General',
          likes: 15,
          views: 120,
          isPinned: true,
          isLocked: false,
          isActive: true,
          author: {
            id: 'admin1',
            displayName: 'School Administration',
            email: 'admin@school.edu'
          },
          lastPost: {
            id: 'post1',
            body: 'Great to have this forum!',
            author: {
              id: 'student1',
              displayName: 'John Doe'
            }
          }
        },
        {
          id: '2',
          title: 'Mathematics Study Group',
          body: 'Looking for study partners for the upcoming algebra exam. Anyone interested?',
          category: 'Study Groups',
          likes: 8,
          views: 45,
          isPinned: false,
          isLocked: false,
          isActive: true,
          course: {
            id: 'course1',
            title: 'Algebra I'
          },
          author: {
            id: 'student2',
            displayName: 'Jane Smith',
            email: 'jane@school.edu'
          }
        },
        {
          id: '3',
          title: 'School Event Discussion',
          body: 'What did everyone think about the recent cultural festival? Share your thoughts!',
          category: 'Events',
          likes: 12,
          views: 78,
          isPinned: false,
          isLocked: false,
          isActive: true,
          author: {
            id: 'teacher1',
            displayName: 'Dr. Johnson',
            email: 'johnson@school.edu'
          }
        }
      ],
      posts: [
        {
          id: '1',
          body: 'This is a great initiative! Looking forward to participating in discussions.',
          likes: 5,
          author: {
            id: 'student1',
            displayName: 'John Doe',
            email: 'john@school.edu'
          },
          thread: {
            id: '1',
            title: 'Welcome to the School Forum!'
          }
        },
        {
          id: '2',
          body: 'I\'m interested in joining the study group. When do you usually meet?',
          likes: 3,
          author: {
            id: 'student3',
            displayName: 'Mike Wilson',
            email: 'mike@school.edu'
          },
          thread: {
            id: '2',
            title: 'Mathematics Study Group'
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