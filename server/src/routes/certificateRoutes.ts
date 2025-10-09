import { Router } from 'express';
import certificateController from '../controllers/certificateController';
import { authenticateClerkToken as authenticateToken, requireAdmin, requireTeacherOrAdmin } from '../middleware/clerkAuth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Test endpoint that doesn't require authentication (temporary)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Certificates test endpoint working',
    data: {
      certificates: [
        {
          id: '1',
          type: 'COURSE_COMPLETION',
          title: 'Certificate of Completion - Algebra I',
          description: 'This certificate is awarded to students who have successfully completed the Algebra I course.',
          period: {
            startDate: '2025-01-15',
            endDate: '2025-05-15',
            academicYear: '2024-2025',
            semester: 'Spring'
          },
          details: {
            courseName: 'Algebra I',
            grade: 'A',
            gpa: 3.8,
            completionDate: '2025-05-15',
            achievements: ['Perfect Attendance', 'Top Performer']
          },
          status: 'VERIFIED',
          certificateNumber: 'CERT-ABC123-DEF456',
          issuedAt: '2025-05-16T10:00:00Z',
          verifiedAt: '2025-05-16T10:30:00Z',
          issuedBy: {
            id: 'teacher1',
            displayName: 'Dr. Smith',
            email: 'smith@school.edu'
          },
          user: {
            id: 'student1',
            displayName: 'John Doe',
            email: 'john@school.edu'
          },
          course: {
            id: 'course1',
            title: 'Algebra I'
          },
          verificationCode: 'ABC12345'
        },
        {
          id: '2',
          type: 'ACADEMIC_EXCELLENCE',
          title: 'Academic Excellence Award',
          description: 'Awarded to students who demonstrate outstanding academic performance.',
          period: {
            startDate: '2025-01-15',
            endDate: '2025-05-15',
            academicYear: '2024-2025',
            semester: 'Spring'
          },
          details: {
            gpa: 3.9,
            achievements: ['Honor Roll', 'Perfect Attendance', 'Leadership']
          },
          status: 'ISSUED',
          certificateNumber: 'CERT-XYZ789-GHI012',
          issuedAt: '2025-05-16T11:00:00Z',
          issuedBy: {
            id: 'admin1',
            displayName: 'School Administration',
            email: 'admin@school.edu'
          },
          user: {
            id: 'student2',
            displayName: 'Jane Smith',
            email: 'jane@school.edu'
          }
        },
        {
          id: '3',
          type: 'PERFECT_ATTENDANCE',
          title: 'Perfect Attendance Certificate',
          description: 'Awarded to students with 100% attendance record.',
          period: {
            startDate: '2025-01-15',
            endDate: '2025-05-15',
            academicYear: '2024-2025',
            semester: 'Spring'
          },
          details: {
            attendanceRate: 100,
            achievements: ['Perfect Attendance']
          },
          status: 'VERIFIED',
          certificateNumber: 'CERT-MNO345-PQR678',
          issuedAt: '2025-05-16T12:00:00Z',
          verifiedAt: '2025-05-16T12:15:00Z',
          issuedBy: {
            id: 'teacher2',
            displayName: 'Prof. Johnson',
            email: 'johnson@school.edu'
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