import { hygraphClient } from '../config/hygraph';
import {
  GET_SUBMISSIONS,
  GET_SUBMISSION_BY_ID,
  CREATE_SUBMISSION,
  UPDATE_SUBMISSION,
  DELETE_SUBMISSION
} from '../lib/hygraphOperations';

// Types for Hygraph Submission data
export interface HygraphSubmission {
  id: string;
  content: string;
  submissionStatus: 'SUBMITTED' | 'GRADED';
  grade?: number;
  feedback?: string;
  maxScore?: number;
  attachments?: string[];
  isActive: boolean;
  submittedAt: string;
  updatedAt: string;
  student?: {
    id: string;
    uid: string;
    displayName: string;
    email: string;
  };
  assignment?: {
    id: string;
    title: string;
    description: string;
    instructions?: string;
    dueDate: string;
    maxScore: number;
  };
  course?: {
    id: string;
    title: string;
  };
}

export interface CreateSubmissionData {
  assignmentId: string;
  courseId: string;
  studentId: string;
  content: string;
  attachments?: string[];
  submissionStatus?: 'SUBMITTED' | 'GRADED';
}

export interface UpdateSubmissionData {
  content?: string;
  attachments?: string[];
  submissionStatus?: 'SUBMITTED' | 'GRADED';
  grade?: number;
  feedback?: string;
}

// Hygraph Submission Service for Backend
export const hygraphSubmissionService = {
  // Get submissions by student
  async getSubmissionsByStudent(studentId: string, limit: number = 100, offset: number = 0): Promise<HygraphSubmission[]> {
    try {
      // First get the student's Hygraph ID
      const { hygraphUserService } = await import('./hygraphUserService');
      const student = await hygraphUserService.getUserByUid(studentId);
      if (!student) {
        return [];
      }

      const response: any = await hygraphClient.request(GET_SUBMISSIONS, {
        first: limit,
        skip: offset,
        where: { student: { id: student.id } }
      });
      return response.submissions || [];
    } catch (error) {
      console.error('Error fetching submissions by student from Hygraph:', error);
      throw error;
    }
  },

  // Get submissions by assignment
  async getSubmissionsByAssignment(assignmentId: string, limit: number = 100, offset: number = 0): Promise<HygraphSubmission[]> {
    try {
      const response: any = await hygraphClient.request(GET_SUBMISSIONS, {
        first: limit,
        skip: offset,
        where: { assignment: { id: assignmentId } }
      });
      return response.submissions || [];
    } catch (error) {
      console.error('Error fetching submissions by assignment from Hygraph:', error);
      throw error;
    }
  },

  // Get submissions by course
  async getSubmissionsByCourse(courseId: string, limit: number = 100, offset: number = 0): Promise<HygraphSubmission[]> {
    try {
      const response: any = await hygraphClient.request(GET_SUBMISSIONS, {
        first: limit,
        skip: offset,
        where: { course: { id: courseId } }
      });
      return response.submissions || [];
    } catch (error) {
      console.error('Error fetching submissions by course from Hygraph:', error);
      throw error;
    }
  },

  // Get submission by ID
  async getSubmissionById(id: string): Promise<HygraphSubmission | null> {
    try {
      const response: any = await hygraphClient.request(GET_SUBMISSION_BY_ID, { id });
      return response.submission || null;
    } catch (error) {
      console.error('Error fetching submission by ID from Hygraph:', error);
      throw error;
    }
  },

  // Create submission
  async createSubmission(submissionData: CreateSubmissionData): Promise<HygraphSubmission> {
    try {
      // Get the student's Hygraph ID
      const { hygraphUserService } = await import('./hygraphUserService');
      const student = await hygraphUserService.getUserByUid(submissionData.studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const data: any = {
        content: submissionData.content,
        submissionStatus: submissionData.submissionStatus || 'SUBMITTED',
        attachments: submissionData.attachments || [],
        isActive: true,
        submittedAt: new Date().toISOString(),
        student: { connect: { id: student.id } },
        assignment: { connect: { id: submissionData.assignmentId } },
        course: { connect: { id: submissionData.courseId } }
      };

      const response: any = await hygraphClient.request(CREATE_SUBMISSION, { data });
      return response.createSubmission;
    } catch (error) {
      console.error('Error creating submission in Hygraph:', error);
      throw error;
    }
  },

  // Update submission
  async updateSubmission(id: string, submissionData: UpdateSubmissionData): Promise<HygraphSubmission> {
    try {
      const data: any = {
        ...submissionData,
        updatedAt: new Date().toISOString()
      };

      const response: any = await hygraphClient.request(UPDATE_SUBMISSION, { id, data });
      return response.updateSubmission;
    } catch (error) {
      console.error('Error updating submission in Hygraph:', error);
      throw error;
    }
  },

  // Delete submission
  async deleteSubmission(id: string): Promise<void> {
    try {
      await hygraphClient.request(DELETE_SUBMISSION, { id });
    } catch (error) {
      console.error('Error deleting submission from Hygraph:', error);
      throw error;
    }
  },

  // Grade submission
  async gradeSubmission(id: string, grade: number, feedback?: string): Promise<HygraphSubmission> {
    try {
      const data: any = {
        grade,
        feedback: feedback || '',
        submissionStatus: 'GRADED',
        updatedAt: new Date().toISOString()
      };

      const response: any = await hygraphClient.request(UPDATE_SUBMISSION, { id, data });
      return response.updateSubmission;
    } catch (error) {
      console.error('Error grading submission in Hygraph:', error);
      throw error;
    }
  }
};