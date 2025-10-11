import { Router } from 'express';
import certificateController from '../controllers/certificateController';
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
// Note: In production, you might want to add some public certificate verification endpoints

// Protected routes (authentication required)
router.use(authenticateToken);

// Public certificate verification (no auth required for verification)
router.get('/verify/:certificateNumber', certificateController.getCertificateByNumber);

// User routes
router.get('/my-certificates', validatePagination, certificateController.getUserCertificates);

// Certificate routes
router.get('/:certificateId', certificateController.getCertificateById);

// Public certificate routes
router.get('/issued', certificateController.getIssuedCertificates);
router.get('/verified', certificateController.getVerifiedCertificates);
router.get('/type/:type', certificateController.getCertificatesByType);
router.get('/search', certificateController.searchCertificates);

// Management routes (admin only)
router.post('/', requireAdmin, certificateController.createCertificate);
router.put('/:certificateId', requireAdmin, certificateController.updateCertificate);
router.delete('/:certificateId', requireAdmin, certificateController.deleteCertificate);
router.patch('/:certificateId/issue', requireAdmin, certificateController.issueCertificate);
router.patch('/:certificateId/verify', requireAdmin, certificateController.verifyCertificate);
router.patch('/:certificateId/revoke', requireAdmin, certificateController.revokeCertificate);
router.patch('/:certificateId/generate-code', requireAdmin, certificateController.generateVerificationCode);

// Statistics routes
router.get('/stats/user', certificateController.getUserCertificateStats);

// Admin only routes
router.get('/', requireAdmin, validatePagination, certificateController.getAllCertificates);
router.get('/stats/overview', requireAdmin, certificateController.getCertificateStats);

export default router;