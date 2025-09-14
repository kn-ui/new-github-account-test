# Database Seeding Guide

This guide provides instructions for manually adding sample data to the Firestore database using the real IDs provided.

## Real IDs Available

### Course IDs
- `848emeF22B0qN1TnYZMg`
- `course-001`
- `course-002`
- `course-003`
- `course-004`
- `course-005`
- `r2gwRDVYZTh3yFRfiotq`
- `SoRvDObbjSXedYhROPGb`
- `UN9bkZe034Fba2XMj005`

### User IDs
- **Admin**: `admin`
- **Students**: 
  - `Bu4LUIMp9scCoMPqp31ZR7CG1y02`
  - `HhrOtnxV7BfZhkrUqJJ0009tKZD3`
  - `N5DSrzHPDu00J4XM3MZmdWYf1gZ2`
  - `mQtPrxzkIAT7hNf4cGf880DnsAE3`
- **Super Admin**: `wIkOmy8folUF j8iA0nw@cnXRbo]2`
- **Teachers**:
  - `7E4dj9z3tzgKtRwURyfR11dz0YG3`
  - `HNSFVjZzngUyJvcrn7N8nrcCHNM2`
  - `VVz08cRZMedJsACARMvU4ApCH821`

## Collections to Seed

### 1. Assignments Collection

Add the following documents to the `assignments` collection:

```json
{
  "title": "Introduction to React",
  "description": "Create a simple React component with props and state management",
  "courseId": "848emeF22B0qN1TnYZMg",
  "teacherId": "7E4dj9z3tzgKtRwURyfR11dz0YG3",
  "dueDate": "2025-09-21T00:00:00.000Z",
  "maxScore": 100,
  "instructions": "Build a functional React component that displays user information",
  "createdAt": "2025-09-14T06:00:00.000Z",
  "updatedAt": "2025-09-14T06:00:00.000Z"
}
```

```json
{
  "title": "JavaScript Fundamentals",
  "description": "Complete exercises on JavaScript ES6 features",
  "courseId": "848emeF22B0qN1TnYZMg",
  "teacherId": "7E4dj9z3tzgKtRwURyfR11dz0YG3",
  "dueDate": "2025-09-28T00:00:00.000Z",
  "maxScore": 100,
  "instructions": "Implement arrow functions, destructuring, and async/await",
  "createdAt": "2025-09-14T06:00:00.000Z",
  "updatedAt": "2025-09-14T06:00:00.000Z"
}
```

```json
{
  "title": "Database Design",
  "description": "Design a normalized database schema for an e-commerce system",
  "courseId": "course-001",
  "teacherId": "HNSFVjZzngUyJvcrn7N8nrcCHNM2",
  "dueDate": "2025-09-24T00:00:00.000Z",
  "maxScore": 100,
  "instructions": "Create ERD diagrams and explain normalization process",
  "createdAt": "2025-09-14T06:00:00.000Z",
  "updatedAt": "2025-09-14T06:00:00.000Z"
}
```

### 2. Submissions Collection

Add the following documents to the `submissions` collection:

```json
{
  "courseId": "848emeF22B0qN1TnYZMg",
  "assignmentId": "[ASSIGNMENT_ID_FROM_ABOVE]",
  "studentId": "Bu4LUIMp9scCoMPqp31ZR7CG1y02",
  "submittedAt": "2025-09-12T00:00:00.000Z",
  "status": "submitted",
  "content": "Here is my React component implementation...",
  "maxScore": 100
}
```

```json
{
  "courseId": "848emeF22B0qN1TnYZMg",
  "assignmentId": "[ASSIGNMENT_ID_FROM_ABOVE]",
  "studentId": "HhrOtnxV7BfZhkrUqJJ0009tKZD3",
  "submittedAt": "2025-09-13T00:00:00.000Z",
  "status": "graded",
  "grade": 85,
  "feedback": "Good implementation! Consider adding error handling.",
  "content": "My React component with error handling...",
  "maxScore": 100
}
```

### 3. Announcements Collection

Add the following documents to the `announcements` collection:

```json
{
  "title": "Welcome to React Development Course",
  "content": "Welcome everyone! This course will cover React fundamentals and advanced concepts. Please review the syllabus and prepare for our first assignment.",
  "courseId": "848emeF22B0qN1TnYZMg",
  "authorId": "7E4dj9z3tzgKtRwURyfR11dz0YG3",
  "createdAt": "2025-09-09T00:00:00.000Z"
}
```

```json
{
  "title": "Assignment Due Date Extended",
  "content": "Due to technical issues, the JavaScript assignment due date has been extended by 2 days. Please use this extra time to improve your submissions.",
  "courseId": "848emeF22B0qN1TnYZMg",
  "authorId": "7E4dj9z3tzgKtRwURyfR11dz0YG3",
  "createdAt": "2025-09-12T00:00:00.000Z"
}
```

### 4. Course Materials Collection

Add the following documents to the `courseMaterials` collection:

```json
{
  "title": "React Documentation",
  "type": "link",
  "content": "Official React documentation for reference",
  "url": "https://reactjs.org/docs/getting-started.html",
  "courseId": "848emeF22B0qN1TnYZMg",
  "teacherId": "7E4dj9z3tzgKtRwURyfR11dz0YG3",
  "createdAt": "2025-09-14T06:00:00.000Z",
  "updatedAt": "2025-09-14T06:00:00.000Z"
}
```

```json
{
  "title": "JavaScript ES6 Cheat Sheet",
  "type": "document",
  "content": "Comprehensive guide to JavaScript ES6 features including arrow functions, destructuring, and modules",
  "courseId": "848emeF22B0qN1TnYZMg",
  "teacherId": "7E4dj9z3tzgKtRwURyfR11dz0YG3",
  "createdAt": "2025-09-14T06:00:00.000Z",
  "updatedAt": "2025-09-14T06:00:00.000Z"
}
```

### 5. Enrollments Collection

Add the following documents to the `enrollments` collection:

```json
{
  "courseId": "848emeF22B0qN1TnYZMg",
  "studentId": "Bu4LUIMp9scCoMPqp31ZR7CG1y02",
  "status": "active",
  "progress": 75,
  "completedLessons": ["lesson1", "lesson2", "lesson3", "lesson4"],
  "enrolledAt": "2025-08-25T00:00:00.000Z",
  "lastAccessedAt": "2025-09-13T00:00:00.000Z"
}
```

```json
{
  "courseId": "848emeF22B0qN1TnYZMg",
  "studentId": "HhrOtnxV7BfZhkrUqJJ0009tKZD3",
  "status": "active",
  "progress": 85,
  "completedLessons": ["lesson1", "lesson2", "lesson3", "lesson4", "lesson5"],
  "enrolledAt": "2025-08-30T00:00:00.000Z",
  "lastAccessedAt": "2025-09-12T00:00:00.000Z"
}
```

## How to Add Data

1. **Using Firebase Console**:
   - Go to the Firebase Console
   - Navigate to Firestore Database
   - Select the appropriate collection
   - Click "Add document"
   - Paste the JSON data (without the collection wrapper)
   - Save the document

2. **Using Firebase Admin SDK**:
   - Use the provided seeding script: `npm run seed`
   - Note: This requires proper authentication setup

3. **Using Firebase CLI**:
   - Use `firebase firestore:import` command with JSON files

## Notes

- All timestamps should be in ISO format
- Replace `[ASSIGNMENT_ID_FROM_ABOVE]` with actual assignment IDs after creating assignments
- The mock data in the components will automatically show when no real data exists
- All teacher dashboard pages are now configured to work with these real IDs

## Verification

After adding the data, verify that:
1. Teacher dashboard shows real data instead of mock data
2. All teacher pages (Grades, Announcements, Materials, Analytics) load properly
3. Course associations are correct
4. Student submissions are properly linked to assignments and courses