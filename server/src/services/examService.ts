import { hygraphClient } from '../config/hygraph';
import { gql } from 'graphql-request';

interface ExamQuestion {
  id: string;
  type: 'MCQ' | 'TRUEFALSE' | 'SHORT';
  prompt: string;
  options?: string[];
  correct: number | boolean | string;
  points: number;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  date: Date;
  startTime?: Date;
  durationMinutes?: number;
  totalPoints: number;
  questions: ExamQuestion[];
  firstAttemptTimestamp?: Date;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  answers: Array<{ questionId: string; response: any }>;
  autoScore?: number;
  totalAutoPoints?: number;
  manualScore?: number;
  score: number;
  feedback?: string;
  isGraded: boolean;
  startedAt: Date;
  submittedAt?: Date;
}

interface ExamCreateData {
  title: string;
  description?: string;
  date: Date;
  startTime?: Date;
  durationMinutes?: number;
  courseId: string;
  questions: ExamQuestion[];
}

class ExamService {

  /**
   * Create a new exam
   */
  async createExam(data: ExamCreateData): Promise<Exam> {
    try {
      // Calculate total points from questions
      const totalPoints = data.questions.reduce((sum, q) => sum + q.points, 0);

      const mutation = gql`
        mutation CreateExam(
          $title: String!
          $description: String
          $date: DateTime!
          $startTime: DateTime
          $durationMinutes: Int
          $totalPoints: Int!
          $questions: Json!
          $courseId: ID!
        ) {
          createExam(data: {
            title: $title
            description: $description
            date: $date
            startTime: $startTime
            durationMinutes: $durationMinutes
            totalPoints: $totalPoints
            questions: $questions
            course: { connect: { id: $courseId } }
          }) {
            id
            title
            description
            date
            startTime
            durationMinutes
            totalPoints
            questions
            firstAttemptTimestamp
            course { id title }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ createExam: any }>(mutation, {
        title: data.title,
        description: data.description,
        date: data.date.toISOString(),
        startTime: data.startTime?.toISOString(),
        durationMinutes: data.durationMinutes,
        totalPoints,
        questions: data.questions,
        courseId: data.courseId
      });

      return this.transformExam(response.createExam);
    } catch (error) {
      console.error('Error creating exam:', error);
      throw new Error('Failed to create exam');
    }
  }

  /**
   * Get exam by ID
   */
  async getExamById(examId: string): Promise<Exam | null> {
    try {
      const query = gql`
        query GetExam($id: ID!) {
          exam(where: { id: $id }) {
            id
            title
            description
            date
            startTime
            durationMinutes
            totalPoints
            questions
            firstAttemptTimestamp
            course { id title }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ exam: any | null }>(query, { id: examId });
      
      if (!response.exam) return null;
      
      return this.transformExam(response.exam);
    } catch (error) {
      console.error('Error getting exam:', error);
      throw new Error('Failed to get exam');
    }
  }

  /**
   * Get exams by course
   */
  async getExamsByCourse(
    courseId: string,
    page = 1,
    limit = 20
  ): Promise<{
    exams: Exam[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const query = gql`
        query GetExamsByCourse($courseId: ID!, $first: Int!, $skip: Int!) {
          examsConnection(
            where: { course: { id: $courseId } }, 
            first: $first, 
            skip: $skip, 
            orderBy: date_ASC
          ) {
            aggregate { count }
            edges {
              node {
                id
                title
                description
                date
                startTime
                durationMinutes
                totalPoints
                questions
                firstAttemptTimestamp
                course { id title }
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        examsConnection: {
          edges: { node: any }[];
          aggregate: { count: number };
        };
      }>(query, { courseId, first: limit, skip });

      const exams = response.examsConnection.edges.map(edge => 
        this.transformExam(edge.node)
      );
      const total = response.examsConnection.aggregate.count;

      return {
        exams,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting exams by course:', error);
      throw new Error('Failed to get exams');
    }
  }

  /**
   * Update exam
   */
  async updateExam(examId: string, updateData: Partial<ExamCreateData>): Promise<Exam> {
    try {
      const mutation = gql`
        mutation UpdateExam($id: ID!, $data: ExamUpdateInput!) {
          updateExam(where: { id: $id }, data: $data) {
            id
            title
            description
            date
            startTime
            durationMinutes
            totalPoints
            questions
            firstAttemptTimestamp
            course { id title }
            createdAt
            updatedAt
          }
        }
      `;

      // Filter out undefined values and format data
      const data: Record<string, any> = {};
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'date' && value instanceof Date) {
            data[key] = value.toISOString();
          } else if (key === 'startTime' && value instanceof Date) {
            data[key] = value.toISOString();
          } else if (key === 'questions') {
            data[key] = value;
            // Recalculate total points if questions are updated
            data.totalPoints = (value as ExamQuestion[]).reduce((sum, q) => sum + q.points, 0);
          } else if (key !== 'courseId') {
            data[key] = value;
          }
        }
      });

      const response = await hygraphClient.request<{ updateExam: any }>(mutation, {
        id: examId,
        data
      });

      return this.transformExam(response.updateExam);
    } catch (error) {
      console.error('Error updating exam:', error);
      throw new Error('Failed to update exam');
    }
  }

  /**
   * Delete exam
   */
  async deleteExam(examId: string): Promise<void> {
    try {
      const mutation = gql`
        mutation DeleteExam($id: ID!) {
          deleteExam(where: { id: $id }) { id }
        }
      `;

      await hygraphClient.request(mutation, { id: examId });
    } catch (error) {
      console.error('Error deleting exam:', error);
      throw new Error('Failed to delete exam');
    }
  }

  /**
   * Start exam attempt
   */
  async startExamAttempt(examId: string, studentId: string): Promise<ExamAttempt> {
    try {
      // Check if this is the first attempt for this exam
      const examAttemptsQuery = gql`
        query CheckExamAttempts($examId: ID!) {
          examAttemptsConnection(where: { exam: { id: $examId } }) {
            aggregate { count }
          }
        }
      `;

      const attemptsResponse = await hygraphClient.request<{
        examAttemptsConnection: { aggregate: { count: number } };
      }>(examAttemptsQuery, { examId });

      const isFirstAttempt = attemptsResponse.examAttemptsConnection.aggregate.count === 0;

      // If first attempt, update exam's firstAttemptTimestamp
      if (isFirstAttempt) {
        const updateExamMutation = gql`
          mutation UpdateExamFirstAttempt($id: ID!, $timestamp: DateTime!) {
            updateExam(where: { id: $id }, data: { firstAttemptTimestamp: $timestamp }) {
              id
            }
          }
        `;

        await hygraphClient.request(updateExamMutation, {
          id: examId,
          timestamp: new Date().toISOString()
        });
      }

      // Create exam attempt
      const createAttemptMutation = gql`
        mutation CreateExamAttempt($examId: ID!, $studentId: String!) {
          createExamAttempt(data: {
            exam: { connect: { id: $examId } }
            student: { connect: { uid: $studentId } }
            status: IN_PROGRESS
            answers: []
            score: 0
            isGraded: false
            startedAt: "${new Date().toISOString()}"
          }) {
            id
            status
            answers
            autoScore
            totalAutoPoints
            manualScore
            score
            feedback
            isGraded
            startedAt
            submittedAt
            exam { id title }
            student { uid displayName }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ createExamAttempt: any }>(createAttemptMutation, {
        examId,
        studentId
      });

      return this.transformExamAttempt(response.createExamAttempt);
    } catch (error) {
      console.error('Error starting exam attempt:', error);
      throw new Error('Failed to start exam attempt');
    }
  }

  /**
   * Submit exam attempt
   */
  async submitExamAttempt(
    attemptId: string,
    answers: Array<{ questionId: string; response: any }>
  ): Promise<ExamAttempt> {
    try {
      // Get exam attempt and exam details
      const attemptQuery = gql`
        query GetExamAttemptWithExam($id: ID!) {
          examAttempt(where: { id: $id }) {
            id
            exam {
              id
              questions
              totalPoints
            }
          }
        }
      `;

      const attemptResponse = await hygraphClient.request<{
        examAttempt: { id: string; exam: { id: string; questions: any; totalPoints: number } };
      }>(attemptQuery, { id: attemptId });

      if (!attemptResponse.examAttempt) {
        throw new Error('Exam attempt not found');
      }

      const exam = attemptResponse.examAttempt.exam;
      const questions = exam.questions as ExamQuestion[];

      // Auto-grade the exam
      let autoScore = 0;
      let hasManualQuestions = false;

      for (const answer of answers) {
        const question = questions.find(q => q.id === answer.questionId);
        if (!question) continue;

        if (question.type === 'MCQ') {
          if (answer.response === question.correct) {
            autoScore += question.points;
          }
        } else if (question.type === 'TRUEFALSE') {
          if (answer.response === question.correct) {
            autoScore += question.points;
          }
        } else if (question.type === 'SHORT') {
          hasManualQuestions = true;
        }
      }

      const totalAutoPoints = questions
        .filter(q => q.type !== 'SHORT')
        .reduce((sum, q) => sum + q.points, 0);

      // Update exam attempt
      const updateMutation = gql`
        mutation SubmitExamAttempt(
          $id: ID!
          $answers: Json!
          $autoScore: Int!
          $totalAutoPoints: Int!
          $score: Int!
          $isGraded: Boolean!
          $status: ExamAttemptStatus!
        ) {
          updateExamAttempt(where: { id: $id }, data: {
            answers: $answers
            autoScore: $autoScore
            totalAutoPoints: $totalAutoPoints
            score: $score
            isGraded: $isGraded
            status: $status
            submittedAt: "${new Date().toISOString()}"
          }) {
            id
            status
            answers
            autoScore
            totalAutoPoints
            manualScore
            score
            feedback
            isGraded
            startedAt
            submittedAt
            exam { id title }
            student { uid displayName }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ updateExamAttempt: any }>(updateMutation, {
        id: attemptId,
        answers,
        autoScore,
        totalAutoPoints,
        score: autoScore, // Initial score is just auto score
        isGraded: !hasManualQuestions,
        status: 'SUBMITTED'
      });

      return this.transformExamAttempt(response.updateExamAttempt);
    } catch (error) {
      console.error('Error submitting exam attempt:', error);
      throw new Error('Failed to submit exam attempt');
    }
  }

  /**
   * Grade exam attempt manually
   */
  async gradeExamAttempt(
    attemptId: string,
    manualScore: number,
    feedback?: string
  ): Promise<ExamAttempt> {
    try {
      // Get current attempt to calculate final score
      const attemptQuery = gql`
        query GetExamAttempt($id: ID!) {
          examAttempt(where: { id: $id }) {
            id
            autoScore
          }
        }
      `;

      const attemptResponse = await hygraphClient.request<{
        examAttempt: { id: string; autoScore: number };
      }>(attemptQuery, { id: attemptId });

      const currentAttempt = attemptResponse.examAttempt;
      const finalScore = (currentAttempt.autoScore || 0) + manualScore;

      const mutation = gql`
        mutation GradeExamAttempt(
          $id: ID!
          $manualScore: Int!
          $score: Int!
          $feedback: String
          $isGraded: Boolean!
          $status: ExamAttemptStatus!
        ) {
          updateExamAttempt(where: { id: $id }, data: {
            manualScore: $manualScore
            score: $score
            feedback: $feedback
            isGraded: $isGraded
            status: $status
          }) {
            id
            status
            answers
            autoScore
            totalAutoPoints
            manualScore
            score
            feedback
            isGraded
            startedAt
            submittedAt
            exam { id title }
            student { uid displayName }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ updateExamAttempt: any }>(mutation, {
        id: attemptId,
        manualScore,
        score: finalScore,
        feedback: feedback || null,
        isGraded: true,
        status: 'GRADED'
      });

      return this.transformExamAttempt(response.updateExamAttempt);
    } catch (error) {
      console.error('Error grading exam attempt:', error);
      throw new Error('Failed to grade exam attempt');
    }
  }

  /**
   * Get exam attempts by exam
   */
  async getExamAttemptsByExam(examId: string): Promise<ExamAttempt[]> {
    try {
      const query = gql`
        query GetExamAttemptsByExam($examId: ID!) {
          examAttempts(where: { exam: { id: $examId } }, orderBy: submittedAt_DESC) {
            id
            status
            answers
            autoScore
            totalAutoPoints
            manualScore
            score
            feedback
            isGraded
            startedAt
            submittedAt
            exam { id title }
            student { uid displayName }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ examAttempts: any[] }>(query, { examId });

      return response.examAttempts.map(attempt => this.transformExamAttempt(attempt));
    } catch (error) {
      console.error('Error getting exam attempts by exam:', error);
      throw new Error('Failed to get exam attempts');
    }
  }

  /**
   * Get exam attempts by student
   */
  async getExamAttemptsByStudent(studentId: string): Promise<ExamAttempt[]> {
    try {
      const query = gql`
        query GetExamAttemptsByStudent($studentId: String!) {
          examAttempts(where: { student: { uid: $studentId } }, orderBy: startedAt_DESC) {
            id
            status
            answers
            autoScore
            totalAutoPoints
            manualScore
            score
            feedback
            isGraded
            startedAt
            submittedAt
            exam { id title }
            student { uid displayName }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ examAttempts: any[] }>(query, { studentId });

      return response.examAttempts.map(attempt => this.transformExamAttempt(attempt));
    } catch (error) {
      console.error('Error getting exam attempts by student:', error);
      throw new Error('Failed to get exam attempts');
    }
  }

  /**
   * Transform exam data from Hygraph
   */
  private transformExam(exam: any): Exam {
    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      date: new Date(exam.date),
      startTime: exam.startTime ? new Date(exam.startTime) : undefined,
      durationMinutes: exam.durationMinutes,
      totalPoints: exam.totalPoints,
      questions: exam.questions || [],
      firstAttemptTimestamp: exam.firstAttemptTimestamp ? new Date(exam.firstAttemptTimestamp) : undefined,
      courseId: exam.course?.id || '',
      createdAt: new Date(exam.createdAt),
      updatedAt: new Date(exam.updatedAt)
    };
  }

  /**
   * Transform exam attempt data from Hygraph
   */
  private transformExamAttempt(attempt: any): ExamAttempt {
    return {
      id: attempt.id,
      examId: attempt.exam?.id || '',
      studentId: attempt.student?.uid || '',
      status: attempt.status,
      answers: attempt.answers || [],
      autoScore: attempt.autoScore,
      totalAutoPoints: attempt.totalAutoPoints,
      manualScore: attempt.manualScore,
      score: attempt.score,
      feedback: attempt.feedback,
      isGraded: attempt.isGraded,
      startedAt: new Date(attempt.startedAt),
      submittedAt: attempt.submittedAt ? new Date(attempt.submittedAt) : undefined
    };
  }
}

export default new ExamService();