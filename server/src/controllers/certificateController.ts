import { Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { hygraphCertificateService, CertificateFilters } from '../services/hygraphCertificateService';
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

export class CertificateController {
  // Create a new certificate (admin only)
  async createCertificate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        type, 
        title, 
        description, 
        period, 
        details, 
        status, 
        userId, 
        courseId, 
        templateId 
      } = req.body;
      const issuedById = req.user!.uid;

      // Validate required fields
      if (!type || !title || !userId) {
        sendError(res, 'Missing required fields: type, title, userId');
        return;
      }

      // Validate certificate type
      const validTypes = ['TOP_PERFORMER', 'PERFECT_ATTENDANCE', 'HOMEWORK_HERO', 'COURSE_COMPLETION', 'ACADEMIC_EXCELLENCE', 'LEADERSHIP', 'PARTICIPATION', 'ACHIEVEMENT'];
      if (!validTypes.includes(type)) {
        sendError(res, 'Invalid certificate type. Must be one of: ' + validTypes.join(', '));
        return;
      }

      // Validate status
      if (status && !['DRAFT', 'ISSUED', 'VERIFIED', 'REVOKED'].includes(status)) {
        sendError(res, 'Invalid status. Must be DRAFT, ISSUED, VERIFIED, or REVOKED');
        return;
      }

      // Verify user exists
      const user = await hygraphUserService.getUserByUid(userId);
      if (!user) {
        sendNotFound(res, 'User not found');
        return;
      }

      // Verify course exists if provided
      if (courseId) {
        const course = await hygraphCourseService.getCourseById(courseId);
        if (!course) {
          sendNotFound(res, 'Course not found');
          return;
        }
      }

      const certificateData = {
        type,
        title,
        description,
        period,
        details,
        status: status || 'DRAFT',
        userId,
        courseId,
        templateId,
        issuedById
      };

      const newCertificate = await hygraphCertificateService.createCertificate(certificateData);
      sendCreated(res, 'Certificate created successfully', newCertificate);
    } catch (error) {
      console.error('Create certificate error:', error);
      sendServerError(res, 'Failed to create certificate');
    }
  }

  // Get all certificates (admin only)
  async getAllCertificates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type as string;
      const status = req.query.status as string;
      const userId = req.query.user as string;
      const courseId = req.query.course as string;
      const issuedBy = req.query.issuedBy as string;
      const academicYear = req.query.academicYear as string;
      const semester = req.query.semester as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;
      const issuedFrom = req.query.issuedFrom as string;
      const issuedTo = req.query.issuedTo as string;

      const skip = (page - 1) * limit;
      const filters: CertificateFilters = {};

      if (type) filters.type = type as any;
      if (status) filters.status = status as any;
      if (userId) filters.userId = userId;
      if (courseId) filters.courseId = courseId;
      if (issuedBy) filters.issuedById = issuedBy;
      if (academicYear) filters.academicYear = academicYear;
      if (semester) filters.semester = semester;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      if (issuedFrom) filters.issuedFrom = issuedFrom;
      if (issuedTo) filters.issuedTo = issuedTo;

      const certificates = await hygraphCertificateService.getCertificates(limit, skip, filters);
      
      // For now, we'll get all certificates to calculate total. In production, implement count query
      const allCertificates = await hygraphCertificateService.getCertificates(1000, 0, filters);
      const total = allCertificates.length;

      sendPaginatedResponse(
        res,
        'Certificates retrieved successfully',
        certificates,
        page,
        limit,
        total
      );
    } catch (error) {
      console.error('Get certificates error:', error);
      sendServerError(res, 'Failed to retrieve certificates');
    }
  }

  // Get certificate by ID
  async getCertificateById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { certificateId } = req.params;
      const userId = req.user!.uid;

      const certificate = await hygraphCertificateService.getCertificateById(certificateId);
      if (!certificate) {
        sendNotFound(res, 'Certificate not found');
        return;
      }

      // Check permissions - users can only view their own certificates, admins can view all
      if (req.user!.role !== UserRole.ADMIN && certificate.user?.id !== userId) {
        sendError(res, 'You can only view your own certificates');
        return;
      }

      sendSuccess(res, 'Certificate retrieved successfully', certificate);
    } catch (error) {
      console.error('Get certificate by ID error:', error);
      sendServerError(res, 'Failed to retrieve certificate');
    }
  }

  // Get certificate by certificate number (public verification)
  async getCertificateByNumber(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { certificateNumber } = req.params;

      const certificate = await hygraphCertificateService.getCertificateByNumber(certificateNumber);
      if (!certificate) {
        sendNotFound(res, 'Certificate not found');
        return;
      }

      // Only show verified certificates for public verification
      if (certificate.status !== 'VERIFIED') {
        sendError(res, 'Certificate is not verified');
        return;
      }

      sendSuccess(res, 'Certificate retrieved successfully', certificate);
    } catch (error) {
      console.error('Get certificate by number error:', error);
      sendServerError(res, 'Failed to retrieve certificate');
    }
  }

  // Update certificate (admin only)
  async updateCertificate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { certificateId } = req.params;
      const updateData = req.body;

      // Get existing certificate
      const existingCertificate = await hygraphCertificateService.getCertificateById(certificateId);
      if (!existingCertificate) {
        sendNotFound(res, 'Certificate not found');
        return;
      }

      const updatedCertificate = await hygraphCertificateService.updateCertificate(certificateId, updateData);
      sendSuccess(res, 'Certificate updated successfully', updatedCertificate);
    } catch (error) {
      console.error('Update certificate error:', error);
      sendServerError(res, 'Failed to update certificate');
    }
  }

  // Delete certificate (admin only)
  async deleteCertificate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { certificateId } = req.params;

      // Get existing certificate
      const existingCertificate = await hygraphCertificateService.getCertificateById(certificateId);
      if (!existingCertificate) {
        sendNotFound(res, 'Certificate not found');
        return;
      }

      await hygraphCertificateService.deleteCertificate(certificateId);
      sendSuccess(res, 'Certificate deleted successfully');
    } catch (error) {
      console.error('Delete certificate error:', error);
      sendServerError(res, 'Failed to delete certificate');
    }
  }

  // ===== PUBLIC ENDPOINTS =====

  // Get user's certificates
  async getUserCertificates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.uid;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const certificates = await hygraphCertificateService.getCertificatesByUser(userId, limit);
      
      sendPaginatedResponse(
        res,
        'Your certificates retrieved successfully',
        certificates,
        page,
        limit,
        certificates.length
      );
    } catch (error) {
      console.error('Get user certificates error:', error);
      sendServerError(res, 'Failed to retrieve your certificates');
    }
  }

  // Get issued certificates
  async getIssuedCertificates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const certificates = await hygraphCertificateService.getIssuedCertificates(limit);
      sendSuccess(res, 'Issued certificates retrieved successfully', certificates);
    } catch (error) {
      console.error('Get issued certificates error:', error);
      sendServerError(res, 'Failed to retrieve issued certificates');
    }
  }

  // Get verified certificates
  async getVerifiedCertificates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const certificates = await hygraphCertificateService.getVerifiedCertificates(limit);
      sendSuccess(res, 'Verified certificates retrieved successfully', certificates);
    } catch (error) {
      console.error('Get verified certificates error:', error);
      sendServerError(res, 'Failed to retrieve verified certificates');
    }
  }

  // Get certificates by type
  async getCertificatesByType(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const certificates = await hygraphCertificateService.getCertificatesByType(type, limit);
      sendSuccess(res, 'Certificates by type retrieved successfully', certificates);
    } catch (error) {
      console.error('Get certificates by type error:', error);
      sendServerError(res, 'Failed to retrieve certificates by type');
    }
  }

  // Search certificates
  async searchCertificates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { searchTerm } = req.query;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!searchTerm) {
        sendError(res, 'Search term is required');
        return;
      }

      const certificates = await hygraphCertificateService.searchCertificates(searchTerm as string, limit);
      sendSuccess(res, 'Certificates search results retrieved successfully', certificates);
    } catch (error) {
      console.error('Search certificates error:', error);
      sendServerError(res, 'Failed to search certificates');
    }
  }

  // ===== CERTIFICATE MANAGEMENT =====

  // Issue certificate
  async issueCertificate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { certificateId } = req.params;

      const updatedCertificate = await hygraphCertificateService.issueCertificate(certificateId);
      sendSuccess(res, 'Certificate issued successfully', updatedCertificate);
    } catch (error) {
      console.error('Issue certificate error:', error);
      sendServerError(res, 'Failed to issue certificate');
    }
  }

  // Verify certificate
  async verifyCertificate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { certificateId } = req.params;

      const updatedCertificate = await hygraphCertificateService.verifyCertificate(certificateId);
      sendSuccess(res, 'Certificate verified successfully', updatedCertificate);
    } catch (error) {
      console.error('Verify certificate error:', error);
      sendServerError(res, 'Failed to verify certificate');
    }
  }

  // Revoke certificate
  async revokeCertificate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { certificateId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        sendError(res, 'Revocation reason is required');
        return;
      }

      const updatedCertificate = await hygraphCertificateService.revokeCertificate(certificateId, reason);
      sendSuccess(res, 'Certificate revoked successfully', updatedCertificate);
    } catch (error) {
      console.error('Revoke certificate error:', error);
      sendServerError(res, 'Failed to revoke certificate');
    }
  }

  // Generate verification code
  async generateVerificationCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { certificateId } = req.params;

      const updatedCertificate = await hygraphCertificateService.generateVerificationCode(certificateId);
      sendSuccess(res, 'Verification code generated successfully', updatedCertificate);
    } catch (error) {
      console.error('Generate verification code error:', error);
      sendServerError(res, 'Failed to generate verification code');
    }
  }

  // ===== STATISTICS =====

  // Get certificate statistics (admin only)
  async getCertificateStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await hygraphCertificateService.getCertificateStats();
      sendSuccess(res, 'Certificate statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get certificate stats error:', error);
      sendServerError(res, 'Failed to retrieve certificate statistics');
    }
  }

  // Get user's certificate statistics
  async getUserCertificateStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.uid;
      const stats = await hygraphCertificateService.getUserCertificateStats(userId);
      sendSuccess(res, 'User certificate statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get user certificate stats error:', error);
      sendServerError(res, 'Failed to retrieve user certificate statistics');
    }
  }
}

export default new CertificateController();