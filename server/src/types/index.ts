import { Request } from 'express';

// User role enumeration
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

// User interface
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  profileImage?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Course interface
export interface Course {
  id: string;
  title: string;
  description: string;
  syllabus: string;
  instructor: string; // User UID
  instructorName: string;
  category: string;
  thumbnail?: string;
  duration: number; // in weeks
  maxStudents: number;
  enrolledStudents: string[]; // Array of student UIDs
  lessons: Lesson[];
  assignments: Assignment[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Lesson interface
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  resources: Resource[];
  order: number;
  duration?: number; // in minutes
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Resource interface
export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'document';
  url: string;
  description?: string;
  size?: number; // file size in bytes
}

// Assignment interface
export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: Date;
  maxPoints: number;
  attachments?: Resource[];
  submissions: Submission[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Submission interface
export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content: string;
  attachments?: Resource[];
  submittedAt: Date;
  grade?: number;
  feedback?: string;
  gradedAt?: Date;
  gradedBy?: string; // Teacher UID
  status: 'submitted' | 'graded' | 'late';
}

// Enrollment interface
export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: Date;
  progress: number; // percentage completed
  completedLessons: string[]; // Array of lesson IDs
  lastAccessedAt: Date;
  status: 'active' | 'completed' | 'dropped';
}

// Forum Post interface
export interface ForumPost {
  id: string;
  courseId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  title: string;
  content: string;
  replies: ForumReply[];
  tags: string[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Forum Reply interface
export interface ForumReply {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Certificate interface
export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  courseName: string;
  studentName: string;
  completionDate: Date;
  certificateUrl: string;
  issuedBy: string; // Teacher/Admin UID
}

// Extended Request interface with user info
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: UserRole;
  };
}

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// File upload interface
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

// Dashboard stats interfaces
export interface StudentDashboardStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalAssignments: number;
  submittedAssignments: number;
  pendingAssignments: number;
  averageGrade: number;
}

export interface TeacherDashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalAssignments: number;
  pendingGrading: number;
  totalSubmissions: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalEnrollments: number;
  activeUsers: number;
}