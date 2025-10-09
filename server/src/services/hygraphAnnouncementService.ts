import { hygraphClient } from '../config/hygraph';
import {
  GET_ANNOUNCEMENTS,
  CREATE_ANNOUNCEMENT,
  UPDATE_ANNOUNCEMENT,
  DELETE_ANNOUNCEMENT
} from '../lib/hygraphOperations';

// Types for Hygraph data
export interface HygraphAnnouncement {
  id: string;
  title: string;
  body: string;
  targetAudience?: 'ALL_STUDENTS' | 'COURSE_STUDENTS' | 'SPECIFIC_STUDENT';
  externalLink?: string;
  isPinned: boolean;
  isActive: boolean;
  publishedAt: string;
  expiresAt?: string;
  author?: {
    id: string;
    displayName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
  };
  targetStudent?: {
    id: string;
    displayName: string;
    email: string;
  };
}

export interface CreateAnnouncementData {
  title: string;
  body: string;
  targetAudience: 'ALL_STUDENTS' | 'COURSE_STUDENTS' | 'SPECIFIC_STUDENT';
  externalLink?: string;
  isPinned?: boolean;
  isActive?: boolean;
  expiresAt?: string;
  authorId: string;
  courseId?: string;
  targetStudentId?: string;
}

export interface UpdateAnnouncementData {
  title?: string;
  body?: string;
  targetAudience?: 'ALL_STUDENTS' | 'COURSE_STUDENTS' | 'SPECIFIC_STUDENT';
  externalLink?: string;
  isPinned?: boolean;
  isActive?: boolean;
  publishedAt?: string;
  expiresAt?: string;
  courseId?: string;
  targetStudentId?: string;
}

export interface AnnouncementFilters {
  targetAudience?: 'ALL_STUDENTS' | 'COURSE_STUDENTS' | 'SPECIFIC_STUDENT';
  courseId?: string;
  authorId?: string;
  isPinned?: boolean;
  isActive?: boolean;
  publishedAfter?: string;
  publishedBefore?: string;
  expiresAfter?: string;
  expiresBefore?: string;
}

