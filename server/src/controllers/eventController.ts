import { Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { hygraphEventService, EventFilters } from '../services/hygraphEventService';
import { hygraphUserService } from '../services/hygraphUserService';
import { hygraphCourseService } from '../services/hygraphCourseService';
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendPaginatedResponse,
  sendServerError
} from '../utils/response';

export class EventController {
  // Create a new event (teacher/admin only)
  async createEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        title, 
        description, 
        date, 
        time, 
        location, 
        eventType, 
        isRecurring, 
        recurrencePattern, 
        recurrenceEndDate, 
        maxAttendees, 
        isActive, 
        isPublic, 
        requiresRegistration, 
        registrationDeadline, 
        courseId 
      } = req.body;
      const eventCreator = req.user!.uid;

      // Validate required fields
      if (!title || !description || !date || !time || !eventType) {
        sendError(res, 'Missing required fields: title, description, date, time, eventType');
        return;
      }

      // Validate event type
      const validEventTypes = ['ACADEMIC', 'SOCIAL', 'SPORTS', 'CULTURAL', 'ADMINISTRATIVE', 'EXAM', 'HOLIDAY'];
      if (!validEventTypes.includes(eventType)) {
        sendError(res, 'Invalid event type. Must be one of: ' + validEventTypes.join(', '));
        return;
      }

      // Validate date format
      const eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        sendError(res, 'Invalid date format. Use YYYY-MM-DD');
        return;
      }

      // Validate recurrence if specified
      if (isRecurring && !recurrencePattern) {
        sendError(res, 'Recurrence pattern is required when isRecurring is true');
        return;
      }

      if (recurrencePattern) {
        const validPatterns = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
        if (!validPatterns.includes(recurrencePattern)) {
          sendError(res, 'Invalid recurrence pattern. Must be one of: ' + validPatterns.join(', '));
          return;
        }
      }

      // Verify course exists if provided
      if (courseId) {
        const course = await hygraphCourseService.getCourseById(courseId);
        if (!course) {
          sendNotFound(res, 'Course not found');
          return;
        }

        // Check permissions for course-specific events
        if (req.user!.role !== UserRole.ADMIN && course.instructor?.uid !== eventCreator) {
          sendError(res, 'You can only create events for your own courses');
          return;
        }
      }

      const eventData = {
        title,
        description,
        date,
        time,
        location,
        eventType,
        isRecurring: isRecurring || false,
        recurrencePattern,
        recurrenceEndDate,
        maxAttendees,
        isActive: isActive !== false, // Default to true
        isPublic: isPublic || false,
        requiresRegistration: requiresRegistration || false,
        registrationDeadline,
        eventCreator,
        courseId
      };

      const newEvent = await hygraphEventService.createEvent(eventData);
      sendCreated(res, 'Event created successfully', newEvent);
    } catch (error: any) {
      console.error('Create event error:', error);
      sendServerError(res, 'Failed to create event: ' + (error.message || 'Unknown error'));
    }
  }

  // Get all events (admin only)
  async getAllEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const eventType = req.query.eventType as string;
      const courseId = req.query.courseId as string;
      const eventCreator = req.query.eventCreator as string;
      const isActive = req.query.isActive as string;
      const isPublic = req.query.isPublic as string;
      const requiresRegistration = req.query.requiresRegistration as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;
      const location = req.query.location as string;

      const skip = (page - 1) * limit;
      const filters: EventFilters = {};

      if (eventType) filters.eventType = eventType as any;
      if (courseId) filters.courseId = courseId;
      if (eventCreator) filters.eventCreator = eventCreator;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
      if (requiresRegistration !== undefined) filters.requiresRegistration = requiresRegistration === 'true';
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      if (location) filters.location = location;

      const events = await hygraphEventService.getEvents(limit, skip, filters);
      
      // For now, we'll get all events to calculate total. In production, implement count query
      const allEvents = await hygraphEventService.getEvents(1000, 0, filters);
      const total = allEvents.length;

      sendPaginatedResponse(
        res,
        'Events retrieved successfully',
        events,
        page,
        limit,
        total
      );
    } catch (error) {
      console.error('Get events error:', error);
      sendServerError(res, 'Failed to retrieve events');
    }
  }

  // Get event by ID
  async getEventById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;

      const event = await hygraphEventService.getEventById(eventId);
      if (!event) {
        sendNotFound(res, 'Event not found');
        return;
      }

      sendSuccess(res, 'Event retrieved successfully', event);
    } catch (error) {
      console.error('Get event by ID error:', error);
      sendServerError(res, 'Failed to retrieve event');
    }
  }

  // Update event (teacher/admin only)
  async updateEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const updateData = req.body;
      const userId = req.user!.uid;

      // Get existing event
      const existingEvent = await hygraphEventService.getEventById(eventId);
      if (!existingEvent) {
        sendNotFound(res, 'Event not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingEvent.eventCreator?.id !== userId) {
        sendError(res, 'You can only update your own events');
        return;
      }

      // Validate course access if updating course-specific event
      if (updateData.courseId) {
        const course = await hygraphCourseService.getCourseById(updateData.courseId);
        if (!course) {
          sendNotFound(res, 'Course not found');
          return;
        }

        if (req.user!.role !== UserRole.ADMIN && course.instructor?.uid !== userId) {
          sendError(res, 'You can only update events for your own courses');
          return;
        }
      }

      const updatedEvent = await hygraphEventService.updateEvent(eventId, updateData);
      sendSuccess(res, 'Event updated successfully', updatedEvent);
    } catch (error) {
      console.error('Update event error:', error);
      sendServerError(res, 'Failed to update event');
    }
  }

  // Delete event (teacher/admin only)
  async deleteEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const userId = req.user!.uid;

      // Get existing event
      const existingEvent = await hygraphEventService.getEventById(eventId);
      if (!existingEvent) {
        sendNotFound(res, 'Event not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingEvent.eventCreator?.id !== userId) {
        sendError(res, 'You can only delete your own events');
        return;
      }

      await hygraphEventService.deleteEvent(eventId);
      sendSuccess(res, 'Event deleted successfully');
    } catch (error) {
      console.error('Delete event error:', error);
      sendServerError(res, 'Failed to delete event');
    }
  }

  // ===== PUBLIC ENDPOINTS =====

  // Get upcoming events
  async getUpcomingEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await hygraphEventService.getUpcomingEvents(limit);
      sendSuccess(res, 'Upcoming events retrieved successfully', events);
    } catch (error) {
      console.error('Get upcoming events error:', error);
      sendServerError(res, 'Failed to retrieve upcoming events');
    }
  }

  // Get events by date range
  async getEventsByDateRange(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const limit = parseInt(req.query.limit as string) || 100;

      if (!startDate || !endDate) {
        sendError(res, 'Start date and end date are required');
        return;
      }

      const events = await hygraphEventService.getEventsByDateRange(startDate as string, endDate as string, limit);
      sendSuccess(res, 'Events by date range retrieved successfully', events);
    } catch (error) {
      console.error('Get events by date range error:', error);
      sendServerError(res, 'Failed to retrieve events by date range');
    }
  }

  // Get events by type
  async getEventsByType(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { eventType } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      const events = await hygraphEventService.getEventsByType(eventType, limit);
      sendSuccess(res, 'Events by type retrieved successfully', events);
    } catch (error) {
      console.error('Get events by type error:', error);
      sendServerError(res, 'Failed to retrieve events by type');
    }
  }

  // Get public events
  async getPublicEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await hygraphEventService.getPublicEvents(limit);
      sendSuccess(res, 'Public events retrieved successfully', events);
    } catch (error) {
      console.error('Get public events error:', error);
      sendServerError(res, 'Failed to retrieve public events');
    }
  }

  // Get events requiring registration
  async getEventsRequiringRegistration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await hygraphEventService.getEventsRequiringRegistration(limit);
      sendSuccess(res, 'Events requiring registration retrieved successfully', events);
    } catch (error) {
      console.error('Get events requiring registration error:', error);
      sendServerError(res, 'Failed to retrieve events requiring registration');
    }
  }

  // ===== COURSE EVENTS =====

  // Get events by course
  async getCourseEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Verify course exists and user has access
      const course = await hygraphCourseService.getCourseById(courseId);
      if (!course) {
        sendNotFound(res, 'Course not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && course.instructor?.uid !== req.user!.uid) {
        // Check if user is enrolled in the course
        const enrollments = await hygraphCourseService.getCourseEnrollments(courseId);
        const isEnrolled = enrollments.some(e => e.student?.uid === req.user!.uid);
        
        if (!isEnrolled) {
          sendError(res, 'You can only view events for courses you are enrolled in or teaching');
          return;
        }
      }

      const events = await hygraphEventService.getEventsByCourse(courseId, limit);
      
      sendPaginatedResponse(
        res,
        'Course events retrieved successfully',
        events,
        page,
        limit,
        events.length
      );
    } catch (error) {
      console.error('Get course events error:', error);
      sendServerError(res, 'Failed to retrieve course events');
    }
  }

  // ===== EVENT MANAGEMENT =====

  // Toggle event active status
  async toggleActiveEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const { isActive } = req.body;
      const userId = req.user!.uid;

      // Get existing event
      const existingEvent = await hygraphEventService.getEventById(eventId);
      if (!existingEvent) {
        sendNotFound(res, 'Event not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingEvent.eventCreator?.id !== userId) {
        sendError(res, 'You can only manage your own events');
        return;
      }

      const updatedEvent = await hygraphEventService.toggleActiveEvent(eventId, isActive);
      sendSuccess(res, `Event ${isActive ? 'activated' : 'deactivated'} successfully`, updatedEvent);
    } catch (error) {
      console.error('Toggle active event error:', error);
      sendServerError(res, 'Failed to toggle active status');
    }
  }

  // Toggle public visibility
  async togglePublicEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const { isPublic } = req.body;
      const userId = req.user!.uid;

      // Get existing event
      const existingEvent = await hygraphEventService.getEventById(eventId);
      if (!existingEvent) {
        sendNotFound(res, 'Event not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingEvent.eventCreator?.id !== userId) {
        sendError(res, 'You can only manage your own events');
        return;
      }

      const updatedEvent = await hygraphEventService.togglePublicEvent(eventId, isPublic);
      sendSuccess(res, `Event ${isPublic ? 'made public' : 'made private'} successfully`, updatedEvent);
    } catch (error) {
      console.error('Toggle public event error:', error);
      sendServerError(res, 'Failed to toggle public status');
    }
  }

  // Toggle registration requirement
  async toggleRegistrationRequirement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const { requiresRegistration } = req.body;
      const userId = req.user!.uid;

      // Get existing event
      const existingEvent = await hygraphEventService.getEventById(eventId);
      if (!existingEvent) {
        sendNotFound(res, 'Event not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingEvent.eventCreator?.id !== userId) {
        sendError(res, 'You can only manage your own events');
        return;
      }

      const updatedEvent = await hygraphEventService.toggleRegistrationRequirement(eventId, requiresRegistration);
      sendSuccess(res, `Registration requirement ${requiresRegistration ? 'enabled' : 'disabled'} successfully`, updatedEvent);
    } catch (error) {
      console.error('Toggle registration requirement error:', error);
      sendServerError(res, 'Failed to toggle registration requirement');
    }
  }

  // Set registration deadline
  async setRegistrationDeadline(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const { deadline } = req.body;
      const userId = req.user!.uid;

      if (!deadline) {
        sendError(res, 'Registration deadline is required');
        return;
      }

      // Validate deadline is in the future
      const deadlineDate = new Date(deadline);
      if (deadlineDate <= new Date()) {
        sendError(res, 'Registration deadline must be in the future');
        return;
      }

      // Get existing event
      const existingEvent = await hygraphEventService.getEventById(eventId);
      if (!existingEvent) {
        sendNotFound(res, 'Event not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingEvent.eventCreator?.id !== userId) {
        sendError(res, 'You can only manage your own events');
        return;
      }

      const updatedEvent = await hygraphEventService.setRegistrationDeadline(eventId, deadline);
      sendSuccess(res, 'Registration deadline set successfully', updatedEvent);
    } catch (error) {
      console.error('Set registration deadline error:', error);
      sendServerError(res, 'Failed to set registration deadline');
    }
  }

  // ===== EVENT REGISTRATION =====

  // Register for event
  async registerForEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const attendeeId = req.user!.uid;

      const success = await hygraphEventService.registerForEvent(eventId, attendeeId);
      if (success) {
        sendSuccess(res, 'Successfully registered for event');
      } else {
        sendError(res, 'Failed to register for event');
      }
    } catch (error) {
      console.error('Register for event error:', error);
      sendError(res, error instanceof Error ? error.message : 'Failed to register for event');
    }
  }

  // Cancel event registration
  async cancelEventRegistration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const attendeeId = req.user!.uid;

      const success = await hygraphEventService.cancelEventRegistration(eventId, attendeeId);
      if (success) {
        sendSuccess(res, 'Successfully cancelled event registration');
      } else {
        sendError(res, 'Failed to cancel event registration');
      }
    } catch (error) {
      console.error('Cancel event registration error:', error);
      sendError(res, error instanceof Error ? error.message : 'Failed to cancel event registration');
    }
  }

  // ===== STATISTICS =====

  // Get event statistics (admin only)
  async getEventStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await hygraphEventService.getEventStats();
      sendSuccess(res, 'Event statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get event stats error:', error);
      sendServerError(res, 'Failed to retrieve event statistics');
    }
  }

  // Get creator's event statistics
  async getCreatorEventStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const creatorId = req.user!.uid;
      const stats = await hygraphEventService.getCreatorEventStats(creatorId);
      sendSuccess(res, 'Creator event statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get creator event stats error:', error);
      sendServerError(res, 'Failed to retrieve creator event statistics');
    }
  }

  // Get course event statistics
  async getCourseEventStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      // Verify course exists and user has access
      const course = await hygraphCourseService.getCourseById(courseId);
      if (!course) {
        sendNotFound(res, 'Course not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && course.instructor?.uid !== req.user!.uid) {
        sendError(res, 'You can only view statistics for your own courses');
        return;
      }

      const stats = await hygraphEventService.getCourseEventStats(courseId);
      sendSuccess(res, 'Course event statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get course event stats error:', error);
      sendServerError(res, 'Failed to retrieve course event statistics');
    }
  }
}

export default new EventController();