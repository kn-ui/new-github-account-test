import { hygraphClient } from '../config/hygraph';
import {
  GET_SUPPORT_TICKETS,
  CREATE_SUPPORT_TICKET,
  UPDATE_SUPPORT_TICKET
} from '../lib/hygraphOperations';

// Types for Hygraph data
export interface HygraphSupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  supportTicketStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'TECHNICAL' | 'ACADEMIC' | 'ADMINISTRATIVE' | 'GENERAL' | 'BUG_REPORT' | 'FEATURE_REQUEST';
  assignedTo?: {
    id: string;
    displayName: string;
    email: string;
  };
  user?: {
    id: string;
    displayName: string;
    email: string;
  };
  resolvedAt?: string;
  closedAt?: string;
  resolution?: string;
  attachments?: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: string;
  }[];
  comments?: {
    id: string;
    content: string;
    author: {
      id: string;
      displayName: string;
    };
    isInternal: boolean;
  }[];
}

export interface CreateSupportTicketData {
  name: string;
  email: string;
  subject: string;
  message: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: 'TECHNICAL' | 'ACADEMIC' | 'ADMINISTRATIVE' | 'GENERAL' | 'BUG_REPORT' | 'FEATURE_REQUEST';
  userId?: string;
  supportTicketStatus?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
}

