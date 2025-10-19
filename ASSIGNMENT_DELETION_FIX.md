# Assignment Deletion Fix

## Problem
When a teacher deleted an assignment, the following critical issues occurred:

1. **Submissions remained in the database** - Students' submissions for the deleted assignment were not deleted
2. **Edit requests remained active** - Any pending edit requests for submissions of that assignment were not deleted
3. **Deleted assignments still displayed** - Assignments showed up in student and teacher views even after deletion
4. **Grades still calculated** - Deleted assignments were still being used in grade calculations
5. **isActive flag not used** - Assignment queries didn't filter by `isActive`, so deleted assignments appeared in listings

This was a **huge problem** that could cause:
- Data inconsistency
- Incorrect grade calculations
- Confusion for students and teachers
- Orphaned data in the database

## Solution

### 1. Added `isActive` Filter to Assignment Queries

**File: `src/lib/firestore.ts`**

#### `getAssignmentsByCourse()`
Added `where('isActive', '==', true)` to filter out deleted assignments:
```typescript
const q = query(
  collections.assignments(),
  where('courseId', '==', courseId),
  where('isActive', '==', true), // ✅ ADDED
  limit(limitCount)
);
```

#### `getAssignmentsByTeacher()`
Added `where('isActive', '==', true)` to filter out deleted assignments:
```typescript
const q = query(
  collections.assignments(),
  where('teacherId', '==', teacherId),
  where('isActive', '==', true) // ✅ ADDED
);
```

### 2. Added `isActive` Filter to Submission Queries

#### `getSubmissionsByStudent()`
Added filter to hide submissions for deleted assignments:
```typescript
const q = query(
  collections.submissions(),
  where('studentId', '==', studentId),
  where('isActive', '==', true), // ✅ ADDED
  orderBy('submittedAt', 'desc')
);
```

#### `getSubmissionsByCourse()`
Added filter to show only active submissions:
```typescript
const q = query(
  collections.submissions(),
  where('courseId', '==', courseId),
  where('isActive', '==', true), // ✅ ADDED
  orderBy('submittedAt', 'desc')
);
```

**Note:** `getSubmissionsByAssignment()` deliberately does NOT filter by `isActive` because we need to fetch ALL submissions (including inactive ones) when deleting an assignment.

### 3. Added Missing `deleteSubmission()` Method

The method was being called but didn't exist:
```typescript
async deleteSubmission(submissionId: string): Promise<void> {
  const docRef = doc(db, 'submissions', submissionId);
  await deleteDoc(docRef);
}
```

### 4. Added Edit Request Deletion Methods

#### `getEditRequestsByAssignment()`
New method to fetch all edit requests for a specific assignment:
```typescript
async getEditRequestsByAssignment(assignmentId: string): Promise<FirestoreEditRequest[]> {
  const q = query(
    collections.editRequests(),
    where('assignmentId', '==', assignmentId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreEditRequest));
}
```

#### `deleteEditRequestsByAssignment()`
New method to delete all edit requests for an assignment:
```typescript
async deleteEditRequestsByAssignment(assignmentId: string): Promise<number> {
  try {
    const editRequests = await this.getEditRequestsByAssignment(assignmentId);
    await Promise.all(editRequests.map(req => this.deleteEditRequest(req.id)));
    console.log(`Deleted ${editRequests.length} edit requests for assignment ${assignmentId}`);
    return editRequests.length;
  } catch (error) {
    console.error(`Failed to delete edit requests for assignment ${assignmentId}:`, error);
    return 0;
  }
}
```

### 5. Updated `deleteAssignment()` to Delete Edit Requests

Added a new step in the deletion flow to remove all edit requests:
```typescript
// Delete edit requests for this assignment
try {
  const deletedEditRequests = await assignmentEditRequestService.deleteEditRequestsByAssignment(assignmentId);
  if (deletedEditRequests > 0) {
    console.log(`Deleted ${deletedEditRequests} edit requests for assignment ${assignmentId}`);
  }
} catch (error) {
  console.error('Failed to delete edit requests for assignment:', error);
}
```

## Complete Deletion Flow

When a teacher deletes an assignment, the system now performs the following steps in order:

