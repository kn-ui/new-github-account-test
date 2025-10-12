import { hygraphClient } from '../config/hygraph';
import { gql } from 'graphql-request';
import { Assignment, Submission } from '../types';

interface AssignmentCreateData {
  title: string;
  description: string;
  instructions?: string;
  dueDate: Date;
  maxScore: number;
  courseId: string;
  teacherId: string;
  attachments?: string[]; // Array of asset IDs
}

interface SubmissionCreateData {
  content: string;
  assignmentId: string;
  studentId: string;
  attachments?: string[]; // Array of asset IDs
}

class AssignmentService {

  /**
   * Create a new assignment
   */
  async createAssignment(data: AssignmentCreateData): Promise<Assignment> {
    try {
      const mutation = gql`
        mutation CreateAssignment(
          $title: String!
          $description: String!
          $instructions: String
          $dueDate: DateTime!
          $maxScore: Int!
          $courseId: ID!
          $teacherId: String!
          $attachments: [AssetCreateOneInlineInput!]
        ) {
          createAssignment(data: {
            title: $title
            description: $description
            instructions: $instructions
            dueDate: $dueDate
            maxScore: $maxScore
            course: { connect: { id: $courseId } }
            teacher: { connect: { uid: $teacherId } }
            attachments: $attachments
            isActive: true
          }) {
            id
            title
            description
            instructions
            dueDate
            maxScore
            isActive
            course { id title }
            teacher { uid displayName }
            attachments { id url fileName }
            createdAt
            updatedAt
          }
        }
      `;

      // Convert attachment IDs to proper format
      const attachments = data.attachments?.map(id => ({
        connect: { id }
      })) || [];

      const response = await hygraphClient.request<{ createAssignment: any }>(mutation, {
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        dueDate: data.dueDate.toISOString(),
        maxScore: data.maxScore,
        courseId: data.courseId,
        teacherId: data.teacherId,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      return this.transformAssignment(response.createAssignment);
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw new Error('Failed to create assignment');
    }
  }

  /**
   * Get assignment by ID
   */
  async getAssignmentById(assignmentId: string): Promise<Assignment | null> {
    try {
      const query = gql`
        query GetAssignment($id: ID!) {
          assignment(where: { id: $id }) {
            id
            title
            description
            instructions
            dueDate
            maxScore
            isActive
            course { id title }
            teacher { uid displayName }
            attachments { id url fileName }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ assignment: any | null }>(query, { id: assignmentId });
      
      if (!response.assignment) return null;
      
      return this.transformAssignment(response.assignment);
    } catch (error) {
      console.error('Error getting assignment:', error);
      throw new Error('Failed to get assignment');
    }
  }

  /**
   * Get assignments by course with pagination
   */
  async getAssignmentsByCourse(
    courseId: string, 
    page = 1, 
    limit = 20,
    activeOnly = true
  ): Promise<{
    assignments: Assignment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const whereClause = activeOnly 
        ? `where: { course: { id: "${courseId}" }, isActive: true }`
        : `where: { course: { id: "${courseId}" } }`;

      const query = gql`
        query GetAssignmentsByCourse($first: Int!, $skip: Int!) {
          assignmentsConnection(${whereClause}, first: $first, skip: $skip, orderBy: dueDate_ASC) {
            aggregate { count }
            edges {
              node {
                id
                title
                description
                instructions
                dueDate
                maxScore
                isActive
                course { id title }
                teacher { uid displayName }
                attachments { id url fileName }
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        assignmentsConnection: {
          edges: { node: any }[];
          aggregate: { count: number };
        };
      }>(query, { first: limit, skip });

      const assignments = response.assignmentsConnection.edges.map(edge => 
        this.transformAssignment(edge.node)
      );
      const total = response.assignmentsConnection.aggregate.count;

      return {
        assignments,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting assignments by course:', error);
      throw new Error('Failed to get assignments');
    }
  }

  /**
   * Get assignments by teacher
   */
  async getAssignmentsByTeacher(
    teacherId: string,
    page = 1,
    limit = 20
  ): Promise<{
    assignments: Assignment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const query = gql`
        query GetAssignmentsByTeacher($teacherId: String!, $first: Int!, $skip: Int!) {
          assignmentsConnection(
            where: { teacher: { uid: $teacherId }, isActive: true }, 
            first: $first, 
            skip: $skip, 
            orderBy: createdAt_DESC
          ) {
            aggregate { count }
            edges {
              node {
                id
                title
                description
                instructions
                dueDate
                maxScore
                isActive
                course { id title }
                teacher { uid displayName }
                attachments { id url fileName }
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

      const response = await hygraphClient.request<{
        assignmentsConnection: {
          edges: { node: any }[];
          aggregate: { count: number };
        };
      }>(query, { teacherId, first: limit, skip });

      const assignments = response.assignmentsConnection.edges.map(edge => 
        this.transformAssignment(edge.node)
      );
      const total = response.assignmentsConnection.aggregate.count;

      return {
        assignments,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting assignments by teacher:', error);
      throw new Error('Failed to get assignments');
    }
  }

  /**
   * Update assignment
   */
  async updateAssignment(
    assignmentId: string, 
    updateData: Partial<AssignmentCreateData>
  ): Promise<Assignment> {
    try {
      const mutation = gql`
        mutation UpdateAssignment($id: ID!, $data: AssignmentUpdateInput!) {
          updateAssignment(where: { id: $id }, data: $data) {
            id
            title
            description
            instructions
            dueDate
            maxScore
            isActive
            course { id title }
            teacher { uid displayName }
            attachments { id url fileName }
            createdAt
            updatedAt
          }
        }
      `;

      // Filter out undefined values and format data
      const data: Record<string, any> = {};
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'dueDate' && value instanceof Date) {
            data[key] = value.toISOString();
          } else if (key === 'attachments' && Array.isArray(value)) {
            data[key] = value.map(id => ({ connect: { id } }));
          } else if (key !== 'courseId' && key !== 'teacherId') {
            data[key] = value;
          }
        }
      });

      const response = await hygraphClient.request<{ updateAssignment: any }>(mutation, {
        id: assignmentId,
        data
      });

      return this.transformAssignment(response.updateAssignment);
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw new Error('Failed to update assignment');
    }
  }

  /**
   * Delete assignment (soft delete)
   */
  async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      const mutation = gql`
        mutation DeleteAssignment($id: ID!) {
          updateAssignment(where: { id: $id }, data: { isActive: false }) {
            id
          }
        }
      `;

      await hygraphClient.request(mutation, { id: assignmentId });
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw new Error('Failed to delete assignment');
    }
  }

  /**
   * Create submission
   */
  async createSubmission(data: SubmissionCreateData): Promise<Submission> {
    try {
      const mutation = gql`
        mutation CreateSubmission(
          $content: String!
          $assignmentId: ID!
          $studentId: String!
          $attachments: [AssetCreateOneInlineInput!]
        ) {
          createSubmission(data: {
            content: $content
            assignment: { connect: { id: $assignmentId } }
            student: { connect: { uid: $studentId } }
            course: { connect: { assignments_some: { id: $assignmentId } } }
            attachments: $attachments
            status: SUBMITTED
            submittedAt: "${new Date().toISOString()}"
            isActive: true
          }) {
            id
            content
            status
            grade
            feedback
            maxScore
            isActive
            submittedAt
            assignment { id title maxScore }
            student { uid displayName }
            attachments { id url fileName }
            createdAt
            updatedAt
          }
        }
      `;

      // Convert attachment IDs to proper format
      const attachments = data.attachments?.map(id => ({
        connect: { id }
      })) || [];

      const response = await hygraphClient.request<{ createSubmission: any }>(mutation, {
        content: data.content,
        assignmentId: data.assignmentId,
        studentId: data.studentId,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      return this.transformSubmission(response.createSubmission);
    } catch (error) {
      console.error('Error creating submission:', error);
      throw new Error('Failed to create submission');
    }
  }

  /**
   * Grade submission
   */
  async gradeSubmission(
    submissionId: string,
    grade: number,
    feedback?: string
  ): Promise<Submission> {
    try {
      const mutation = gql`
        mutation GradeSubmission($id: ID!, $grade: Int!, $feedback: String) {
          updateSubmission(where: { id: $id }, data: {
            grade: $grade
            feedback: $feedback
            status: GRADED
          }) {
            id
            content
            status
            grade
            feedback
            maxScore
            isActive
            submittedAt
            assignment { id title maxScore }
            student { uid displayName }
            attachments { id url fileName }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ updateSubmission: any }>(mutation, {
        id: submissionId,
        grade,
        feedback: feedback || null
      });

      return this.transformSubmission(response.updateSubmission);
    } catch (error) {
      console.error('Error grading submission:', error);
      throw new Error('Failed to grade submission');
    }
  }

  /**
   * Get submissions by assignment
   */
  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    try {
      const query = gql`
        query GetSubmissionsByAssignment($assignmentId: ID!) {
          submissions(where: { assignment: { id: $assignmentId }, isActive: true }, orderBy: submittedAt_DESC) {
            id
            content
            status
            grade
            feedback
            maxScore
            isActive
            submittedAt
            assignment { id title maxScore }
            student { uid displayName }
            attachments { id url fileName }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ submissions: any[] }>(query, { assignmentId });

      return response.submissions.map(submission => this.transformSubmission(submission));
    } catch (error) {
      console.error('Error getting submissions by assignment:', error);
      throw new Error('Failed to get submissions');
    }
  }

  /**
   * Get submissions by student
   */
  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    try {
      const query = gql`
        query GetSubmissionsByStudent($studentId: String!) {
          submissions(where: { student: { uid: $studentId }, isActive: true }, orderBy: submittedAt_DESC) {
            id
            content
            status
            grade
            feedback
            maxScore
            isActive
            submittedAt
            assignment { id title maxScore }
            student { uid displayName }
            attachments { id url fileName }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await hygraphClient.request<{ submissions: any[] }>(query, { studentId });

      return response.submissions.map(submission => this.transformSubmission(submission));
    } catch (error) {
      console.error('Error getting submissions by student:', error);
      throw new Error('Failed to get submissions');
    }
  }

  /**
   * Transform assignment data from Hygraph to our interface
   */
  private transformAssignment(assignment: any): Assignment {
    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions || '',
      dueDate: new Date(assignment.dueDate),
      maxPoints: assignment.maxScore, // Note: Using maxPoints as per interface
      attachments: assignment.attachments?.map((att: any) => ({
        id: att.id,
        title: att.fileName,
        type: 'file',
        url: att.url
      })) || [],
      submissions: [], // Will be loaded separately if needed
      isPublished: assignment.isActive,
      createdAt: new Date(assignment.createdAt),
      updatedAt: new Date(assignment.updatedAt)
    } as Assignment;
  }

  /**
   * Transform submission data from Hygraph to our interface
   */
  private transformSubmission(submission: any): Submission {
    return {
      id: submission.id,
      assignmentId: submission.assignment?.id || '',
      studentId: submission.student?.uid || '',
      studentName: submission.student?.displayName || '',
      content: submission.content,
      attachments: submission.attachments?.map((att: any) => ({
        id: att.id,
        title: att.fileName,
        type: 'file',
        url: att.url
      })) || [],
      submittedAt: new Date(submission.submittedAt),
      grade: submission.grade || undefined,
      feedback: submission.feedback || undefined,
      gradedAt: submission.grade ? new Date(submission.updatedAt) : undefined,
      gradedBy: submission.grade ? 'teacher' : undefined, // Would need to track this properly
      status: submission.status.toLowerCase() as 'submitted' | 'graded' | 'late'
    } as Submission;
  }
}

export default new AssignmentService();