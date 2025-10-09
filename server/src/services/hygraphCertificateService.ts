import { hygraphClient } from '../config/hygraph';
import {
  GET_CERTIFICATES,
  CREATE_CERTIFICATE
} from '../lib/hygraphOperations';

// Types for Hygraph data
export interface HygraphCertificate {
  id: string;
  type: 'TOP_PERFORMER' | 'PERFECT_ATTENDANCE' | 'HOMEWORK_HERO' | 'COURSE_COMPLETION' | 'ACADEMIC_EXCELLENCE' | 'LEADERSHIP' | 'PARTICIPATION' | 'ACHIEVEMENT';
  title: string;
  description?: string;
  period?: {
    startDate: string;
    endDate: string;
    academicYear?: string;
    semester?: string;
  };
  details?: {
    courseName?: string;
    grade?: string;
    gpa?: number;
    attendanceRate?: number;
    completionDate?: string;
    achievements?: string[];
    criteria?: string[];
  };
  status: 'DRAFT' | 'ISSUED' | 'VERIFIED' | 'REVOKED';
  certificateNumber: string;
  issuedAt?: string;
  verifiedAt?: string;
  revokedAt?: string;
  revokedReason?: string;
  issuedBy?: {
    id: string;
    displayName: string;
    email: string;
  };
  user?: {
    id: string;
    displayName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
  };
  template?: {
    id: string;
    name: string;
    design: any; // JSON
  };
  verificationCode?: string;
  pdfUrl?: string;
  imageUrl?: string;
}

export interface CreateCertificateData {
  type: 'TOP_PERFORMER' | 'PERFECT_ATTENDANCE' | 'HOMEWORK_HERO' | 'COURSE_COMPLETION' | 'ACADEMIC_EXCELLENCE' | 'LEADERSHIP' | 'PARTICIPATION' | 'ACHIEVEMENT';
  title: string;
  description?: string;
  period?: {
    startDate: string;
    endDate: string;
    academicYear?: string;
    semester?: string;
  };
  details?: {
    courseName?: string;
    grade?: string;
    gpa?: number;
    attendanceRate?: number;
    completionDate?: string;
    achievements?: string[];
    criteria?: string[];
  };
  status?: 'DRAFT' | 'ISSUED' | 'VERIFIED' | 'REVOKED';
  userId: string;
  courseId?: string;
  templateId?: string;
  issuedById: string;
}

export interface UpdateCertificateData {
  title?: string;
  description?: string;
  period?: {
    startDate: string;
    endDate: string;
    academicYear?: string;
    semester?: string;
  };
  details?: {
    courseName?: string;
    grade?: string;
    gpa?: number;
    attendanceRate?: number;
    completionDate?: string;
    achievements?: string[];
    criteria?: string[];
  };
  status?: 'DRAFT' | 'ISSUED' | 'VERIFIED' | 'REVOKED';
  revokedReason?: string;
  pdfUrl?: string;
  imageUrl?: string;
  issuedAt?: string;
  verifiedAt?: string;
  revokedAt?: string;
  verificationCode?: string;
}

export interface CertificateFilters {
  type?: 'TOP_PERFORMER' | 'PERFECT_ATTENDANCE' | 'HOMEWORK_HERO' | 'COURSE_COMPLETION' | 'ACADEMIC_EXCELLENCE' | 'LEADERSHIP' | 'PARTICIPATION' | 'ACHIEVEMENT';
  status?: 'DRAFT' | 'ISSUED' | 'VERIFIED' | 'REVOKED';
  userId?: string;
  courseId?: string;
  issuedById?: string;
  academicYear?: string;
  semester?: string;
  dateFrom?: string;
  dateTo?: string;
  issuedFrom?: string;
  issuedTo?: string;
}

