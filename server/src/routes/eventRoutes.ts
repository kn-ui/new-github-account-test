import { Router } from 'express';
import eventController from '../controllers/eventController';
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
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/public', eventController.getPublicEvents);
router.get('/type/:eventType', eventController.getEventsByType);
router.get('/date-range', eventController.getEventsByDateRange);
router.get('/registration-required', eventController.getEventsRequiringRegistration);
router.get('/', eventController.getPublicEvents); // Add public access to main events endpoint

// Protected routes (authentication required)
router.use(authenticateToken);

// Student routes
router.post('/:eventId/register', eventController.registerForEvent);
router.delete('/:eventId/register', eventController.cancelEventRegistration);

// Course-specific routes
router.get('/course/:courseId', requireStudentOrTeacherOrAdmin, validatePagination, eventController.getCourseEvents);
router.get('/course/:courseId/stats', requireTeacherOrAdmin, eventController.getCourseEventStats);

// Teacher/Admin CRUD routes
router.post('/', requireTeacherOrAdmin, eventController.createEvent);

// Parameterized routes for specific events
router.get('/:eventId', eventController.getEventById);
router.put('/:eventId', requireTeacherOrAdmin, eventController.updateEvent);
router.delete('/:eventId', requireTeacherOrAdmin, eventController.deleteEvent);

// Event management routes
router.patch('/:eventId/active', requireTeacherOrAdmin, eventController.toggleActiveEvent);
router.patch('/:eventId/public', requireTeacherOrAdmin, eventController.togglePublicEvent);
router.patch('/:eventId/registration', requireTeacherOrAdmin, eventController.toggleRegistrationRequirement);
router.patch('/:eventId/registration-deadline', requireTeacherOrAdmin, eventController.setRegistrationDeadline);

// Statistics routes
router.get('/stats/creator', eventController.getCreatorEventStats);

// Admin only routes
router.get('/admin', requireAdmin, validatePagination, eventController.getAllEvents);
router.get('/stats/overview', requireAdmin, eventController.getEventStats);

export default router;