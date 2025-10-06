#!/usr/bin/env node

/**
 * Firebase to Hygraph Migration Script
 * 
 * This script migrates data from Firebase Firestore to Hygraph CMS
 * 
 * Usage:
 *   npx tsx scripts/migrate-firebase-to-hygraph.ts
 * 
 * Prerequisites:
 *   - Firebase credentials configured
 *   - Hygraph project created with schema
 *   - Hygraph mutation token with write permissions
 *   - All environment variables set
 */

import * as admin from 'firebase-admin';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const HYGRAPH_ENDPOINT = process.env.VITE_HYGRAPH_ENDPOINT || '';
const HYGRAPH_MUTATION_TOKEN = process.env.HYGRAPH_MUTATION_TOKEN || '';
const BATCH_SIZE = 50; // Process in batches to avoid rate limits

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// Hygraph GraphQL client
async function hygraphMutation(mutation: string, variables: any) {
  const response = await fetch(HYGRAPH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${HYGRAPH_MUTATION_TOKEN}`,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('GraphQL Error:', JSON.stringify(result.errors, null, 2));
    throw new Error(result.errors[0]?.message || 'GraphQL mutation failed');
  }
  
  return result.data;
}

// Helper to convert Firestore Timestamp to ISO string
function timestampToISO(timestamp: any): string {
  if (!timestamp) return new Date().toISOString();
  if (timestamp.toDate) return timestamp.toDate().toISOString();
  if (timestamp._seconds) return new Date(timestamp._seconds * 1000).toISOString();
  return new Date().toISOString();
}

// Helper to map Firebase role to Hygraph enum
function mapRole(role: string): string {
  return role.toUpperCase().replace('-', '_');
}

// ==================== MIGRATION FUNCTIONS ====================

async function migrateUsers() {
  console.log('\n📊 Migrating Users...');
  
  const usersSnapshot = await db.collection('users').get();
  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`Found ${users.length} users to migrate`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const user of users) {
    try {
      const mutation = `
        mutation CreateUser($data: UserCreateInput!) {
          createUser(data: $data) { id }
          publishUser: publishUser(where: { uid: "${user.uid}" }) { id }
        }
      `;
      
      await hygraphMutation(mutation, {
        data: {
          uid: user.uid || user.id,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          role: mapRole(user.role || 'student'),
          isActive: user.isActive !== false,
          passwordChanged: user.passwordChanged || false,
        },
      });
      
      migrated++;
      console.log(`  ✅ Migrated user: ${user.email}`);
    } catch (error: any) {
      failed++;
      console.error(`  ❌ Failed to migrate user ${user.email}:`, error.message);
    }
  }
  
  console.log(`\n✅ Users migration complete: ${migrated} succeeded, ${failed} failed`);
}

async function migrateCourses() {
  console.log('\n📚 Migrating Courses...');
  
  const coursesSnapshot = await db.collection('courses').get();
  const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`Found ${courses.length} courses to migrate`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const course of courses) {
    try {
      const mutation = `
        mutation CreateCourse($data: CourseCreateInput!) {
          createCourse(data: $data) { id }
          publishCourse(where: { id: "${course.id}" }) { id }
        }
      `;
      
      await hygraphMutation(mutation, {
        data: {
          title: course.title,
          description: course.description || '',
          category: course.category || 'General',
          duration: course.duration || 0,
          maxStudents: course.maxStudents || 30,
          syllabus: course.syllabus || '',
          isActive: course.isActive !== false,
          instructorName: course.instructorName || 'Unknown',
          instructor: {
            connect: { uid: course.instructor },
          },
        },
      });
      
      migrated++;
      console.log(`  ✅ Migrated course: ${course.title}`);
    } catch (error: any) {
      failed++;
      console.error(`  ❌ Failed to migrate course ${course.title}:`, error.message);
    }
  }
  
  console.log(`\n✅ Courses migration complete: ${migrated} succeeded, ${failed} failed`);
}

async function migrateEnrollments() {
  console.log('\n📝 Migrating Enrollments...');
  
  const enrollmentsSnapshot = await db.collection('enrollments').get();
  const enrollments = enrollmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`Found ${enrollments.length} enrollments to migrate`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const enrollment of enrollments) {
    try {
      const mutation = `
        mutation CreateEnrollment($data: EnrollmentCreateInput!) {
          createEnrollment(data: $data) { id }
          publishEnrollment(where: { id: "${enrollment.id}" }) { id }
        }
      `;
      
      await hygraphMutation(mutation, {
        data: {
          student: { connect: { uid: enrollment.studentId } },
          course: { connect: { id: enrollment.courseId } },
          status: (enrollment.status || 'active').toUpperCase(),
          progress: enrollment.progress || 0,
          completedLessons: enrollment.completedLessons || [],
          isActive: enrollment.isActive !== false,
          enrolledAt: timestampToISO(enrollment.enrolledAt),
          lastAccessedAt: timestampToISO(enrollment.lastAccessedAt),
        },
      });
      
      migrated++;
      console.log(`  ✅ Migrated enrollment: ${enrollment.id}`);
    } catch (error: any) {
      failed++;
      console.error(`  ❌ Failed to migrate enrollment ${enrollment.id}:`, error.message);
    }
  }
  
  console.log(`\n✅ Enrollments migration complete: ${migrated} succeeded, ${failed} failed`);
}

async function migrateAssignments() {
  console.log('\n📋 Migrating Assignments...');
  
  const assignmentsSnapshot = await db.collection('assignments').get();
  const assignments = assignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`Found ${assignments.length} assignments to migrate`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const assignment of assignments) {
    try {
      const mutation = `
        mutation CreateAssignment($data: AssignmentCreateInput!) {
          createAssignment(data: $data) { id }
          publishAssignment(where: { id: "${assignment.id}" }) { id }
        }
      `;
      
      await hygraphMutation(mutation, {
        data: {
          title: assignment.title,
          description: assignment.description || '',
          instructions: assignment.instructions || '',
          dueDate: timestampToISO(assignment.dueDate),
          maxScore: assignment.maxScore || 100,
          isActive: assignment.isActive !== false,
          course: { connect: { id: assignment.courseId } },
          teacher: { connect: { uid: assignment.teacherId } },
        },
      });
      
      migrated++;
      console.log(`  ✅ Migrated assignment: ${assignment.title}`);
    } catch (error: any) {
      failed++;
      console.error(`  ❌ Failed to migrate assignment ${assignment.title}:`, error.message);
    }
  }
  
  console.log(`\n✅ Assignments migration complete: ${migrated} succeeded, ${failed} failed`);
}

async function migrateSubmissions() {
  console.log('\n📤 Migrating Submissions...');
  
  const submissionsSnapshot = await db.collection('submissions').get();
  const submissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`Found ${submissions.length} submissions to migrate`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const submission of submissions) {
    try {
      const mutation = `
        mutation CreateSubmission($data: SubmissionCreateInput!) {
          createSubmission(data: $data) { id }
          publishSubmission(where: { id: "${submission.id}" }) { id }
        }
      `;
      
      await hygraphMutation(mutation, {
        data: {
          content: submission.content || '',
          status: (submission.status || 'submitted').toUpperCase(),
          grade: submission.grade,
          feedback: submission.feedback,
          maxScore: submission.maxScore || 100,
          isActive: submission.isActive !== false,
          assignment: { connect: { id: submission.assignmentId } },
          student: { connect: { uid: submission.studentId } },
          course: { connect: { id: submission.courseId } },
          submittedAt: timestampToISO(submission.submittedAt),
        },
      });
      
      migrated++;
      console.log(`  ✅ Migrated submission: ${submission.id}`);
    } catch (error: any) {
      failed++;
      console.error(`  ❌ Failed to migrate submission ${submission.id}:`, error.message);
    }
  }
  
  console.log(`\n✅ Submissions migration complete: ${migrated} succeeded, ${failed} failed`);
}

async function migrateAnnouncements() {
  console.log('\n📢 Migrating Announcements...');
  
  const announcementsSnapshot = await db.collection('announcements').get();
  const announcements = announcementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`Found ${announcements.length} announcements to migrate`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const announcement of announcements) {
    try {
      const data: any = {
        title: announcement.title,
        body: announcement.body || '',
        targetAudience: announcement.targetAudience,
        author: { connect: { uid: announcement.authorId } },
        createdAt: timestampToISO(announcement.createdAt),
      };
      
      if (announcement.courseId) {
        data.course = { connect: { id: announcement.courseId } };
      }
      
      if (announcement.recipientStudentId) {
        data.recipientStudentId = announcement.recipientStudentId;
      }
      
      if (announcement.externalLink) {
        data.externalLink = announcement.externalLink;
      }
      
      const mutation = `
        mutation CreateAnnouncement($data: AnnouncementCreateInput!) {
          createAnnouncement(data: $data) { id }
          publishAnnouncement(where: { id: "${announcement.id}" }) { id }
        }
      `;
      
      await hygraphMutation(mutation, { data });
      
      migrated++;
      console.log(`  ✅ Migrated announcement: ${announcement.title}`);
    } catch (error: any) {
      failed++;
      console.error(`  ❌ Failed to migrate announcement ${announcement.title}:`, error.message);
    }
  }
  
  console.log(`\n✅ Announcements migration complete: ${migrated} succeeded, ${failed} failed`);
}

async function migrateEvents() {
  console.log('\n📅 Migrating Events...');
  
  const eventsSnapshot = await db.collection('events').get();
  const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`Found ${events.length} events to migrate`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const event of events) {
    try {
      const mutation = `
        mutation CreateEvent($data: EventCreateInput!) {
          createEvent(data: $data) { id }
          publishEvent(where: { id: "${event.id}" }) { id }
        }
      `;
      
      await hygraphMutation(mutation, {
        data: {
          title: event.title,
          description: event.description || '',
          date: timestampToISO(event.date),
          time: event.time || '',
          location: event.location || '',
          type: event.type || 'General',
          maxAttendees: event.maxAttendees || 0,
          currentAttendees: event.currentAttendees || 0,
          status: (event.status || 'upcoming').toUpperCase(),
          isActive: event.isActive !== false,
          createdBy: event.createdBy || '',
          createdAt: timestampToISO(event.createdAt),
        },
      });
      
      migrated++;
      console.log(`  ✅ Migrated event: ${event.title}`);
    } catch (error: any) {
      failed++;
      console.error(`  ❌ Failed to migrate event ${event.title}:`, error.message);
    }
  }
  
  console.log(`\n✅ Events migration complete: ${migrated} succeeded, ${failed} failed`);
}

// ==================== MAIN MIGRATION FUNCTION ====================

async function main() {
  console.log('🚀 Starting Firebase to Hygraph Migration\n');
  console.log('⚠️  WARNING: This will create new data in Hygraph');
  console.log('⚠️  Make sure you have a backup of your Firebase data\n');
  
  // Check configuration
  if (!HYGRAPH_ENDPOINT || !HYGRAPH_MUTATION_TOKEN) {
    console.error('❌ Error: Missing Hygraph configuration');
    console.error('Please set VITE_HYGRAPH_ENDPOINT and HYGRAPH_MUTATION_TOKEN in your .env file');
    process.exit(1);
  }
  
  console.log('Configuration:');
  console.log(`  Hygraph Endpoint: ${HYGRAPH_ENDPOINT}`);
  console.log(`  Mutation Token: ${HYGRAPH_MUTATION_TOKEN.substring(0, 20)}...`);
  console.log('');
  
  try {
    // Migrate in order (respecting foreign key dependencies)
    await migrateUsers();
    await migrateCourses();
    await migrateEnrollments();
    await migrateAssignments();
    await migrateSubmissions();
    await migrateAnnouncements();
    await migrateEvents();
    
    // Add more collections as needed:
    // await migrateExams();
    // await migrateGrades();
    // await migrateForumThreads();
    // await migrateBlogPosts();
    // await migrateSupportTickets();
    
    console.log('\n✅ Migration Complete!');
    console.log('\nNext Steps:');
    console.log('1. Verify data in Hygraph dashboard');
    console.log('2. Test the application with Hygraph');
    console.log('3. Update application code to use Hygraph service');
    console.log('4. Remove Firebase dependencies when ready');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
main();
