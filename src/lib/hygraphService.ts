// Comprehensive Hygraph Service
// This file provides all CRUD operations for the school management system using Hygraph

import { hygraphClient } from './hygraph';
import {
  GET_USERS,
  GET_USER_BY_ID,
  GET_USER_BY_UID,
  GET_USER_BY_EMAIL,
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
  GET_COURSES,
  GET_COURSE_BY_ID,
  CREATE_COURSE,
  UPDATE_COURSE,
  DELETE_COURSE,
  GET_ENROLLMENTS,
  CREATE_ENROLLMENT,
  UPDATE_ENROLLMENT,
  GET_ASSIGNMENTS,
  GET_ASSIGNMENT_BY_ID,
  CREATE_ASSIGNMENT,
  UPDATE_ASSIGNMENT,
  DELETE_ASSIGNMENT,
  GET_SUBMISSIONS,
  GET_SUBMISSION_BY_ID,
  CREATE_SUBMISSION,
  UPDATE_SUBMISSION,
  GET_EXAMS,
  GET_EXAM_BY_ID,
  CREATE_EXAM,
  UPDATE_EXAM,
  DELETE_EXAM,
  GET_EXAM_ATTEMPTS,
  CREATE_EXAM_ATTEMPT,
  UPDATE_EXAM_ATTEMPT,
  GET_ANNOUNCEMENTS,
  CREATE_ANNOUNCEMENT,
  UPDATE_ANNOUNCEMENT,
  DELETE_ANNOUNCEMENT,
  GET_EVENTS,
  CREATE_EVENT,
  UPDATE_EVENT,
  DELETE_EVENT,
  GET_GRADES,
  CREATE_GRADE,
  UPDATE_GRADE,
  GET_COURSE_MATERIALS,
  CREATE_COURSE_MATERIAL,
  UPDATE_COURSE_MATERIAL,
  DELETE_COURSE_MATERIAL,
  GET_SUPPORT_TICKETS,
  CREATE_SUPPORT_TICKET,
  UPDATE_SUPPORT_TICKET,
  GET_EDIT_REQUESTS,
  CREATE_EDIT_REQUEST,
  UPDATE_EDIT_REQUEST,
  GET_FORUM_THREADS,
  CREATE_FORUM_THREAD,
  GET_FORUM_POSTS,
  CREATE_FORUM_POST,
  GET_BLOG_POSTS,
  CREATE_BLOG_POST,
  UPDATE_BLOG_POST,
  DELETE_BLOG_POST,
  GET_CERTIFICATES,
  CREATE_CERTIFICATE,
  GET_ACTIVITY_LOGS,
  CREATE_ACTIVITY_LOG
} from './hygraphOperations';

// ===== TYPE DEFINITIONS =====

export interface HygraphUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  passwordChanged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HygraphCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  maxStudents: number;
  syllabus: string;
  isActive: boolean;
  instructorName: string;
  createdAt: string;
  updatedAt: string;
  instructor?: {
    id: string;
    displayName: string;
    email: string;
  };
}

export interface HygraphEnrollment {
  id: string;
  enrollmentStatus: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
  progress: number;
  completedLessons?: string;
  isActive: boolean;
  enrolledAt: string;
  lastAccessedAt: string;
  student?: {
    id: string;
    displayName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    description: string;
  };
}

export interface HygraphAssignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  maxScore: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  updatedAt?: string;
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
  createdAt: string;
  updatedAt: string;
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
  updatedAt?: string;
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

export interface HygraphAnnouncement {
  id: string;
  title: string;
  body: string;
  targetAudience?: 'ALL_STUDENTS' | 'COURSE_STUDENTS' | 'SPECIFIC_STUDENT';
  externalLink?: string;
  recipientStudentId?: string;
  createdAt: string;
  author?: {
    id: string;
    displayName: string;
  };
  course?: {
    id: string;
    title: string;
  };
}

export interface HygraphEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  maxAttendees: number;
  currentAttendees: number;
  eventStatus: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  isActive: boolean;
  eventCreator: string;
  createdAt: string;
  updatedAt: string;
}

export interface HygraphGrade {
  id: string;
  finalGrade: number;
  letterGrade: string;
  gradePoints: number;
  calculationMethod: 'WEIGHTED_AVERAGE' | 'SIMPLE_AVERAGE' | 'MANUAL';
  assignmentGrades?: any; // JSON
  notes?: string;
  calculatedBy: string;
  calculatedAt: string;
  student?: {
    id: string;
    displayName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
  };
}

