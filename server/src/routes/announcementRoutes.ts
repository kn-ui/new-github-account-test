import { Router } from 'express';
import announcementController from '../controllers/announcementController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin, requireStudentOrTeacherOrAdmin } from '../middleware/clerkAuth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Test endpoint that doesn't require authentication (temporary)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Announcements test endpoint working',
    data: [
      {
        id: '1',
        title: 'Welcome to the New Semester!',
        body: 'We are excited to welcome all students to the new semester. Please check your course schedules and be ready for classes starting next week.',
        targetAudience: 'ALL_STUDENTS',
        isPinned: true,
        isActive: true,
        publishedAt: new Date().toISOString(),
        author: {
          id: 'admin1',
          displayName: 'School Administration',
          email: 'admin@school.edu'
        }
      },
      {
        id: '2',
        title: 'Mathematics Assignment Due',
        body: 'The mathematics assignment for Chapter 5 is due next Friday. Please submit your work through the online portal.',
        targetAudience: 'COURSE_STUDENTS',
        isPinned: false,
        isActive: true,
        publishedAt: new Date().toISOString(),
        course: {
          id: 'course1',
          title: 'Algebra I'
        },
        author: {
          id: 'teacher1',
          displayName: 'Dr. Smith',
          email: 'smith@school.edu'
        }
      },
      {
        id: '3',
        title: 'Library Hours Update',
        body: 'The library will be open extended hours during exam week. New hours: 7 AM - 10 PM Monday through Friday.',
        targetAudience: 'ALL_STUDENTS',
        isPinned: false,
        isActive: true,
        publishedAt: new Date().toISOString(),
        author: {
          id: 'librarian1',
          displayName: 'Library Staff',
          email: 'library@school.edu'
        }
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 3,
      totalPages: 1
    }
  });
});

// Public endpoints (no authentication required)
// Note: In production, you might want to add some public announcement endpoints

// Protected routes (authentication required)
router.use(authenticateToken);

// Student routes
router.get('/active', validatePagination, announcementController.getActiveAnnouncements);
router.get('/pinned', announcementController.getPinnedAnnouncements);
router.get('/recent', announcementController.getRecentAnnouncements);

// Course-specific routes
router.get('/course/:courseId', requireStudentOrTeacherOrAdmin, validatePagination, announcementController.getCourseAnnouncements);
router.get('/course/:courseId/stats', requireTeacherOrAdmin, announcementController.getCourseAnnouncementStats);

// Teacher/Admin CRUD routes
router.post('/', requireTeacherOrAdmin, announcementController.createAnnouncement);

// Parameterized routes for specific announcements
router.get('/:announcementId', announcementController.getAnnouncementById);
router.put('/:announcementId', requireTeacherOrAdmin, announcementController.updateAnnouncement);
router.delete('/:announcementId', requireTeacherOrAdmin, announcementController.deleteAnnouncement);

// Announcement management routes
router.patch('/:announcementId/pin', requireTeacherOrAdmin, announcementController.togglePinAnnouncement);
router.patch('/:announcementId/active', requireTeacherOrAdmin, announcementController.toggleActiveAnnouncement);
router.patch('/:announcementId/schedule', requireTeacherOrAdmin, announcementController.scheduleAnnouncement);
router.patch('/:announcementId/expiration', requireTeacherOrAdmin, announcementController.setAnnouncementExpiration);

// Statistics routes
router.get('/stats/author', announcementController.getAuthorAnnouncementStats);

// Admin only routes
router.get('/', requireAdmin, validatePagination, announcementController.getAllAnnouncements);
router.get('/admin', requireAdmin, validatePagination, announcementController.getAllAnnouncements);
router.get('/stats/overview', requireAdmin, announcementController.getAnnouncementStats);

export default router;