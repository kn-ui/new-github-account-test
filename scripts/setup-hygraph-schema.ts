#!/usr/bin/env node

/**
 * Hygraph Schema Setup Script
 * 
 * This script creates the complete schema for the St. Raguel School Management System
 * using the Hygraph Management API.
 * 
 * Usage:
 *   npx tsx scripts/setup-hygraph-schema.ts
 * 
 * Prerequisites:
 *   - Hygraph project created
 *   - Permanent auth token with management permissions
 *   - Environment variables set
 */

import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

const MANAGEMENT_API = 'https://management.hygraph.com/graphql';
const AUTH_TOKEN = process.env.HYGRAPH_MANAGEMENT_TOKEN || '';

if (!AUTH_TOKEN) {
  console.error('❌ Error: Missing HYGRAPH_MANAGEMENT_TOKEN in environment variables');
  process.exit(1);
}

// Helper function to make GraphQL requests
async function graphqlRequest(query: string, variables: any = {}) {
  const response = await fetch(MANAGEMENT_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('GraphQL Error:', JSON.stringify(result.errors, null, 2));
    throw new Error(result.errors[0]?.message || 'GraphQL request failed');
  }
  
  return result.data;
}

// Create enumeration
async function createEnumeration(apiId: string, displayName: string, values: string[]) {
  console.log(`  Creating enumeration: ${displayName}`);
  
  const mutation = `
    mutation CreateEnumeration($apiId: String!, $displayName: String!, $values: [String!]!) {
      createEnumeration(
        data: {
          apiId: $apiId
          displayName: $displayName
          values: $values
        }
      ) {
        id
        apiId
      }
    }
  `;
  
  return await graphqlRequest(mutation, { apiId, displayName, values });
}

// Create model
async function createModel(apiId: string, displayName: string, fields: any[]) {
  console.log(`  Creating model: ${displayName}`);
  
  const mutation = `
    mutation CreateModel($apiId: String!, $displayName: String!, $fields: [FieldCreateInput!]!) {
      createModel(
        data: {
          apiId: $apiId
          displayName: $displayName
          fields: $fields
        }
      ) {
        id
        apiId
      }
    }
  `;
  
  return await graphqlRequest(mutation, { apiId, displayName, fields });
}

// Create relation field
async function createRelationField(modelId: string, field: any) {
  console.log(`    Creating relation field: ${field.apiId}`);
  
  const mutation = `
    mutation CreateField($modelId: ID!, $field: FieldCreateInput!) {
      createField(
        modelId: $modelId
        data: $field
      ) {
        id
        apiId
      }
    }
  `;
  
  return await graphqlRequest(mutation, { modelId, field });
}