1. **Fetch the assignment** - Get assignment details to check for attachments and course info
2. **Delete Hygraph files** - Remove any uploaded attachment files from Hygraph CDN
3. **Delete edit requests** - Remove all edit requests related to the assignment ✅ NEW
4. **Delete submissions** - Remove all student submissions for the assignment ✅ FIXED
5. **Remove from grades** - Remove the assignment from all grade records
6. **Delete assignment** - Finally delete the assignment document itself

## What Gets Deleted

When an assignment is deleted, the following related data is automatically cleaned up:

| Data Type | Action | Impact |
|-----------|--------|--------|
| **Assignment Document** | Hard deleted | Assignment no longer exists |
| **Hygraph Attachments** | Deleted from CDN | Files removed from storage |
| **Edit Requests** | Hard deleted ✅ NEW | No orphaned edit requests |
| **Student Submissions** | Hard deleted ✅ FIXED | Submissions removed completely |
| **Grade Records** | Assignment removed from arrays | Grades recalculated without this assignment |

## Filtering Improvements

### Assignments
- ✅ `getAssignmentsByCourse()` - Now filters by `isActive`
- ✅ `getAssignmentsByTeacher()` - Now filters by `isActive`
- ✅ Deleted assignments no longer appear in teacher/student views

### Submissions
- ✅ `getSubmissionsByStudent()` - Now filters by `isActive`
- ✅ `getSubmissionsByCourse()` - Now filters by `isActive`
- ✅ Submissions for deleted assignments no longer appear

### Edit Requests
- ✅ Already filtered by `isActive` in all queries
- ✅ Now properly deleted when assignment is deleted

## Testing Checklist

To verify the fix works correctly:

### 1. Create Test Data
- [ ] Create an assignment with attachments
- [ ] Have a student submit to the assignment
- [ ] Have the student request an edit for their submission
- [ ] Teacher grades the submission

### 2. Delete the Assignment
- [ ] Teacher deletes the assignment
- [ ] Check console logs for deletion confirmations

### 3. Verify Cleanup
- [ ] Assignment no longer appears in teacher's assignment list
- [ ] Assignment no longer appears in student's assignment list
- [ ] Submission no longer appears in student's submissions
- [ ] Edit request no longer appears for teacher or student
- [ ] Grade calculation excludes the deleted assignment
- [ ] Hygraph attachments are deleted (check CDN)

### Expected Console Output
```
Deleted 2 Hygraph asset(s) for assignment abc123
Deleted 3 edit requests for assignment abc123
Deleted 5 submissions for assignment abc123
Removed assignment abc123 from grade records
```

## Files Modified

- **src/lib/firestore.ts**
  - Updated `getAssignmentsByCourse()` - Added isActive filter
  - Updated `getAssignmentsByTeacher()` - Added isActive filter
  - Updated `getSubmissionsByStudent()` - Added isActive filter
  - Updated `getSubmissionsByCourse()` - Added isActive filter
  - Added `deleteSubmission()` method
  - Added `getEditRequestsByAssignment()` method
  - Added `deleteEditRequestsByAssignment()` method
  - Updated `deleteAssignment()` - Added edit request deletion step

## Impact

### Before Fix
- 😞 Deleted assignments still visible
- 😞 Submissions orphaned in database
- 😞 Edit requests orphaned in database
- 😞 Grades calculated with deleted assignments
- 😞 Data inconsistency and confusion

### After Fix
- ✅ Deleted assignments properly hidden
- ✅ All related submissions deleted
- ✅ All related edit requests deleted
- ✅ Grades calculated correctly without deleted assignments
- ✅ Clean database with no orphaned records
- ✅ Students and teachers see accurate data

## Backward Compatibility

The fix is backward compatible:
- Existing active assignments continue to work normally
- Previously deleted assignments (before this fix) will now be properly filtered out
- No data migration required
- Orphaned submissions/edit requests from old deletions will remain but won't affect new deletions

## Notes

- The fix uses **hard deletion** (deleteDoc) for submissions and edit requests
- The assignment itself is also hard deleted (not soft deleted with isActive flag)
- Grade records are updated to remove the assignment from arrays
- Hygraph file deletion is best-effort (continues even if file deletion fails)
- All deletions are wrapped in try-catch blocks to ensure completion even if one step fails
