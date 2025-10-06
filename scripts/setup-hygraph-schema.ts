#!/usr/bin/env node

/**
 * Hygraph Schema Setup Guide
 * 
 * This script provides a comprehensive guide for setting up the Hygraph schema
 * manually since the Management API has changed significantly.
 * 
 * Usage:
 *   npx tsx scripts/setup-hygraph-schema.ts
 */

import * as dotenv from 'dotenv';

dotenv.config();

async function setupSchema() {
  console.log('🚀 Hygraph Schema Setup Guide for St. Raguel School Management System\n');
  console.log('⚠️  Note: Due to changes in the Hygraph Management API,');
  console.log('⚠️  this guide will help you set up the schema manually.\n');

  try {
    // Step 1: Enumerations
    console.log('📋 STEP 1: Create Enumerations');
    console.log('Go to: Schema → Enumerations → Add Enumeration\n');
    
    const enumerations = [
      { name: 'UserRole', values: ['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'] },
      { name: 'EnrollmentStatus', values: ['ACTIVE', 'COMPLETED', 'DROPPED'] },
      { name: 'SubmissionStatus', values: ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED'] },
      { name: 'ExamQuestionType', values: ['MCQ', 'TRUEFALSE', 'SHORT'] },
      { name: 'ExamAttemptStatus', values: ['IN_PROGRESS', 'SUBMITTED', 'GRADED'] },
      { name: 'SupportTicketStatus', values: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
      { name: 'AnnouncementTarget', values: ['ALL_STUDENTS', 'COURSE_STUDENTS', 'SPECIFIC_STUDENT'] },
      { name: 'EditRequestStatus', values: ['PENDING', 'APPROVED', 'DENIED'] },
      { name: 'EventStatus', values: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'] },
      { name: 'GradeCalculationMethod', values: ['WEIGHTED_AVERAGE', 'SIMPLE_AVERAGE', 'MANUAL'] },
      { name: 'CertificateType', values: ['TOP_PERFORMER', 'PERFECT_ATTENDANCE', 'HOMEWORK_HERO', 'COURSE_COMPLETION'] }
    ];

    enumerations.forEach((enumeration, index) => {
      console.log(`${index + 1}. ${enumeration.name}`);
      console.log(`   Values: ${enumeration.values.join(', ')}\n`);
    });

    // Step 2: Models
    console.log('🏗️ STEP 2: Create Models');
    console.log('Go to: Schema → Models → Add Model\n');

    const models = [
      {
        name: 'User',
        description: 'System users (students, teachers, admins)',
        fields: [
          { name: 'uid', type: 'Single line text', unique: true, required: true, description: 'Unique user identifier' },
          { name: 'email', type: 'Single line text', unique: true, required: true, description: 'User email address' },
          { name: 'displayName', type: 'Single line text', required: true, description: 'User display name' },
          { name: 'role', type: 'Enumeration', enum: 'UserRole', required: true, description: 'User role in the system' },
          { name: 'isActive', type: 'Boolean', default: true, required: true, description: 'Whether user is active' },
          { name: 'passwordChanged', type: 'Boolean', default: false, required: true, description: 'Password change status' },
          { name: 'createdAt', type: 'Date and time', required: true, description: 'Account creation date' },
          { name: 'updatedAt', type: 'Date and time', required: true, description: 'Last update date' }
        ]
      },
      {
        name: 'Course',
        description: 'Academic courses',
        fields: [
          { name: 'title', type: 'Single line text', required: true, description: 'Course title' },
          { name: 'description', type: 'Multi-line text', required: true, description: 'Course description' },
          { name: 'category', type: 'Single line text', required: true, description: 'Course category' },
          { name: 'duration', type: 'Integer', required: true, description: 'Course duration in hours' },
          { name: 'maxStudents', type: 'Integer', required: true, description: 'Maximum number of students' },
          { name: 'syllabus', type: 'Multi-line text', required: true, description: 'Course syllabus' },
          { name: 'isActive', type: 'Boolean', default: true, required: true, description: 'Whether course is active' },
          { name: 'instructorName', type: 'Single line text', required: true, description: 'Instructor name' },
          { name: 'createdAt', type: 'Date and time', required: true, description: 'Course creation date' },
          { name: 'updatedAt', type: 'Date and time', required: true, description: 'Last update date' }
        ]
      },
      {
        name: 'Enrollment',
        description: 'Student course enrollments',
        fields: [
          { name: 'status', type: 'Enumeration', enum: 'EnrollmentStatus', required: true, description: 'Enrollment status' },
          { name: 'progress', type: 'Integer', default: 0, required: true, description: 'Course progress percentage' },
          { name: 'completedLessons', type: 'Multi-line text', description: 'List of completed lessons' },
          { name: 'isActive', type: 'Boolean', default: true, required: true, description: 'Whether enrollment is active' },
          { name: 'enrolledAt', type: 'Date and time', required: true, description: 'Enrollment date' },
          { name: 'lastAccessedAt', type: 'Date and time', required: true, description: 'Last access date' }
        ]
      },
      {
        name: 'Assignment',
        description: 'Course assignments',
        fields: [
          { name: 'title', type: 'Single line text', required: true, description: 'Assignment title' },
          { name: 'description', type: 'Multi-line text', required: true, description: 'Assignment description' },
          { name: 'instructions', type: 'Multi-line text', description: 'Assignment instructions' },
          { name: 'dueDate', type: 'Date and time', required: true, description: 'Assignment due date' },
          { name: 'maxScore', type: 'Integer', required: true, description: 'Maximum possible score' },
          { name: 'isActive', type: 'Boolean', default: true, required: true, description: 'Whether assignment is active' },
          { name: 'attachments', type: 'Asset', multiple: true, description: 'Assignment attachments' },
          { name: 'createdAt', type: 'Date and time', required: true, description: 'Assignment creation date' },
          { name: 'updatedAt', type: 'Date and time', required: true, description: 'Last update date' }
        ]
      },
      {
        name: 'Submission',
        description: 'Student assignment submissions',
        fields: [
          { name: 'content', type: 'Multi-line text', required: true, description: 'Submission content' },
          { name: 'status', type: 'Enumeration', enum: 'SubmissionStatus', required: true, description: 'Submission status' },
          { name: 'grade', type: 'Integer', description: 'Assigned grade' },
          { name: 'feedback', type: 'Multi-line text', description: 'Teacher feedback' },
          { name: 'maxScore', type: 'Integer', description: 'Maximum possible score' },
          { name: 'isActive', type: 'Boolean', default: true, required: true, description: 'Whether submission is active' },
          { name: 'attachments', type: 'Asset', multiple: true, description: 'Submission attachments' },
          { name: 'submittedAt', type: 'Date and time', required: true, description: 'Submission date' },
          { name: 'updatedAt', type: 'Date and time', description: 'Last update date' }
        ]
      },
      {
        name: 'CourseMaterial',
        description: 'Course materials and resources',
        fields: [
          { name: 'title', type: 'Single line text', required: true, description: 'Material title' },
          { name: 'description', type: 'Multi-line text', required: true, description: 'Material description' },
          { name: 'type', type: 'Single line text', required: true, description: 'Material type (document, video, etc.)' },
          { name: 'externalLink', type: 'Single line text', description: 'External link if applicable' },
          { name: 'isActive', type: 'Boolean', default: true, required: true, description: 'Whether material is active' },
          { name: 'file', type: 'Asset', description: 'Material file' },
          { name: 'createdAt', type: 'Date and time', required: true, description: 'Material creation date' },
          { name: 'updatedAt', type: 'Date and time', required: true, description: 'Last update date' }
        ]
      },
      {
        name: 'Exam',
        description: 'Online examinations',
        fields: [
          { name: 'title', type: 'Single line text', required: true, description: 'Exam title' },
          { name: 'description', type: 'Multi-line text', description: 'Exam description' },
          { name: 'date', type: 'Date and time', required: true, description: 'Exam date' },
          { name: 'startTime', type: 'Date and time', description: 'Exam start time' },
          { name: 'durationMinutes', type: 'Integer', description: 'Exam duration in minutes' },
          { name: 'totalPoints', type: 'Integer', required: true, description: 'Total exam points' },
          { name: 'questions', type: 'JSON', description: 'Exam questions (JSON format)' },
          { name: 'firstAttemptTimestamp', type: 'Date and time', description: 'First attempt timestamp' },
          { name: 'createdAt', type: 'Date and time', required: true, description: 'Exam creation date' },
          { name: 'updatedAt', type: 'Date and time', required: true, description: 'Last update date' }
        ]
      },
      {
        name: 'ExamAttempt',
        description: 'Student exam attempts',
        fields: [
          { name: 'status', type: 'Enumeration', enum: 'ExamAttemptStatus', required: true, description: 'Attempt status' },
          { name: 'answers', type: 'JSON', description: 'Student answers (JSON format)' },
          { name: 'autoScore', type: 'Integer', description: 'Automatically calculated score' },
          { name: 'totalAutoPoints', type: 'Integer', description: 'Total auto-calculated points' },
          { name: 'manualScore', type: 'Integer', description: 'Manually assigned score' },
          { name: 'score', type: 'Integer', required: true, description: 'Final score' },
          { name: 'feedback', type: 'Multi-line text', description: 'Exam feedback' },
          { name: 'isGraded', type: 'Boolean', default: false, required: true, description: 'Whether exam is graded' },
          { name: 'startedAt', type: 'Date and time', required: true, description: 'Attempt start time' },
          { name: 'submittedAt', type: 'Date and time', description: 'Submission time' },
          { name: 'updatedAt', type: 'Date and time', description: 'Last update time' }
        ]
      },
      {
        name: 'Grade',
        description: 'Student grades and calculations',
        fields: [
          { name: 'finalGrade', type: 'Float', required: true, description: 'Final calculated grade' },
          { name: 'letterGrade', type: 'Single line text', required: true, description: 'Letter grade (A, B, C, etc.)' },
          { name: 'gradePoints', type: 'Float', required: true, description: 'Grade points' },
          { name: 'calculationMethod', type: 'Enumeration', enum: 'GradeCalculationMethod', required: true, description: 'Grade calculation method' },
          { name: 'assignmentGrades', type: 'JSON', description: 'Individual assignment grades (JSON format)' },
          { name: 'notes', type: 'Multi-line text', description: 'Grade notes' },
          { name: 'calculatedBy', type: 'Single line text', required: true, description: 'Who calculated the grade' },
          { name: 'calculatedAt', type: 'Date and time', required: true, description: 'Grade calculation date' }
        ]
      },
      {
        name: 'Announcement',
        description: 'System announcements',
        fields: [
          { name: 'title', type: 'Single line text', required: true, description: 'Announcement title' },
          { name: 'body', type: 'Multi-line text', required: true, description: 'Announcement content' },
          { name: 'targetAudience', type: 'Enumeration', enum: 'AnnouncementTarget', description: 'Target audience' },
          { name: 'externalLink', type: 'Single line text', description: 'External link if applicable' },
          { name: 'recipientStudentId', type: 'Single line text', description: 'Specific student ID for targeted announcements' },
          { name: 'createdAt', type: 'Date and time', required: true, description: 'Announcement creation date' }
        ]
      },
      {
        name: 'Event',
        description: 'School events and activities',
        fields: [
          { name: 'title', type: 'Single line text', required: true, description: 'Event title' },
          { name: 'description', type: 'Multi-line text', required: true, description: 'Event description' },
          { name: 'date', type: 'Date and time', required: true, description: 'Event date' },
          { name: 'time', type: 'Single line text', required: true, description: 'Event time' },
          { name: 'location', type: 'Single line text', required: true, description: 'Event location' },
          { name: 'type', type: 'Single line text', required: true, description: 'Event type' },
          { name: 'maxAttendees', type: 'Integer', required: true, description: 'Maximum attendees' },
          { name: 'currentAttendees', type: 'Integer', default: 0, required: true, description: 'Current attendees count' },
          { name: 'status', type: 'Enumeration', enum: 'EventStatus', required: true, description: 'Event status' },
          { name: 'isActive', type: 'Boolean', default: true, required: true, description: 'Whether event is active' },
          { name: 'createdBy', type: 'Single line text', required: true, description: 'Event creator' },
          { name: 'createdAt', type: 'Date and time', required: true, description: 'Event creation date' },
          { name: 'updatedAt', type: 'Date and time', required: true, description: 'Last update date' }
        ]
      },
      {
        name: 'ForumThread',
        description: 'Discussion forum threads',
        fields: [
          { name: 'title', type: 'Single line text', required: true, description: 'Thread title' },
          { name: 'body', type: 'Multi-line text', required: true, description: 'Thread content' },
          { name: 'category', type: 'Single line text', description: 'Thread category' },
          { name: 'likes', type: 'Integer', default: 0, required: true, description: 'Number of likes' },
          { name: 'views', type: 'Integer', default: 0, required: true, description: 'Number of views' },
          { name: 'createdAt', type: 'Date and time', required: true, description: 'Thread creation date' },
          { name: 'lastActivityAt', type: 'Date and time', required: true, description: 'Last activity date' },
          { name: 'updatedAt', type: 'Date and time', description: 'Last update date' }
        ]
      },
      {
        name: 'ForumPost',
        description: 'Forum thread replies',
        fields: [
          { name: 'body', type: 'Multi-line text', required: true, description: 'Post content' },
          { name: 'likes', type: 'Integer', default: 0, required: true, description: 'Number of likes' },
          { name: 'createdAt', type: 'Date and time', required: true, description: 'Post creation date' },
          { name: 'updatedAt', type: 'Date and time', description: 'Last update date' }
        ]
      },
      {
        name: 'BlogPost',
        description: 'Blog posts and articles',
        fields: [
          { name: 'title', type: 'Single line text', required: true, description: 'Post title' },
          { name: 'content', type: 'Multi-line text', required: true, description: 'Post content' },
          { name: 'likes', type: 'Integer', default: 0, required: true, description: 'Number of likes' },
          { name: 'createdAt', type: 'Date and time', required: true, description: 'Post creation date' },
          { name: 'updatedAt', type: 'Date and time', description: 'Last update date' }
        ]
      },
      {
        name: 'SupportTicket',
        description: 'Support and help tickets',
        fields: [
          { name: 'name', type: 'Single line text', required: true, description: 'Ticket creator name' },
          { name: 'email', type: 'Single line text', required: true, description: 'Contact email' },
          { name: 'subject', type: 'Single line text', required: true, description: 'Ticket subject' },
          { name: 'message', type: 'Multi-line text', required: true, description: 'Ticket message' },
          { name: 'status', type: 'Enumeration', enum: 'SupportTicketStatus', required: true, description: 'Ticket status' },
          { name: 'createdAt', type: 'Date and time', required: true, description: 'Ticket creation date' },
          { name: 'updatedAt', type: 'Date and time', description: 'Last update date' }
        ]
      },
      {
        name: 'EditRequest',
        description: 'Grade edit requests',
        fields: [
          { name: 'submissionId', type: 'Single line text', required: true, description: 'Submission ID' },
          { name: 'assignmentId', type: 'Single line text', required: true, description: 'Assignment ID' },
          { name: 'assignmentTitle', type: 'Single line text', required: true, description: 'Assignment title' },
          { name: 'courseId', type: 'Single line text', required: true, description: 'Course ID' },
          { name: 'courseTitle', type: 'Single line text', required: true, description: 'Course title' },
          { name: 'studentId', type: 'Single line text', required: true, description: 'Student ID' },
          { name: 'studentName', type: 'Single line text', required: true, description: 'Student name' },
          { name: 'studentEmail', type: 'Single line text', required: true, description: 'Student email' },
          { name: 'teacherId', type: 'Single line text', required: true, description: 'Teacher ID' },
          { name: 'reason', type: 'Multi-line text', required: true, description: 'Request reason' },
          { name: 'status', type: 'Enumeration', enum: 'EditRequestStatus', required: true, description: 'Request status' },
          { name: 'response', type: 'Multi-line text', description: 'Response to request' },
          { name: 'respondedBy', type: 'Single line text', description: 'Who responded' },
          { name: 'isActive', type: 'Boolean', default: true, required: true, description: 'Whether request is active' },
          { name: 'requestedAt', type: 'Date and time', required: true, description: 'Request date' },
          { name: 'respondedAt', type: 'Date and time', description: 'Response date' }
        ]
      },
      {
        name: 'Certificate',
        description: 'Student certificates',
        fields: [
          { name: 'type', type: 'Enumeration', enum: 'CertificateType', required: true, description: 'Certificate type' },
          { name: 'period', type: 'JSON', description: 'Certificate period (JSON format)' },
          { name: 'details', type: 'JSON', description: 'Additional certificate details (JSON format)' },
          { name: 'awardedAt', type: 'Date and time', required: true, description: 'Award date' }
        ]
      },
      {
        name: 'ActivityLog',
        description: 'User activity tracking',
        fields: [
          { name: 'dateKey', type: 'Single line text', required: true, description: 'Date key for tracking' },
          { name: 'source', type: 'Single line text', required: true, description: 'Activity source' },
          { name: 'createdAt', type: 'Date and time', required: true, description: 'Activity date' }
        ]
      }
    ];

    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   Description: ${model.description}`);
      console.log(`   Fields:`);
      model.fields.forEach(field => {
        const unique = field.unique ? ' (unique)' : '';
        const required = field.required ? ' (required)' : '';
        const defaultVal = field.default ? ` (default: ${field.default})` : '';
        const multiple = field.multiple ? ' (multiple)' : '';
        const enumRef = field.enum ? ` (enum: ${field.enum})` : '';
        console.log(`     • ${field.name}: ${field.type}${unique}${required}${defaultVal}${multiple}${enumRef}`);
        if (field.description) {
          console.log(`       ${field.description}`);
        }
      });
      console.log('');
    });

    // Step 3: Relations
    console.log('🔗 STEP 3: Create Relations');
    console.log('Go to: Schema → Relations → Add Relation\n');

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

      // Submission relations
      { from: 'Submission', to: 'Assignment', type: 'manyToOne', field: 'assignment', relationName: 'AssignmentSubmissions' },
      { from: 'Submission', to: 'User', type: 'manyToOne', field: 'student', relationName: 'StudentSubmissions' },
      { from: 'Submission', to: 'Course', type: 'manyToOne', field: 'course', relationName: 'CourseSubmissions' },

      // Enrollment relations
      { from: 'Enrollment', to: 'User', type: 'manyToOne', field: 'student', relationName: 'StudentEnrollments' },
      { from: 'Enrollment', to: 'Course', type: 'manyToOne', field: 'course', relationName: 'CourseEnrollments' },

      // CourseMaterial relations
      { from: 'CourseMaterial', to: 'Course', type: 'manyToOne', field: 'course', relationName: 'CourseMaterials' },

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

    console.log(`Total Relations to Create: ${relations.length}\n`);
    relations.forEach((relation, index) => {
      console.log(`${index + 1}. ${relation.from}.${relation.field} → ${relation.to} (${relation.type})`);
    });

    console.log('\n✅ Schema setup guide completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to your Hygraph dashboard');
    console.log('2. Create the enumerations listed above');
    console.log('3. Create the models with their fields');
    console.log('4. Create the relations between models');
    console.log('5. Set up content permissions');
    console.log('6. Generate API tokens');
    console.log('7. Test the connection with: npm run test:hygraph');

  } catch (error) {
    console.error('\n❌ Setup guide failed:', error);
    process.exit(1);
  }
}

// Run the setup guide
setupSchema();