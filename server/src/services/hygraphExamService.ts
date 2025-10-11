import { hygraphClient } from '../config/hygraph';
import {
  GET_EXAMS,
  GET_EXAM_BY_ID,
  CREATE_EXAM,
  UPDATE_EXAM,
  DELETE_EXAM,
  GET_EXAM_ATTEMPTS,
  CREATE_EXAM_ATTEMPT,
  UPDATE_EXAM_ATTEMPT
} from '../lib/hygraphOperations';

// Types for Hygraph data
export interface HygraphExam {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  durationMinutes?: number;
  totalPoints: number;
  questions?: any; // JSON
  firstAttemptTimestamp?: string;
  course?: {
    id: string;
    title: string;
  };
}

export interface HygraphExamAttempt {
  id: string;
  examAttemptStatus: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  answers?: any; // JSON
  autoScore?: number;
  totalAutoPoints?: number;
  manualScore?: number;
  score: number;
  feedback?: string;
  isGraded: boolean;
  startedAt: string;
  submittedAt?: string;
  student?: {
    id: string;
    displayName: string;
    email: string;
  };
  exam?: {
    id: string;
    title: string;
    description: string;
  };
}

export interface CreateExamData {
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  durationMinutes?: number;
  totalPoints: number;
  questions?: any;
  courseId: string;
  firstAttemptTimestamp?: string;
}

export interface UpdateExamData {
  title?: string;
  description?: string;
  date?: string;
  startTime?: string;
  durationMinutes?: number;
  totalPoints?: number;
  questions?: any;
  firstAttemptTimestamp?: string;
}

export interface CreateExamAttemptData {
  examId: string;
  studentId: string;
  examAttemptStatus?: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  answers?: any;
}

export interface UpdateExamAttemptData {
  examAttemptStatus?: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  answers?: any;
  autoScore?: number;
  totalAutoPoints?: number;
  manualScore?: number;
  score?: number;
  feedback?: string;
  isGraded?: boolean;
}

