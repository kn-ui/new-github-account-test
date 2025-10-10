import { hygraphClient } from '../config/hygraph';
import {
  GET_EVENTS,
  CREATE_EVENT,
  UPDATE_EVENT,
  DELETE_EVENT
} from '../lib/hygraphOperations';

// Types for Hygraph data
export interface HygraphEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  eventType: 'ACADEMIC' | 'SOCIAL' | 'SPORTS' | 'CULTURAL' | 'ADMINISTRATIVE' | 'EXAM' | 'HOLIDAY';
  isRecurring: boolean;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  recurrenceEndDate?: string;
  maxAttendees?: number;
  isActive: boolean;
  isPublic: boolean;
  requiresRegistration: boolean;
  registrationDeadline?: string;
  eventCreator?: {
    id: string;
    displayName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
  };
  attendees?: {
    id: string;
    displayName: string;
    email: string;
  }[];
}

export interface CreateEventData {
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  eventType: 'ACADEMIC' | 'SOCIAL' | 'SPORTS' | 'CULTURAL' | 'ADMINISTRATIVE' | 'EXAM' | 'HOLIDAY';
  isRecurring?: boolean;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  recurrenceEndDate?: string;
  maxAttendees?: number;
  isActive?: boolean;
  isPublic?: boolean;
  requiresRegistration?: boolean;
  registrationDeadline?: string;
  eventCreator: string;
  courseId?: string;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  eventType?: 'ACADEMIC' | 'SOCIAL' | 'SPORTS' | 'CULTURAL' | 'ADMINISTRATIVE' | 'EXAM' | 'HOLIDAY';
  isRecurring?: boolean;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  recurrenceEndDate?: string;
  maxAttendees?: number;
  isActive?: boolean;
  isPublic?: boolean;
  requiresRegistration?: boolean;
  registrationDeadline?: string;
  courseId?: string;
}

export interface EventFilters {
  eventType?: 'ACADEMIC' | 'SOCIAL' | 'SPORTS' | 'CULTURAL' | 'ADMINISTRATIVE' | 'EXAM' | 'HOLIDAY';
  courseId?: string;
  eventCreator?: string;
  isActive?: boolean;
  isPublic?: boolean;
  requiresRegistration?: boolean;
  dateFrom?: string;
  dateTo?: string;
  location?: string;
}

export interface EventRegistration {
  eventId: string;
  attendeeId: string;
  registeredAt: string;
  status: 'REGISTERED' | 'CANCELLED' | 'WAITLISTED';
}

