# Hygraph Setup Guide

## Overview

This guide walks you through setting up Hygraph CMS for the St. Raguel School Management System.

## Step 1: Create a Hygraph Account

1. Go to [hygraph.com](https://hygraph.com)
2. Sign up for a free account (Community Plan includes 1M API Operations/month)
3. Create a new project
4. Choose a region close to your users (e.g., US East, EU West)
5. Name your project (e.g., "St Raguel School Management")

## Step 2: Create the Schema

### Option A: Using the Hygraph UI

1. Go to your project's Schema Editor
2. For each model in `hygraph-schema.graphql`, create:
   - Click "Add Model"
   - Enter model name
   - Add fields according to the schema
   - Set up relationships
   - Configure enums

### Option B: Using the GraphQL API (Faster)

You can use the Hygraph Management API to create the schema programmatically. A complete script is available at `scripts/setup-hygraph-schema.ts`.

**Prerequisites:**
1. Get your Management API token from Hygraph dashboard
2. Set `HYGRAPH_MANAGEMENT_TOKEN` in your environment variables

**Usage:**
```bash
# Set your management token
export HYGRAPH_MANAGEMENT_TOKEN="your-management-token"

# Run the setup script
npx tsx scripts/setup-hygraph-schema.ts
```

**What the script does:**
1. ✅ Creates all 11 enumerations (UserRole, EnrollmentStatus, etc.)
2. ✅ Creates all 17 models (User, Course, Assignment, etc.)
3. ✅ Sets up all field types and constraints including Asset fields
4. ✅ Configures default values and required fields
5. 📋 Lists all 47 relations that need to be created manually

**After running the script:**
1. Go to your Hygraph dashboard
2. Create the relations manually using the provided list
3. Set up content permissions
4. Generate API tokens

**Note:** The Management API has limitations for creating relations, so you'll need to set up the relationships manually in the Hygraph dashboard. The script will provide a complete list of all relations to create.

### Important Schema Notes

1. **Relationships**: Set up bidirectional relationships where needed (e.g., User ↔ Course)
2. **Required Fields**: Mark essential fields as required
3. **Unique Fields**: Make `uid` and `email` unique
4. **Default Values**: Set appropriate defaults (e.g., `isActive: true`)
5. **Enums**: Create all enum types first before using them in models

## Step 3: Configure API Access

### Public API (Read-Only)

1. Go to Project Settings → API Access
2. Create a new "Permanent Auth Token"
3. Name it "Public Read Token"
4. Set permissions to **READ** only
5. Apply to all models/stages
6. Copy the token → This is your `VITE_HYGRAPH_TOKEN`

### Mutation API (Read/Write)

1. Create another "Permanent Auth Token"
2. Name it "Mutation Token"
3. Set permissions to **READ**, **CREATE**, **UPDATE**, **DELETE**, **PUBLISH**
4. Apply to all models/stages
5. Copy the token → This is your `HYGRAPH_MUTATION_TOKEN`

### Content API Endpoint

1. Go to Project Settings → Endpoints
2. Copy the "Content API" endpoint
3. This is your `VITE_HYGRAPH_ENDPOINT`

## Step 4: Set Up Environment Variables

Create/update `.env` file:

```env
# Hygraph Configuration
VITE_HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/[project-id]/master
VITE_HYGRAPH_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
HYGRAPH_MUTATION_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Step 5: Configure Content Permissions

Hygraph has a powerful permission system. Set up roles:

### 1. Public Role
- **Can Read**: All published content
- **Cannot**: Create, Update, Delete

### 2. Student Role
- **Can Read**: Own enrollments, submissions, grades, announcements
- **Can Create**: Submissions, support tickets
- **Cannot**: Update other users' data

### 3. Teacher Role
- **Can Read**: Own courses, assignments, student submissions
- **Can Create**: Courses, assignments, announcements, exams
- **Can Update**: Own courses, assignments, can grade submissions
- **Cannot**: Access other teachers' data

### 4. Admin Role
- **Can**: Full access to all content
- **Can**: Create/update/delete all models

To set this up:
1. Go to Project Settings → Roles & Permissions
2. Create custom roles matching the above
3. Configure permissions for each model

## Step 6: Configure Asset Management

For file uploads (course materials, submission attachments):

1. Go to Project Settings → Assets
2. Configure:
   - Max file size: 100 MB
   - Allowed file types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, JPG, PNG
   - File naming: Unique filenames
   - Storage: Hygraph CDN (automatic)

## Step 7: Set Up Webhooks (Optional)

For real-time updates and automation:

1. Go to Project Settings → Webhooks
2. Create webhooks for:
   - **Content Published**: Notify frontend of new content
   - **Content Updated**: Sync changes
   - **Content Deleted**: Handle deletions

Example webhook payload:
```json
{
  "operation": "publish",
  "model": "User",
  "data": {
    "id": "...",
    "uid": "...",
    ...
  }
}
```

## Step 8: Enable GraphQL Introspection (Development)

For development, enable introspection to help with debugging:

1. Go to Project Settings → API Access
2. Enable "Allow Introspection"
3. **Disable this in production** for security

## Step 9: Configure Stages

Hygraph supports multiple content stages:

- **DRAFT**: Content being worked on
- **PUBLISHED**: Live content

Configure:
1. Go to Project Settings → Stages
2. Use DRAFT for testing
3. Publish to PUBLISHED for production
4. Set up publishing workflows if needed

## Step 10: Test the Connection

Create a test script:

```typescript
// scripts/test-hygraph-connection.ts
import { hygraphQuery } from './src/lib/hygraph';

async function testConnection() {
  try {
    const query = `
      query {
        users(first: 1) {
          id
          email
          displayName
        }
      }
    `;
    
    const result = await hygraphQuery(query);
    console.log('✅ Connection successful!');
    console.log('Users:', result.users);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();
```

Run: `npx tsx scripts/test-hygraph-connection.ts`

## Step 11: Set Up Rate Limiting

Hygraph has rate limits based on your plan:

### Community Plan (Free)
- 1M API Operations/month
- 10 requests/second
- 1000 records per query

### Professional Plan ($299/month)
- 3M API Operations/month
- 30 requests/second
- 5000 records per query

To optimize:
1. Use pagination (`first`, `skip`)
2. Cache frequently accessed data
3. Use GraphQL field selection (only request needed fields)
4. Batch related queries

## Step 12: Enable API Caching

For better performance:

1. Go to Project Settings → Cache
2. Enable CDN caching
3. Set cache duration:
   - Dynamic content: 60 seconds
   - Static content: 3600 seconds
4. Use cache tags for invalidation

## Step 13: Set Up Monitoring

Monitor your Hygraph usage:

1. Go to Project Settings → Usage
2. Track:
   - API operations
   - Bandwidth
   - Storage
   - Rate limit hits
3. Set up alerts for limits

## Common Issues & Solutions

### Issue: "Unauthorized" Error
**Solution**: Check that your API token has the correct permissions

### Issue: "Rate Limit Exceeded"
**Solution**: Implement caching and reduce request frequency

### Issue: "Validation Error"
**Solution**: Ensure data matches schema exactly (enums must be uppercase, required fields present)

### Issue: "Relation Not Found"
**Solution**: Ensure related entities exist before creating relationships

## GraphQL Playground

Hygraph provides a GraphQL Playground:

1. Go to API Playground in your project
2. Test queries and mutations
3. View schema documentation
4. Explore available types and fields

Example query to test:
```graphql
query {
  users(first: 10) {
    id
    email
    displayName
    role
  }
}
```

## Best Practices

1. **Always Publish**: After creating/updating content, call `publish[Model]`
2. **Use Pagination**: Never query without limits
3. **Optimize Queries**: Only request fields you need
4. **Handle Errors**: Implement proper error handling
5. **Test Locally**: Use DRAFT stage for development
6. **Version Control**: Keep schema changes in git
7. **Monitor Usage**: Watch your API operation count

## Next Steps

After completing setup:
1. ✅ Test all CRUD operations
2. ✅ Set up Clerk authentication
3. ✅ Run migration script
4. ✅ Update frontend code
5. ✅ Update backend code
6. ✅ Deploy and test

## Support Resources

- [Hygraph Documentation](https://hygraph.com/docs)
- [GraphQL API Reference](https://hygraph.com/docs/api-reference)
- [Community Forum](https://community.hygraph.com)
- [Discord Channel](https://discord.gg/hygraph)
