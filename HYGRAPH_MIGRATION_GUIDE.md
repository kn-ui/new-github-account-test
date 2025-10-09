# Hygraph Migration Guide

This guide documents the migration from Firebase Firestore to Hygraph GraphQL CMS for the St. Raguel Church School Management System.

## Overview

The migration replaces Firebase Firestore with Hygraph as the primary database for the school management system. This provides better content management capabilities, GraphQL API, and improved developer experience.

## What Was Migrated

### Database Models
All 18 models have been migrated from Firestore to Hygraph:

1. **AppUser** - System users (students, teachers, admins)
2. **Course** - Academic courses
3. **Enrollment** - Student course enrollments
4. **Assignment** - Course assignments
5. **Submission** - Student assignment submissions
6. **CourseMaterial** - Course materials and resources
7. **Exam** - Online examinations
8. **ExamAttempt** - Student exam attempts
9. **Grade** - Student grades and calculations
10. **Announcement** - System announcements
11. **Event** - School events and activities
12. **ForumThread** - Discussion forum threads
13. **ForumPost** - Forum thread replies
14. **BlogPost** - Blog posts and articles
15. **SupportTicket** - Support and help tickets
16. **EditRequest** - Grade edit requests
17. **Certificate** - Student certificates
18. **ActivityLog** - User activity tracking

### Enumerations
All 11 enumerations have been migrated:

1. **UserRole** - STUDENT, TEACHER, ADMIN, SUPER_ADMIN
2. **EnrollmentStatus** - ACTIVE, COMPLETED, DROPPED
3. **SubmissionStatus** - NOT_STARTED, IN_PROGRESS, SUBMITTED, GRADED
4. **ExamQuestionType** - MCQ, TRUEFALSE, SHORT
5. **ExamAttemptStatus** - IN_PROGRESS, SUBMITTED, GRADED
6. **SupportTicketStatus** - OPEN, IN_PROGRESS, RESOLVED, CLOSED
7. **AnnouncementTarget** - ALL_STUDENTS, COURSE_STUDENTS, SPECIFIC_STUDENT
8. **EditRequestStatus** - PENDING, APPROVED, DENIED
9. **EventStatus** - UPCOMING, ONGOING, COMPLETED, CANCELLED
10. **GradeCalculationMethod** - WEIGHTED_AVERAGE, SIMPLE_AVERAGE, MANUAL
11. **CertificateType** - TOP_PERFORMER, PERFECT_ATTENDANCE, HOMEWORK_HERO, COURSE_COMPLETION

## New Architecture

### Frontend Services
- **Location**: `src/lib/hygraphService.ts`
- **Purpose**: Comprehensive service layer for all Hygraph operations
- **Features**: 
  - Type-safe GraphQL operations
  - Error handling
  - Pagination support
  - Search functionality

### Backend Services
- **Location**: `server/src/services/hygraphService.ts`
- **Purpose**: Server-side Hygraph operations
- **Features**:
  - Same API as frontend service
  - Server-side authentication
  - Admin operations

### GraphQL Operations
- **Location**: `src/lib/hygraphOperations.ts` and `server/src/lib/hygraphOperations.ts`
- **Purpose**: All GraphQL queries and mutations
- **Features**:
  - Complete CRUD operations for all models
  - Optimized queries with relationships
  - Pagination and filtering support

## Key Changes

### 1. Authentication Context
- **File**: `src/contexts/ClerkAuthContext.tsx`
- **Changes**: 
  - Now uses `hygraphUserService` instead of Firestore
  - Converts Hygraph user data to compatible format
  - Maintains backward compatibility with existing components

### 2. User Management
- **File**: `src/pages/UserManager.tsx`
- **Changes**: 
  - Uses Hygraph service for user creation
  - Maintains same UI/UX
  - Improved error handling

### 3. CSV Upload
- **File**: `src/components/ui/CSVUpload.tsx`
- **Changes**: 
  - Uses Hygraph service for bulk user creation
  - Better progress tracking
  - Enhanced error reporting

### 4. Backend Controllers
- **File**: `server/src/controllers/userController.ts`
- **Changes**: 
  - Uses Hygraph service instead of Firestore
  - Maintains same API endpoints
  - Improved error handling

## Environment Variables

### Frontend (.env)
```env
VITE_HYGRAPH_ENDPOINT=https://api-eu-central-1.hygraph.com/v2/your-project-id/master
VITE_HYGRAPH_TOKEN=your-hygraph-token
```

### Backend (server/.env)
```env
HYGRAPH_ENDPOINT=https://api-eu-central-1.hygraph.com/v2/your-project-id/master
HYGRAPH_TOKEN=your-hygraph-token
```

## Usage Examples

### Creating a User
```typescript
import { hygraphUserService } from '@/lib/hygraphService';

const newUser = await hygraphUserService.create({
  uid: 'clerk-user-id',
  email: 'user@example.com',
  displayName: 'John Doe',
  role: 'STUDENT',
  isActive: true,
  passwordChanged: true
});
```

### Fetching Courses
```typescript
import { hygraphCourseService } from '@/lib/hygraphService';

const courses = await hygraphCourseService.getAll(50, 0, {
  isActive: true
});
```

### Creating an Assignment
```typescript
import { hygraphAssignmentService } from '@/lib/hygraphService';

const assignment = await hygraphAssignmentService.create({
  title: 'Math Homework',
  description: 'Complete exercises 1-10',
  dueDate: '2024-01-15T23:59:59Z',
  maxScore: 100,
  courseId: 'course-id',
  teacherId: 'teacher-id'
});
```

## Benefits of Migration

### 1. Better Developer Experience
- Type-safe GraphQL operations
- Auto-generated TypeScript types
- Better error handling
- Improved debugging

### 2. Performance Improvements
- Optimized queries with only required fields
- Built-in caching
- Better pagination support
- Reduced data transfer

### 3. Content Management
- Visual content editor
- Version control
- Content scheduling
- Multi-environment support

### 4. Scalability
- Better query optimization
- CDN integration
- Global edge caching
- Automatic scaling

## Migration Checklist

- [x] Install Hygraph dependencies
- [x] Create Hygraph configuration
- [x] Set up GraphQL operations
- [x] Create comprehensive service layer
- [x] Update authentication context
- [x] Update user management components
- [x] Update backend controllers
- [x] Test user operations
- [ ] Test all CRUD operations
- [ ] Update remaining components
- [ ] Remove Firebase dependencies
- [ ] Update documentation

## Testing

### Manual Testing
1. **User Authentication**: Test login/logout with Clerk
2. **User Creation**: Test admin user creation
3. **CSV Upload**: Test bulk user creation
4. **Profile Updates**: Test user profile modifications

### Automated Testing
```bash
# Run frontend tests
npm test

# Run backend tests
cd server && npm test
```

## Troubleshooting

### Common Issues

1. **Environment Variables**: Ensure all Hygraph environment variables are set
2. **GraphQL Errors**: Check query syntax and field names
3. **Authentication**: Verify Clerk integration is working
4. **Permissions**: Check Hygraph API permissions

### Debug Mode
Enable debug logging by setting:
```env
VITE_DEBUG=true
```

## Next Steps

1. **Complete Component Migration**: Update all remaining components to use Hygraph
2. **Data Migration**: Migrate existing Firestore data to Hygraph
3. **Performance Optimization**: Optimize queries and implement caching
4. **Monitoring**: Set up error tracking and performance monitoring
5. **Documentation**: Update API documentation and user guides

## Support

For issues or questions regarding the Hygraph migration:
1. Check the troubleshooting section
2. Review Hygraph documentation
3. Contact the development team
4. Create an issue in the project repository