export interface UpdateSupportTicketData {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  supportTicketStatus?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: 'TECHNICAL' | 'ACADEMIC' | 'ADMINISTRATIVE' | 'GENERAL' | 'BUG_REPORT' | 'FEATURE_REQUEST';
  assignedToId?: string;
  resolution?: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface SupportTicketFilters {
  supportTicketStatus?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: 'TECHNICAL' | 'ACADEMIC' | 'ADMINISTRATIVE' | 'GENERAL' | 'BUG_REPORT' | 'FEATURE_REQUEST';
  assignedToId?: string;
  userId?: string;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  resolvedFrom?: string;
  resolvedTo?: string;
}

// Hygraph Support Ticket Service for Backend
export const hygraphSupportTicketService = {
  // ===== SUPPORT TICKET OPERATIONS =====
  
  // Get all support tickets with pagination and filters
  async getSupportTickets(
    limit: number = 100, 
    offset: number = 0, 
    filters?: SupportTicketFilters
  ): Promise<HygraphSupportTicket[]> {
    try {
      const where: any = {};
      
      if (filters) {
        if (filters.supportTicketStatus) where.supportTicketStatus = filters.supportTicketStatus;
        if (filters.priority) where.priority = filters.priority;
        if (filters.category) where.category = filters.category;
        if (filters.assignedToId) where.assignedTo = { id: filters.assignedToId };
        if (filters.userId) where.user = { id: filters.userId };
        
        if (filters.searchTerm) {
          where.OR = [
            { subject_contains: filters.searchTerm },
            { message_contains: filters.searchTerm },
            { name_contains: filters.searchTerm }
          ];
        }
        

        
        if (filters.resolvedFrom || filters.resolvedTo) {
          where.resolvedAt = {};
          if (filters.resolvedFrom) where.resolvedAt.gte = filters.resolvedFrom;
          if (filters.resolvedTo) where.resolvedAt.lte = filters.resolvedTo;
        }
      }

      const response = await hygraphClient.request(GET_SUPPORT_TICKETS, {
        first: limit,
        skip: offset,
        where
      });
      return (response as any).supportTickets || [];
    } catch (error) {
      console.error('Error fetching support tickets from Hygraph:', error);
      throw error;
    }
  },

  // Get support ticket by ID
  async getSupportTicketById(id: string): Promise<HygraphSupportTicket | null> {
    try {
      const response = await hygraphClient.request(GET_SUPPORT_TICKETS, {
        first: 1,
        skip: 0,
        where: { id }
      });
      const tickets = (response as any).supportTickets || [];
      return tickets.length > 0 ? tickets[0] : null;
    } catch (error) {
      console.error('Error fetching support ticket by ID from Hygraph:', error);
      throw error;
    }
  },

  // Get support tickets by user
  async getSupportTicketsByUser(userId: string, limit: number = 100): Promise<HygraphSupportTicket[]> {
    try {
      const response = await hygraphClient.request(GET_SUPPORT_TICKETS, {
        first: limit,
        skip: 0,
        where: { user: { id: userId } }
      });
      return (response as any).supportTickets || [];
    } catch (error) {
      console.error('Error fetching support tickets by user from Hygraph:', error);
      throw error;
    }
  },

  // Get support tickets by assigned agent
  async getSupportTicketsByAssignedAgent(assignedToId: string, limit: number = 100): Promise<HygraphSupportTicket[]> {
    try {
      const response = await hygraphClient.request(GET_SUPPORT_TICKETS, {
        first: limit,
        skip: 0,
        where: { assignedTo: { id: assignedToId } }
      });
      return (response as any).supportTickets || [];
    } catch (error) {
      console.error('Error fetching support tickets by assigned agent from Hygraph:', error);
      throw error;
    }
  },

  // Get support tickets by status
  async getSupportTicketsByStatus(status: string, limit: number = 100): Promise<HygraphSupportTicket[]> {
    try {
      const response = await hygraphClient.request(GET_SUPPORT_TICKETS, {
        first: limit,
        skip: 0,
        where: { supportTicketStatus: status }
      });
      return (response as any).supportTickets || [];
    } catch (error) {
      console.error('Error fetching support tickets by status from Hygraph:', error);
      throw error;
    }
  },

  // Get support tickets by priority
  async getSupportTicketsByPriority(priority: string, limit: number = 100): Promise<HygraphSupportTicket[]> {
    try {
      const response = await hygraphClient.request(GET_SUPPORT_TICKETS, {
        first: limit,
        skip: 0,
        where: { priority }
      });
      return (response as any).supportTickets || [];
    } catch (error) {
      console.error('Error fetching support tickets by priority from Hygraph:', error);
      throw error;
    }
  },

  // Get support tickets by category
  async getSupportTicketsByCategory(category: string, limit: number = 100): Promise<HygraphSupportTicket[]> {
    try {
      const response = await hygraphClient.request(GET_SUPPORT_TICKETS, {
        first: limit,
        skip: 0,
        where: { category }
      });
      return (response as any).supportTickets || [];
    } catch (error) {
      console.error('Error fetching support tickets by category from Hygraph:', error);
      throw error;
    }
  },

  // Get open support tickets
  async getOpenSupportTickets(limit: number = 50): Promise<HygraphSupportTicket[]> {
    try {
      const response = await hygraphClient.request(GET_SUPPORT_TICKETS, {
        first: limit,
        skip: 0,
        where: { 
          supportTicketStatus: 'OPEN'
        }
      });
      return (response as any).supportTickets || [];
    } catch (error) {
      console.error('Error fetching open support tickets from Hygraph:', error);
      throw error;
    }
  },

  // Get urgent support tickets
  async getUrgentSupportTickets(limit: number = 50): Promise<HygraphSupportTicket[]> {
    try {
      const response = await hygraphClient.request(GET_SUPPORT_TICKETS, {
        first: limit,
        skip: 0,
        where: { 
          priority: 'URGENT',
          supportTicketStatus: { in: ['OPEN', 'IN_PROGRESS'] }
        }
      });
      return (response as any).supportTickets || [];
    } catch (error) {
      console.error('Error fetching urgent support tickets from Hygraph:', error);
      throw error;
    }
  },

  // Search support tickets
  async searchSupportTickets(searchTerm: string, limit: number = 50): Promise<HygraphSupportTicket[]> {
    try {
      const response = await hygraphClient.request(GET_SUPPORT_TICKETS, {
        first: limit,
        skip: 0,
        where: {
          OR: [
            { subject_contains: searchTerm },
            { message_contains: searchTerm },
            { name_contains: searchTerm },
            { email_contains: searchTerm }
          ]
        }
      });
      return (response as any).supportTickets || [];
    } catch (error) {
      console.error('Error searching support tickets from Hygraph:', error);
      throw error;
    }
  },

  // Create new support ticket
  async createSupportTicket(ticketData: CreateSupportTicketData): Promise<HygraphSupportTicket> {
    try {
      const response = await hygraphClient.request(CREATE_SUPPORT_TICKET, {
        data: {
          name: ticketData.name,
          email: ticketData.email,
          subject: ticketData.subject,
          message: ticketData.message,
          priority: ticketData.priority || 'MEDIUM',
          category: ticketData.category || 'GENERAL',
          supportTicketStatus: ticketData.supportTicketStatus || 'OPEN',
          user: ticketData.userId ? { connect: { id: ticketData.userId } } : undefined
        }
      });
      return (response as any).createSupportTicket;
    } catch (error) {
      console.error('Error creating support ticket in Hygraph:', error);
      throw error;
    }
  },

  // Update support ticket
  async updateSupportTicket(id: string, ticketData: UpdateSupportTicketData): Promise<HygraphSupportTicket> {
    try {
      const updateData: any = { 
        ...ticketData
      };

      // Handle assignment
      if (ticketData.assignedToId) {
        updateData.assignedTo = { connect: { id: ticketData.assignedToId } };
        delete updateData.assignedToId;
      }

      // Handle status changes
      if (ticketData.supportTicketStatus === 'RESOLVED' && !ticketData.resolution) {
        updateData.resolvedAt = new Date().toISOString();
      }
      
      if (ticketData.supportTicketStatus === 'CLOSED') {
        updateData.closedAt = new Date().toISOString();
      }

      const response = await hygraphClient.request(UPDATE_SUPPORT_TICKET, {
        id,
        data: updateData
      });
      return (response as any).updateSupportTicket;
    } catch (error) {
      console.error('Error updating support ticket in Hygraph:', error);
      throw error;
    }
  },

  // ===== SUPPORT TICKET MANAGEMENT =====

  // Assign support ticket
  async assignSupportTicket(id: string, assignedToId: string): Promise<HygraphSupportTicket> {
    try {
      return await this.updateSupportTicket(id, { 
        assignedToId,
        supportTicketStatus: 'IN_PROGRESS'
      });
    } catch (error) {
      console.error('Error assigning support ticket:', error);
      throw error;
    }
  },

  // Change support ticket status
  async changeSupportTicketStatus(id: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'): Promise<HygraphSupportTicket> {
    try {
      const updateData: any = { supportTicketStatus: status };
      
      if (status === 'RESOLVED') {
        updateData.resolvedAt = new Date().toISOString();
      }
      
      if (status === 'CLOSED') {
        updateData.closedAt = new Date().toISOString();
      }

      return await this.updateSupportTicket(id, updateData);
    } catch (error) {
      console.error('Error changing support ticket status:', error);
      throw error;
    }
  },

  // Resolve support ticket
  async resolveSupportTicket(id: string, resolution: string): Promise<HygraphSupportTicket> {
    try {
      return await this.updateSupportTicket(id, {
        supportTicketStatus: 'RESOLVED',
        resolution,
        resolvedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error resolving support ticket:', error);
      throw error;
    }
  },

  // Close support ticket
  async closeSupportTicket(id: string): Promise<HygraphSupportTicket> {
    try {
      return await this.updateSupportTicket(id, {
        supportTicketStatus: 'CLOSED',
        closedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error closing support ticket:', error);
      throw error;
    }
  },

  // Change priority
  async changeSupportTicketPriority(id: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'): Promise<HygraphSupportTicket> {
    try {
      return await this.updateSupportTicket(id, { priority });
    } catch (error) {
      console.error('Error changing support ticket priority:', error);
      throw error;
    }
  },

  // Change category
  async changeSupportTicketCategory(id: string, category: 'TECHNICAL' | 'ACADEMIC' | 'ADMINISTRATIVE' | 'GENERAL' | 'BUG_REPORT' | 'FEATURE_REQUEST'): Promise<HygraphSupportTicket> {
    try {
      return await this.updateSupportTicket(id, { category });
    } catch (error) {
      console.error('Error changing support ticket category:', error);
      throw error;
    }
  },

  // ===== STATISTICS =====

  // Get support ticket statistics
  async getSupportTicketStats(): Promise<{
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    urgentTickets: number;
    ticketsByPriority: { [priority: string]: number };
    ticketsByCategory: { [category: string]: number };
    ticketsByStatus: { [status: string]: number };
  }> {
    try {
      const [allTickets, openTickets, inProgressTickets, resolvedTickets, closedTickets, urgentTickets] = await Promise.all([
        this.getSupportTickets(1000, 0),
        this.getSupportTicketsByStatus('OPEN', 1000),
        this.getSupportTicketsByStatus('IN_PROGRESS', 1000),
        this.getSupportTicketsByStatus('RESOLVED', 1000),
        this.getSupportTicketsByStatus('CLOSED', 1000),
        this.getUrgentSupportTickets(1000)
      ]);

      // Calculate tickets by priority
      const ticketsByPriority: { [priority: string]: number } = {};
      allTickets.forEach(ticket => {
        const priority = ticket.priority || 'MEDIUM';
        ticketsByPriority[priority] = (ticketsByPriority[priority] || 0) + 1;
      });

      // Calculate tickets by category
      const ticketsByCategory: { [category: string]: number } = {};
      allTickets.forEach(ticket => {
        const category = ticket.category || 'GENERAL';
        ticketsByCategory[category] = (ticketsByCategory[category] || 0) + 1;
      });

      // Calculate tickets by status
      const ticketsByStatus: { [status: string]: number } = {};
      allTickets.forEach(ticket => {
        const status = ticket.supportTicketStatus;
        ticketsByStatus[status] = (ticketsByStatus[status] || 0) + 1;
      });

      // Calculate average resolution time - NOT POSSIBLE WITHOUT createdAt
      // The averageResolutionTime will be 0 as createdAt is no longer available.
      const averageResolutionTime = 0;

      return {
        totalTickets: allTickets.length,
        openTickets: openTickets.length,
        inProgressTickets: inProgressTickets.length,
        resolvedTickets: resolvedTickets.length,
        closedTickets: closedTickets.length,
        urgentTickets: urgentTickets.length,
        ticketsByPriority,
        ticketsByCategory,
        ticketsByStatus
      };
    } catch (error) {
      console.error('Error calculating support ticket statistics:', error);
      throw error;
    }
  },

  // Get agent's support ticket statistics
  async getAgentSupportTicketStats(agentId: string): Promise<{
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    ticketsByPriority: { [priority: string]: number };
    ticketsByCategory: { [category: string]: number };
  }> {
    try {
      const [allTickets, openTickets, inProgressTickets, resolvedTickets, closedTickets] = await Promise.all([
        this.getSupportTicketsByAssignedAgent(agentId, 1000),
        this.getSupportTickets(1000, 0, { assignedToId: agentId, supportTicketStatus: 'OPEN' }),
        this.getSupportTickets(1000, 0, { assignedToId: agentId, supportTicketStatus: 'IN_PROGRESS' }),
        this.getSupportTickets(1000, 0, { assignedToId: agentId, supportTicketStatus: 'RESOLVED' }),
        this.getSupportTickets(1000, 0, { assignedToId: agentId, supportTicketStatus: 'CLOSED' })
      ]);

      // Calculate tickets by priority
      const ticketsByPriority: { [priority: string]: number } = {};
      allTickets.forEach(ticket => {
        const priority = ticket.priority || 'MEDIUM';
        ticketsByPriority[priority] = (ticketsByPriority[priority] || 0) + 1;
      });

      // Calculate tickets by category
      const ticketsByCategory: { [category: string]: number } = {};
      allTickets.forEach(ticket => {
        const category = ticket.category || 'GENERAL';
        ticketsByCategory[category] = (ticketsByCategory[category] || 0) + 1;
      });

      return {
        totalTickets: allTickets.length,
        openTickets: openTickets.length,
        inProgressTickets: inProgressTickets.length,
        resolvedTickets: resolvedTickets.length,
        closedTickets: closedTickets.length,
        ticketsByPriority,
        ticketsByCategory
      };
    } catch (error) {
      console.error('Error calculating agent support ticket statistics:', error);
      throw error;
    }
  }
};