async function setupSchema() {
  console.log('🚀 Setting up Hygraph Schema for St. Raguel School Management System\n');

  try {
    // Step 1: Create Enumerations
    console.log('📋 Creating Enumerations...');
    
    await createEnumeration('UserRole', 'User Role', ['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN']);
    await createEnumeration('EnrollmentStatus', 'Enrollment Status', ['ACTIVE', 'COMPLETED', 'DROPPED']);
    await createEnumeration('SubmissionStatus', 'Submission Status', ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED']);
    await createEnumeration('ExamQuestionType', 'Exam Question Type', ['MCQ', 'TRUEFALSE', 'SHORT']);
    await createEnumeration('ExamAttemptStatus', 'Exam Attempt Status', ['IN_PROGRESS', 'SUBMITTED', 'GRADED']);
    await createEnumeration('SupportTicketStatus', 'Support Ticket Status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
    await createEnumeration('AnnouncementTarget', 'Announcement Target', ['ALL_STUDENTS', 'COURSE_STUDENTS', 'SPECIFIC_STUDENT']);
    await createEnumeration('EditRequestStatus', 'Edit Request Status', ['PENDING', 'APPROVED', 'DENIED']);
    await createEnumeration('EventStatus', 'Event Status', ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']);
    await createEnumeration('GradeCalculationMethod', 'Grade Calculation Method', ['WEIGHTED_AVERAGE', 'SIMPLE_AVERAGE', 'MANUAL']);
    await createEnumeration('CertificateType', 'Certificate Type', ['TOP_PERFORMER', 'PERFECT_ATTENDANCE', 'HOMEWORK_HERO', 'COURSE_COMPLETION']);

    console.log('✅ Enumerations created successfully\n');

    // Step 2: Create Models
    console.log('🏗️ Creating Models...');

    // User Model
    const userModel = await createModel('User', 'User', [
      { apiId: 'uid', displayName: 'UID', type: 'STRING', isUnique: true, isRequired: true },
      { apiId: 'email', displayName: 'Email', type: 'STRING', isUnique: true, isRequired: true },
      { apiId: 'displayName', displayName: 'Display Name', type: 'STRING', isRequired: true },
      { apiId: 'role', displayName: 'Role', type: 'ENUMERATION', enumeration: 'UserRole', isRequired: true },
      { apiId: 'isActive', displayName: 'Is Active', type: 'BOOLEAN', defaultValue: true, isRequired: true },
      { apiId: 'passwordChanged', displayName: 'Password Changed', type: 'BOOLEAN', defaultValue: false, isRequired: true },
      { apiId: 'createdAt', displayName: 'Created At', type: 'DATETIME', isRequired: true },
      { apiId: 'updatedAt', displayName: 'Updated At', type: 'DATETIME', isRequired: true }
    ]);

    // Course Model
    const courseModel = await createModel('Course', 'Course', [
      { apiId: 'title', displayName: 'Title', type: 'STRING', isRequired: true },
      { apiId: 'description', displayName: 'Description', type: 'STRING', isTextarea: true, isRequired: true },
      { apiId: 'category', displayName: 'Category', type: 'STRING', isRequired: true },
      { apiId: 'duration', displayName: 'Duration', type: 'INT', isRequired: true },
      { apiId: 'maxStudents', displayName: 'Max Students', type: 'INT', isRequired: true },
      { apiId: 'syllabus', displayName: 'Syllabus', type: 'STRING', isTextarea: true, isRequired: true },
      { apiId: 'isActive', displayName: 'Is Active', type: 'BOOLEAN', defaultValue: true, isRequired: true },
      { apiId: 'instructorName', displayName: 'Instructor Name', type: 'STRING', isRequired: true },
      { apiId: 'createdAt', displayName: 'Created At', type: 'DATETIME', isRequired: true },
      { apiId: 'updatedAt', displayName: 'Updated At', type: 'DATETIME', isRequired: true }
    ]);

    // Enrollment Model
    const enrollmentModel = await createModel('Enrollment', 'Enrollment', [
      { apiId: 'status', displayName: 'Status', type: 'ENUMERATION', enumeration: 'EnrollmentStatus', isRequired: true },
      { apiId: 'progress', displayName: 'Progress', type: 'INT', defaultValue: 0, isRequired: true },
      { apiId: 'completedLessons', displayName: 'Completed Lessons', type: 'STRING', isList: true },
      { apiId: 'isActive', displayName: 'Is Active', type: 'BOOLEAN', defaultValue: true, isRequired: true },
      { apiId: 'enrolledAt', displayName: 'Enrolled At', type: 'DATETIME', isRequired: true },
      { apiId: 'lastAccessedAt', displayName: 'Last Accessed At', type: 'DATETIME', isRequired: true }
    ]);

    // Assignment Model
    const assignmentModel = await createModel('Assignment', 'Assignment', [
      { apiId: 'title', displayName: 'Title', type: 'STRING', isRequired: true },
      { apiId: 'description', displayName: 'Description', type: 'STRING', isTextarea: true, isRequired: true },
      { apiId: 'instructions', displayName: 'Instructions', type: 'STRING', isTextarea: true },
      { apiId: 'dueDate', displayName: 'Due Date', type: 'DATETIME', isRequired: true },
      { apiId: 'maxScore', displayName: 'Max Score', type: 'INT', isRequired: true },
      { apiId: 'isActive', displayName: 'Is Active', type: 'BOOLEAN', defaultValue: true, isRequired: true },
      { apiId: 'attachments', displayName: 'Attachments', type: 'ASSET', isList: true },
      { apiId: 'createdAt', displayName: 'Created At', type: 'DATETIME', isRequired: true },
      { apiId: 'updatedAt', displayName: 'Updated At', type: 'DATETIME', isRequired: true }
    ]);

    // Submission Model
    const submissionModel = await createModel('Submission', 'Submission', [
      { apiId: 'content', displayName: 'Content', type: 'STRING', isTextarea: true, isRequired: true },
      { apiId: 'status', displayName: 'Status', type: 'ENUMERATION', enumeration: 'SubmissionStatus', isRequired: true },
      { apiId: 'grade', displayName: 'Grade', type: 'INT' },
      { apiId: 'feedback', displayName: 'Feedback', type: 'STRING', isTextarea: true },
      { apiId: 'maxScore', displayName: 'Max Score', type: 'INT' },
      { apiId: 'isActive', displayName: 'Is Active', type: 'BOOLEAN', defaultValue: true, isRequired: true },
      { apiId: 'attachments', displayName: 'Attachments', type: 'ASSET', isList: true },
      { apiId: 'submittedAt', displayName: 'Submitted At', type: 'DATETIME', isRequired: true },
      { apiId: 'updatedAt', displayName: 'Updated At', type: 'DATETIME' }
    ]);

    // CourseMaterial Model
    const courseMaterialModel = await createModel('CourseMaterial', 'Course Material', [
      { apiId: 'title', displayName: 'Title', type: 'STRING', isRequired: true },
      { apiId: 'description', displayName: 'Description', type: 'STRING', isTextarea: true, isRequired: true },
      { apiId: 'type', displayName: 'Type', type: 'STRING', isRequired: true },
      { apiId: 'externalLink', displayName: 'External Link', type: 'STRING' },
      { apiId: 'isActive', displayName: 'Is Active', type: 'BOOLEAN', defaultValue: true, isRequired: true },
      { apiId: 'file', displayName: 'File', type: 'ASSET' },
      { apiId: 'createdAt', displayName: 'Created At', type: 'DATETIME', isRequired: true },
      { apiId: 'updatedAt', displayName: 'Updated At', type: 'DATETIME', isRequired: true }
    ]);

    // Exam Model
    const examModel = await createModel('Exam', 'Exam', [
      { apiId: 'title', displayName: 'Title', type: 'STRING', isRequired: true },
      { apiId: 'description', displayName: 'Description', type: 'STRING', isTextarea: true },
      { apiId: 'date', displayName: 'Date', type: 'DATETIME', isRequired: true },
      { apiId: 'startTime', displayName: 'Start Time', type: 'DATETIME' },
      { apiId: 'durationMinutes', displayName: 'Duration Minutes', type: 'INT' },
      { apiId: 'totalPoints', displayName: 'Total Points', type: 'INT', isRequired: true },
      { apiId: 'questions', displayName: 'Questions', type: 'JSON' },
      { apiId: 'firstAttemptTimestamp', displayName: 'First Attempt Timestamp', type: 'DATETIME' },
      { apiId: 'createdAt', displayName: 'Created At', type: 'DATETIME', isRequired: true },
      { apiId: 'updatedAt', displayName: 'Updated At', type: 'DATETIME', isRequired: true }
    ]);

    // ExamAttempt Model
    const examAttemptModel = await createModel('ExamAttempt', 'Exam Attempt', [
      { apiId: 'status', displayName: 'Status', type: 'ENUMERATION', enumeration: 'ExamAttemptStatus', isRequired: true },
      { apiId: 'answers', displayName: 'Answers', type: 'JSON' },
      { apiId: 'autoScore', displayName: 'Auto Score', type: 'INT' },
      { apiId: 'totalAutoPoints', displayName: 'Total Auto Points', type: 'INT' },
      { apiId: 'manualScore', displayName: 'Manual Score', type: 'INT' },
      { apiId: 'score', displayName: 'Score', type: 'INT', isRequired: true },
      { apiId: 'feedback', displayName: 'Feedback', type: 'STRING', isTextarea: true },
      { apiId: 'isGraded', displayName: 'Is Graded', type: 'BOOLEAN', defaultValue: false, isRequired: true },
      { apiId: 'startedAt', displayName: 'Started At', type: 'DATETIME', isRequired: true },
      { apiId: 'submittedAt', displayName: 'Submitted At', type: 'DATETIME' },
      { apiId: 'updatedAt', displayName: 'Updated At', type: 'DATETIME' }
    ]);

    // Grade Model
    const gradeModel = await createModel('Grade', 'Grade', [
      { apiId: 'finalGrade', displayName: 'Final Grade', type: 'FLOAT', isRequired: true },
      { apiId: 'letterGrade', displayName: 'Letter Grade', type: 'STRING', isRequired: true },
      { apiId: 'gradePoints', displayName: 'Grade Points', type: 'FLOAT', isRequired: true },
      { apiId: 'calculationMethod', displayName: 'Calculation Method', type: 'ENUMERATION', enumeration: 'GradeCalculationMethod', isRequired: true },
      { apiId: 'assignmentGrades', displayName: 'Assignment Grades', type: 'JSON' },
      { apiId: 'notes', displayName: 'Notes', type: 'STRING', isTextarea: true },
      { apiId: 'calculatedBy', displayName: 'Calculated By', type: 'STRING', isRequired: true },
      { apiId: 'calculatedAt', displayName: 'Calculated At', type: 'DATETIME', isRequired: true }
    ]);

    // Announcement Model
    const announcementModel = await createModel('Announcement', 'Announcement', [
      { apiId: 'title', displayName: 'Title', type: 'STRING', isRequired: true },
      { apiId: 'body', displayName: 'Body', type: 'STRING', isTextarea: true, isRequired: true },
      { apiId: 'targetAudience', displayName: 'Target Audience', type: 'ENUMERATION', enumeration: 'AnnouncementTarget' },
      { apiId: 'externalLink', displayName: 'External Link', type: 'STRING' },
      { apiId: 'recipientStudentId', displayName: 'Recipient Student ID', type: 'STRING' },
      { apiId: 'createdAt', displayName: 'Created At', type: 'DATETIME', isRequired: true }
    ]);

    // Event Model
    const eventModel = await createModel('Event', 'Event', [
      { apiId: 'title', displayName: 'Title', type: 'STRING', isRequired: true },
      { apiId: 'description', displayName: 'Description', type: 'STRING', isTextarea: true, isRequired: true },
      { apiId: 'date', displayName: 'Date', type: 'DATETIME', isRequired: true },
      { apiId: 'time', displayName: 'Time', type: 'STRING', isRequired: true },
      { apiId: 'location', displayName: 'Location', type: 'STRING', isRequired: true },
      { apiId: 'type', displayName: 'Type', type: 'STRING', isRequired: true },
      { apiId: 'maxAttendees', displayName: 'Max Attendees', type: 'INT', isRequired: true },
      { apiId: 'currentAttendees', displayName: 'Current Attendees', type: 'INT', defaultValue: 0, isRequired: true },
      { apiId: 'status', displayName: 'Status', type: 'ENUMERATION', enumeration: 'EventStatus', isRequired: true },
      { apiId: 'isActive', displayName: 'Is Active', type: 'BOOLEAN', defaultValue: true, isRequired: true },
      { apiId: 'createdBy', displayName: 'Created By', type: 'STRING', isRequired: true },
      { apiId: 'createdAt', displayName: 'Created At', type: 'DATETIME', isRequired: true },
      { apiId: 'updatedAt', displayName: 'Updated At', type: 'DATETIME', isRequired: true }
    ]);

    // ForumThread Model
    const forumThreadModel = await createModel('ForumThread', 'Forum Thread', [
      { apiId: 'title', displayName: 'Title', type: 'STRING', isRequired: true },
      { apiId: 'body', displayName: 'Body', type: 'STRING', isTextarea: true, isRequired: true },
      { apiId: 'category', displayName: 'Category', type: 'STRING' },
      { apiId: 'likes', displayName: 'Likes', type: 'INT', defaultValue: 0, isRequired: true },
      { apiId: 'views', displayName: 'Views', type: 'INT', defaultValue: 0, isRequired: true },
      { apiId: 'createdAt', displayName: 'Created At', type: 'DATETIME', isRequired: true },
      { apiId: 'lastActivityAt', displayName: 'Last Activity At', type: 'DATETIME', isRequired: true },
      { apiId: 'updatedAt', displayName: 'Updated At', type: 'DATETIME' }
    ]);

    // ForumPost Model
    const forumPostModel = await createModel('ForumPost', 'Forum Post', [
      { apiId: 'body', displayName: 'Body', type: 'STRING', isTextarea: true, isRequired: true },
      { apiId: 'likes', displayName: 'Likes', type: 'INT', defaultValue: 0, isRequired: true },
      { apiId: 'createdAt', displayName: 'Created At', type: 'DATETIME', isRequired: true },
      { apiId: 'updatedAt', displayName: 'Updated At', type: 'DATETIME' }
    ]);

    // BlogPost Model
    const blogPostModel = await createModel('BlogPost', 'Blog Post', [
      { apiId: 'title', displayName: 'Title', type: 'STRING', isRequired: true },
      { apiId: 'content', displayName: 'Content', type: 'STRING', isTextarea: true, isRequired: true },
      { apiId: 'likes', displayName: 'Likes', type: 'INT', defaultValue: 0, isRequired: true },
      { apiId: 'createdAt', displayName: 'Created At', type: 'DATETIME', isRequired: true },
      { apiId: 'updatedAt', displayName: 'Updated At', type: 'DATETIME', isRequired: true }
    ]);

    // SupportTicket Model
    const supportTicketModel = await createModel('SupportTicket', 'Support Ticket', [
      { apiId: 'name', displayName: 'Name', type: 'STRING', isRequired: true },
      { apiId: 'email', displayName: 'Email', type: 'STRING', isRequired: true },
      { apiId: 'subject', displayName: 'Subject', type: 'STRING', isRequired: true },
      { apiId: 'message', displayName: 'Message', type: 'STRING', isTextarea: true, isRequired: true },
      { apiId: 'status', displayName: 'Status', type: 'ENUMERATION', enumeration: 'SupportTicketStatus', isRequired: true },
      { apiId: 'createdAt', displayName: 'Created At', type: 'DATETIME', isRequired: true },
      { apiId: 'updatedAt', displayName: 'Updated At', type: 'DATETIME', isRequired: true }
    ]);

    // EditRequest Model
    const editRequestModel = await createModel('EditRequest', 'Edit Request', [
      { apiId: 'submissionId', displayName: 'Submission ID', type: 'STRING', isRequired: true },
      { apiId: 'assignmentId', displayName: 'Assignment ID', type: 'STRING', isRequired: true },
      { apiId: 'assignmentTitle', displayName: 'Assignment Title', type: 'STRING', isRequired: true },
      { apiId: 'courseId', displayName: 'Course ID', type: 'STRING', isRequired: true },
      { apiId: 'courseTitle', displayName: 'Course Title', type: 'STRING', isRequired: true },
      { apiId: 'studentId', displayName: 'Student ID', type: 'STRING', isRequired: true },
      { apiId: 'studentName', displayName: 'Student Name', type: 'STRING', isRequired: true },
      { apiId: 'studentEmail', displayName: 'Student Email', type: 'STRING', isRequired: true },
      { apiId: 'teacherId', displayName: 'Teacher ID', type: 'STRING', isRequired: true },
      { apiId: 'reason', displayName: 'Reason', type: 'STRING', isTextarea: true, isRequired: true },
      { apiId: 'status', displayName: 'Status', type: 'ENUMERATION', enumeration: 'EditRequestStatus', isRequired: true },
      { apiId: 'response', displayName: 'Response', type: 'STRING', isTextarea: true },
      { apiId: 'respondedBy', displayName: 'Responded By', type: 'STRING' },
      { apiId: 'isActive', displayName: 'Is Active', type: 'BOOLEAN', defaultValue: true, isRequired: true },
      { apiId: 'requestedAt', displayName: 'Requested At', type: 'DATETIME', isRequired: true },
      { apiId: 'respondedAt', displayName: 'Responded At', type: 'DATETIME' }
    ]);

    // Certificate Model
    const certificateModel = await createModel('Certificate', 'Certificate', [
      { apiId: 'type', displayName: 'Type', type: 'ENUMERATION', enumeration: 'CertificateType', isRequired: true },
      { apiId: 'period', displayName: 'Period', type: 'JSON' },
      { apiId: 'details', displayName: 'Details', type: 'JSON' },
      { apiId: 'awardedAt', displayName: 'Awarded At', type: 'DATETIME', isRequired: true }
    ]);

    // ActivityLog Model
    const activityLogModel = await createModel('ActivityLog', 'Activity Log', [
      { apiId: 'dateKey', displayName: 'Date Key', type: 'STRING', isRequired: true },
      { apiId: 'source', displayName: 'Source', type: 'STRING', isRequired: true },
      { apiId: 'createdAt', displayName: 'Created At', type: 'DATETIME', isRequired: true }
    ]);

    console.log('✅ Models created successfully\n');

    // Step 3: Create Relations
    console.log('🔗 Creating Relations...');

    // Note: Creating relations via Management API is complex and may require
    // multiple API calls or manual setup in the Hygraph dashboard.
    // For now, we'll log the relations that need to be created manually.

    const relations = [
      // User relations
      { from: 'User', to: 'Course', type: 'oneToMany', field: 'coursesAsInstructor', relationName: 'CourseInstructor' },
      { from: 'User', to: 'Enrollment', type: 'oneToMany', field: 'enrollments', relationName: 'StudentEnrollments' },
      { from: 'User', to: 'Submission', type: 'oneToMany', field: 'submissions', relationName: 'StudentSubmissions' },
      { from: 'User', to: 'Assignment', type: 'oneToMany', field: 'assignments', relationName: 'TeacherAssignments' },
      { from: 'User', to: 'Grade', type: 'oneToMany', field: 'grades', relationName: 'StudentGrades' },
      { from: 'User', to: 'Announcement', type: 'oneToMany', field: 'announcements', relationName: 'AuthorAnnouncements' },
      { from: 'User', to: 'SupportTicket', type: 'oneToMany', field: 'supportTickets', relationName: 'UserTickets' },
      { from: 'User', to: 'BlogPost', type: 'oneToMany', field: 'blogPosts', relationName: 'AuthorBlogs' },
      { from: 'User', to: 'ForumThread', type: 'oneToMany', field: 'forumThreads', relationName: 'AuthorThreads' },
      { from: 'User', to: 'ForumPost', type: 'oneToMany', field: 'forumPosts', relationName: 'AuthorPosts' },
      { from: 'User', to: 'ExamAttempt', type: 'oneToMany', field: 'examAttempts', relationName: 'StudentAttempts' },
      { from: 'User', to: 'Certificate', type: 'oneToMany', field: 'certificates', relationName: 'UserCertificates' },
      { from: 'User', to: 'ActivityLog', type: 'oneToMany', field: 'activityLogs', relationName: 'UserActivity' },

      // Course relations
      { from: 'Course', to: 'User', type: 'manyToOne', field: 'instructor', relationName: 'CourseInstructor' },
      { from: 'Course', to: 'Enrollment', type: 'oneToMany', field: 'enrollments', relationName: 'CourseEnrollments' },
      { from: 'Course', to: 'Assignment', type: 'oneToMany', field: 'assignments', relationName: 'CourseAssignments' },
      { from: 'Course', to: 'CourseMaterial', type: 'oneToMany', field: 'materials', relationName: 'CourseMaterials' },
      { from: 'Course', to: 'Exam', type: 'oneToMany', field: 'exams', relationName: 'CourseExams' },
      { from: 'Course', to: 'Announcement', type: 'oneToMany', field: 'announcements', relationName: 'CourseAnnouncements' },
      { from: 'Course', to: 'Grade', type: 'oneToMany', field: 'grades', relationName: 'CourseGrades' },

      // Assignment relations
      { from: 'Assignment', to: 'Course', type: 'manyToOne', field: 'course', relationName: 'CourseAssignments' },
      { from: 'Assignment', to: 'User', type: 'manyToOne', field: 'teacher', relationName: 'TeacherAssignments' },
      { from: 'Assignment', to: 'Submission', type: 'oneToMany', field: 'submissions', relationName: 'AssignmentSubmissions' },
      { from: 'Assignment', to: 'Asset', type: 'manyToMany', field: 'attachments', relationName: 'AssignmentAttachments' },

      // Submission relations
      { from: 'Submission', to: 'Assignment', type: 'manyToOne', field: 'assignment', relationName: 'AssignmentSubmissions' },
      { from: 'Submission', to: 'User', type: 'manyToOne', field: 'student', relationName: 'StudentSubmissions' },
      { from: 'Submission', to: 'Course', type: 'manyToOne', field: 'course', relationName: 'CourseSubmissions' },
      { from: 'Submission', to: 'Asset', type: 'manyToMany', field: 'attachments', relationName: 'SubmissionAttachments' },

      // Enrollment relations
      { from: 'Enrollment', to: 'User', type: 'manyToOne', field: 'student', relationName: 'StudentEnrollments' },
      { from: 'Enrollment', to: 'Course', type: 'manyToOne', field: 'course', relationName: 'CourseEnrollments' },

      // CourseMaterial relations
      { from: 'CourseMaterial', to: 'Course', type: 'manyToOne', field: 'course', relationName: 'CourseMaterials' },
      { from: 'CourseMaterial', to: 'Asset', type: 'manyToOne', field: 'file', relationName: 'CourseMaterialFile' },

      // Exam relations
      { from: 'Exam', to: 'Course', type: 'manyToOne', field: 'course', relationName: 'CourseExams' },
      { from: 'Exam', to: 'ExamAttempt', type: 'oneToMany', field: 'attempts', relationName: 'ExamAttempts' },

      // ExamAttempt relations
      { from: 'ExamAttempt', to: 'Exam', type: 'manyToOne', field: 'exam', relationName: 'ExamAttempts' },
      { from: 'ExamAttempt', to: 'User', type: 'manyToOne', field: 'student', relationName: 'StudentAttempts' },

      // Grade relations
      { from: 'Grade', to: 'Course', type: 'manyToOne', field: 'course', relationName: 'CourseGrades' },
      { from: 'Grade', to: 'User', type: 'manyToOne', field: 'student', relationName: 'StudentGrades' },

      // Announcement relations
      { from: 'Announcement', to: 'Course', type: 'manyToOne', field: 'course', relationName: 'CourseAnnouncements' },
      { from: 'Announcement', to: 'User', type: 'manyToOne', field: 'author', relationName: 'AuthorAnnouncements' },

      // ForumThread relations
      { from: 'ForumThread', to: 'User', type: 'manyToOne', field: 'author', relationName: 'AuthorThreads' },
      { from: 'ForumThread', to: 'ForumPost', type: 'oneToMany', field: 'posts', relationName: 'ThreadPosts' },

      // ForumPost relations
      { from: 'ForumPost', to: 'ForumThread', type: 'manyToOne', field: 'thread', relationName: 'ThreadPosts' },
      { from: 'ForumPost', to: 'User', type: 'manyToOne', field: 'author', relationName: 'AuthorPosts' },

      // BlogPost relations
      { from: 'BlogPost', to: 'User', type: 'manyToOne', field: 'author', relationName: 'AuthorBlogs' },

      // SupportTicket relations
      { from: 'SupportTicket', to: 'User', type: 'manyToOne', field: 'user', relationName: 'UserTickets' },

      // Certificate relations
      { from: 'Certificate', to: 'User', type: 'manyToOne', field: 'user', relationName: 'UserCertificates' },

      // ActivityLog relations
      { from: 'ActivityLog', to: 'User', type: 'manyToOne', field: 'user', relationName: 'UserActivity' }
    ];

    console.log(`📋 Relations to create manually in Hygraph dashboard (${relations.length} total):`);
    relations.forEach(relation => {
      console.log(`  ${relation.from}.${relation.field} -> ${relation.to} (${relation.type})`);
    });

    console.log('\n✅ Schema setup completed!');
    console.log(`\n📊 Summary:`);
    console.log(`  • ${11} Enumerations created`);
    console.log(`  • ${17} Models created`);
    console.log(`  • ${relations.length} Relations to create manually`);
    console.log('\n📋 Next Steps:');
    console.log('1. Go to your Hygraph dashboard');
    console.log('2. Create the relations manually using the list above');
    console.log('3. Set up content permissions');
    console.log('4. Generate API tokens');
    console.log('5. Test the schema with sample data');

  } catch (error) {
    console.error('\n❌ Schema setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupSchema();