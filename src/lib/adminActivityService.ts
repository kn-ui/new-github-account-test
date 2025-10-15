/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface AdminActivity {
  id?: string;
  adminId: string;
  adminName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: 'COURSE' | 'EVENT' | 'USER' | 'ANNOUNCEMENT' | 'ASSIGNMENT';
  resourceId: string;
  resourceName: string;
  details?: string;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActivityFilter {
  adminId?: string;
  action?: string;
  resource?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

const COLLECTION_NAME = 'admin_activities';

export const adminActivityService = {
  // Log an admin activity
  async logActivity(activity: Omit<AdminActivity, 'id' | 'timestamp'>): Promise<string> {
    try {
      const activityData = {
        ...activity,
        timestamp: Timestamp.now(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), activityData);
      return docRef.id;
    } catch (error) {
      console.error('Error logging admin activity:', error);
      throw error;
    }
  },

  // Get activities with filters and pagination
  async getActivities(
    filters: ActivityFilter = {}, 
    limitCount = 50, 
    offset = 0
  ): Promise<AdminActivity[]> {
    try {
      let q = query(collection(db, COLLECTION_NAME));

      // Apply filters
      if (filters.adminId) {
        q = query(q, where('adminId', '==', filters.adminId));
      }
      
      if (filters.action) {
        q = query(q, where('action', '==', filters.action));
      }
      
      if (filters.resource) {
        q = query(q, where('resource', '==', filters.resource));
      }

      // Add ordering and limit
      q = query(q, orderBy('timestamp', 'desc'), limit(limitCount));

      const snapshot = await getDocs(q);
      let activities = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as AdminActivity));

      // Client-side filtering for date range and search
      if (filters.dateFrom || filters.dateTo || filters.searchTerm) {
        activities = activities.filter(activity => {
          // Date filtering
          if (filters.dateFrom && activity.timestamp.toDate() < filters.dateFrom) {
            return false;
          }
          if (filters.dateTo && activity.timestamp.toDate() > filters.dateTo) {
            return false;
          }
          
          // Search term filtering
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            return (
              activity.adminName.toLowerCase().includes(searchLower) ||
              activity.resourceName.toLowerCase().includes(searchLower) ||
              activity.details?.toLowerCase().includes(searchLower) ||
              activity.action.toLowerCase().includes(searchLower) ||
              activity.resource.toLowerCase().includes(searchLower)
            );
          }
          
          return true;
        });
      }

      // Apply client-side pagination if needed
      if (offset > 0) {
        activities = activities.slice(offset);
      }

      return activities;
    } catch (error) {
      console.error('Error fetching admin activities:', error);
      throw error;
    }
  },

  // Get activities by admin ID
  async getActivitiesByAdmin(adminId: string, limitCount = 100): Promise<AdminActivity[]> {
    return this.getActivities({ adminId }, limitCount);
  },

  // Get recent activities
  async getRecentActivities(limitCount = 20): Promise<AdminActivity[]> {
    return this.getActivities({}, limitCount);
  },

  // Get activity statistics
  async getActivityStats(dateFrom?: Date, dateTo?: Date): Promise<{
    totalActivities: number;
    activitiesByAction: Record<string, number>;
    activitiesByResource: Record<string, number>;
    activitiesByAdmin: Record<string, number>;
  }> {
    try {
      const activities = await this.getActivities({ dateFrom, dateTo }, 1000);
      
      const stats = {
        totalActivities: activities.length,
        activitiesByAction: {} as Record<string, number>,
        activitiesByResource: {} as Record<string, number>,
        activitiesByAdmin: {} as Record<string, number>
      };

      activities.forEach(activity => {
        // Count by action
        stats.activitiesByAction[activity.action] = 
          (stats.activitiesByAction[activity.action] || 0) + 1;
        
        // Count by resource
        stats.activitiesByResource[activity.resource] = 
          (stats.activitiesByResource[activity.resource] || 0) + 1;
        
        // Count by admin
        stats.activitiesByAdmin[activity.adminName] = 
          (stats.activitiesByAdmin[activity.adminName] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting activity stats:', error);
      throw error;
    }
  },

  // Helper function to get client IP (simplified)
  async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  },

  // Helper functions for logging specific actions
  async logCourseAction(
    adminId: string, 
    adminName: string, 
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    courseId: string,
    courseName: string,
    details?: string
  ): Promise<string> {
    return this.logActivity({
      adminId,
      adminName,
      action,
      resource: 'COURSE',
      resourceId: courseId,
      resourceName: courseName,
      details
    });
  },

  async logUserAction(
    adminId: string, 
    adminName: string, 
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    userId: string,
    userName: string,
    details?: string
  ): Promise<string> {
    return this.logActivity({
      adminId,
      adminName,
      action,
      resource: 'USER',
      resourceId: userId,
      resourceName: userName,
      details
    });
  },

  async logEventAction(
    adminId: string, 
    adminName: string, 
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    eventId: string,
    eventName: string,
    details?: string
  ): Promise<string> {
    return this.logActivity({
      adminId,
      adminName,
      action,
      resource: 'EVENT',
      resourceId: eventId,
      resourceName: eventName,
      details
    });
  },

  async logAnnouncementAction(
    adminId: string, 
    adminName: string, 
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    announcementId: string,
    announcementTitle: string,
    details?: string
  ): Promise<string> {
    return this.logActivity({
      adminId,
      adminName,
      action,
      resource: 'ANNOUNCEMENT',
      resourceId: announcementId,
      resourceName: announcementTitle,
      details
    });
  }
};