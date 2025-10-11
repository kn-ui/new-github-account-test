import { Router } from 'express';
import supportTicketController from '../controllers/supportTicketController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin } from '../middleware/clerkAuth';
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
// Note: In production, you might want to add some public support ticket endpoints

// Protected routes (authentication required)
router.use(authenticateToken);

// User routes
router.get('/my-tickets', validatePagination, supportTicketController.getUserSupportTickets);
router.post('/', supportTicketController.createSupportTicket);

// Support ticket routes
router.get('/:ticketId', supportTicketController.getSupportTicketById);

// Admin/Support agent routes
router.get('/open', supportTicketController.getOpenSupportTickets);
router.get('/urgent', supportTicketController.getUrgentSupportTickets);
router.get('/search', supportTicketController.searchSupportTickets);

// Management routes
router.put('/:ticketId', requireAdmin, supportTicketController.updateSupportTicket);
router.patch('/:ticketId/assign', requireAdmin, supportTicketController.assignSupportTicket);
router.patch('/:ticketId/status', requireAdmin, supportTicketController.changeSupportTicketStatus);
router.patch('/:ticketId/resolve', requireAdmin, supportTicketController.resolveSupportTicket);
router.patch('/:ticketId/close', requireAdmin, supportTicketController.closeSupportTicket);
router.patch('/:ticketId/priority', requireAdmin, supportTicketController.changeSupportTicketPriority);
router.patch('/:ticketId/category', requireAdmin, supportTicketController.changeSupportTicketCategory);

// Statistics routes
router.get('/stats/agent', supportTicketController.getAgentSupportTicketStats);

// Admin only routes
router.get('/', requireAdmin, validatePagination, supportTicketController.getAllSupportTickets);
router.get('/stats/overview', requireAdmin, supportTicketController.getSupportTicketStats);

export default router;