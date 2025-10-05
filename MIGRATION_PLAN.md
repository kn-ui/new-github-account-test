# Firebase to Hygraph Migration Plan

## Overview
This document outlines the complete migration strategy from Firebase to Hygraph for the St. Raguel School Management System.

## Current Firebase Stack
1. **Firebase Authentication** - Email/password authentication
2. **Cloud Firestore** - NoSQL database with 20+ collections
3. **Firebase Storage** - File storage for course materials and attachments
4. **Firebase Admin SDK** - Server-side operations

## Hygraph Replacement Strategy

### 1. Authentication (Critical Decision Required)
Hygraph does NOT provide authentication services. We need to choose an alternative:

**Option A: Clerk (Recommended)**
- ✅ Easy integration
- ✅ Built-in UI components
- ✅ Good documentation
- ✅ Free tier available
- ✅ JWT tokens work with Hygraph

**Option B: Auth0**
- ✅ Enterprise-grade
- ✅ Extensive features
- ⚠️ More complex setup
- ⚠️ Expensive at scale

**Option C: Supabase Auth**
- ✅ Open source
- ✅ Good free tier
- ✅ Similar to Firebase Auth
- ⚠️ Requires Supabase DB (but we can ignore it)

**Selected: Clerk** - Best balance for this project

### 2. Database Migration
Hygraph uses GraphQL with a content model approach. We'll map Firestore collections to Hygraph models:

#### Firestore → Hygraph Model Mapping
- `users` → `User` (with Role enum)
- `courses` → `Course`
- `enrollments` → `Enrollment`
- `assignments` → `Assignment`
- `submissions` → `Submission`
- `exams` → `Exam`
- `exam_attempts` → `ExamAttempt`
- `grades` → `Grade`
- `announcements` → `Announcement`
- `events` → `Event`
- `forum_threads` → `ForumThread`
- `forum_posts` → `ForumPost` (nested in threads)
- `blogs` → `BlogPost`
- `support_tickets` → `SupportTicket`
- `courseMaterials` → `CourseMaterial`
- `editRequests` → `EditRequest`
- `activity_logs` → `ActivityLog`
- `certificates` → `Certificate`

### 3. File Storage
Hygraph has built-in Asset Management:
- ✅ Upload files via GraphQL API
- ✅ Automatic CDN distribution
- ✅ Image transformations
- ✅ File organization by folders

### 4. Security & Permissions
Hygraph provides:
- **Content Permissions** - Role-based access control
- **API Access** - Token-based authentication
- **Webhooks** - For custom authorization logic

### 5. Real-time Updates
Hygraph doesn't have built-in real-time subscriptions like Firebase. Options:
- **Webhooks** - Trigger updates on content changes
- **Polling** - Regular API calls (simple but less efficient)
- **GraphQL Subscriptions** - Available in higher tiers

## Migration Steps

### Phase 1: Setup (Current)
1. ✅ Create Hygraph account and project
2. ✅ Design Hygraph schema
3. ⏳ Set up Clerk authentication
4. ⏳ Configure Hygraph API tokens

### Phase 2: Infrastructure
1. Create Hygraph GraphQL client
2. Create data migration scripts
3. Set up Clerk in frontend
4. Update backend API endpoints

### Phase 3: Feature Migration
1. Authentication & User Management
2. Courses & Enrollments
3. Assignments & Submissions
4. Exams & Grading
5. Announcements & Events
6. Forums & Blogs
7. Support System

### Phase 4: Data Migration
1. Export data from Firebase
2. Transform data to Hygraph schema
3. Import data via Hygraph API
4. Verify data integrity

### Phase 5: Testing & Deployment
1. Test all features
2. Performance testing
3. Security audit
4. Deploy to production
5. Monitor and optimize

## Hygraph Schema Structure

See `hygraph-schema.graphql` for the complete schema definition.

## Environment Variables Required

### Hygraph
```env
VITE_HYGRAPH_ENDPOINT=https://your-project.hygraph.com/v2/[project-id]/master
VITE_HYGRAPH_TOKEN=your-permanent-auth-token
HYGRAPH_MUTATION_TOKEN=your-mutation-token
```

### Clerk
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Code Structure Changes

### Frontend
```
src/
├── lib/
│   ├── hygraph.ts          # Hygraph GraphQL client
│   ├── clerk.ts            # Clerk configuration
│   └── graphql/            # GraphQL queries & mutations
├── contexts/
│   └── AuthContext.tsx     # Updated to use Clerk
└── hooks/
    └── useHygraph.ts       # Custom hooks for Hygraph
```

### Backend
```
server/src/
├── config/
│   ├── hygraph.ts          # Hygraph configuration
│   └── clerk.ts            # Clerk configuration
├── services/
│   └── hygraphService.ts   # Hygraph API service
└── middleware/
    └── clerkAuth.ts        # Clerk authentication middleware
```

## Timeline
- Week 1: Setup & Schema Design
- Week 2: Authentication Migration
- Week 3-4: Core Features Migration
- Week 5: Data Migration
- Week 6: Testing & Deployment

## Risks & Mitigation
1. **Data Loss** - Complete backup before migration
2. **Downtime** - Implement feature flags for gradual rollout
3. **Performance** - Load testing with production-like data
4. **Cost** - Monitor Hygraph usage and optimize queries

## Rollback Plan
Keep Firebase infrastructure running in parallel for 30 days post-migration for easy rollback if needed.
