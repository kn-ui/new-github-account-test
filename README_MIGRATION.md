# Firebase to Hygraph Migration Guide

## 🎯 Overview

This guide provides a comprehensive walkthrough for migrating the St. Raguel School Management System from Firebase to Hygraph (GraphCMS) with Clerk authentication.

## 📚 Documentation

- **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)** - Overall migration strategy and architecture
- **[HYGRAPH_SETUP.md](./HYGRAPH_SETUP.md)** - Complete Hygraph setup instructions
- **[CLERK_SETUP.md](./CLERK_SETUP.md)** - Clerk authentication setup guide
- **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Detailed task checklist
- **[hygraph-schema.graphql](./hygraph-schema.graphql)** - Complete Hygraph schema definition

## 🚀 Quick Start

### 1. Install New Dependencies

```bash
# Frontend
npm install @clerk/clerk-react graphql node-fetch@2 form-data

# Backend
cd server
npm install @clerk/clerk-sdk-node graphql node-fetch@2 form-data
```

### 2. Set Up Hygraph

1. Create account at [hygraph.com](https://hygraph.com)
2. Create new project
3. Import schema from `hygraph-schema.graphql`
4. Generate API tokens
5. Copy the content API endpoint

Follow detailed instructions in [HYGRAPH_SETUP.md](./HYGRAPH_SETUP.md)

### 3. Set Up Clerk

1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Enable email authentication
4. Get API keys

Follow detailed instructions in [CLERK_SETUP.md](./CLERK_SETUP.md)

### 4. Configure Environment Variables

Create `.env` file:

```env
# Hygraph
VITE_HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/[project-id]/master
VITE_HYGRAPH_TOKEN=your-read-token
HYGRAPH_MUTATION_TOKEN=your-mutation-token

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Create `server/.env` file:

```env
# Hygraph
HYGRAPH_ENDPOINT=https://your-region.cdn.hygraph.com/content/[project-id]/master
HYGRAPH_TOKEN=your-read-token
HYGRAPH_MUTATION_TOKEN=your-mutation-token

# Clerk
CLERK_SECRET_KEY=sk_test_...
```

### 5. Test Connection

```bash
# Test Hygraph connection
npm run test:hygraph
```

### 6. Migrate Data

```bash
# Backup Firebase data first!
# Then run migration
npm run migrate:hygraph
```

### 7. Update Code

Follow the [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) to update:
- Authentication (Clerk)
- Data services (Hygraph)
- Components
- API endpoints

### 8. Test

```bash
# Start development servers
npm run dev:all

# Test all functionality
- User authentication
- Course management
- Assignments
- Grading
- etc.
```

## 📊 Migration Status

Current implementation provides:

### ✅ Completed
- [x] Migration planning and architecture
- [x] Hygraph schema design (matches all Firebase collections)
- [x] Hygraph GraphQL client library
- [x] Complete GraphQL queries and mutations
- [x] Service layer (drop-in replacement for Firebase)
- [x] Clerk authentication setup guide
- [x] Data migration script
- [x] Backend Hygraph configuration
- [x] Backend Clerk middleware
- [x] Documentation

### 📋 Remaining Work
- [ ] Set up Hygraph project
- [ ] Set up Clerk application
- [ ] Update frontend authentication to use Clerk
- [ ] Update components to use Hygraph service
- [ ] Update backend services
- [ ] Run data migration
- [ ] Testing
- [ ] Deployment

## 🏗️ Architecture

### Before (Firebase)
```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ├─► Firebase Auth
       ├─► Cloud Firestore
       └─► Firebase Storage
```

### After (Hygraph + Clerk)
```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ├─► Clerk Auth
       └─► Hygraph (GraphQL)
           ├─► Database
           └─► Assets (CDN)
```

## 📦 File Structure

```
project/
├── src/
│   ├── lib/
│   │   ├── hygraph.ts              # Hygraph client
│   │   ├── hygraphService.ts       # Service layer (replaces firestore.ts)
│   │   └── graphql/
│   │       ├── queries.ts          # GraphQL queries
│   │       └── mutations.ts        # GraphQL mutations
│   ├── contexts/
│   │   └── ClerkAuthContext.tsx    # New auth context
│   └── ...
├── server/
│   └── src/
│       ├── config/
│       │   ├── hygraph.ts          # Backend Hygraph config
│       │   └── clerk.ts            # Backend Clerk config
│       └── ...
├── scripts/
│   └── migrate-firebase-to-hygraph.ts  # Migration script
├── hygraph-schema.graphql          # Schema definition
├── MIGRATION_PLAN.md               # Migration strategy
├── HYGRAPH_SETUP.md                # Hygraph setup guide
├── CLERK_SETUP.md                  # Clerk setup guide
└── IMPLEMENTATION_CHECKLIST.md     # Task checklist
```

## 🔄 Data Model Mapping

| Firebase Collection | Hygraph Model | Status |
|-------------------|---------------|---------|
| users | User | ✅ Ready |
| courses | Course | ✅ Ready |
| enrollments | Enrollment | ✅ Ready |
| assignments | Assignment | ✅ Ready |
| submissions | Submission | ✅ Ready |
| exams | Exam | ✅ Ready |
| exam_attempts | ExamAttempt | ✅ Ready |
| grades | Grade | ✅ Ready |
| announcements | Announcement | ✅ Ready |
| events | Event | ✅ Ready |
| forum_threads | ForumThread | ✅ Ready |
| forum_posts | ForumPost | ✅ Ready |
| blogs | BlogPost | ✅ Ready |
| support_tickets | SupportTicket | ✅ Ready |
| courseMaterials | CourseMaterial | ✅ Ready |
| editRequests | EditRequest | ✅ Ready |
| certificates | Certificate | ✅ Ready |
| activity_logs | ActivityLog | ✅ Ready |

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start frontend
npm run dev:backend      # Start backend
npm run dev:all          # Start both

# Migration
npm run test:hygraph     # Test Hygraph connection
npm run migrate:hygraph  # Migrate data from Firebase

# Build
npm run build            # Build frontend
npm run build:backend    # Build backend
npm run build:all        # Build both

# Deployment
npm run preview          # Preview production build
```

## 🔐 Authentication Changes

### Before (Firebase Auth)
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './lib/firebase';

await signInWithEmailAndPassword(auth, email, password);
```

### After (Clerk)
```typescript
import { useSignIn } from '@clerk/clerk-react';

const { signIn } = useSignIn();
await signIn.create({ identifier: email, password });
```

## 📊 Database Queries

### Before (Firestore)
```typescript
import { collection, getDocs, where, query } from 'firebase/firestore';
import { db } from './lib/firebase';

const q = query(collection(db, 'users'), where('role', '==', 'student'));
const snapshot = await getDocs(q);
const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

### After (Hygraph)
```typescript
import { hygraphQuery } from './lib/hygraph';
import { GET_STUDENTS } from './lib/graphql/queries';

const result = await hygraphQuery(GET_STUDENTS);
const users = result.users;
```

## 💰 Cost Comparison

| Service | Free Tier | Notes |
|---------|-----------|-------|
| **Before** | | |
| Firebase Auth | Unlimited | Free forever |
| Cloud Firestore | 1GB storage, 50K reads/day | Usually enough |
| Firebase Storage | 5GB storage, 1GB/day bandwidth | Limited |
| **After** | | |
| Clerk Auth | 10,000 MAU | More than enough |
| Hygraph | 1M API ops/month | Monitor usage |
| Hygraph Assets | CDN included | Better performance |

## 🚨 Important Warnings

1. **Backup First**: Always backup Firebase data before migration
2. **Test Environment**: Test on staging before production
3. **API Limits**: Monitor Hygraph usage (1M ops/month on free tier)
4. **Breaking Changes**: This is a major architecture change
5. **No Rollback**: Once you switch, rolling back is complex
6. **Data Loss Risk**: Ensure migration completes successfully
7. **User Impact**: Users may need to reset passwords (Clerk uses different auth)

## 📈 Migration Timeline

- **Week 1**: Setup Hygraph and Clerk
- **Week 2**: Update authentication (Clerk)
- **Week 3-4**: Update data services and components
- **Week 5**: Data migration and testing
- **Week 6**: Production deployment and monitoring

## 🐛 Troubleshooting

### Connection Issues
```bash
# Check Hygraph endpoint
curl -X POST $VITE_HYGRAPH_ENDPOINT \
  -H "Authorization: Bearer $VITE_HYGRAPH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

### Authentication Issues
- Verify Clerk keys are correct
- Check that keys start with `pk_` (publishable) or `sk_` (secret)
- Ensure keys match the environment (test vs production)

### Migration Issues
- Check Firebase credentials are valid
- Verify Hygraph mutation token has write permissions
- Review migration logs for specific errors

## 📞 Support

- **Hygraph**: [docs.hygraph.com](https://docs.hygraph.com)
- **Clerk**: [clerk.com/docs](https://clerk.com/docs)
- **Issues**: Create an issue in the project repository

## 🎓 Learning Resources

- [GraphQL Introduction](https://graphql.org/learn/)
- [Hygraph Documentation](https://hygraph.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Migration Best Practices](https://hygraph.com/blog/migrate-to-hygraph)

## ✨ Benefits of Migration

1. **GraphQL API** - More flexible than Firestore queries
2. **Content Modeling** - Better structured data
3. **Built-in CDN** - Faster asset delivery worldwide
4. **Type Safety** - GraphQL provides strong typing
5. **Developer Experience** - GraphQL Playground for testing
6. **Scalability** - Better performance at scale
7. **No Vendor Lock-in** - GraphQL is an open standard

## 🎯 Next Steps

1. Read through all documentation
2. Set up Hygraph project
3. Set up Clerk application
4. Test connections
5. Follow implementation checklist
6. Run migration
7. Test thoroughly
8. Deploy!

---

**Need Help?** Refer to the detailed guides in this directory or contact the development team.
