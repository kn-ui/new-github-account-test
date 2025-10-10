# Deprecated Firebase Files

This directory contains deprecated Firebase files that are no longer used in the application.

## Migration Status

**✅ COMPLETE** - The application now uses:
- **Authentication**: Clerk
- **Database**: Hygraph (GraphQL CMS)

## Deprecated Files

### `_deprecated/firebase.ts`
- Old Firebase initialization
- **Replaced by**: Clerk for authentication

### `_deprecated/firebaseSecondary.ts`
- Secondary Firebase app for admin user creation
- **Replaced by**: Clerk Admin API in backend

### `_deprecated/firestore.ts`
- Firestore database operations (2229 lines)
- **Replaced by**: Hygraph GraphQL operations

### `_deprecated/certificates.ts`
- Certificate generation using Firestore data
- **Replaced by**: Hygraph certificate service

### `../contexts/_AuthContext.tsx.deprecated`
- Old Firebase authentication context
- **Replaced by**: ClerkAuthContext

## Current Architecture

```
Authentication: Clerk
  ├── Frontend: @clerk/clerk-react
  └── Backend: @clerk/backend

Database: Hygraph
  ├── Frontend: src/lib/hygraph.ts
  └── Backend: server/src/services/hygraph*.ts

Date Handling: 
  └── src/utils/dateUtils.ts (safe utilities)
```

## Safe to Delete

All files in this directory can be safely deleted after verifying:
1. All authentication flows work with Clerk
2. All data operations work with Hygraph
3. No imports reference these files

---

*Last updated: $(date)*