// Hygraph Exam Service for Backend
export const hygraphExamService = {
  // ===== EXAM OPERATIONS =====
  
  // Get all exams with pagination
  async getExams(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphExam[]> {
    try {
      const response = await hygraphClient.request(GET_EXAMS, {
        first: limit,
        skip: offset,
        where: where || {}
      });
      return (response as any).exams || [];
    } catch (error) {
      console.error('Error fetching exams from Hygraph:', error);
      throw error;
    }
  },

  // Get exam by ID
  async getExamById(id: string): Promise<HygraphExam | null> {
    try {
      const response = await hygraphClient.request(GET_EXAM_BY_ID, { id });
      return (response as any).exam || null;
    } catch (error) {
      console.error('Error fetching exam by ID from Hygraph:', error);
      throw error;
    }
  },

  // Get exams by course
  async getExamsByCourse(courseId: string, limit: number = 100): Promise<HygraphExam[]> {
    try {
      const response = await hygraphClient.request(GET_EXAMS, {
        first: limit,
        skip: 0,
        where: { course: { id: courseId } }
      });
      return (response as any).exams || [];
    } catch (error) {
      console.error('Error fetching exams by course from Hygraph:', error);
      throw error;
    }
  },

  // Get upcoming exams
  async getUpcomingExams(limit: number = 100): Promise<HygraphExam[]> {
    try {
      const now = new Date().toISOString();
      const response = await hygraphClient.request(GET_EXAMS, {
        first: limit,
        skip: 0,
        where: { 
          date: { gte: now }
        }
      });
      return (response as any).exams || [];
    } catch (error) {
      console.error('Error fetching upcoming exams from Hygraph:', error);
      throw error;
    }
  },

  // Get past exams
  async getPastExams(limit: number = 100): Promise<HygraphExam[]> {
    try {
      const now = new Date().toISOString();
      const response = await hygraphClient.request(GET_EXAMS, {
        first: limit,
        skip: 0,
        where: { 
          date: { lt: now }
        }
      });
      return (response as any).exams || [];
    } catch (error) {
      console.error('Error fetching past exams from Hygraph:', error);
      throw error;
    }
  },

  // Create new exam
  async createExam(examData: CreateExamData): Promise<HygraphExam> {
    try {
      const response = await hygraphClient.request(CREATE_EXAM, {
        data: {
          title: examData.title,
          description: examData.description,
          date: examData.date,
          startTime: examData.startTime,
          durationMinutes: examData.durationMinutes,
          totalPoints: examData.totalPoints,
          questions: examData.questions,
          firstAttemptTimestamp: examData.firstAttemptTimestamp,
          course: { connect: { id: examData.courseId } }
        }
      });
      return (response as any).createExam;
    } catch (error) {
      console.error('Error creating exam in Hygraph:', error);
      throw error;
    }
  },

  // Update exam
  async updateExam(id: string, examData: UpdateExamData): Promise<HygraphExam> {
    try {
      const response = await hygraphClient.request(UPDATE_EXAM, {
        id,
        data: examData
      });
      return (response as any).updateExam;
    } catch (error) {
      console.error('Error updating exam in Hygraph:', error);
      throw error;
    }
  },

  // Delete exam
  async deleteExam(id: string): Promise<void> {
    try {
      await hygraphClient.request(DELETE_EXAM, { id });
    } catch (error) {
      console.error('Error deleting exam from Hygraph:', error);
      throw error;
    }
  },

  // ===== EXAM ATTEMPT OPERATIONS =====

  // Get all exam attempts with pagination
  async getExamAttempts(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphExamAttempt[]> {
    try {
      const response = await hygraphClient.request(GET_EXAM_ATTEMPTS, {
        first: limit,
        skip: offset,
        where: where || {}
      });
      return (response as any).examAttempts || [];
    } catch (error) {
      console.error('Error fetching exam attempts from Hygraph:', error);
      throw error;
    }
  },

  // Get exam attempt by ID
  async getExamAttemptById(id: string): Promise<HygraphExamAttempt | null> {
    try {
      const response = await hygraphClient.request(GET_EXAM_ATTEMPTS, {
        first: 1,
        skip: 0,
        where: { id }
      });
      const attempts = (response as any).examAttempts || [];
      return attempts.length > 0 ? attempts[0] : null;
    } catch (error) {
      console.error('Error fetching exam attempt by ID from Hygraph:', error);
      throw error;
    }
  },

  // Get exam attempts by exam
  async getExamAttemptsByExam(examId: string, limit: number = 100): Promise<HygraphExamAttempt[]> {
    try {
      const response = await hygraphClient.request(GET_EXAM_ATTEMPTS, {
        first: limit,
        skip: 0,
        where: { exam: { id: examId } }
      });
      return (response as any).examAttempts || [];
    } catch (error) {
      console.error('Error fetching exam attempts by exam from Hygraph:', error);
      throw error;
    }
  },

  // Get exam attempts by student
  async getExamAttemptsByStudent(studentId: string, limit: number = 100): Promise<HygraphExamAttempt[]> {
    try {
      const response = await hygraphClient.request(GET_EXAM_ATTEMPTS, {
        first: limit,
        skip: 0,
        where: { student: { id: studentId } }
      });
      return (response as any).examAttempts || [];
    } catch (error) {
      console.error('Error fetching exam attempts by student from Hygraph:', error);
      throw error;
    }
  },

  // Get student's attempt for specific exam
  async getStudentExamAttempt(studentId: string, examId: string): Promise<HygraphExamAttempt | null> {
    try {
      const response = await hygraphClient.request(GET_EXAM_ATTEMPTS, {
        first: 1,
        skip: 0,
        where: { 
          student: { id: studentId },
          exam: { id: examId }
        }
      });
      const attempts = (response as any).examAttempts || [];
      return attempts.length > 0 ? attempts[0] : null;
    } catch (error) {
      console.error('Error fetching student exam attempt from Hygraph:', error);
      throw error;
    }
  },

  // Start exam attempt
  async startExamAttempt(attemptData: CreateExamAttemptData): Promise<HygraphExamAttempt> {
    try {
      const now = new Date().toISOString();
      const response = await hygraphClient.request(CREATE_EXAM_ATTEMPT, {
        data: {
          examAttemptStatus: 'IN_PROGRESS',
          isGraded: false,
          score: 0,
          startedAt: now,
          student: { connect: { id: attemptData.studentId } },
          exam: { connect: { id: attemptData.examId } }
        }
      });
      return (response as any).createExamAttempt;
    } catch (error) {
      console.error('Error starting exam attempt in Hygraph:', error);
      throw error;
    }
  },

  // Update exam attempt
  async updateExamAttempt(id: string, attemptData: UpdateExamAttemptData): Promise<HygraphExamAttempt> {
    try {
      const response = await hygraphClient.request(UPDATE_EXAM_ATTEMPT, {
        id,
        data: attemptData
      });
      return (response as any).updateExamAttempt;
    } catch (error) {
      console.error('Error updating exam attempt in Hygraph:', error);
      throw error;
    }
  },

  // Submit exam attempt
  async submitExamAttempt(attemptId: string, answers: any): Promise<HygraphExamAttempt> {
    try {
      const now = new Date().toISOString();
      const response = await hygraphClient.request(UPDATE_EXAM_ATTEMPT, {
        id: attemptId,
        data: {
          answers,
          examAttemptStatus: 'SUBMITTED',
          submittedAt: now
        }
      });
      return (response as any).updateExamAttempt;
    } catch (error) {
      console.error('Error submitting exam attempt in Hygraph:', error);
      throw error;
    }
  },

  // Grade exam attempt
  async gradeExamAttempt(attemptId: string, score: number, feedback?: string): Promise<HygraphExamAttempt> {
    try {
      const response = await hygraphClient.request(UPDATE_EXAM_ATTEMPT, {
        id: attemptId,
        data: {
          score,
          feedback,
          examAttemptStatus: 'GRADED',
          isGraded: true
        }
      });
      return (response as any).updateExamAttempt;
    } catch (error) {
      console.error('Error grading exam attempt in Hygraph:', error);
      throw error;
    }
  },

  // Auto-grade exam attempt (for multiple choice questions)
  async autoGradeExamAttempt(attemptId: string, answers: any, examQuestions: any): Promise<HygraphExamAttempt> {
    try {
      let autoScore = 0;
      let totalAutoPoints = 0;

      // Calculate auto score based on answers and questions
      if (examQuestions && answers) {
        // This is a simplified auto-grading logic
        // In a real implementation, you'd have more sophisticated grading
        const questionCount = Object.keys(examQuestions).length;
        const correctAnswers = Object.keys(answers).length;
        autoScore = Math.round((correctAnswers / questionCount) * 100);
        totalAutoPoints = autoScore;
      }

      const response = await hygraphClient.request(UPDATE_EXAM_ATTEMPT, {
        id: attemptId,
        data: {
          answers,
          autoScore,
          totalAutoPoints,
          score: autoScore,
          examAttemptStatus: 'GRADED',
          isGraded: true
        }
      });
      return (response as any).updateExamAttempt;
    } catch (error) {
      console.error('Error auto-grading exam attempt in Hygraph:', error);
      throw error;
    }
  },

  // ===== STATISTICS =====

  // Get exam statistics
  async getExamStats(examId: string): Promise<{
    totalAttempts: number;
    completedAttempts: number;
    gradedAttempts: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
  }> {
    try {
      const attempts = await this.getExamAttemptsByExam(examId, 1000);
      const completedAttempts = attempts.filter(a => a.examAttemptStatus === 'SUBMITTED' || a.examAttemptStatus === 'GRADED');
      const gradedAttempts = attempts.filter(a => a.examAttemptStatus === 'GRADED');
      
      const scores = gradedAttempts.map(a => a.score);
      const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

      return {
        totalAttempts: attempts.length,
        completedAttempts: completedAttempts.length,
        gradedAttempts: gradedAttempts.length,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore,
        lowestScore
      };
    } catch (error) {
      console.error('Error getting exam stats from Hygraph:', error);
      throw error;
    }
  },

  // Get student's exam performance
  async getStudentExamPerformance(studentId: string): Promise<{
    totalExams: number;
    attemptedExams: number;
    completedExams: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
  }> {
    try {
      const attempts = await this.getExamAttemptsByStudent(studentId, 1000);
      const completedAttempts = attempts.filter(a => a.examAttemptStatus === 'SUBMITTED' || a.examAttemptStatus === 'GRADED');
      const gradedAttempts = attempts.filter(a => a.examAttemptStatus === 'GRADED');
      
      const scores = gradedAttempts.map(a => a.score);
      const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const worstScore = scores.length > 0 ? Math.min(...scores) : 0;

      return {
        totalExams: attempts.length,
        attemptedExams: attempts.length,
        completedExams: completedAttempts.length,
        averageScore: Math.round(averageScore * 100) / 100,
        bestScore,
        worstScore
      };
    } catch (error) {
      console.error('Error getting student exam performance from Hygraph:', error);
      throw error;
    }
  }
};