export interface HygraphCourseMaterial {
  id: string;
  title: string;
  description: string;
  type: string;
  externalLink?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    title: string;
  };
}

export interface HygraphSupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  supportTicketStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    displayName: string;
    email: string;
  };
}

export interface HygraphEditRequest {
  id: string;
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  teacherId: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  response?: string;
  respondedBy?: string;
  isActive: boolean;
  requestedAt: string;
  respondedAt?: string;
}

export interface HygraphForumThread {
  id: string;
  title: string;
  body: string;
  category?: string;
  likes: number;
  views: number;
  createdAt: string;
  lastActivityAt: string;
  updatedAt?: string;
  author?: {
    id: string;
    displayName: string;
  };
}

export interface HygraphForumPost {
  id: string;
  body: string;
  likes: number;
  dateCreated: string;
  author?: {
    id: string;
    displayName: string;
  };
  thread?: {
    id: string;
    title: string;
  };
}

export interface HygraphBlogPost {
  id: string;
  title: string;
  content: string;
  likes: number;
  createdAt: string;
  updatedAt?: string;
  author?: {
    id: string;
    displayName: string;
  };
}

export interface HygraphCertificate {
  id: string;
  type: 'TOP_PERFORMER' | 'PERFECT_ATTENDANCE' | 'HOMEWORK_HERO' | 'COURSE_COMPLETION';
  period?: any; // JSON
  details?: any; // JSON
  awardedAt: string;
  user?: {
    id: string;
    displayName: string;
    email: string;
  };
}

export interface HygraphActivityLog {
  id: string;
  dateKey: string;
  source: string;
  createdAt: string;
  user?: {
    id: string;
    displayName: string;
  };
}

// ===== MAIN HYGRAPH SERVICE =====