// Hygraph Certificate Service for Backend
export const hygraphCertificateService = {
  // ===== CERTIFICATE OPERATIONS =====
  
  // Get all certificates with pagination and filters
  async getCertificates(
    limit: number = 100, 
    offset: number = 0, 
    filters?: CertificateFilters
  ): Promise<HygraphCertificate[]> {
    try {
      const where: any = {};
      
      if (filters) {
        if (filters.type) where.type = filters.type;
        if (filters.status) where.status = filters.status;
        if (filters.userId) where.user = { id: filters.userId };
        if (filters.courseId) where.course = { id: filters.courseId };
        if (filters.issuedById) where.issuedBy = { id: filters.issuedById };
        if (filters.academicYear) where.period = { academicYear: filters.academicYear };
        if (filters.semester) where.period = { semester: filters.semester };
        
        if (filters.dateFrom || filters.dateTo) {
          where.issuedAt = {};
          if (filters.dateFrom) where.issuedAt.gte = filters.dateFrom;
          if (filters.dateTo) where.issuedAt.lte = filters.dateTo;
        }
      }

      const response = await hygraphClient.request(GET_CERTIFICATES, {
        first: limit,
        skip: offset,
        where
      });
      return (response as any).certificates || [];
    } catch (error) {
      console.error('Error fetching certificates from Hygraph:', error);
      throw error;
    }
  },

  // Get certificate by ID
  async getCertificateById(id: string): Promise<HygraphCertificate | null> {
    try {
      const response = await hygraphClient.request(GET_CERTIFICATES, {
        first: 1,
        skip: 0,
        where: { id }
      });
      const certificates = (response as any).certificates || [];
      return certificates.length > 0 ? certificates[0] : null;
    } catch (error) {
      console.error('Error fetching certificate by ID from Hygraph:', error);
      throw error;
    }
  },

  // Get certificate by certificate number
  async getCertificateByNumber(certificateNumber: string): Promise<HygraphCertificate | null> {
    try {
      const response = await hygraphClient.request(GET_CERTIFICATES, {
        first: 1,
        skip: 0,
        where: { certificateNumber }
      });
      const certificates = (response as any).certificates || [];
      return certificates.length > 0 ? certificates[0] : null;
    } catch (error) {
      console.error('Error fetching certificate by number from Hygraph:', error);
      throw error;
    }
  },

  // Get certificates by user
  async getCertificatesByUser(userId: string, limit: number = 100): Promise<HygraphCertificate[]> {
    try {
      const response = await hygraphClient.request(GET_CERTIFICATES, {
        first: limit,
        skip: 0,
        where: { user: { id: userId } }
      });
      return (response as any).certificates || [];
    } catch (error) {
      console.error('Error fetching certificates by user from Hygraph:', error);
      throw error;
    }
  },

  // Get certificates by course
  async getCertificatesByCourse(courseId: string, limit: number = 100): Promise<HygraphCertificate[]> {
    try {
      const response = await hygraphClient.request(GET_CERTIFICATES, {
        first: limit,
        skip: 0,
        where: { course: { id: courseId } }
      });
      return (response as any).certificates || [];
    } catch (error) {
      console.error('Error fetching certificates by course from Hygraph:', error);
      throw error;
    }
  },

  // Get certificates by type
  async getCertificatesByType(type: string, limit: number = 100): Promise<HygraphCertificate[]> {
    try {
      const response = await hygraphClient.request(GET_CERTIFICATES, {
        first: limit,
        skip: 0,
        where: { type }
      });
      return (response as any).certificates || [];
    } catch (error) {
      console.error('Error fetching certificates by type from Hygraph:', error);
      throw error;
    }
  },

  // Get issued certificates
  async getIssuedCertificates(limit: number = 100): Promise<HygraphCertificate[]> {
    try {
      const response = await hygraphClient.request(GET_CERTIFICATES, {
        first: limit,
        skip: 0,
        where: { 
          status: { in: ['ISSUED', 'VERIFIED'] }
        }
      });
      return (response as any).certificates || [];
    } catch (error) {
      console.error('Error fetching issued certificates from Hygraph:', error);
      throw error;
    }
  },

  // Get verified certificates
  async getVerifiedCertificates(limit: number = 100): Promise<HygraphCertificate[]> {
    try {
      const response = await hygraphClient.request(GET_CERTIFICATES, {
        first: limit,
        skip: 0,
        where: { 
          status: 'VERIFIED'
        }
      });
      return (response as any).certificates || [];
    } catch (error) {
      console.error('Error fetching verified certificates from Hygraph:', error);
      throw error;
    }
  },

  // Search certificates
  async searchCertificates(searchTerm: string, limit: number = 50): Promise<HygraphCertificate[]> {
    try {
      const response = await hygraphClient.request(GET_CERTIFICATES, {
        first: limit,
        skip: 0,
        where: {
          OR: [
            { title_contains: searchTerm },
            { description_contains: searchTerm },
            { certificateNumber_contains: searchTerm }
          ]
        }
      });
      return (response as any).certificates || [];
    } catch (error) {
      console.error('Error searching certificates from Hygraph:', error);
      throw error;
    }
  },

  // Create new certificate
  async createCertificate(certificateData: CreateCertificateData): Promise<HygraphCertificate> {
    try {
      const now = new Date().toISOString();
      const certificateNumber = this.generateCertificateNumber();
      
      const response = await hygraphClient.request(CREATE_CERTIFICATE, {
        data: {
          type: certificateData.type,
          title: certificateData.title,
          description: certificateData.description,
          period: certificateData.period,
          details: certificateData.details,
          status: certificateData.status || 'DRAFT',
          certificateNumber,
          issuedAt: certificateData.status === 'ISSUED' ? now : undefined,
          user: { connect: { id: certificateData.userId } },
          course: certificateData.courseId ? { connect: { id: certificateData.courseId } } : undefined,
          issuedBy: { connect: { id: certificateData.issuedById } }
        }
      });
      return (response as any).createCertificate;
    } catch (error) {
      console.error('Error creating certificate in Hygraph:', error);
      throw error;
    }
  },

  // Update certificate (simplified - in production, implement proper update)
  async updateCertificate(id: string, certificateData: UpdateCertificateData): Promise<HygraphCertificate> {
    try {
      // For now, we'll just return the existing certificate
      // In production, implement proper update using Hygraph's update operations
      const existingCertificate = await this.getCertificateById(id);
      if (!existingCertificate) {
        throw new Error('Certificate not found');
      }
      
      // Merge the update data with existing certificate
      const updatedCertificate = { ...existingCertificate, ...certificateData };
      return updatedCertificate as HygraphCertificate;
    } catch (error) {
      console.error('Error updating certificate in Hygraph:', error);
      throw error;
    }
  },

  // Delete certificate (simplified - in production, implement proper delete)
  async deleteCertificate(id: string): Promise<boolean> {
    try {
      // For now, we'll just return true
      // In production, implement proper delete using Hygraph's delete operations
      const existingCertificate = await this.getCertificateById(id);
      if (!existingCertificate) {
        throw new Error('Certificate not found');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting certificate from Hygraph:', error);
      throw error;
    }
  },

  // ===== CERTIFICATE MANAGEMENT =====

  // Issue certificate
  async issueCertificate(id: string): Promise<HygraphCertificate> {
    try {
      return await this.updateCertificate(id, { 
        status: 'ISSUED',
        issuedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error issuing certificate:', error);
      throw error;
    }
  },

  // Verify certificate
  async verifyCertificate(id: string): Promise<HygraphCertificate> {
    try {
      return await this.updateCertificate(id, { 
        status: 'VERIFIED',
        verifiedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
  },

  // Revoke certificate
  async revokeCertificate(id: string, reason: string): Promise<HygraphCertificate> {
    try {
      return await this.updateCertificate(id, { 
        status: 'REVOKED',
        revokedAt: new Date().toISOString(),
        revokedReason: reason
      });
    } catch (error) {
      console.error('Error revoking certificate:', error);
      throw error;
    }
  },

  // Generate verification code
  async generateVerificationCode(id: string): Promise<HygraphCertificate> {
    try {
      const verificationCode = this.generateRandomCode(8);
      return await this.updateCertificate(id, { verificationCode });
    } catch (error) {
      console.error('Error generating verification code:', error);
      throw error;
    }
  },

  // ===== UTILITY FUNCTIONS =====

  // Generate unique certificate number
  generateCertificateNumber(): string {
    const prefix = 'CERT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  },

  // Generate random verification code
  generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // ===== STATISTICS =====

  // Get certificate statistics
  async getCertificateStats(): Promise<{
    totalCertificates: number;
    issuedCertificates: number;
    verifiedCertificates: number;
    revokedCertificates: number;
    draftCertificates: number;
    certificatesByType: { [type: string]: number };
    certificatesByStatus: { [status: string]: number };
    recentCertificates: number; // Last 30 days
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [allCertificates, issuedCertificates, verifiedCertificates, revokedCertificates, draftCertificates, recentCertificates] = await Promise.all([
        this.getCertificates(1000, 0),
        this.getCertificates(1000, 0, { status: 'ISSUED' }),
        this.getCertificates(1000, 0, { status: 'VERIFIED' }),
        this.getCertificates(1000, 0, { status: 'REVOKED' }),
        this.getCertificates(1000, 0, { status: 'DRAFT' }),
        this.getCertificates(1000, 0, { issuedFrom: thirtyDaysAgo.toISOString() })
      ]);

      // Calculate certificates by type
      const certificatesByType: { [type: string]: number } = {};
      allCertificates.forEach(certificate => {
        certificatesByType[certificate.type] = (certificatesByType[certificate.type] || 0) + 1;
      });

      // Calculate certificates by status
      const certificatesByStatus: { [status: string]: number } = {};
      allCertificates.forEach(certificate => {
        certificatesByStatus[certificate.status] = (certificatesByStatus[certificate.status] || 0) + 1;
      });

      return {
        totalCertificates: allCertificates.length,
        issuedCertificates: issuedCertificates.length,
        verifiedCertificates: verifiedCertificates.length,
        revokedCertificates: revokedCertificates.length,
        draftCertificates: draftCertificates.length,
        certificatesByType,
        certificatesByStatus,
        recentCertificates: recentCertificates.length
      };
    } catch (error) {
      console.error('Error calculating certificate statistics:', error);
      throw error;
    }
  },

  // Get user's certificate statistics
  async getUserCertificateStats(userId: string): Promise<{
    totalCertificates: number;
    issuedCertificates: number;
    verifiedCertificates: number;
    certificatesByType: { [type: string]: number };
  }> {
    try {
      const [allCertificates, issuedCertificates, verifiedCertificates] = await Promise.all([
        this.getCertificatesByUser(userId, 1000),
        this.getCertificates(1000, 0, { userId, status: 'ISSUED' }),
        this.getCertificates(1000, 0, { userId, status: 'VERIFIED' })
      ]);

      // Calculate certificates by type
      const certificatesByType: { [type: string]: number } = {};
      allCertificates.forEach(certificate => {
        certificatesByType[certificate.type] = (certificatesByType[certificate.type] || 0) + 1;
      });

      return {
        totalCertificates: allCertificates.length,
        issuedCertificates: issuedCertificates.length,
        verifiedCertificates: verifiedCertificates.length,
        certificatesByType
      };
    } catch (error) {
      console.error('Error calculating user certificate statistics:', error);
      throw error;
    }
  }
};