// Hygraph Event Service for Backend
export const hygraphEventService = {
  // ===== EVENT OPERATIONS =====
  
  // Get all events with pagination and filters
  async getEvents(
    limit: number = 100, 
    offset: number = 0, 
    filters?: EventFilters
  ): Promise<HygraphEvent[]> {
    try {
      // For development, return mock data instead of calling Hygraph
      console.log('Using mock event data for development');
      
      const mockEvents: HygraphEvent[] = [
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
      ];

      // Apply filters
      let filteredEvents = mockEvents;
      
      if (filters) {
        if (filters.eventType) {
          filteredEvents = filteredEvents.filter(event => event.eventType === filters.eventType);
        }
        if (filters.isActive !== undefined) {
          filteredEvents = filteredEvents.filter(event => event.isActive === filters.isActive);
        }
        if (filters.isPublic !== undefined) {
          filteredEvents = filteredEvents.filter(event => event.isPublic === filters.isPublic);
        }
        if (filters.requiresRegistration !== undefined) {
          filteredEvents = filteredEvents.filter(event => event.requiresRegistration === filters.requiresRegistration);
        }
        if (filters.location) {
          filteredEvents = filteredEvents.filter(event => 
            event.location?.toLowerCase().includes(filters.location!.toLowerCase())
          );
        }
        if (filters.dateFrom) {
          filteredEvents = filteredEvents.filter(event => event.date >= filters.dateFrom!);
        }
        if (filters.dateTo) {
          filteredEvents = filteredEvents.filter(event => event.date <= filters.dateTo!);
        }
      }

      // Apply pagination
      const startIndex = offset;
      const endIndex = startIndex + limit;
      return filteredEvents.slice(startIndex, endIndex);
    } catch (error) {
      console.error('Error fetching events from Hygraph:', error);
      throw error;
    }
  },

  // Get event by ID
  async getEventById(id: string): Promise<HygraphEvent | null> {
    try {
      // For development, return mock data
      const mockEvents = await this.getEvents(100, 0);
      return mockEvents.find(event => event.id === id) || null;
    } catch (error) {
      console.error('Error fetching event by ID from Hygraph:', error);
      throw error;
    }
  },

  // Get events by course
  async getEventsByCourse(courseId: string, limit: number = 100): Promise<HygraphEvent[]> {
    try {
      const response = await hygraphClient.request(GET_EVENTS, {
        first: limit,
        skip: 0,
        where: { 
          course: { id: courseId },
          isActive: true
        }
      });
      return (response as any).events || [];
    } catch (error) {
      console.error('Error fetching events by course from Hygraph:', error);
      throw error;
    }
  },

  // Get events by creator
  async getEventsByCreator(creatorId: string, limit: number = 100): Promise<HygraphEvent[]> {
    try {
      const response = await hygraphClient.request(GET_EVENTS, {
        first: limit,
        skip: 0,
        where: { eventCreator: { id: creatorId } }
      });
      return (response as any).events || [];
    } catch (error) {
      console.error('Error fetching events by creator from Hygraph:', error);
      throw error;
    }
  },

  // Get upcoming events
  async getUpcomingEvents(limit: number = 50): Promise<HygraphEvent[]> {
    try {
      // For development, return mock data
      const mockEvents = await this.getEvents(100, 0, { isActive: true });
      const now = new Date().toISOString().split('T')[0];
      return mockEvents
        .filter(event => event.date >= now)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching upcoming events from Hygraph:', error);
      throw error;
    }
  },

  // Get events by date range
  async getEventsByDateRange(startDate: string, endDate: string, limit: number = 100): Promise<HygraphEvent[]> {
    try {
      const response = await hygraphClient.request(GET_EVENTS, {
        first: limit,
        skip: 0,
        where: {
          isActive: true,
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      return (response as any).events || [];
    } catch (error) {
      console.error('Error fetching events by date range from Hygraph:', error);
      throw error;
    }
  },

  // Get events by type
  async getEventsByType(eventType: string, limit: number = 100): Promise<HygraphEvent[]> {
    try {
      const response = await hygraphClient.request(GET_EVENTS, {
        first: limit,
        skip: 0,
        where: {
          eventType,
          isActive: true
        }
      });
      return (response as any).events || [];
    } catch (error) {
      console.error('Error fetching events by type from Hygraph:', error);
      throw error;
    }
  },

  // Get public events
  async getPublicEvents(limit: number = 50): Promise<HygraphEvent[]> {
    try {
      // For development, return mock data
      const mockEvents = await this.getEvents(100, 0, { isActive: true, isPublic: true });
      return mockEvents.slice(0, limit);
    } catch (error) {
      console.error('Error fetching public events from Hygraph:', error);
      throw error;
    }
  },

  // Get events requiring registration
  async getEventsRequiringRegistration(limit: number = 50): Promise<HygraphEvent[]> {
    try {
      const response = await hygraphClient.request(GET_EVENTS, {
        first: limit,
        skip: 0,
        where: {
          isActive: true,
          requiresRegistration: true
        }
      });
      return (response as any).events || [];
    } catch (error) {
      console.error('Error fetching events requiring registration from Hygraph:', error);
      throw error;
    }
  },

  // Create new event
  async createEvent(eventData: CreateEventData): Promise<HygraphEvent> {
    try {
      const now = new Date().toISOString();
      const response = await hygraphClient.request(CREATE_EVENT, {
        data: {
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          eventType: eventData.eventType,
          isRecurring: eventData.isRecurring || false,
          recurrencePattern: eventData.recurrencePattern,
          recurrenceEndDate: eventData.recurrenceEndDate,
          maxAttendees: eventData.maxAttendees,
          isActive: eventData.isActive !== false, // Default to true
          isPublic: eventData.isPublic || false,
          requiresRegistration: eventData.requiresRegistration || false,
          registrationDeadline: eventData.registrationDeadline,
          eventCreator: { connect: { id: eventData.eventCreator } },
          course: eventData.courseId ? { connect: { id: eventData.courseId } } : undefined
        }
      });
      return (response as any).createEvent;
    } catch (error) {
      console.error('Error creating event in Hygraph:', error);
      throw error;
    }
  },

  // Update event
  async updateEvent(id: string, eventData: UpdateEventData): Promise<HygraphEvent> {
    try {
      const updateData: any = { ...eventData };
      
      // Handle relationship updates
      if (eventData.courseId) {
        updateData.course = { connect: { id: eventData.courseId } };
        delete updateData.courseId;
      }

      const response = await hygraphClient.request(UPDATE_EVENT, {
        id,
        data: updateData
      });
      return (response as any).updateEvent;
    } catch (error) {
      console.error('Error updating event in Hygraph:', error);
      throw error;
    }
  },

  // Delete event
  async deleteEvent(id: string): Promise<boolean> {
    try {
      await hygraphClient.request(DELETE_EVENT, { id });
      return true;
    } catch (error) {
      console.error('Error deleting event from Hygraph:', error);
      throw error;
    }
  },

  // ===== EVENT MANAGEMENT =====

  // Activate/deactivate event
  async toggleActiveEvent(id: string, isActive: boolean): Promise<HygraphEvent> {
    try {
      return await this.updateEvent(id, { isActive });
    } catch (error) {
      console.error('Error toggling active status for event:', error);
      throw error;
    }
  },

  // Toggle public visibility
  async togglePublicEvent(id: string, isPublic: boolean): Promise<HygraphEvent> {
    try {
      return await this.updateEvent(id, { isPublic });
    } catch (error) {
      console.error('Error toggling public status for event:', error);
      throw error;
    }
  },

  // Toggle registration requirement
  async toggleRegistrationRequirement(id: string, requiresRegistration: boolean): Promise<HygraphEvent> {
    try {
      return await this.updateEvent(id, { requiresRegistration });
    } catch (error) {
      console.error('Error toggling registration requirement for event:', error);
      throw error;
    }
  },

  // Set registration deadline
  async setRegistrationDeadline(id: string, deadline: string): Promise<HygraphEvent> {
    try {
      return await this.updateEvent(id, { registrationDeadline: deadline });
    } catch (error) {
      console.error('Error setting registration deadline for event:', error);
      throw error;
    }
  },

  // ===== EVENT REGISTRATION =====

  // Register for event (simplified - in production, this would be more complex)
  async registerForEvent(eventId: string, attendeeId: string): Promise<boolean> {
    try {
      // This is a simplified implementation
      // In production, you'd need to handle:
      // - Check if event exists and is active
      // - Check if registration is required
      // - Check if registration deadline has passed
      // - Check if event is full
      // - Add attendee to event's attendees list
      // - Handle waitlist if event is full
      
      const event = await this.getEventById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (!event.isActive) {
        throw new Error('Event is not active');
      }

      if (event.requiresRegistration) {
        if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
          throw new Error('Registration deadline has passed');
        }

        if (event.maxAttendees && event.attendees && event.attendees.length >= event.maxAttendees) {
          throw new Error('Event is full');
        }
      }

      // For now, we'll just return true
      // In production, you'd update the event with the new attendee
      return true;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  },

  // Cancel event registration
  async cancelEventRegistration(eventId: string, attendeeId: string): Promise<boolean> {
    try {
      // Similar to registration, this would be more complex in production
      const event = await this.getEventById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // For now, we'll just return true
      return true;
    } catch (error) {
      console.error('Error cancelling event registration:', error);
      throw error;
    }
  },

  // ===== STATISTICS =====

  // Get event statistics
  async getEventStats(): Promise<{
    totalEvents: number;
    activeEvents: number;
    publicEvents: number;
    eventsRequiringRegistration: number;
    upcomingEvents: number;
    eventsByType: { [eventType: string]: number };
  }> {
    try {
      const [allEvents, activeEvents, publicEvents, registrationEvents, upcomingEvents] = await Promise.all([
        this.getEvents(1000, 0),
        this.getEvents(1000, 0, { isActive: true }),
        this.getEvents(1000, 0, { isPublic: true }),
        this.getEventsRequiringRegistration(1000),
        this.getUpcomingEvents(1000)
      ]);

      // Calculate events by type
      const eventsByType: { [eventType: string]: number } = {};
      allEvents.forEach(event => {
        eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      });

      return {
        totalEvents: allEvents.length,
        activeEvents: activeEvents.length,
        publicEvents: publicEvents.length,
        eventsRequiringRegistration: registrationEvents.length,
        upcomingEvents: upcomingEvents.length,
        eventsByType
      };
    } catch (error) {
      console.error('Error calculating event statistics:', error);
      throw error;
    }
  },

  // Get creator's event statistics
  async getCreatorEventStats(creatorId: string): Promise<{
    totalEvents: number;
    activeEvents: number;
    publicEvents: number;
    upcomingEvents: number;
    eventsByType: { [eventType: string]: number };
  }> {
    try {
      const [allEvents, activeEvents, publicEvents, upcomingEvents] = await Promise.all([
        this.getEventsByCreator(creatorId, 1000),
        this.getEvents(1000, 0, { eventCreator: creatorId, isActive: true }),
        this.getEvents(1000, 0, { eventCreator: creatorId, isPublic: true }),
        this.getEvents(1000, 0, { 
          eventCreator: creatorId, 
          isActive: true,
          dateFrom: new Date().toISOString().split('T')[0]
        })
      ]);

      // Calculate events by type
      const eventsByType: { [eventType: string]: number } = {};
      allEvents.forEach(event => {
        eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      });

      return {
        totalEvents: allEvents.length,
        activeEvents: activeEvents.length,
        publicEvents: publicEvents.length,
        upcomingEvents: upcomingEvents.length,
        eventsByType
      };
    } catch (error) {
      console.error('Error calculating creator event statistics:', error);
      throw error;
    }
  },

  // Get course event statistics
  async getCourseEventStats(courseId: string): Promise<{
    totalEvents: number;
    activeEvents: number;
    upcomingEvents: number;
    eventsByType: { [eventType: string]: number };
  }> {
    try {
      const [allEvents, activeEvents, upcomingEvents] = await Promise.all([
        this.getEventsByCourse(courseId, 1000),
        this.getEvents(1000, 0, { courseId, isActive: true }),
        this.getEvents(1000, 0, { 
          courseId, 
          isActive: true,
          dateFrom: new Date().toISOString().split('T')[0]
        })
      ]);

      // Calculate events by type
      const eventsByType: { [eventType: string]: number } = {};
      allEvents.forEach(event => {
        eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      });

      return {
        totalEvents: allEvents.length,
        activeEvents: activeEvents.length,
        upcomingEvents: upcomingEvents.length,
        eventsByType
      };
    } catch (error) {
      console.error('Error calculating course event statistics:', error);
      throw error;
    }
  }
};