export const hygraphService = {
  // ===== USER OPERATIONS =====
  users: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphUser[]> {
      try {
        const response = await hygraphClient.request(GET_USERS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.appUsers || [];
      } catch (error) {
        console.error('Error fetching users from Hygraph:', error);
        throw error;
      }
    },

    async getById(id: string): Promise<HygraphUser | null> {
      try {
        const response = await hygraphClient.request(GET_USER_BY_ID, { id });
        return response.appUser || null;
      } catch (error) {
        console.error('Error fetching user by ID from Hygraph:', error);
        throw error;
      }
    },

    async getByUid(uid: string): Promise<HygraphUser | null> {
      try {
        const response = await hygraphClient.request(GET_USER_BY_UID, { uid });
        return response.appUser || null;
      } catch (error) {
        console.error('Error fetching user by UID from Hygraph:', error);
        throw error;
      }
    },

    async getByEmail(email: string): Promise<HygraphUser | null> {
      try {
        const response = await hygraphClient.request(GET_USER_BY_EMAIL, { email });
        return response.appUser || null;
      } catch (error) {
        console.error('Error fetching user by email from Hygraph:', error);
        throw error;
      }
    },

    async create(userData: {
      uid: string;
      email: string;
      displayName: string;
      role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';
      isActive?: boolean;
      passwordChanged?: boolean;
    }): Promise<HygraphUser> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_USER, {
          data: {
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName,
            role: userData.role,
            isActive: userData.isActive ?? true,
            passwordChanged: userData.passwordChanged ?? true,
          }
        });
        return response.createAppUser;
      } catch (error) {
        console.error('Error creating user in Hygraph:', error);
        throw error;
      }
    },

    async update(id: string, userData: Partial<HygraphUser>): Promise<HygraphUser> {
      try {
        const response = await hygraphClient.request(UPDATE_USER, {
          id,
          data: {
            ...userData,
          }
        });
        return response.updateAppUser;
      } catch (error) {
        console.error('Error updating user in Hygraph:', error);
        throw error;
      }
    },

    async delete(id: string): Promise<void> {
      try {
        await hygraphClient.request(DELETE_USER, { id });
      } catch (error) {
        console.error('Error deleting user from Hygraph:', error);
        throw error;
      }
    },

    async search(query: string, limit: number = 50): Promise<HygraphUser[]> {
      try {
        const response = await hygraphClient.request(GET_USERS, {
          first: limit,
          skip: 0,
          where: {
            OR: [
              { displayName_contains: query },
              { email_contains: query }
            ]
          }
        });
        return response.appUsers || [];
      } catch (error) {
        console.error('Error searching users in Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== COURSE OPERATIONS =====
  courses: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphCourse[]> {
      try {
        const response = await hygraphClient.request(GET_COURSES, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.courses || [];
      } catch (error) {
        console.error('Error fetching courses from Hygraph:', error);
        throw error;
      }
    },

    async getById(id: string): Promise<HygraphCourse | null> {
      try {
        const response = await hygraphClient.request(GET_COURSE_BY_ID, { id });
        return response.course || null;
      } catch (error) {
        console.error('Error fetching course by ID from Hygraph:', error);
        throw error;
      }
    },

    async create(courseData: {
      title: string;
      description: string;
      category: string;
      duration: number;
      maxStudents: number;
      syllabus: string;
      instructorName: string;
      instructorId?: string;
      isActive?: boolean;
    }): Promise<HygraphCourse> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_COURSE, {
          data: {
            title: courseData.title,
            description: courseData.description,
            category: courseData.category,
            duration: courseData.duration,
            maxStudents: courseData.maxStudents,
            syllabus: courseData.syllabus,
            instructorName: courseData.instructorName,
            isActive: courseData.isActive ?? true,
            ...(courseData.instructorId && { instructor: { connect: { id: courseData.instructorId } } })
          }
        });
        return response.createCourse;
      } catch (error) {
        console.error('Error creating course in Hygraph:', error);
        throw error;
      }
    },

    async update(id: string, courseData: Partial<HygraphCourse>): Promise<HygraphCourse> {
      try {
        const response = await hygraphClient.request(UPDATE_COURSE, {
          id,
          data: {
            ...courseData,
          }
        });
        return response.updateCourse;
      } catch (error) {
        console.error('Error updating course in Hygraph:', error);
        throw error;
      }
    },

    async delete(id: string): Promise<void> {
      try {
        await hygraphClient.request(DELETE_COURSE, { id });
      } catch (error) {
        console.error('Error deleting course from Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== ENROLLMENT OPERATIONS =====
  enrollments: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphEnrollment[]> {
      try {
        const response = await hygraphClient.request(GET_ENROLLMENTS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.enrollments || [];
      } catch (error) {
        console.error('Error fetching enrollments from Hygraph:', error);
        throw error;
      }
    },

    async create(enrollmentData: {
      studentId: string;
      courseId: string;
      enrollmentStatus?: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
      progress?: number;
      completedLessons?: string;
      isActive?: boolean;
    }): Promise<HygraphEnrollment> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_ENROLLMENT, {
          data: {
            enrollmentStatus: enrollmentData.enrollmentStatus || 'ACTIVE',
            progress: enrollmentData.progress || 0,
            completedLessons: enrollmentData.completedLessons,
            isActive: enrollmentData.isActive ?? true,
            enrolledAt: now,
            lastAccessedAt: now,
            student: { connect: { id: enrollmentData.studentId } },
            course: { connect: { id: enrollmentData.courseId } }
          }
        });
        return response.createEnrollment;
      } catch (error) {
        console.error('Error creating enrollment in Hygraph:', error);
        throw error;
      }
    },

    async update(id: string, enrollmentData: Partial<HygraphEnrollment>): Promise<HygraphEnrollment> {
      try {
        const response = await hygraphClient.request(UPDATE_ENROLLMENT, {
          id,
          data: enrollmentData
        });
        return response.updateEnrollment;
      } catch (error) {
        console.error('Error updating enrollment in Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== ASSIGNMENT OPERATIONS =====
  assignments: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphAssignment[]> {
      try {
        const response = await hygraphClient.request(GET_ASSIGNMENTS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.assignments || [];
      } catch (error) {
        console.error('Error fetching assignments from Hygraph:', error);
        throw error;
      }
    },

    async getById(id: string): Promise<HygraphAssignment | null> {
      try {
        const response = await hygraphClient.request(GET_ASSIGNMENT_BY_ID, { id });
        return response.assignment || null;
      } catch (error) {
        console.error('Error fetching assignment by ID from Hygraph:', error);
        throw error;
      }
    },

    async create(assignmentData: {
      title: string;
      description: string;
      instructions?: string;
      dueDate: string;
      maxScore: number;
      courseId: string;
      teacherId: string;
      isActive?: boolean;
    }): Promise<HygraphAssignment> {
      try {
        const now = new Date().toISOString();
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
        return response.createAssignment;
      } catch (error) {
        console.error('Error creating assignment in Hygraph:', error);
        throw error;
      }
    },

    async update(id: string, assignmentData: Partial<HygraphAssignment>): Promise<HygraphAssignment> {
      try {
        const response = await hygraphClient.request(UPDATE_ASSIGNMENT, {
          id,
          data: {
            ...assignmentData,
          }
        });
        return response.updateAssignment;
      } catch (error) {
        console.error('Error updating assignment in Hygraph:', error);
        throw error;
      }
    },

    async delete(id: string): Promise<void> {
      try {
        await hygraphClient.request(DELETE_ASSIGNMENT, { id });
      } catch (error) {
        console.error('Error deleting assignment from Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== SUBMISSION OPERATIONS =====
  submissions: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphSubmission[]> {
      try {
        const response = await hygraphClient.request(GET_SUBMISSIONS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.submissions || [];
      } catch (error) {
        console.error('Error fetching submissions from Hygraph:', error);
        throw error;
      }
    },

    async getById(id: string): Promise<HygraphSubmission | null> {
      try {
        const response = await hygraphClient.request(GET_SUBMISSION_BY_ID, { id });
        return response.submission || null;
      } catch (error) {
        console.error('Error fetching submission by ID from Hygraph:', error);
        throw error;
      }
    },

    async create(submissionData: {
      content: string;
      submissionStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
      studentId: string;
      assignmentId: string;
      courseId: string;
      grade?: number;
      feedback?: string;
      maxScore?: number;
      isActive?: boolean;
    }): Promise<HygraphSubmission> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_SUBMISSION, {
          data: {
            content: submissionData.content,
            submissionStatus: submissionData.submissionStatus,
            grade: submissionData.grade,
            feedback: submissionData.feedback,
            maxScore: submissionData.maxScore,
            isActive: submissionData.isActive ?? true,
            submittedAt: now,
            student: { connect: { id: submissionData.studentId } },
            assignment: { connect: { id: submissionData.assignmentId } },
            course: { connect: { id: submissionData.courseId } }
          }
        });
        return response.createSubmission;
      } catch (error) {
        console.error('Error creating submission in Hygraph:', error);
        throw error;
      }
    },

    async update(id: string, submissionData: Partial<HygraphSubmission>): Promise<HygraphSubmission> {
      try {
        const response = await hygraphClient.request(UPDATE_SUBMISSION, {
          id,
          data: {
            ...submissionData,
          }
        });
        return response.updateSubmission;
      } catch (error) {
        console.error('Error updating submission in Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== EXAM OPERATIONS =====
  exams: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphExam[]> {
      try {
        const response = await hygraphClient.request(GET_EXAMS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.exams || [];
      } catch (error) {
        console.error('Error fetching exams from Hygraph:', error);
        throw error;
      }
    },

    async getById(id: string): Promise<HygraphExam | null> {
      try {
        const response = await hygraphClient.request(GET_EXAM_BY_ID, { id });
        return response.exam || null;
      } catch (error) {
        console.error('Error fetching exam by ID from Hygraph:', error);
        throw error;
      }
    },

    async create(examData: {
      title: string;
      description?: string;
      date: string;
      startTime?: string;
      durationMinutes?: number;
      totalPoints: number;
      questions?: any;
      courseId: string;
      firstAttemptTimestamp?: string;
    }): Promise<HygraphExam> {
      try {
        const now = new Date().toISOString();
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
        return response.createExam;
      } catch (error) {
        console.error('Error creating exam in Hygraph:', error);
        throw error;
      }
    },

    async update(id: string, examData: Partial<HygraphExam>): Promise<HygraphExam> {
      try {
        const response = await hygraphClient.request(UPDATE_EXAM, {
          id,
          data: {
            ...examData,
          }
        });
        return response.updateExam;
      } catch (error) {
        console.error('Error updating exam in Hygraph:', error);
        throw error;
      }
    },

    async delete(id: string): Promise<void> {
      try {
        await hygraphClient.request(DELETE_EXAM, { id });
      } catch (error) {
        console.error('Error deleting exam from Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== EXAM ATTEMPT OPERATIONS =====
  examAttempts: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphExamAttempt[]> {
      try {
        const response = await hygraphClient.request(GET_EXAM_ATTEMPTS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.examAttempts || [];
      } catch (error) {
        console.error('Error fetching exam attempts from Hygraph:', error);
        throw error;
      }
    },

    async create(attemptData: {
      studentId: string;
      examId: string;
      examAttemptStatus: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
      answers?: any;
      autoScore?: number;
      totalAutoPoints?: number;
      manualScore?: number;
      score: number;
      feedback?: string;
      isGraded: boolean;
    }): Promise<HygraphExamAttempt> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_EXAM_ATTEMPT, {
          data: {
            examAttemptStatus: attemptData.examAttemptStatus,
            answers: attemptData.answers,
            autoScore: attemptData.autoScore,
            totalAutoPoints: attemptData.totalAutoPoints,
            manualScore: attemptData.manualScore,
            score: attemptData.score,
            feedback: attemptData.feedback,
            isGraded: attemptData.isGraded,
            startedAt: now,
            submittedAt: attemptData.examAttemptStatus === 'SUBMITTED' || attemptData.examAttemptStatus === 'GRADED' ? now : undefined,
            student: { connect: { id: attemptData.studentId } },
            exam: { connect: { id: attemptData.examId } }
          }
        });
        return response.createExamAttempt;
      } catch (error) {
        console.error('Error creating exam attempt in Hygraph:', error);
        throw error;
      }
    },

    async update(id: string, attemptData: Partial<HygraphExamAttempt>): Promise<HygraphExamAttempt> {
      try {
        const response = await hygraphClient.request(UPDATE_EXAM_ATTEMPT, {
          id,
          data: {
            ...attemptData,
          }
        });
        return response.updateExamAttempt;
      } catch (error) {
        console.error('Error updating exam attempt in Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== ANNOUNCEMENT OPERATIONS =====
  announcements: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphAnnouncement[]> {
      try {
        const response = await hygraphClient.request(GET_ANNOUNCEMENTS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.announcements || [];
      } catch (error) {
        console.error('Error fetching announcements from Hygraph:', error);
        throw error;
      }
    },

    async create(announcementData: {
      title: string;
      body: string;
      targetAudience?: 'ALL_STUDENTS' | 'COURSE_STUDENTS' | 'SPECIFIC_STUDENT';
      externalLink?: string;
      recipientStudentId?: string;
      authorId: string;
      courseId?: string;
    }): Promise<HygraphAnnouncement> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_ANNOUNCEMENT, {
          data: {
            title: announcementData.title,
            body: announcementData.body,
            targetAudience: announcementData.targetAudience,
            externalLink: announcementData.externalLink,
            recipientStudentId: announcementData.recipientStudentId,
            author: { connect: { id: announcementData.authorId } },
            ...(announcementData.courseId && { course: { connect: { id: announcementData.courseId } } })
          }
        });
        return response.createAnnouncement;
      } catch (error) {
        console.error('Error creating announcement in Hygraph:', error);
        throw error;
      }
    },

    async update(id: string, announcementData: Partial<HygraphAnnouncement>): Promise<HygraphAnnouncement> {
      try {
        const response = await hygraphClient.request(UPDATE_ANNOUNCEMENT, {
          id,
          data: announcementData
        });
        return response.updateAnnouncement;
      } catch (error) {
        console.error('Error updating announcement in Hygraph:', error);
        throw error;
      }
    },

    async delete(id: string): Promise<void> {
      try {
        await hygraphClient.request(DELETE_ANNOUNCEMENT, { id });
      } catch (error) {
        console.error('Error deleting announcement from Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== EVENT OPERATIONS =====
  events: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphEvent[]> {
      try {
        const response = await hygraphClient.request(GET_EVENTS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.events || [];
      } catch (error) {
        console.error('Error fetching events from Hygraph:', error);
        throw error;
      }
    },

    async create(eventData: {
      title: string;
      description: string;
      date: string;
      time: string;
      location: string;
      type: string;
      maxAttendees: number;
      currentAttendees?: number;
      eventStatus: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
      eventCreator: string;
      isActive?: boolean;
    }): Promise<HygraphEvent> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_EVENT, {
          data: {
            title: eventData.title,
            description: eventData.description,
            date: eventData.date,
            time: eventData.time,
            location: eventData.location,
            type: eventData.type,
            maxAttendees: eventData.maxAttendees,
            currentAttendees: eventData.currentAttendees || 0,
            eventStatus: eventData.eventStatus,
            eventCreator: eventData.eventCreator,
            isActive: eventData.isActive ?? true
          }
        });
        return response.createEvent;
      } catch (error) {
        console.error('Error creating event in Hygraph:', error);
        throw error;
      }
    },

    async update(id: string, eventData: Partial<HygraphEvent>): Promise<HygraphEvent> {
      try {
        const response = await hygraphClient.request(UPDATE_EVENT, {
          id,
          data: {
            ...eventData,
          }
        });
        return response.updateEvent;
      } catch (error) {
        console.error('Error updating event in Hygraph:', error);
        throw error;
      }
    },

    async delete(id: string): Promise<void> {
      try {
        await hygraphClient.request(DELETE_EVENT, { id });
      } catch (error) {
        console.error('Error deleting event from Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== GRADE OPERATIONS =====
  grades: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphGrade[]> {
      try {
        const response = await hygraphClient.request(GET_GRADES, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.grades || [];
      } catch (error) {
        console.error('Error fetching grades from Hygraph:', error);
        throw error;
      }
    },

    async create(gradeData: {
      studentId: string;
      courseId: string;
      finalGrade: number;
      letterGrade: string;
      gradePoints: number;
      calculationMethod: 'WEIGHTED_AVERAGE' | 'SIMPLE_AVERAGE' | 'MANUAL';
      assignmentGrades?: any;
      notes?: string;
      calculatedBy: string;
    }): Promise<HygraphGrade> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_GRADE, {
          data: {
            finalGrade: gradeData.finalGrade,
            letterGrade: gradeData.letterGrade,
            gradePoints: gradeData.gradePoints,
            calculationMethod: gradeData.calculationMethod,
            assignmentGrades: gradeData.assignmentGrades,
            notes: gradeData.notes,
            calculatedBy: gradeData.calculatedBy,
            calculatedAt: now,
            student: { connect: { id: gradeData.studentId } },
            course: { connect: { id: gradeData.courseId } }
          }
        });
        return response.createGrade;
      } catch (error) {
        console.error('Error creating grade in Hygraph:', error);
        throw error;
      }
    },

    async update(id: string, gradeData: Partial<HygraphGrade>): Promise<HygraphGrade> {
      try {
        const response = await hygraphClient.request(UPDATE_GRADE, {
          id,
          data: gradeData
        });
        return response.updateGrade;
      } catch (error) {
        console.error('Error updating grade in Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== COURSE MATERIAL OPERATIONS =====
  courseMaterials: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphCourseMaterial[]> {
      try {
        const response = await hygraphClient.request(GET_COURSE_MATERIALS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.courseMaterials || [];
      } catch (error) {
        console.error('Error fetching course materials from Hygraph:', error);
        throw error;
      }
    },

    async create(materialData: {
      title: string;
      description: string;
      type: string;
      externalLink?: string;
      courseId: string;
      isActive?: boolean;
    }): Promise<HygraphCourseMaterial> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_COURSE_MATERIAL, {
          data: {
            title: materialData.title,
            description: materialData.description,
            type: materialData.type,
            externalLink: materialData.externalLink,
            isActive: materialData.isActive ?? true,
            course: { connect: { id: materialData.courseId } }
          }
        });
        return response.createCourseMaterial;
      } catch (error) {
        console.error('Error creating course material in Hygraph:', error);
        throw error;
      }
    },

    async update(id: string, materialData: Partial<HygraphCourseMaterial>): Promise<HygraphCourseMaterial> {
      try {
        const response = await hygraphClient.request(UPDATE_COURSE_MATERIAL, {
          id,
          data: {
            ...materialData,
          }
        });
        return response.updateCourseMaterial;
      } catch (error) {
        console.error('Error updating course material in Hygraph:', error);
        throw error;
      }
    },

    async delete(id: string): Promise<void> {
      try {
        await hygraphClient.request(DELETE_COURSE_MATERIAL, { id });
      } catch (error) {
        console.error('Error deleting course material from Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== SUPPORT TICKET OPERATIONS =====
  supportTickets: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphSupportTicket[]> {
      try {
        const response = await hygraphClient.request(GET_SUPPORT_TICKETS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.supportTickets || [];
      } catch (error) {
        console.error('Error fetching support tickets from Hygraph:', error);
        throw error;
      }
    },

    async create(ticketData: {
      name: string;
      email: string;
      subject: string;
      message: string;
      userId?: string;
      supportTicketStatus?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    }): Promise<HygraphSupportTicket> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_SUPPORT_TICKET, {
          data: {
            name: ticketData.name,
            email: ticketData.email,
            subject: ticketData.subject,
            message: ticketData.message,
            supportTicketStatus: ticketData.supportTicketStatus || 'OPEN',
            ...(ticketData.userId && { user: { connect: { id: ticketData.userId } } })
          }
        });
        return response.createSupportTicket;
      } catch (error) {
        console.error('Error creating support ticket in Hygraph:', error);
        throw error;
      }
    },

    async update(id: string, ticketData: Partial<HygraphSupportTicket>): Promise<HygraphSupportTicket> {
      try {
        const response = await hygraphClient.request(UPDATE_SUPPORT_TICKET, {
          id,
          data: {
            ...ticketData,
          }
        });
        return response.updateSupportTicket;
      } catch (error) {
        console.error('Error updating support ticket in Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== EDIT REQUEST OPERATIONS =====
  editRequests: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphEditRequest[]> {
      try {
        const response = await hygraphClient.request(GET_EDIT_REQUESTS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.editRequests || [];
      } catch (error) {
        console.error('Error fetching edit requests from Hygraph:', error);
        throw error;
      }
    },

    async create(requestData: {
      submissionId: string;
      assignmentId: string;
      assignmentTitle: string;
      courseId: string;
      courseTitle: string;
      studentId: string;
      studentName: string;
      studentEmail: string;
      teacherId: string;
      reason: string;
      status?: 'PENDING' | 'APPROVED' | 'DENIED';
      isActive?: boolean;
    }): Promise<HygraphEditRequest> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_EDIT_REQUEST, {
          data: {
            submissionId: requestData.submissionId,
            assignmentId: requestData.assignmentId,
            assignmentTitle: requestData.assignmentTitle,
            courseId: requestData.courseId,
            courseTitle: requestData.courseTitle,
            studentId: requestData.studentId,
            studentName: requestData.studentName,
            studentEmail: requestData.studentEmail,
            teacherId: requestData.teacherId,
            reason: requestData.reason,
            status: requestData.status || 'PENDING',
            isActive: requestData.isActive ?? true,
            requestedAt: now
          }
        });
        return response.createEditRequest;
      } catch (error) {
        console.error('Error creating edit request in Hygraph:', error);
        throw error;
      }
    },

    async update(id: string, requestData: Partial<HygraphEditRequest>): Promise<HygraphEditRequest> {
      try {
        const response = await hygraphClient.request(UPDATE_EDIT_REQUEST, {
          id,
          data: {
            ...requestData,
            respondedAt: requestData.status && requestData.status !== 'PENDING' ? new Date().toISOString() : undefined
          }
        });
        return response.updateEditRequest;
      } catch (error) {
        console.error('Error updating edit request in Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== FORUM OPERATIONS =====
  forumThreads: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphForumThread[]> {
      try {
        const response = await hygraphClient.request(GET_FORUM_THREADS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.forumThreads || [];
      } catch (error) {
        console.error('Error fetching forum threads from Hygraph:', error);
        throw error;
      }
    },

    async create(threadData: {
      title: string;
      body: string;
      category?: string;
      authorId: string;
      likes?: number;
      views?: number;
    }): Promise<HygraphForumThread> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_FORUM_THREAD, {
          data: {
            title: threadData.title,
            body: threadData.body,
            category: threadData.category,
            likes: threadData.likes || 0,
            views: threadData.views || 0,
            lastActivityAt: now,
            author: { connect: { id: threadData.authorId } }
          }
        });
        return response.createForumThread;
      } catch (error) {
        console.error('Error creating forum thread in Hygraph:', error);
        throw error;
      }
    }
  },

  forumPosts: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphForumPost[]> {
      try {
        const response = await hygraphClient.request(GET_FORUM_POSTS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.forumPosts || [];
      } catch (error) {
        console.error('Error fetching forum posts from Hygraph:', error);
        throw error;
      }
    },

    async create(postData: {
      body: string;
      authorId: string;
      threadId: string;
      likes?: number;
    }): Promise<HygraphForumPost> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_FORUM_POST, {
          data: {
            body: postData.body,
            likes: postData.likes || 0,
            dateCreated: now,
            author: { connect: { id: postData.authorId } },
            thread: { connect: { id: postData.threadId } }
          }
        });
        return response.createForumPost;
      } catch (error) {
        console.error('Error creating forum post in Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== BLOG OPERATIONS =====
  blogPosts: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphBlogPost[]> {
      try {
        const response = await hygraphClient.request(GET_BLOG_POSTS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.blogPosts || [];
      } catch (error) {
        console.error('Error fetching blog posts from Hygraph:', error);
        throw error;
      }
    },

    async create(postData: {
      title: string;
      content: string;
      authorId: string;
      likes?: number;
    }): Promise<HygraphBlogPost> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_BLOG_POST, {
          data: {
            title: postData.title,
            content: postData.content,
            likes: postData.likes || 0,
            author: { connect: { id: postData.authorId } }
          }
        });
        return response.createBlogPost;
      } catch (error) {
        console.error('Error creating blog post in Hygraph:', error);
        throw error;
      }
    },

    async update(id: string, postData: Partial<HygraphBlogPost>): Promise<HygraphBlogPost> {
      try {
        const response = await hygraphClient.request(UPDATE_BLOG_POST, {
          id,
          data: {
            ...postData,
          }
        });
        return response.updateBlogPost;
      } catch (error) {
        console.error('Error updating blog post in Hygraph:', error);
        throw error;
      }
    },

    async delete(id: string): Promise<void> {
      try {
        await hygraphClient.request(DELETE_BLOG_POST, { id });
      } catch (error) {
        console.error('Error deleting blog post from Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== CERTIFICATE OPERATIONS =====
  certificates: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphCertificate[]> {
      try {
        const response = await hygraphClient.request(GET_CERTIFICATES, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.certificates || [];
      } catch (error) {
        console.error('Error fetching certificates from Hygraph:', error);
        throw error;
      }
    },

    async create(certificateData: {
      type: 'TOP_PERFORMER' | 'PERFECT_ATTENDANCE' | 'HOMEWORK_HERO' | 'COURSE_COMPLETION';
      userId: string;
      period?: any;
      details?: any;
    }): Promise<HygraphCertificate> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_CERTIFICATE, {
          data: {
            type: certificateData.type,
            period: certificateData.period,
            details: certificateData.details,
            awardedAt: now,
            user: { connect: { id: certificateData.userId } }
          }
        });
        return response.createCertificate;
      } catch (error) {
        console.error('Error creating certificate in Hygraph:', error);
        throw error;
      }
    }
  },

  // ===== ACTIVITY LOG OPERATIONS =====
  activityLogs: {
    async getAll(limit: number = 100, offset: number = 0, where?: any): Promise<HygraphActivityLog[]> {
      try {
        const response = await hygraphClient.request(GET_ACTIVITY_LOGS, {
          first: limit,
          skip: offset,
          where: where || {}
        });
        return response.activityLogs || [];
      } catch (error) {
        console.error('Error fetching activity logs from Hygraph:', error);
        throw error;
      }
    },

    async create(logData: {
      userId: string;
      dateKey: string;
      source: string;
    }): Promise<HygraphActivityLog> {
      try {
        const now = new Date().toISOString();
        const response = await hygraphClient.request(CREATE_ACTIVITY_LOG, {
          data: {
            dateKey: logData.dateKey,
            source: logData.source,
            user: { connect: { id: logData.userId } }
          }
        });
        return response.createActivityLog;
      } catch (error) {
        console.error('Error creating activity log in Hygraph:', error);
        throw error;
      }
    }
  }
};

// Export individual services for backward compatibility
export const hygraphUserService = hygraphService.users;
export const hygraphCourseService = hygraphService.courses;
export const hygraphEnrollmentService = hygraphService.enrollments;
export const hygraphAssignmentService = hygraphService.assignments;
export const hygraphSubmissionService = hygraphService.submissions;
export const hygraphExamService = hygraphService.exams;
export const hygraphExamAttemptService = hygraphService.examAttempts;
export const hygraphAnnouncementService = hygraphService.announcements;
export const hygraphEventService = hygraphService.events;
export const hygraphGradeService = hygraphService.grades;
export const hygraphCourseMaterialService = hygraphService.courseMaterials;
export const hygraphSupportTicketService = hygraphService.supportTickets;
export const hygraphEditRequestService = hygraphService.editRequests;
export const hygraphForumThreadService = hygraphService.forumThreads;
export const hygraphForumPostService = hygraphService.forumPosts;
export const hygraphBlogPostService = hygraphService.blogPosts;
export const hygraphCertificateService = hygraphService.certificates;
export const hygraphActivityLogService = hygraphService.activityLogs;