#!/usr/bin/env node

/**
 * Test Hygraph Connection
 * 
 * This script tests the connection to Hygraph and verifies
 * that the API is accessible and properly configured.
 */

import * as dotenv from 'dotenv';

dotenv.config();

const HYGRAPH_ENDPOINT = process.env.VITE_HYGRAPH_ENDPOINT || '';
const HYGRAPH_TOKEN = process.env.VITE_HYGRAPH_TOKEN || '';

async function testConnection() {
  console.log('🧪 Testing Hygraph Connection\n');

  // Check configuration
  if (!HYGRAPH_ENDPOINT) {
    console.error('❌ Error: VITE_HYGRAPH_ENDPOINT not set');
    console.log('Please add it to your .env file:');
    console.log('VITE_HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/[project-id]/master');
    process.exit(1);
  }

  if (!HYGRAPH_TOKEN) {
    console.error('❌ Error: VITE_HYGRAPH_TOKEN not set');
    console.log('Please add it to your .env file:');
    console.log('VITE_HYGRAPH_TOKEN=your-permanent-auth-token');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log(`  Endpoint: ${HYGRAPH_ENDPOINT}`);
  console.log(`  Token: ${HYGRAPH_TOKEN.substring(0, 20)}...\n`);

  // Test 1: Basic connectivity
  console.log('Test 1: Basic Connectivity');
  try {
    const response = await fetch(HYGRAPH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HYGRAPH_TOKEN}`,
      },
      body: JSON.stringify({
        query: '{ __typename }',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL Errors:', result.errors);
      process.exit(1);
    }

    console.log('✅ Connected successfully!\n');
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }

  // Test 2: Schema introspection
  console.log('Test 2: Schema Introspection');
  try {
    const response = await fetch(HYGRAPH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HYGRAPH_TOKEN}`,
      },
      body: JSON.stringify({
        query: `
          query {
            __schema {
              types {
                name
                kind
              }
            }
          }
        `,
      }),
    });

    const result = await response.json();
    
    if (result.errors) {
      console.warn('⚠️  Introspection not available (may be disabled)');
    } else {
      const types = result.data?.__schema?.types || [];
      const modelTypes = types.filter((t: any) => 
        t.kind === 'OBJECT' && 
        !t.name.startsWith('__') &&
        !['Query', 'Mutation', 'Subscription'].includes(t.name)
      );
      
      console.log(`✅ Schema loaded: ${modelTypes.length} models found`);
      console.log('   Models:', modelTypes.map((t: any) => t.name).join(', '));
      console.log('');
    }
  } catch (error: any) {
    console.warn('⚠️  Schema introspection failed:', error.message, '\n');
  }

  // Test 3: Query data
  console.log('Test 3: Query Data');
  try {
    const response = await fetch(HYGRAPH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HYGRAPH_TOKEN}`,
      },
      body: JSON.stringify({
        query: `
          query {
            users(first: 1) {
              id
              email
              displayName
              role
            }
          }
        `,
      }),
    });

    const result = await response.json();
    
    if (result.errors) {
      console.warn('⚠️  User query failed (schema may not be set up yet)');
      console.warn('   Error:', result.errors[0]?.message);
    } else {
      const users = result.data?.users || [];
      console.log(`✅ Query successful: ${users.length} user(s) found`);
      if (users.length > 0) {
        console.log('   Sample user:', users[0]);
      }
    }
    console.log('');
  } catch (error: any) {
    console.warn('⚠️  Query failed:', error.message, '\n');
  }

  // Test 4: Check mutation token
  const MUTATION_TOKEN = process.env.HYGRAPH_MUTATION_TOKEN || '';
  console.log('Test 4: Mutation Token');
  if (!MUTATION_TOKEN) {
    console.warn('⚠️  HYGRAPH_MUTATION_TOKEN not set');
    console.log('   You will need this for creating/updating data');
    console.log('   Add it to your .env file:');
    console.log('   HYGRAPH_MUTATION_TOKEN=your-mutation-token\n');
  } else {
    console.log(`✅ Mutation token configured: ${MUTATION_TOKEN.substring(0, 20)}...\n`);
  }

  // Summary
  console.log('━'.repeat(60));
  console.log('✅ Connection Test Complete!');
  console.log('━'.repeat(60));
  console.log('\nNext Steps:');
  console.log('1. If schema is not set up, import hygraph-schema.graphql');
  console.log('2. Configure mutation token for data migration');
  console.log('3. Run: npm run migrate:hygraph');
  console.log('4. Start development: npm run dev:all\n');
}

// Run test
testConnection().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
