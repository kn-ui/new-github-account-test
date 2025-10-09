import { Router } from 'express';
import eventController from '../controllers/eventController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin, requireStudentOrTeacherOrAdmin } from '../middleware/clerkAuth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Test endpoint that doesn't require authentication (temporary)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Events test endpoint working',
    data: [
      {
        id: '1',
        title: 'Mathematics Midterm Exam',
        description: 'Midterm examination for Algebra I course covering chapters 1-5',
        date: '2025-10-15',
        time: '10:00 AM',
        location: 'Room 101',
        eventType: 'EXAM',
        isRecurring: false,
        isActive: true,
        isPublic: false,
        requiresRegistration: true,
        registrationDeadline: '2025-10-14T23:59:59Z',
        maxAttendees: 30,
        eventCreator: {
          id: 'teacher1',
          displayName: 'Dr. Smith',
          email: 'smith@school.edu'
        },
        course: {
          id: 'course1',
          title: 'Algebra I'
        }
      },
      {
        id: '2',
        title: 'School Sports Day',
        description: 'Annual sports day with various competitions and activities for all students',
        date: '2025-10-20',
        time: '9:00 AM',
        location: 'School Grounds',
        eventType: 'SPORTS',
        isRecurring: true,
        recurrencePattern: 'YEARLY',
        isActive: true,
        isPublic: true,
        requiresRegistration: true,
        registrationDeadline: '2025-10-18T23:59:59Z',
        maxAttendees: 200,
        eventCreator: {
          id: 'admin1',
          displayName: 'School Administration',
          email: 'admin@school.edu'
        }
      },
      {
        id: '3',
        title: 'Cultural Festival',
        description: 'Annual cultural festival showcasing student talents and cultural diversity',
        date: '2025-11-05',
        time: '6:00 PM',
        location: 'Auditorium',
        eventType: 'CULTURAL',
        isRecurring: true,
        recurrencePattern: 'YEARLY',
        isActive: true,
        isPublic: true,
        requiresRegistration: false,
        maxAttendees: 500,
        eventCreator: {
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
  });
});

// Public endpoints (no authentication required)
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/public', eventController.getPublicEvents);
router.get('/type/:eventType', eventController.getEventsByType);
router.get('/date-range', eventController.getEventsByDateRange);
router.get('/registration-required', eventController.getEventsRequiringRegistration);

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
router.get('/', requireAdmin, validatePagination, eventController.getAllEvents);
router.get('/stats/overview', requireAdmin, eventController.getEventStats);

export default router;