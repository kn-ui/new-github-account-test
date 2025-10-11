import { Router } from 'express';
import supportTicketController from '../controllers/supportTicketController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin } from '../middleware/clerkAuth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Test endpoint that doesn't require authentication (temporary)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Support Tickets test endpoint working',
    data: {
      tickets: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@school.edu',
          subject: 'Login Issues',
          message: 'I am unable to log into my account. I keep getting an error message.',
          supportTicketStatus: 'OPEN',
          priority: 'HIGH',
          category: 'TECHNICAL',
          user: {
            id: 'student1',
            displayName: 'John Doe',
            email: 'john@school.edu'
          }
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@school.edu',
          subject: 'Assignment Submission Problem',
          message: 'I cannot submit my assignment through the online portal. The submit button is not working.',
          supportTicketStatus: 'IN_PROGRESS',
          priority: 'MEDIUM',
          category: 'ACADEMIC',
          assignedTo: {
            id: 'teacher1',
            displayName: 'Dr. Johnson',
            email: 'johnson@school.edu'
          },
          user: {
            id: 'student2',
            displayName: 'Jane Smith',
            email: 'jane@school.edu'
          }
        },
        {
          id: '3',
          name: 'Mike Wilson',
          email: 'mike@school.edu',
          subject: 'Grade Inquiry',
          message: 'I would like to discuss my recent exam grade. I believe there might be an error in the grading.',
          supportTicketStatus: 'RESOLVED',
          priority: 'LOW',
          category: 'ACADEMIC',
          resolvedAt: new Date().toISOString(),
          resolution: 'Grade reviewed and corrected. Student notified via email.',
          assignedTo: {
            id: 'teacher2',
            displayName: 'Prof. Davis',
            email: 'davis@school.edu'
          },
          user: {
            id: 'student3',
            displayName: 'Mike Wilson',
            email: 'mike@school.edu'
          }
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1
      }
    }
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