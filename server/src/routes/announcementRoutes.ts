import { Router } from 'express';
import announcementController from '../controllers/announcementController';
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
// Note: In production, you might want to add some public announcement endpoints

// Protected routes (authentication required)
router.use(authenticateToken);

// Student routes
router.get('/active', validatePagination, announcementController.getActiveAnnouncements);
router.get('/pinned', announcementController.getPinnedAnnouncements);
router.get('/recent', validatePagination, announcementController.getRecentAnnouncements);
router.get('/public', validatePagination, announcementController.getPublicAnnouncements);

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