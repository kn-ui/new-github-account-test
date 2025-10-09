import { Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { hygraphSupportTicketService, SupportTicketFilters } from '../services/hygraphSupportTicketService';
import { hygraphUserService } from '../services/hygraphUserService';
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendPaginatedResponse,
  sendServerError
} from '../utils/response';

export class SupportTicketController {
  // Create a new support ticket (authenticated users only)
  async createSupportTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        name, 
        email, 
        subject, 
        message, 
        priority, 
        category 
      } = req.body;
      const userId = req.user!.uid;

      // Validate required fields
      if (!name || !email || !subject || !message) {
        sendError(res, 'Missing required fields: name, email, subject, message');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        sendError(res, 'Invalid email format');
        return;
      }

      // Validate priority
      if (priority && !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
        sendError(res, 'Invalid priority. Must be LOW, MEDIUM, HIGH, or URGENT');
        return;
      }

      // Validate category
      if (category && !['TECHNICAL', 'ACADEMIC', 'ADMINISTRATIVE', 'GENERAL', 'BUG_REPORT', 'FEATURE_REQUEST'].includes(category)) {
        sendError(res, 'Invalid category. Must be TECHNICAL, ACADEMIC, ADMINISTRATIVE, GENERAL, BUG_REPORT, or FEATURE_REQUEST');
        return;
      }

      const ticketData = {
        name,
        email,
        subject,
        message,
        priority: priority || 'MEDIUM',
        category: category || 'GENERAL',
        userId
      };

      const newTicket = await hygraphSupportTicketService.createSupportTicket(ticketData);
      sendCreated(res, 'Support ticket created successfully', newTicket);
    } catch (error) {
      console.error('Create support ticket error:', error);
      sendServerError(res, 'Failed to create support ticket');
    }
  }

  // Get all support tickets (admin only)
  async getAllSupportTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const supportTicketStatus = req.query.status as string;
      const priority = req.query.priority as string;
      const category = req.query.category as string;
      const assignedToId = req.query.assignedTo as string;
      const userId = req.query.user as string;
      const searchTerm = req.query.search as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;
      const resolvedFrom = req.query.resolvedFrom as string;
      const resolvedTo = req.query.resolvedTo as string;

      const skip = (page - 1) * limit;
      const filters: SupportTicketFilters = {};

      if (supportTicketStatus) filters.supportTicketStatus = supportTicketStatus as any;
      if (priority) filters.priority = priority as any;
      if (category) filters.category = category as any;
      if (assignedToId) filters.assignedToId = assignedToId;
      if (userId) filters.userId = userId;
      if (searchTerm) filters.searchTerm = searchTerm;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      if (resolvedFrom) filters.resolvedFrom = resolvedFrom;
      if (resolvedTo) filters.resolvedTo = resolvedTo;

      const tickets = await hygraphSupportTicketService.getSupportTickets(limit, skip, filters);
      
      // For now, we'll get all tickets to calculate total. In production, implement count query
      const allTickets = await hygraphSupportTicketService.getSupportTickets(1000, 0, filters);
      const total = allTickets.length;

      sendPaginatedResponse(
        res,
        'Support tickets retrieved successfully',
        tickets,
        page,
        limit,
        total
      );
    } catch (error) {
      console.error('Get support tickets error:', error);
      sendServerError(res, 'Failed to retrieve support tickets');
    }
  }

  // Get support ticket by ID
  async getSupportTicketById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const userId = req.user!.uid;

      const ticket = await hygraphSupportTicketService.getSupportTicketById(ticketId);
      if (!ticket) {
        sendNotFound(res, 'Support ticket not found');
        return;
      }

      // Check permissions - users can only view their own tickets, admins can view all
      if (req.user!.role !== UserRole.ADMIN && ticket.user?.id !== userId) {
        sendError(res, 'You can only view your own support tickets');
        return;
      }

      sendSuccess(res, 'Support ticket retrieved successfully', ticket);
    } catch (error) {
      console.error('Get support ticket by ID error:', error);
      sendServerError(res, 'Failed to retrieve support ticket');
    }
  }

  // Update support ticket (admin only)
  async updateSupportTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const updateData = req.body;

      // Get existing ticket
      const existingTicket = await hygraphSupportTicketService.getSupportTicketById(ticketId);
      if (!existingTicket) {
        sendNotFound(res, 'Support ticket not found');
        return;
      }

      const updatedTicket = await hygraphSupportTicketService.updateSupportTicket(ticketId, updateData);
      sendSuccess(res, 'Support ticket updated successfully', updatedTicket);
    } catch (error) {
      console.error('Update support ticket error:', error);
      sendServerError(res, 'Failed to update support ticket');
    }
  }

  // ===== PUBLIC ENDPOINTS =====

  // Get user's support tickets
  async getUserSupportTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.uid;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const tickets = await hygraphSupportTicketService.getSupportTicketsByUser(userId, limit);
      
      sendPaginatedResponse(
        res,
        'Your support tickets retrieved successfully',
        tickets,
        page,
        limit,
        tickets.length
      );
    } catch (error) {
      console.error('Get user support tickets error:', error);
      sendServerError(res, 'Failed to retrieve your support tickets');
    }
  }

  // Get open support tickets
  async getOpenSupportTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const tickets = await hygraphSupportTicketService.getOpenSupportTickets(limit);
      sendSuccess(res, 'Open support tickets retrieved successfully', tickets);
    } catch (error) {
      console.error('Get open support tickets error:', error);
      sendServerError(res, 'Failed to retrieve open support tickets');
    }
  }

  // Get urgent support tickets
  async getUrgentSupportTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const tickets = await hygraphSupportTicketService.getUrgentSupportTickets(limit);
      sendSuccess(res, 'Urgent support tickets retrieved successfully', tickets);
    } catch (error) {
      console.error('Get urgent support tickets error:', error);
      sendServerError(res, 'Failed to retrieve urgent support tickets');
    }
  }

  // Search support tickets
  async searchSupportTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { searchTerm } = req.query;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!searchTerm) {
        sendError(res, 'Search term is required');
        return;
      }

      const tickets = await hygraphSupportTicketService.searchSupportTickets(searchTerm as string, limit);
      sendSuccess(res, 'Support tickets search results retrieved successfully', tickets);
    } catch (error) {
      console.error('Search support tickets error:', error);
      sendServerError(res, 'Failed to search support tickets');
    }
  }

  // ===== SUPPORT TICKET MANAGEMENT =====

  // Assign support ticket
  async assignSupportTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { assignedToId } = req.body;

      if (!assignedToId) {
        sendError(res, 'Assigned to ID is required');
        return;
      }

      // Verify assigned user exists
      const assignedUser = await hygraphUserService.getUserByUid(assignedToId);
      if (!assignedUser) {
        sendNotFound(res, 'Assigned user not found');
        return;
      }

      const updatedTicket = await hygraphSupportTicketService.assignSupportTicket(ticketId, assignedToId);
      sendSuccess(res, 'Support ticket assigned successfully', updatedTicket);
    } catch (error) {
      console.error('Assign support ticket error:', error);
      sendServerError(res, 'Failed to assign support ticket');
    }
  }

  // Change support ticket status
  async changeSupportTicketStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { status } = req.body;

      if (!status || !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
        sendError(res, 'Valid status is required (OPEN, IN_PROGRESS, RESOLVED, CLOSED)');
        return;
      }

      const updatedTicket = await hygraphSupportTicketService.changeSupportTicketStatus(ticketId, status);
      sendSuccess(res, `Support ticket status changed to ${status} successfully`, updatedTicket);
    } catch (error) {
      console.error('Change support ticket status error:', error);
      sendServerError(res, 'Failed to change support ticket status');
    }
  }

  // Resolve support ticket
  async resolveSupportTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { resolution } = req.body;

      if (!resolution) {
        sendError(res, 'Resolution is required');
        return;
      }

      const updatedTicket = await hygraphSupportTicketService.resolveSupportTicket(ticketId, resolution);
      sendSuccess(res, 'Support ticket resolved successfully', updatedTicket);
    } catch (error) {
      console.error('Resolve support ticket error:', error);
      sendServerError(res, 'Failed to resolve support ticket');
    }
  }

  // Close support ticket
  async closeSupportTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;

      const updatedTicket = await hygraphSupportTicketService.closeSupportTicket(ticketId);
      sendSuccess(res, 'Support ticket closed successfully', updatedTicket);
    } catch (error) {
      console.error('Close support ticket error:', error);
      sendServerError(res, 'Failed to close support ticket');
    }
  }

  // Change priority
  async changeSupportTicketPriority(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { priority } = req.body;

      if (!priority || !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
        sendError(res, 'Valid priority is required (LOW, MEDIUM, HIGH, URGENT)');
        return;
      }

      const updatedTicket = await hygraphSupportTicketService.changeSupportTicketPriority(ticketId, priority);
      sendSuccess(res, `Support ticket priority changed to ${priority} successfully`, updatedTicket);
    } catch (error) {
      console.error('Change support ticket priority error:', error);
      sendServerError(res, 'Failed to change support ticket priority');
    }
  }

  // Change category
  async changeSupportTicketCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { category } = req.body;

      if (!category || !['TECHNICAL', 'ACADEMIC', 'ADMINISTRATIVE', 'GENERAL', 'BUG_REPORT', 'FEATURE_REQUEST'].includes(category)) {
        sendError(res, 'Valid category is required (TECHNICAL, ACADEMIC, ADMINISTRATIVE, GENERAL, BUG_REPORT, FEATURE_REQUEST)');
        return;
      }

      const updatedTicket = await hygraphSupportTicketService.changeSupportTicketCategory(ticketId, category);
      sendSuccess(res, `Support ticket category changed to ${category} successfully`, updatedTicket);
    } catch (error) {
      console.error('Change support ticket category error:', error);
      sendServerError(res, 'Failed to change support ticket category');
    }
  }

  // ===== STATISTICS =====

  // Get support ticket statistics (admin only)
  async getSupportTicketStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await hygraphSupportTicketService.getSupportTicketStats();
      sendSuccess(res, 'Support ticket statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get support ticket stats error:', error);
      sendServerError(res, 'Failed to retrieve support ticket statistics');
    }
  }

  // Get agent's support ticket statistics
  async getAgentSupportTicketStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const agentId = req.user!.uid;
      const stats = await hygraphSupportTicketService.getAgentSupportTicketStats(agentId);
      sendSuccess(res, 'Agent support ticket statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get agent support ticket stats error:', error);
      sendServerError(res, 'Failed to retrieve agent support ticket statistics');
    }
  }
}

export default new SupportTicketController();