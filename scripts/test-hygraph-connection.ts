#!/usr/bin/env node

/**
 * Hygraph Connection Test Script
 * 
 * This script tests the connection to Hygraph and verifies the schema setup.
 * 
 * Usage:
 *   npx tsx scripts/test-hygraph-connection.ts
 * 
 * Prerequisites:
 *   - Hygraph project created with schema
 *   - API tokens configured
 *   - Environment variables set
 */

import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

const HYGRAPH_ENDPOINT = process.env.VITE_HYGRAPH_ENDPOINT || '';
const HYGRAPH_TOKEN = process.env.VITE_HYGRAPH_TOKEN || '';

if (!HYGRAPH_ENDPOINT || !HYGRAPH_TOKEN) {
  console.error('❌ Error: Missing Hygraph configuration');
  console.error('Please set VITE_HYGRAPH_ENDPOINT and VITE_HYGRAPH_TOKEN in your .env file');
  process.exit(1);
}

// Helper function to make GraphQL requests
async function hygraphQuery(query: string, variables: any = {}) {
  const response = await fetch(HYGRAPH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${HYGRAPH_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('GraphQL Error:', JSON.stringify(result.errors, null, 2));
    throw new Error(result.errors[0]?.message || 'GraphQL query failed');
  }
  
  return result.data;
}

async function testConnection() {
  console.log('🧪 Testing Hygraph Connection\n');
  console.log(`Endpoint: ${HYGRAPH_ENDPOINT}`);
  console.log(`Token: ${HYGRAPH_TOKEN.substring(0, 20)}...\n`);

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const introspectionQuery = `
      query {
        __schema {
          types {
            name
          }
        }
      }
    `;
    
    const schemaResult = await hygraphQuery(introspectionQuery);
    console.log('✅ Connection successful!');
    console.log(`   Found ${schemaResult.__schema.types.length} types in schema\n`);

    // Test 2: Check if User model exists
    console.log('2️⃣ Testing User model...');
    const userQuery = `
      query {
        users(first: 1) {
          id
          uid
          email
          displayName
          role
          isActive
        }
      }
    `;
    
    const userResult = await hygraphQuery(userQuery);
    console.log('✅ User model accessible!');
    console.log(`   Found ${userResult.users.length} users\n`);

    // Test 3: Check if Course model exists
    console.log('3️⃣ Testing Course model...');
    const courseQuery = `
      query {
        courses(first: 1) {
          id
          title
          description
          category
          duration
          maxStudents
          isActive
        }
      }
    `;
    
    const courseResult = await hygraphQuery(courseQuery);
    console.log('✅ Course model accessible!');
    console.log(`   Found ${courseResult.courses.length} courses\n`);

    // Test 4: Check if Assignment model exists
    console.log('4️⃣ Testing Assignment model...');
    const assignmentQuery = `
      query {
        assignments(first: 1) {
          id
          title
          description
          dueDate
          maxScore
          isActive
        }
      }
    `;
    
    const assignmentResult = await hygraphQuery(assignmentQuery);
    console.log('✅ Assignment model accessible!');
    console.log(`   Found ${assignmentResult.assignments.length} assignments\n`);

    // Test 5: Check if Announcement model exists
    console.log('5️⃣ Testing Announcement model...');
    const announcementQuery = `
      query {
        announcements(first: 1) {
          id
          title
          body
          targetAudience
          createdAt
        }
      }
    `;
    
    const announcementResult = await hygraphQuery(announcementQuery);
    console.log('✅ Announcement model accessible!');
    console.log(`   Found ${announcementResult.announcements.length} announcements\n`);

    // Test 6: Check if Event model exists
    console.log('6️⃣ Testing Event model...');
    const eventQuery = `
      query {
        events(first: 1) {
          id
          title
          description
          date
          time
          location
          status
        }
      }
    `;
    
    const eventResult = await hygraphQuery(eventQuery);
    console.log('✅ Event model accessible!');
    console.log(`   Found ${eventResult.events.length} events\n`);

    // Test 7: Check if ForumThread model exists
    console.log('7️⃣ Testing ForumThread model...');
    const forumQuery = `
      query {
        forumThreads(first: 1) {
          id
          title
          body
          category
          likes
          views
        }
      }
    `;
    
    const forumResult = await hygraphQuery(forumQuery);
    console.log('✅ ForumThread model accessible!');
    console.log(`   Found ${forumResult.forumThreads.length} forum threads\n`);

    // Test 8: Check if BlogPost model exists
    console.log('8️⃣ Testing BlogPost model...');
    const blogQuery = `
      query {
        blogPosts(first: 1) {
          id
          title
          content
          likes
        }
      }
    `;
    
    const blogResult = await hygraphQuery(blogQuery);
    console.log('✅ BlogPost model accessible!');
    console.log(`   Found ${blogResult.blogPosts.length} blog posts\n`);

    // Test 9: Check if SupportTicket model exists
    console.log('9️⃣ Testing SupportTicket model...');
    const supportQuery = `
      query {
        supportTickets(first: 1) {
          id
          name
          email
          subject
          message
          status
        }
      }
    `;
    
    const supportResult = await hygraphQuery(supportQuery);
    console.log('✅ SupportTicket model accessible!');
    console.log(`   Found ${supportResult.supportTickets.length} support tickets\n`);

    // Test 10: Check if Exam model exists
    console.log('🔟 Testing Exam model...');
    const examQuery = `
      query {
        exams(first: 1) {
          id
          title
          description
          date
          totalPoints
        }
      }
    `;
    
    const examResult = await hygraphQuery(examQuery);
    console.log('✅ Exam model accessible!');
    console.log(`   Found ${examResult.exams.length} exams\n`);

    console.log('\n🎉 All tests passed! Your Hygraph setup is working correctly.');
    console.log('\n📋 Next Steps:');
    console.log('1. Set up Clerk authentication');
    console.log('2. Update your application code to use Hygraph');
    console.log('3. Test CRUD operations');
    console.log('4. Deploy to production');

  } catch (error) {
    console.error('\n❌ Connection test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that your Hygraph project is created');
    console.log('2. Verify your API tokens are correct');
    console.log('3. Ensure the schema is properly set up');
    console.log('4. Check that your tokens have the right permissions');
    process.exit(1);
  }
}

// Run the test
testConnection();