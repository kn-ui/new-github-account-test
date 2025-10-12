# Firebase/Firestore Cleanup Guide

## What was removed:
✅ **Deleted Firebase config files:**
- `server/src/config/firebase.ts`
- `src/lib/firebase.ts` 
- `src/lib/firebaseSecondary.ts`

✅ **Cleaned up imports:**
- Removed all `import ... from 'firebase/...'` statements
- Removed Firebase dependencies from package.json files

✅ **Updated type system:**
- Created `src/lib/types.ts` with clean type definitions
- Replaced `src/lib/firestore.ts` with compatibility layer that warns about deprecation

## Remaining service calls to replace:

The following service calls are still using the old firestore services and need to be replaced with API calls:

### User Service Calls (userService.*)
- `userService.getUsers()` → `api.getUsers()`
- `userService.getUserById()` → `api.getUserProfile()` (for current user) or create new endpoint
- `userService.getUsersByIds()` → Need to create new bulk endpoint or use multiple calls
- `userService.createUser()` → `api.createUser()`
- `userService.updateUser()` → `api.updateUserProfile()`
- `userService.deleteUser()` → Need to create new endpoint

### Course Service Calls (courseService.*)
- `courseService.getCourses()` → `api.getCourses()`
- `courseService.getCourseById()` → `api.getCourseById()`
- `courseService.getCoursesByInstructor()` → `api.getMyCourses()`
- `courseService.createCourse()` → `api.createCourse()`
- `courseService.updateCourse()` → `api.updateCourse()`
- `courseService.deleteCourse()` → `api.deleteCourse()`

### Enrollment Service Calls (enrollmentService.*)
- `enrollmentService.getEnrollmentsByStudent()` → `api.getMyEnrollments()`
- `enrollmentService.getEnrollmentsByCourse()` → `api.getCourseEnrollments()`
- `enrollmentService.createEnrollment()` → `api.enrollInCourse()`

## Files needing updates (97 locations):

### High Priority - Core functionality:
1. `src/pages/Dashboard.tsx` and dashboard components
2. `src/pages/TeacherCourses.tsx`
3. `src/pages/StudentCourses.tsx` 
4. `src/pages/CourseDetail.tsx`
5. `src/pages/CourseManager.tsx`
6. `src/pages/UserManager.tsx`

### Medium Priority - Features:
7. All other page components with service calls
8. Dashboard components

### Low Priority - Reports/Analytics:
9. Report generators
10. Analytics pages

## Quick Fix Commands:

You can use these search/replace patterns to speed up the conversion:

```bash
# Replace user service calls
find src -name "*.tsx" -exec sed -i 's/userService\.getUsers(/api.getUsers(/g' {} \;
find src -name "*.tsx" -exec sed -i 's/userService\.createUser(/api.createUser(/g' {} \;

# Replace course service calls  
find src -name "*.tsx" -exec sed -i 's/courseService\.getCourses(/api.getCourses(/g' {} \;
find src -name "*.tsx" -exec sed -i 's/courseService\.getCourseById(/api.getCourseById(/g' {} \;
find src -name "*.tsx" -exec sed -i 's/courseService\.createCourse(/api.createCourse(/g' {} \;

# Replace enrollment service calls
find src -name "*.tsx" -exec sed -i 's/enrollmentService\.getMyEnrollments(/api.getMyEnrollments(/g' {} \;
```

## Import statements to add:

Many files will need to import the API:
```typescript
import { api } from '@/lib/api';
```

## New API endpoints needed:

Some service calls don't have direct API equivalents yet:
- `GET /api/users/:id` (for getUserById)
- `POST /api/users/bulk` (for getUsersByIds)  
- `DELETE /api/users/:id` (for deleteUser)

## Testing approach:

1. Start with critical pages first (Dashboard, Courses, Users)
2. Test each page after conversion
3. Check browser console for API errors
4. Verify data is loading correctly

The application should work much better once these service calls are replaced with proper API calls!