// Hygraph Announcement Service for Backend
export const hygraphAnnouncementService = {
  // ===== ANNOUNCEMENT OPERATIONS =====
  
  // Get all announcements with pagination and filters
  async getAnnouncements(
    limit: number = 100, 
    offset: number = 0, 
    filters?: AnnouncementFilters
  ): Promise<HygraphAnnouncement[]> {
    try {
      const where: any = {};
      
      if (filters) {
        if (filters.targetAudience) where.targetAudience = filters.targetAudience;
        if (filters.courseId) where.course = { id: filters.courseId };
        if (filters.authorId) where.author = { id: filters.authorId };
        if (filters.isPinned !== undefined) where.isPinned = filters.isPinned;
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        
        if (filters.publishedAfter || filters.publishedBefore) {
          where.publishedAt = {};
          if (filters.publishedAfter) where.publishedAt.gte = filters.publishedAfter;
          if (filters.publishedBefore) where.publishedAt.lte = filters.publishedBefore;
        }
        
        if (filters.expiresAfter || filters.expiresBefore) {
          where.expiresAt = {};
          if (filters.expiresAfter) where.expiresAt.gte = filters.expiresAfter;
          if (filters.expiresBefore) where.expiresAt.lte = filters.expiresBefore;
        }
      }

      const response = await hygraphClient.request(GET_ANNOUNCEMENTS, {
        first: limit,
        skip: offset,
        where
      });
      return (response as any).announcements || [];
    } catch (error) {
      console.error('Error fetching announcements from Hygraph:', error);
      throw error;
    }
  },

  // Get announcement by ID
  async getAnnouncementById(id: string): Promise<HygraphAnnouncement | null> {
    try {
      const response = await hygraphClient.request(GET_ANNOUNCEMENTS, {
        first: 1,
        skip: 0,
        where: { id }
      });
      const announcements = (response as any).announcements || [];
      return announcements.length > 0 ? announcements[0] : null;
    } catch (error) {
      console.error('Error fetching announcement by ID from Hygraph:', error);
      throw error;
    }
  },

  // Get announcements by course
  async getAnnouncementsByCourse(courseId: string, limit: number = 100): Promise<HygraphAnnouncement[]> {
    try {
      const response = await hygraphClient.request(GET_ANNOUNCEMENTS, {
        first: limit,
        skip: 0,
        where: { 
          course: { id: courseId },
          isActive: true
        }
      });
      return (response as any).announcements || [];
    } catch (error) {
      console.error('Error fetching announcements by course from Hygraph:', error);
      throw error;
    }
  },

  // Get announcements by author
  async getAnnouncementsByAuthor(authorId: string, limit: number = 100): Promise<HygraphAnnouncement[]> {
    try {
      const response = await hygraphClient.request(GET_ANNOUNCEMENTS, {
        first: limit,
        skip: 0,
        where: { author: { id: authorId } }
      });
      return (response as any).announcements || [];
    } catch (error) {
      console.error('Error fetching announcements by author from Hygraph:', error);
      throw error;
    }
  },

  // Get active announcements for students
  async getActiveAnnouncementsForStudents(limit: number = 50): Promise<HygraphAnnouncement[]> {
    try {
      const now = new Date().toISOString();
      const response = await hygraphClient.request(GET_ANNOUNCEMENTS, {
        first: limit,
        skip: 0,
        where: {
          isActive: true,
          OR: [
            { targetAudience: 'ALL_STUDENTS' },
            { targetAudience: 'COURSE_STUDENTS' }
          ],
          publishedAt: { lte: now },
          AND: [
            {
              OR: [
                { expiresAt: null },
                { expiresAt: { gte: now } }
              ]
            }
          ]
        }
      });
      return (response as any).announcements || [];
    } catch (error) {
      console.error('Error fetching active announcements for students from Hygraph:', error);
      throw error;
    }
  },

  // Get pinned announcements
  async getPinnedAnnouncements(limit: number = 10): Promise<HygraphAnnouncement[]> {
    try {
      const response = await hygraphClient.request(GET_ANNOUNCEMENTS, {
        first: limit,
        skip: 0,
        where: { 
          isPinned: true,
          isActive: true
        }
      });
      return (response as any).announcements || [];
    } catch (error) {
      console.error('Error fetching pinned announcements from Hygraph:', error);
      throw error;
    }
  },

  // Get recent announcements
  async getRecentAnnouncements(limit: number = 20): Promise<HygraphAnnouncement[]> {
    try {
      const response = await hygraphClient.request(GET_ANNOUNCEMENTS, {
        first: limit,
        skip: 0,
        where: { 
          isActive: true
        }
      });
      return (response as any).announcements || [];
    } catch (error) {
      console.error('Error fetching recent announcements from Hygraph:', error);
      throw error;
    }
  },

  // Create new announcement
  async createAnnouncement(announcementData: CreateAnnouncementData): Promise<HygraphAnnouncement> {
    try {
      const now = new Date().toISOString();
      const response = await hygraphClient.request(CREATE_ANNOUNCEMENT, {
        data: {
          title: announcementData.title,
          body: announcementData.body,
          targetAudience: announcementData.targetAudience,
          externalLink: announcementData.externalLink,
          isPinned: announcementData.isPinned || false,
          isActive: announcementData.isActive !== false, // Default to true
          publishedAt: now,
          expiresAt: announcementData.expiresAt,
          author: { connect: { id: announcementData.authorId } },
          course: announcementData.courseId ? { connect: { id: announcementData.courseId } } : undefined,
          targetStudent: announcementData.targetStudentId ? { connect: { id: announcementData.targetStudentId } } : undefined
        }
      });
      return (response as any).createAnnouncement;
    } catch (error) {
      console.error('Error creating announcement in Hygraph:', error);
      throw error;
    }
  },

  // Update announcement
  async updateAnnouncement(id: string, announcementData: UpdateAnnouncementData): Promise<HygraphAnnouncement> {
    try {
      const updateData: any = { ...announcementData };
      
      // Handle relationship updates
      if (announcementData.courseId) {
        updateData.course = { connect: { id: announcementData.courseId } };
        delete updateData.courseId;
      }
      
      if (announcementData.targetStudentId) {
        updateData.targetStudent = { connect: { id: announcementData.targetStudentId } };
        delete updateData.targetStudentId;
      }

      const response = await hygraphClient.request(UPDATE_ANNOUNCEMENT, {
        id,
        data: updateData
      });
      return (response as any).updateAnnouncement;
    } catch (error) {
      console.error('Error updating announcement in Hygraph:', error);
      throw error;
    }
  },

  // Delete announcement
  async deleteAnnouncement(id: string): Promise<boolean> {
    try {
      await hygraphClient.request(DELETE_ANNOUNCEMENT, { id });
      return true;
    } catch (error) {
      console.error('Error deleting announcement from Hygraph:', error);
      throw error;
    }
  },

  // ===== ANNOUNCEMENT MANAGEMENT =====

  // Pin/unpin announcement
  async togglePinAnnouncement(id: string, isPinned: boolean): Promise<HygraphAnnouncement> {
    try {
      return await this.updateAnnouncement(id, { isPinned });
    } catch (error) {
      console.error('Error toggling pin status for announcement:', error);
      throw error;
    }
  },

  // Activate/deactivate announcement
  async toggleActiveAnnouncement(id: string, isActive: boolean): Promise<HygraphAnnouncement> {
    try {
      return await this.updateAnnouncement(id, { isActive });
    } catch (error) {
      console.error('Error toggling active status for announcement:', error);
      throw error;
    }
  },

  // Schedule announcement (set future publish date)
  async scheduleAnnouncement(id: string, publishAt: string): Promise<HygraphAnnouncement> {
    try {
      return await this.updateAnnouncement(id, { 
        publishedAt: publishAt,
        isActive: false // Deactivate until publish time
      });
    } catch (error) {
      console.error('Error scheduling announcement:', error);
      throw error;
    }
  },

  // Set announcement expiration
  async setAnnouncementExpiration(id: string, expiresAt: string): Promise<HygraphAnnouncement> {
    try {
      return await this.updateAnnouncement(id, { expiresAt });
    } catch (error) {
      console.error('Error setting announcement expiration:', error);
      throw error;
    }
  },

  // ===== STATISTICS =====

  // Get announcement statistics
  async getAnnouncementStats(): Promise<{
    totalAnnouncements: number;
    activeAnnouncements: number;
    pinnedAnnouncements: number;
    expiredAnnouncements: number;
    recentAnnouncements: number; // Last 7 days
  }> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [allAnnouncements, activeAnnouncements, pinnedAnnouncements, recentAnnouncements] = await Promise.all([
        this.getAnnouncements(1000, 0),
        this.getAnnouncements(1000, 0, { isActive: true }),
        this.getAnnouncements(1000, 0, { isPinned: true }),
        this.getAnnouncements(1000, 0, { publishedAfter: sevenDaysAgo })
      ]);

      const expiredAnnouncements = allAnnouncements.filter(a => 
        a.expiresAt && new Date(a.expiresAt) < now
      ).length;

      return {
        totalAnnouncements: allAnnouncements.length,
        activeAnnouncements: activeAnnouncements.length,
        pinnedAnnouncements: pinnedAnnouncements.length,
        expiredAnnouncements,
        recentAnnouncements: recentAnnouncements.length
      };
    } catch (error) {
      console.error('Error calculating announcement statistics:', error);
      throw error;
    }
  },

  // Get author's announcement statistics
  async getAuthorAnnouncementStats(authorId: string): Promise<{
    totalAnnouncements: number;
    activeAnnouncements: number;
    pinnedAnnouncements: number;
    recentAnnouncements: number;
  }> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [allAnnouncements, activeAnnouncements, pinnedAnnouncements, recentAnnouncements] = await Promise.all([
        this.getAnnouncementsByAuthor(authorId, 1000),
        this.getAnnouncements(1000, 0, { authorId, isActive: true }),
        this.getAnnouncements(1000, 0, { authorId, isPinned: true }),
        this.getAnnouncements(1000, 0, { authorId, publishedAfter: sevenDaysAgo })
      ]);

      return {
        totalAnnouncements: allAnnouncements.length,
        activeAnnouncements: activeAnnouncements.length,
        pinnedAnnouncements: pinnedAnnouncements.length,
        recentAnnouncements: recentAnnouncements.length
      };
    } catch (error) {
      console.error('Error calculating author announcement statistics:', error);
      throw error;
    }
  },

  // Get course announcement statistics
  async getCourseAnnouncementStats(courseId: string): Promise<{
    totalAnnouncements: number;
    activeAnnouncements: number;
    pinnedAnnouncements: number;
    recentAnnouncements: number;
  }> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [allAnnouncements, activeAnnouncements, pinnedAnnouncements, recentAnnouncements] = await Promise.all([
        this.getAnnouncementsByCourse(courseId, 1000),
        this.getAnnouncements(1000, 0, { courseId, isActive: true }),
        this.getAnnouncements(1000, 0, { courseId, isPinned: true }),
        this.getAnnouncements(1000, 0, { courseId, publishedAfter: sevenDaysAgo })
      ]);

      return {
        totalAnnouncements: allAnnouncements.length,
        activeAnnouncements: activeAnnouncements.length,
        pinnedAnnouncements: pinnedAnnouncements.length,
        recentAnnouncements: recentAnnouncements.length
      };
    } catch (error) {
      console.error('Error calculating course announcement statistics:', error);
      throw error;
    }
  }
};