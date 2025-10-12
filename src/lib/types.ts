/* eslint-disable @typescript-eslint/no-explicit-any */
// Type definitions for the application - formerly Firestore types, now used with Hygraph

// Simple Timestamp compatibility shim for legacy components
export const Timestamp = {
  now: () => ({ toDate: () => new Date() } as any),
  fromDate: (d: Date) => ({ toDate: () => d } as any),
} as any;

// User types
export interface User {
  uid?: string; // Optional for backward compatibility
  id?: string;  // Document ID
  displayName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  isActive: boolean;
  passwordChanged?: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Legacy alias for backward compatibility
export type FirestoreUser = User;

// Course types
export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  maxStudents: number;
  syllabus: string;
  isActive: boolean;
  instructor: string;
  instructorName: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Legacy alias for backward compatibility
export type FirestoreCourse = Course;

// Enrollment types
export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  status: 'active' | 'completed';
  progress: number;
  completedLessons: string[];
  enrolledAt: Date | Timestamp;
  lastAccessedAt: Date | Timestamp;
  isActive: boolean;
}

// Legacy alias for backward compatibility
export type FirestoreEnrollment = Enrollment;

// Assignment submission types
export interface Submission {
  id: string;
  courseId: string;
  assignmentId: string;
  studentId: string;
  submittedAt: Date | Timestamp;
  status: 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  content: string;
  attachments?: string[];
  maxScore?: number;
  instructions?: string;
  isActive: boolean;
}

// Legacy alias for backward compatibility
export type FirestoreSubmission = Submission;

// Assignment types
export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date | Timestamp;
  maxScore: number;
  instructions?: string;
  teacherId: string;
  attachments?: { type: 'file' | 'link'; url: string; title?: string }[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  isActive: boolean;
}

// Legacy alias for backward compatibility
export type FirestoreAssignment = Assignment;

// Course material types
export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'other';
  fileUrl?: string;
  externalLink?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  isActive: boolean;
}

// Legacy alias for backward compatibility
export type FirestoreCourseMaterial = CourseMaterial;

// Exam types
export interface Exam {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  date: Date | Timestamp;
  startTime?: Date | Timestamp;
  durationMinutes?: number;
  firstAttemptTimestamp?: Date | Timestamp;
  totalPoints: number;
  questions?: Array<{
    id: string;
    type: 'mcq' | 'truefalse' | 'short';
    prompt: string;
    options?: string[];
    correct: number | boolean;
    points: number;
  }>;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Legacy alias for backward compatibility
export type FirestoreExam = Exam;

// Exam attempt types
export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  startedAt: Date | Timestamp;
  submittedAt?: Date | Timestamp;
  status: 'in_progress' | 'submitted' | 'graded';
  answers: Array<{ questionId: string; response: any }>;
  autoScore?: number;
  totalAutoPoints?: number;
  manualScore?: number;
  feedback?: string;
  score: number;
  isGraded: boolean;
}

// Legacy alias for backward compatibility
export type FirestoreExamAttempt = ExamAttempt;

// Support ticket types
export interface SupportTicket {
  id: string;
  userId?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: Date | Timestamp;
}

// Legacy alias for backward compatibility
export type FirestoreSupportTicket = SupportTicket;

// Certificate types
export interface Certificate {
  id: string;
  type: 'top-performer' | 'perfect-attendance' | 'homework-hero';
  awardedAt: Date | Timestamp;
  period: { start: Date | Timestamp; end: Date | Timestamp };
  details?: Record<string, any>;
}

// Legacy alias for backward compatibility
export type FirestoreCertificate = Certificate;

// Blog types
export interface Blog {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date | Timestamp;
  likes: number;
}

// Legacy alias for backward compatibility
export type FirestoreBlog = Blog;

// Grade types
export interface Grade {
  id: string;
  courseId: string;
  studentId: string;
  finalGrade: number;
  letterGrade: string;
  gradePoints: number;
  calculatedAt: Date | Timestamp;
  calculatedBy: string;
  calculationMethod: 'weighted_average' | 'simple_average' | 'manual';
  assignmentGrades?: { assignmentId: string; grade: number; weight: number }[];
  notes?: string;
}

// Legacy alias for backward compatibility
export type FirestoreGrade = Grade;

// Edit request types
export interface EditRequest {
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
  status: 'pending' | 'approved' | 'denied';
  requestedAt: Date | Timestamp;
  respondedAt?: Date | Timestamp;
  response?: string;
  respondedBy?: string;
  isActive: boolean;
}

// Legacy alias for backward compatibility
export type FirestoreEditRequest = EditRequest;

// Announcement types
export interface Announcement {
  id: string;
  courseId?: string;
  targetAudience?: 'ALL_STUDENTS' | 'COURSE_STUDENTS' | 'SPECIFIC_STUDENT';
  recipientStudentId?: string;
  title: string;
  body: string;
  authorId: string;
  createdAt: Date | Timestamp;
  externalLink?: string;
}

// Legacy alias for backward compatibility
export type FirestoreAnnouncement = Announcement;

// Event types
export interface Event {
  id: string;
  title: string;
  date: Date | Timestamp;
  description: string;
  createdBy: string;
  type: string;
  time: string;
  location: string;
  maxAttendees: number;
  currentAttendees: number;
  status: string;
  isActive: boolean;
}

// Legacy alias for backward compatibility
export type FirestoreEvent = Event;

// Forum thread types
export interface ForumThread {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: Date | Timestamp;
  lastActivityAt: Date | Timestamp;
  category?: string;
  likes?: number;
}

// Legacy alias for backward compatibility
export type FirestoreForumThread = ForumThread;

// Forum post types
export interface ForumPost {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: Date | Timestamp;
}

// Legacy alias for backward compatibility
export type FirestoreForumPost = ForumPost;

// Assignment edit request types (legacy)
export interface AssignmentEditRequest {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  teacherId: string;
  submissionId?: string;
  requestedAt: Date | Timestamp;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  requestedChanges?: string;
  teacherResponse?: string;
  handledAt?: Date | Timestamp;
  dueDate: Date | Timestamp;
}

// Legacy alias for backward compatibility
export type FirestoreAssignmentEditRequest = AssignmentEditRequest;