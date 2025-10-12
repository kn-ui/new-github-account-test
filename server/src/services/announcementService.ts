import { hygraphClient } from '../config/hygraph';
import { gql } from 'graphql-request';

interface Announcement {
  id: string;
  title: string;
  body: string;
  targetAudience?: 'ALL_STUDENTS' | 'COURSE_STUDENTS' | 'SPECIFIC_STUDENT';
  externalLink?: string;
  recipientStudentId?: string;
  courseId?: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AnnouncementCreateData {
  title: string;
  body: string;
  targetAudience?: 'ALL_STUDENTS' | 'COURSE_STUDENTS' | 'SPECIFIC_STUDENT';
  externalLink?: string;
  recipientStudentId?: string;
  courseId?: string;
  authorId: string;
}

class AnnouncementService {

  /**
   * Create announcement
   */
  async createAnnouncement(data: AnnouncementCreateData): Promise<Announcement> {
    try {
      const mutation = gql`
        mutation CreateAnnouncement(
          $title: String!
          $body: String!
          $targetAudience: AnnouncementTarget
          $externalLink: String
          $recipientStudentId: String
          $courseId: ID
          $authorId: String!
        ) {
          createAnnouncement(data: {
            title: $title
            body: $body
            targetAudience: $targetAudience
            externalLink: $externalLink
            recipientStudentId: $recipientStudentId
            course: ${data.courseId ? '{ connect: { id: $courseId } }' : 'null'}
            author: { connect: { uid: $authorId } }
          }) {
            id
            title
            body
            targetAudience
            externalLink
            recipientStudentId
            course { id title }
            author { uid displayName }
            createdAt
            updatedAt
          }
        }
      `;

      const variables: any = {
        title: data.title,
        body: data.body,
        targetAudience: data.targetAudience || null,
        externalLink: data.externalLink || null,
        recipientStudentId: data.recipientStudentId || null,
        authorId: data.authorId
      };

      if (data.courseId) {
        variables.courseId = data.courseId;
      }

      const response = await hygraphClient.request<{ createAnnouncement: any }>(mutation, variables);

      return this.transformAnnouncement(response.createAnnouncement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw new Error('Failed to create announcement');
    }
  }

  /**
   * Get announcement by ID
   */
  async getAnnouncementById(announcementId: string): Promise<Announcement | null> {
    try {
      const query = gql`
        query GetAnnouncement($id: ID!) {
          announcement(where: { id: $id }) {
            id
            title
            body
            targetAudience
            externalLink
            recipientStudentId
            course { id title }
            author { uid displayName }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ announcement: any | null }>(query, { id: announcementId });
      
      if (!response.announcement) return null;
      
      return this.transformAnnouncement(response.announcement);
    } catch (error) {
      console.error('Error getting announcement:', error);
      throw new Error('Failed to get announcement');
    }
  }

  /**
   * Get announcements with filtering and pagination
   */
  async getAnnouncements(
    page = 1,
    limit = 20,
    courseId?: string,
    targetAudience?: string,
    authorId?: string
  ): Promise<{
    announcements: Announcement[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const whereConditions: string[] = [];
      if (courseId) whereConditions.push(`course: { id: "${courseId}" }`);
      if (targetAudience) whereConditions.push(`targetAudience: ${targetAudience}`);
      if (authorId) whereConditions.push(`author: { uid: "${authorId}" }`);

      const whereClause = whereConditions.length > 0 ? `where: { ${whereConditions.join(', ')} }` : '';

      const query = gql`
        query GetAnnouncements($first: Int!, $skip: Int!) {
          announcementsConnection(${whereClause}, first: $first, skip: $skip, orderBy: createdAt_DESC) {
            aggregate { count }
            edges {
              node {
                id
                title
                body
                targetAudience
                externalLink
                recipientStudentId
                course { id title }
                author { uid displayName }
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        announcementsConnection: {
          edges: { node: any }[];
          aggregate: { count: number };
        };
      }>(query, { first: limit, skip });

      const announcements = response.announcementsConnection.edges.map(edge =>
        this.transformAnnouncement(edge.node)
      );
      const total = response.announcementsConnection.aggregate.count;

      return {
        announcements,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting announcements:', error);
      throw new Error('Failed to get announcements');
    }
  }

  /**
   * Get announcements for a specific student (considering enrollment and targeting)
   */
  async getAnnouncementsForStudent(
    studentId: string,
    page = 1,
    limit = 20
  ): Promise<{
    announcements: Announcement[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      // Get student's enrolled courses first
      const enrollmentsQuery = gql`
        query GetStudentEnrollments($studentId: String!) {
          enrollments(where: { student: { uid: $studentId }, status: ACTIVE }) {
            course { id }
          }
        }
      `;

      const enrollmentsResponse = await hygraphClient.request<{
        enrollments: { course: { id: string } }[];
      }>(enrollmentsQuery, { studentId });

      const enrolledCourseIds = enrollmentsResponse.enrollments.map(e => e.course.id);

      // Build complex where clause for student announcements
      const whereConditions = [
        'targetAudience: ALL_STUDENTS',
        `recipientStudentId: "${studentId}"`,
      ];

      // Add course-specific announcements for enrolled courses
      if (enrolledCourseIds.length > 0) {
        const courseConditions = enrolledCourseIds.map(id => `{ course: { id: "${id}" }, targetAudience: COURSE_STUDENTS }`);
        whereConditions.push(...courseConditions);
      }

      const query = gql`
        query GetAnnouncementsForStudent($first: Int!, $skip: Int!) {
          announcementsConnection(
            where: { OR: [${whereConditions.map(c => `{${c}}`).join(', ')}] },
            first: $first,
            skip: $skip,
            orderBy: createdAt_DESC
          ) {
            aggregate { count }
            edges {
              node {
                id
                title
                body
                targetAudience
                externalLink
                recipientStudentId
                course { id title }
                author { uid displayName }
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        announcementsConnection: {
          edges: { node: any }[];
          aggregate: { count: number };
        };
      }>(query, { first: limit, skip });

      const announcements = response.announcementsConnection.edges.map(edge =>
        this.transformAnnouncement(edge.node)
      );
      const total = response.announcementsConnection.aggregate.count;

      return {
        announcements,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting announcements for student:', error);
      throw new Error('Failed to get announcements for student');
    }
  }

  /**
   * Update announcement
   */
  async updateAnnouncement(
    announcementId: string,
    updateData: Partial<AnnouncementCreateData>
  ): Promise<Announcement> {
    try {
      const mutation = gql`
        mutation UpdateAnnouncement($id: ID!, $data: AnnouncementUpdateInput!) {
          updateAnnouncement(where: { id: $id }, data: $data) {
            id
            title
            body
            targetAudience
            externalLink
            recipientStudentId
            course { id title }
            author { uid displayName }
            createdAt
            updatedAt
          }
        }
      `;

      // Filter out undefined values
      const data: Record<string, any> = {};
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'courseId') {
            data.course = value ? { connect: { id: value } } : { disconnect: true };
          } else if (key !== 'authorId') {
            data[key] = value;
          }
        }
      });

      const response = await hygraphClient.request<{ updateAnnouncement: any }>(mutation, {
        id: announcementId,
        data
      });

      return this.transformAnnouncement(response.updateAnnouncement);
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw new Error('Failed to update announcement');
    }
  }

  /**
   * Delete announcement
   */
  async deleteAnnouncement(announcementId: string): Promise<void> {
    try {
      const mutation = gql`
        mutation DeleteAnnouncement($id: ID!) {
          deleteAnnouncement(where: { id: $id }) { id }
        }
      `;

      await hygraphClient.request(mutation, { id: announcementId });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw new Error('Failed to delete announcement');
    }
  }

  /**
   * Transform announcement data from Hygraph
   */
  private transformAnnouncement(announcement: any): Announcement {
    return {
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      targetAudience: announcement.targetAudience,
      externalLink: announcement.externalLink,
      recipientStudentId: announcement.recipientStudentId,
      courseId: announcement.course?.id,
      authorId: announcement.author?.uid || '',
      authorName: announcement.author?.displayName || '',
      createdAt: new Date(announcement.createdAt),
      updatedAt: new Date(announcement.updatedAt)
    };
  }
}

export default new AnnouncementService();