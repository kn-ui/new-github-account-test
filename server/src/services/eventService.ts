import { hygraphClient } from '../config/hygraph';
import { gql } from 'graphql-request';
import { EventItem } from '../types';

class EventService {
  
  async getEvents(page = 1, limit = 50, type?: string, month?: string): Promise<{ events: EventItem[]; total: number; }> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const whereConditions: string[] = ['isActive: true'];
      if (type) whereConditions.push(`type: "${type}"`);
      if (month) {
        whereConditions.push(`date_gte: "${month}-01T00:00:00.000Z"`);
        whereConditions.push(`date_lte: "${month}-31T23:59:59.999Z"`);
      }

      const whereClause = `where: { ${whereConditions.join(', ')} }`;

      const query = gql`
        query GetEvents($first: Int!, $skip: Int!) {
          eventsConnection(${whereClause}, first: $first, skip: $skip, orderBy: date_ASC) {
            aggregate { count }
            edges {
              node {
                id
                title
                date
                time
                type
                location
                description
                status
                maxAttendees
                currentAttendees
                isActive
                createdBy
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        eventsConnection: {
          edges: { node: any }[];
          aggregate: { count: number };
        };
      }>(query, { first: limit, skip });

      const events: EventItem[] = response.eventsConnection.edges.map(edge => {
        const event = edge.node;
        return {
          id: event.id,
          title: event.title,
          date: event.date.split('T')[0], // Convert to YYYY-MM-DD format
          time: event.time,
          type: event.type,
          location: event.location,
          description: event.description,
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt)
        };
      });
      
      const total = response.eventsConnection.aggregate.count;

      return { events, total };
    } catch (error) {
      console.error('Error getting events:', error);
      return { events: [], total: 0 };
    }
  }

  async createEvent(eventData: Partial<EventItem & { createdBy: string }>): Promise<EventItem> {
    try {
      const mutation = gql`
        mutation CreateEvent(
          $title: String!
          $date: DateTime!
          $time: String!
          $type: String!
          $location: String!
          $description: String!
          $createdBy: String!
          $maxAttendees: Int!
          $status: EventStatus!
        ) {
          createEvent(data: {
            title: $title
            date: $date
            time: $time
            type: $type
            location: $location
            description: $description
            createdBy: $createdBy
            maxAttendees: $maxAttendees
            currentAttendees: 0
            status: $status
            isActive: true
          }) {
            id
            title
            date
            time
            type
            location
            description
            status
            maxAttendees
            currentAttendees
            isActive
            createdBy
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        title: eventData.title || 'Untitled Event',
        date: eventData.date ? `${eventData.date}T${eventData.time || '00:00'}:00.000Z` : new Date().toISOString(),
        time: eventData.time || '00:00',
        type: eventData.type || 'academic',
        location: eventData.location || 'TBD',
        description: eventData.description || '',
        createdBy: eventData.createdBy || 'system',
        maxAttendees: 100,
        status: 'UPCOMING'
      };

      const response = await hygraphClient.request<{ createEvent: any }>(mutation, variables);
      
      const event = response.createEvent;
      return {
        id: event.id,
        title: event.title,
        date: event.date.split('T')[0],
        time: event.time,
        type: event.type,
        location: event.location,
        description: event.description,
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt)
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  }

  async updateEvent(eventId: string, updateData: Partial<EventItem>): Promise<EventItem> {
    try {
      const mutation = gql`
        mutation UpdateEvent($id: ID!, $data: EventUpdateInput!) {
          updateEvent(where: { id: $id }, data: $data) {
            id
            title
            date
            time
            type
            location
            description
            status
            maxAttendees
            currentAttendees
            isActive
            createdBy
            createdAt
            updatedAt
          }
        }
      `;

      // Filter out undefined values and format date if provided
      const data: Record<string, any> = {};
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'date' && updateData.time) {
            data.date = `${value}T${updateData.time}:00.000Z`;
          } else if (key !== 'time' || !updateData.date) {
            data[key] = value;
          }
        }
      });

      const response = await hygraphClient.request<{ updateEvent: any }>(mutation, {
        id: eventId,
        data
      });

      const event = response.updateEvent;
      return {
        id: event.id,
        title: event.title,
        date: event.date.split('T')[0],
        time: event.time,
        type: event.type,
        location: event.location,
        description: event.description,
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt)
      };
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event');
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const mutation = gql`
        mutation DeleteEvent($id: ID!) {
          updateEvent(where: { id: $id }, data: { isActive: false }) { 
            id 
          }
        }
      `;

      await hygraphClient.request(mutation, { id: eventId });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event');
    }
  }

  async getEventById(eventId: string): Promise<EventItem | null> {
    try {
      const query = gql`
        query GetEvent($id: ID!) {
          event(where: { id: $id }) {
            id
            title
            date
            time
            type
            location
            description
            status
            maxAttendees
            currentAttendees
            isActive
            createdBy
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ event: any | null }>(query, { id: eventId });
      
      if (!response.event) return null;

      const event = response.event;
      return {
        id: event.id,
        title: event.title,
        date: event.date.split('T')[0],
        time: event.time,
        type: event.type,
        location: event.location,
        description: event.description,
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt)
      };
    } catch (error) {
      console.error('Error getting event:', error);
      throw new Error('Failed to get event');
    }
  }
}

export default new EventService();