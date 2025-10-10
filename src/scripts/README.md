# Database Seeding Scripts

## ⚠️ WARNING: These scripts use Firebase (Deprecated)

These seeding scripts were created for the old Firebase backend and are **no longer compatible** with the current Hygraph + Clerk architecture.

### Deprecated Files
- `seedDatabaseNode.ts` - Firebase seeding script
- `runSeedNode.ts` - Firebase seed runner
- `browserSeed.js` - Browser-based Firebase seeding

## Current Seeding Method

To seed data in the current Hygraph + Clerk system:

### Option 1: Use Hygraph Content API
1. Log into your Hygraph dashboard
2. Use the Content API to create entries
3. Or use Hygraph's UI to manually create content

### Option 2: Backend API Endpoints
Use the REST API endpoints in `server/src/routes/`:
- POST `/api/users` - Create users (admin only)
- POST `/api/courses` - Create courses
- POST `/api/events` - Create events
- etc.

### Option 3: Admin Dashboard
Use the admin dashboard at `/dashboard/users` to:
- Create users individually
- Import users via CSV upload
- Manage all content through the UI

## Migration Notes

The application now uses:
- **Authentication**: Clerk
- **Database**: Hygraph (GraphQL CMS)
- **No Firebase**: All Firebase code has been deprecated

---

*If you need to migrate data from Firebase to Hygraph, create a custom migration script using the Hygraph GraphQL API.*
