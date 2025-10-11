import { Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { hygraphAnnouncementService, AnnouncementFilters } from '../services/hygraphAnnouncementService';
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

export class AnnouncementController {
  // Create a new announcement (teacher/admin only)
  async createAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        title, 
        body, 
        targetAudience, 
        externalLink, 
        isPinned, 
        isActive, 
        expiresAt, 
        courseId, 
        targetStudentId 
      } = req.body;
      const authorId = req.user!.uid;

      // Validate required fields
      if (!title || !body || !targetAudience) {
        sendError(res, 'Missing required fields: title, body, targetAudience');
        return;
      }

      // Validate target audience
      if (!['ALL_STUDENTS', 'COURSE_STUDENTS', 'SPECIFIC_STUDENT'].includes(targetAudience)) {
        sendError(res, 'Invalid target audience. Must be ALL_STUDENTS, COURSE_STUDENTS, or SPECIFIC_STUDENT');
        return;
      }

      // Validate course-specific announcement
      if (targetAudience === 'COURSE_STUDENTS' && !courseId) {
        sendError(res, 'Course ID is required for COURSE_STUDENTS target audience');
        return;
      }

      // Validate specific student announcement
      if (targetAudience === 'SPECIFIC_STUDENT' && !targetStudentId) {
        sendError(res, 'Target student ID is required for SPECIFIC_STUDENT target audience');
        return;
      }

      // Verify course exists if provided
      if (courseId) {
        const course = await hygraphCourseService.getCourseById(courseId);
        if (!course) {
          sendNotFound(res, 'Course not found');
          return;
        }

        // Check permissions for course-specific announcements
        if (req.user!.role !== UserRole.ADMIN && course.instructor?.uid !== authorId) {
          sendError(res, 'You can only create announcements for your own courses');
          return;
        }
      }

      // Verify target student exists if provided
      if (targetStudentId) {
        const student = await hygraphUserService.getUserByUid(targetStudentId);
        if (!student) {
          sendNotFound(res, 'Target student not found');
          return;
        }
      }

      const announcementData = {
        title,
        body,
        targetAudience,
        externalLink,
        isPinned: isPinned || false,
        isActive: isActive !== false, // Default to true
        expiresAt,
        authorId,
        courseId,
        targetStudentId
      };

      const newAnnouncement = await hygraphAnnouncementService.createAnnouncement(announcementData);
      sendCreated(res, 'Announcement created successfully', newAnnouncement);
    } catch (error) {
      console.error('Create announcement error:', error);
      sendServerError(res, 'Failed to create announcement');
    }
  }

  // Get all announcements (admin only)
  async getAllAnnouncements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const targetAudience = req.query.targetAudience as string;
      const courseId = req.query.courseId as string;
      const authorId = req.query.authorId as string;
      const isPinned = req.query.isPinned as string;
      const isActive = req.query.isActive as string;

      const skip = (page - 1) * limit;
      const filters: AnnouncementFilters = {};

      if (targetAudience) filters.targetAudience = targetAudience as any;
      if (courseId) filters.courseId = courseId;
      if (authorId) filters.authorId = authorId;
      if (isPinned !== undefined) filters.isPinned = isPinned === 'true';
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const announcements = await hygraphAnnouncementService.getAnnouncements(limit, skip, filters);
      
      // For now, we'll get all announcements to calculate total. In production, implement count query
      const allAnnouncements = await hygraphAnnouncementService.getAnnouncements(1000, 0, filters);
      const total = allAnnouncements.length;

      sendPaginatedResponse(
        res,
        'Announcements retrieved successfully',
        announcements,
        page,
        limit,
        total
      );
    } catch (error) {
      console.error('Get announcements error:', error);
      sendServerError(res, 'Failed to retrieve announcements');
    }
  }

  // Get announcement by ID
  async getAnnouncementById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { announcementId } = req.params;

      const announcement = await hygraphAnnouncementService.getAnnouncementById(announcementId);
      if (!announcement) {
        sendNotFound(res, 'Announcement not found');
        return;
      }

      sendSuccess(res, 'Announcement retrieved successfully', announcement);
    } catch (error) {
      console.error('Get announcement by ID error:', error);
      sendServerError(res, 'Failed to retrieve announcement');
    }
  }

  // Update announcement (teacher/admin only)
  async updateAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { announcementId } = req.params;
      const updateData = req.body;
      const userId = req.user!.uid;

      // Get existing announcement
      const existingAnnouncement = await hygraphAnnouncementService.getAnnouncementById(announcementId);
      if (!existingAnnouncement) {
        sendNotFound(res, 'Announcement not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingAnnouncement.author?.id !== userId) {
        sendError(res, 'You can only update your own announcements');
        return;
      }

      // Validate course access if updating course-specific announcement
      if (updateData.courseId) {
        const course = await hygraphCourseService.getCourseById(updateData.courseId);
        if (!course) {
          sendNotFound(res, 'Course not found');
          return;
        }

        if (req.user!.role !== UserRole.ADMIN && course.instructor?.uid !== userId) {
          sendError(res, 'You can only update announcements for your own courses');
          return;
        }
      }

      const updatedAnnouncement = await hygraphAnnouncementService.updateAnnouncement(announcementId, updateData);
      sendSuccess(res, 'Announcement updated successfully', updatedAnnouncement);
    } catch (error) {
      console.error('Update announcement error:', error);
      sendServerError(res, 'Failed to update announcement');
    }
  }

  // Delete announcement (teacher/admin only)
  async deleteAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { announcementId } = req.params;
      const userId = req.user!.uid;

      // Get existing announcement
      const existingAnnouncement = await hygraphAnnouncementService.getAnnouncementById(announcementId);
      if (!existingAnnouncement) {
        sendNotFound(res, 'Announcement not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingAnnouncement.author?.id !== userId) {
        sendError(res, 'You can only delete your own announcements');
        return;
      }

      await hygraphAnnouncementService.deleteAnnouncement(announcementId);
      sendSuccess(res, 'Announcement deleted successfully');
    } catch (error) {
      console.error('Delete announcement error:', error);
      sendServerError(res, 'Failed to delete announcement');
    }
  }

  // ===== STUDENT ENDPOINTS =====

  // Get active announcements for students
  async getActiveAnnouncements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const announcements = await hygraphAnnouncementService.getActiveAnnouncementsForStudents(limit);
      
      sendPaginatedResponse(
        res,
        'Active announcements retrieved successfully',
        announcements,
        page,
        limit,
        announcements.length
      );
    } catch (error) {
      console.error('Get active announcements error:', error);
      sendServerError(res, 'Failed to retrieve active announcements');
    }
  }

  // Get pinned announcements
  async getPinnedAnnouncements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const announcements = await hygraphAnnouncementService.getPinnedAnnouncements(10);
      sendSuccess(res, 'Pinned announcements retrieved successfully', announcements);
    } catch (error) {
      console.error('Get pinned announcements error:', error);
      sendServerError(res, 'Failed to retrieve pinned announcements');
    }
  }

  // Get recent announcements
  async getRecentAnnouncements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const announcements = await hygraphAnnouncementService.getRecentAnnouncements(limit);
      sendSuccess(res, 'Recent announcements retrieved successfully', announcements);
    } catch (error) {
      console.error('Get recent announcements error:', error);
      sendServerError(res, 'Failed to retrieve recent announcements');
    }
  }

  // ===== COURSE ANNOUNCEMENTS =====

  // Get announcements by course
  async getCourseAnnouncements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Verify course exists and user has access
      const course = await hygraphCourseService.getCourseById(courseId);
      if (!course) {
        sendNotFound(res, 'Course not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && course.instructor?.uid !== req.user!.uid) {
        // Check if user is enrolled in the course
        const enrollments = await hygraphCourseService.getCourseEnrollments(courseId);
        const isEnrolled = enrollments.some(e => e.student?.uid === req.user!.uid);
        
        if (!isEnrolled) {
          sendError(res, 'You can only view announcements for courses you are enrolled in or teaching');
          return;
        }
      }

      const announcements = await hygraphAnnouncementService.getAnnouncementsByCourse(courseId, limit);
      
      sendPaginatedResponse(
        res,
        'Course announcements retrieved successfully',
        announcements,
        page,
        limit,
        announcements.length
      );
    } catch (error) {
      console.error('Get course announcements error:', error);
      sendServerError(res, 'Failed to retrieve course announcements');
    }
  }

  // ===== ANNOUNCEMENT MANAGEMENT =====

  // Pin/unpin announcement
  async togglePinAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { announcementId } = req.params;
      const { isPinned } = req.body;
      const userId = req.user!.uid;

      // Get existing announcement
      const existingAnnouncement = await hygraphAnnouncementService.getAnnouncementById(announcementId);
      if (!existingAnnouncement) {
        sendNotFound(res, 'Announcement not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingAnnouncement.author?.id !== userId) {
        sendError(res, 'You can only manage your own announcements');
        return;
      }

      const updatedAnnouncement = await hygraphAnnouncementService.togglePinAnnouncement(announcementId, isPinned);
      sendSuccess(res, `Announcement ${isPinned ? 'pinned' : 'unpinned'} successfully`, updatedAnnouncement);
    } catch (error) {
      console.error('Toggle pin announcement error:', error);
      sendServerError(res, 'Failed to toggle pin status');
    }
  }

  // Activate/deactivate announcement
  async toggleActiveAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { announcementId } = req.params;
      const { isActive } = req.body;
      const userId = req.user!.uid;

      // Get existing announcement
      const existingAnnouncement = await hygraphAnnouncementService.getAnnouncementById(announcementId);
      if (!existingAnnouncement) {
        sendNotFound(res, 'Announcement not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingAnnouncement.author?.id !== userId) {
        sendError(res, 'You can only manage your own announcements');
        return;
      }

      const updatedAnnouncement = await hygraphAnnouncementService.toggleActiveAnnouncement(announcementId, isActive);
      sendSuccess(res, `Announcement ${isActive ? 'activated' : 'deactivated'} successfully`, updatedAnnouncement);
    } catch (error) {
      console.error('Toggle active announcement error:', error);
      sendServerError(res, 'Failed to toggle active status');
    }
  }

  // Schedule announcement
  async scheduleAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { announcementId } = req.params;
      const { publishAt } = req.body;
      const userId = req.user!.uid;

      if (!publishAt) {
        sendError(res, 'Publish date is required');
        return;
      }

      // Validate publish date is in the future
      const publishDate = new Date(publishAt);
      if (publishDate <= new Date()) {
        sendError(res, 'Publish date must be in the future');
        return;
      }

      // Get existing announcement
      const existingAnnouncement = await hygraphAnnouncementService.getAnnouncementById(announcementId);
      if (!existingAnnouncement) {
        sendNotFound(res, 'Announcement not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingAnnouncement.author?.id !== userId) {
        sendError(res, 'You can only manage your own announcements');
        return;
      }

      const updatedAnnouncement = await hygraphAnnouncementService.scheduleAnnouncement(announcementId, publishAt);
      sendSuccess(res, 'Announcement scheduled successfully', updatedAnnouncement);
    } catch (error) {
      console.error('Schedule announcement error:', error);
      sendServerError(res, 'Failed to schedule announcement');
    }
  }

  // Set announcement expiration
  async setAnnouncementExpiration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { announcementId } = req.params;
      const { expiresAt } = req.body;
      const userId = req.user!.uid;

      if (!expiresAt) {
        sendError(res, 'Expiration date is required');
        return;
      }

      // Validate expiration date is in the future
      const expirationDate = new Date(expiresAt);
      if (expirationDate <= new Date()) {
        sendError(res, 'Expiration date must be in the future');
        return;
      }

      // Get existing announcement
      const existingAnnouncement = await hygraphAnnouncementService.getAnnouncementById(announcementId);
      if (!existingAnnouncement) {
        sendNotFound(res, 'Announcement not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && existingAnnouncement.author?.id !== userId) {
        sendError(res, 'You can only manage your own announcements');
        return;
      }

      const updatedAnnouncement = await hygraphAnnouncementService.setAnnouncementExpiration(announcementId, expiresAt);
      sendSuccess(res, 'Announcement expiration set successfully', updatedAnnouncement);
    } catch (error) {
      console.error('Set announcement expiration error:', error);
      sendServerError(res, 'Failed to set announcement expiration');
    }
  }

  // ===== STATISTICS =====

  // Get announcement statistics (admin only)
  async getAnnouncementStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await hygraphAnnouncementService.getAnnouncementStats();
      sendSuccess(res, 'Announcement statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get announcement stats error:', error);
      sendServerError(res, 'Failed to retrieve announcement statistics');
    }
  }

  // Get author's announcement statistics
  async getAuthorAnnouncementStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const authorId = req.user!.uid;
      const stats = await hygraphAnnouncementService.getAuthorAnnouncementStats(authorId);
      sendSuccess(res, 'Author announcement statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get author announcement stats error:', error);
      sendServerError(res, 'Failed to retrieve author announcement statistics');
    }
  }

  // Get course announcement statistics
  async getCourseAnnouncementStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      // Verify course exists and user has access
      const course = await hygraphCourseService.getCourseById(courseId);
      if (!course) {
        sendNotFound(res, 'Course not found');
        return;
      }

      // Check permissions
      if (req.user!.role !== UserRole.ADMIN && course.instructor?.uid !== req.user!.uid) {
        sendError(res, 'You can only view statistics for your own courses');
        return;
      }

      const stats = await hygraphAnnouncementService.getCourseAnnouncementStats(courseId);
      sendSuccess(res, 'Course announcement statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get course announcement stats error:', error);
      sendServerError(res, 'Failed to retrieve course announcement statistics');
    }
  }

  // Get public announcements (no authentication required)
  async getPublicAnnouncements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const filters: AnnouncementFilters = {
        isActive: true,
        isPublic: true
      };

      const announcements = await hygraphAnnouncementService.getAnnouncements(limit, skip, filters);
      
      sendPaginatedResponse(
        res,
        'Public announcements retrieved successfully',
        announcements,
        page,
        limit,
        announcements.length
      );
    } catch (error) {
      console.error('Get public announcements error:', error);
      sendServerError(res, 'Failed to get public announcements');
    }
  }
}

export default new AnnouncementController();