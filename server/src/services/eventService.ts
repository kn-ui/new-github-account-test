import { hygraphClient } from '../config/hygraph';
import { gql } from 'graphql-request';
import { EventItem } from '../types';

class EventService {
  
  async getEvents(page = 1, limit = 50, type?: string, month?: string): Promise<{ events: EventItem[]; total: number; }> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const whereConditions: string[] = [];
      if (type) whereConditions.push(`type: ${type}`);
      if (month) {
        whereConditions.push(`date_gte: "${month}-01"`);
        whereConditions.push(`date_lte: "${month}-31"`);
      }

      const whereClause = whereConditions.length > 0 ? `where: { ${whereConditions.join(', ')} }` : '';

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
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        eventsConnection: {
          edges: { node: EventItem }[];
          aggregate: { count: number };
        };
      }>(query, { first: limit, skip });

      const events = response.eventsConnection.edges.map(edge => edge.node);
      const total = response.eventsConnection.aggregate.count;

      return { events, total };
    } catch (error) {
      console.error('Error getting events:', error);
      return { events: [], total: 0 };
    }
  }

  async createEvent(eventData: Partial<EventItem>): Promise<EventItem> {
    try {
      const mutation = gql`
        mutation CreateEvent(
          $title: String!
          $date: Date!
          $time: String!
          $type: EventType!
          $location: String!
          $description: String
        ) {
          createEvent(data: {
            title: $title
            date: $date
            time: $time
            type: $type
            location: $location
            description: $description
          }) {
            id
            title
            date
            time
            type
            location
            description
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        title: eventData.title || 'Untitled Event',
        date: eventData.date || new Date().toISOString().split('T')[0],
        time: eventData.time || '00:00',
        type: eventData.type || 'academic',
        location: eventData.location || 'TBD',
        description: eventData.description || null
      };

      const response = await hygraphClient.request<{ createEvent: EventItem }>(mutation, variables);
      return response.createEvent;
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
            createdAt
            updatedAt
          }
        }
      `;

      // Filter out undefined values
      const data: Record<string, any> = {};
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          data[key] = value;
        }
      });

      const response = await hygraphClient.request<{ updateEvent: EventItem }>(mutation, {
        id: eventId,
        data
      });

      return response.updateEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event');
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const mutation = gql`
        mutation DeleteEvent($id: ID!) {
          deleteEvent(where: { id: $id }) { id }
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
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ event: EventItem | null }>(query, { id: eventId });
      return response.event;
    } catch (error) {
      console.error('Error getting event:', error);
      throw new Error('Failed to get event');
    }
  }
}

export default new EventService();