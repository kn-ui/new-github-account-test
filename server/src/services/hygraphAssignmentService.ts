import { hygraphClient } from '../config/hygraph';
import {
  GET_ASSIGNMENTS,
  GET_ASSIGNMENT_BY_ID,
  CREATE_ASSIGNMENT,
  UPDATE_ASSIGNMENT,
  DELETE_ASSIGNMENT,
  GET_SUBMISSIONS,
  GET_SUBMISSION_BY_ID,
  CREATE_SUBMISSION,
  UPDATE_SUBMISSION
} from '../lib/hygraphOperations';

// Types for Hygraph data
export interface HygraphAssignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  maxScore: number;
  isActive: boolean;
  course?: {
    id: string;
    title: string;
  };
  teacher?: {
    id: string;
    displayName: string;
  };
}

export interface HygraphSubmission {
  id: string;
  content: string;
  submissionStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  grade?: number;
  feedback?: string;
  maxScore?: number;
  isActive: boolean;
  submittedAt: string;
  student?: {
    id: string;
    displayName: string;
    email: string;
  };
  assignment?: {
    id: string;
    title: string;
    description: string;
  };
  course?: {
    id: string;
    title: string;
  };
}

export interface CreateAssignmentData {
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  maxScore: number;
  courseId: string;
  teacherId: string;
  isActive?: boolean;
}

export interface UpdateAssignmentData {
  title?: string;
  description?: string;
  instructions?: string;
  dueDate?: string;
  maxScore?: number;
  isActive?: boolean;
}

export interface CreateSubmissionData {
  content: string;
  assignmentId: string;
  studentId: string;
  courseId: string;
  submissionStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
}

export interface UpdateSubmissionData {
  content?: string;
  submissionStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  grade?: number;
  feedback?: string;
}

// Hygraph Assignment Service for Backend
export const hygraphAssignmentService = {
  // ===== ASSIGNMENT OPERATIONS =====
  
  // Get all assignments with pagination
  async getAssignments(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphAssignment[]> {
    try {
      const response = await hygraphClient.request(GET_ASSIGNMENTS, {
        first: limit,
        skip: offset,
        where: where || {}
      });
      return (response as any).assignments || [];
    } catch (error) {
      console.error('Error fetching assignments from Hygraph:', error);
      throw error;
    }
  },

  // Get assignment by ID
  async getAssignmentById(id: string): Promise<HygraphAssignment | null> {
    try {
      const response = await hygraphClient.request(GET_ASSIGNMENT_BY_ID, { id });
      return (response as any).assignment || null;
    } catch (error) {
      console.error('Error fetching assignment by ID from Hygraph:', error);
      throw error;
    }
  },

  // Get assignments by course
  async getAssignmentsByCourse(courseId: string, limit: number = 100): Promise<HygraphAssignment[]> {
    try {
      const response = await hygraphClient.request(GET_ASSIGNMENTS, {
        first: limit,
        skip: 0,
        where: { course: { id: courseId } }
      });
      return (response as any).assignments || [];
    } catch (error) {
      console.error('Error fetching assignments by course from Hygraph:', error);
      throw error;
    }
  },

  // Get assignments by teacher
  async getAssignmentsByTeacher(teacherId: string, limit: number = 100): Promise<HygraphAssignment[]> {
    try {
      const response = await hygraphClient.request(GET_ASSIGNMENTS, {
        first: limit,
        skip: 0,
        where: { teacher: { id: teacherId } }
      });
      return (response as any).assignments || [];
    } catch (error) {
      console.error('Error fetching assignments by teacher from Hygraph:', error);
      throw error;
    }
  },

  // Create new assignment
  async createAssignment(assignmentData: CreateAssignmentData): Promise<HygraphAssignment> {
    try {
      const response = await hygraphClient.request(CREATE_ASSIGNMENT, {
        data: {
          title: assignmentData.title,
          description: assignmentData.description,
          instructions: assignmentData.instructions,
          dueDate: assignmentData.dueDate,
          maxScore: assignmentData.maxScore,
          isActive: assignmentData.isActive ?? true,
          course: { connect: { id: assignmentData.courseId } },
          teacher: { connect: { id: assignmentData.teacherId } }
        }
      });
      return (response as any).createAssignment;
    } catch (error) {
      console.error('Error creating assignment in Hygraph:', error);
      throw error;
    }
  },

  // Update assignment
  async updateAssignment(id: string, assignmentData: UpdateAssignmentData): Promise<HygraphAssignment> {
    try {
      const response = await hygraphClient.request(UPDATE_ASSIGNMENT, {
        id,
        data: assignmentData
      });
      return (response as any).updateAssignment;
    } catch (error) {
      console.error('Error updating assignment in Hygraph:', error);
      throw error;
    }
  },

  // Delete assignment
  async deleteAssignment(id: string): Promise<void> {
    try {
      await hygraphClient.request(DELETE_ASSIGNMENT, { id });
    } catch (error) {
      console.error('Error deleting assignment from Hygraph:', error);
      throw error;
    }
  },

  // ===== SUBMISSION OPERATIONS =====

  // Get all submissions with pagination
  async getSubmissions(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphSubmission[]> {
    try {
      const response = await hygraphClient.request(GET_SUBMISSIONS, {
        first: limit,
        skip: offset,
        where: where || {}
      });
      return (response as any).submissions || [];
    } catch (error) {
      console.error('Error fetching submissions from Hygraph:', error);
      throw error;
    }
  },

  // Get submission by ID
  async getSubmissionById(id: string): Promise<HygraphSubmission | null> {
    try {
      const response = await hygraphClient.request(GET_SUBMISSION_BY_ID, { id });
      return (response as any).submission || null;
    } catch (error) {
      console.error('Error fetching submission by ID from Hygraph:', error);
      throw error;
    }
  },

  // Get submissions by assignment
  async getSubmissionsByAssignment(assignmentId: string, limit: number = 100): Promise<HygraphSubmission[]> {
    try {
      const response = await hygraphClient.request(GET_SUBMISSIONS, {
        first: limit,
        skip: 0,
        where: { assignment: { id: assignmentId } }
      });
      return (response as any).submissions || [];
    } catch (error) {
      console.error('Error fetching submissions by assignment from Hygraph:', error);
      throw error;
    }
  },

  // Get submissions by student
  async getSubmissionsByStudent(studentId: string, limit: number = 100): Promise<HygraphSubmission[]> {
    try {
      const response = await hygraphClient.request(GET_SUBMISSIONS, {
        first: limit,
        skip: 0,
        where: { student: { id: studentId } }
      });
      return (response as any).submissions || [];
    } catch (error) {
      console.error('Error fetching submissions by student from Hygraph:', error);
      throw error;
    }
  },

  // Get student's submission for specific assignment
  async getStudentSubmissionForAssignment(studentId: string, assignmentId: string): Promise<HygraphSubmission | null> {
    try {
      const response = await hygraphClient.request(GET_SUBMISSIONS, {
        first: 1,
        skip: 0,
        where: { 
          student: { id: studentId },
          assignment: { id: assignmentId }
        }
      });
      const submissions = (response as any).submissions || [];
      return submissions.length > 0 ? submissions[0] : null;
    } catch (error) {
      console.error('Error fetching student submission for assignment from Hygraph:', error);
      throw error;
    }
  },

  // Create new submission
  async createSubmission(submissionData: CreateSubmissionData): Promise<HygraphSubmission> {
    try {
      const now = new Date().toISOString();
      const response = await hygraphClient.request(CREATE_SUBMISSION, {
        data: {
          content: submissionData.content,
          submissionStatus: submissionData.submissionStatus || 'SUBMITTED',
          isActive: true,
          submittedAt: now,
          student: { connect: { id: submissionData.studentId } },
          assignment: { connect: { id: submissionData.assignmentId } },
          course: { connect: { id: submissionData.courseId } }
        }
      });
      return (response as any).createSubmission;
    } catch (error) {
      console.error('Error creating submission in Hygraph:', error);
      throw error;
    }
  },

  // Update submission
  async updateSubmission(id: string, submissionData: UpdateSubmissionData): Promise<HygraphSubmission> {
    try {
      const response = await hygraphClient.request(UPDATE_SUBMISSION, {
        id,
        data: submissionData
      });
      return (response as any).updateSubmission;
    } catch (error) {
      console.error('Error updating submission in Hygraph:', error);
      throw error;
    }
  },

  // Grade submission
  async gradeSubmission(submissionId: string, grade: number, feedback?: string): Promise<HygraphSubmission> {
    try {
      const response = await hygraphClient.request(UPDATE_SUBMISSION, {
        id: submissionId,
        data: {
          grade,
          feedback,
          submissionStatus: 'GRADED'
        }
      });
      return (response as any).updateSubmission;
    } catch (error) {
      console.error('Error grading submission in Hygraph:', error);
      throw error;
    }
  },

  // ===== STATISTICS =====

  // Get assignment statistics
  async getAssignmentStats(assignmentId: string): Promise<{
    totalSubmissions: number;
    gradedSubmissions: number;
    pendingSubmissions: number;
    averageGrade: number;
  }> {
    try {
      const submissions = await this.getSubmissionsByAssignment(assignmentId, 1000);
      const gradedSubmissions = submissions.filter(s => s.submissionStatus === 'GRADED');
      const pendingSubmissions = submissions.filter(s => s.submissionStatus === 'SUBMITTED');
      
      const averageGrade = gradedSubmissions.length > 0 
        ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
        : 0;

      return {
        totalSubmissions: submissions.length,
        gradedSubmissions: gradedSubmissions.length,
        pendingSubmissions: pendingSubmissions.length,
        averageGrade: Math.round(averageGrade * 100) / 100
      };
    } catch (error) {
      console.error('Error getting assignment stats from Hygraph:', error);
      throw error;
    }
  },

  // Get teacher's assignment statistics
  async getTeacherAssignmentStats(teacherId: string): Promise<{
    totalAssignments: number;
    activeAssignments: number;
    totalSubmissions: number;
    gradedSubmissions: number;
    averageGrade: number;
  }> {
    try {
      const assignments = await this.getAssignmentsByTeacher(teacherId, 1000);
      const activeAssignments = assignments.filter(a => a.isActive);
      
      let totalSubmissions = 0;
      let gradedSubmissions = 0;
      let totalGrade = 0;
      let gradedCount = 0;

      for (const assignment of assignments) {
        const stats = await this.getAssignmentStats(assignment.id);
        totalSubmissions += stats.totalSubmissions;
        gradedSubmissions += stats.gradedSubmissions;
        totalGrade += stats.averageGrade * stats.gradedSubmissions;
        gradedCount += stats.gradedSubmissions;
      }

      const averageGrade = gradedCount > 0 ? totalGrade / gradedCount : 0;

      return {
        totalAssignments: assignments.length,
        activeAssignments: activeAssignments.length,
        totalSubmissions,
        gradedSubmissions,
        averageGrade: Math.round(averageGrade * 100) / 100
      };
    } catch (error) {
      console.error('Error getting teacher assignment stats from Hygraph:', error);
      throw error;
    }
  }
};