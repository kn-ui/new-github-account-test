import { 
  collection, 
  addDoc, 
  Timestamp,
  doc,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Sample data for seeding
const sampleAssignments = [
  {
    title: "Introduction to React",
    description: "Create a simple React component with props and state management",
    courseId: "course1",
    teacherId: "teacher1",
    dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
    maxScore: 100,
    instructions: "Build a functional React component that displays user information",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: "JavaScript Fundamentals",
    description: "Complete exercises on JavaScript ES6 features",
    courseId: "course1",
    teacherId: "teacher1",
    dueDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 14 days from now
    maxScore: 100,
    instructions: "Implement arrow functions, destructuring, and async/await",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: "Database Design",
    description: "Design a normalized database schema for an e-commerce system",
    courseId: "course2",
    teacherId: "teacher1",
    dueDate: Timestamp.fromDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)), // 10 days from now
    maxScore: 100,
    instructions: "Create ERD diagrams and explain normalization process",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
];

const sampleSubmissions = [
  {
    courseId: "course1",
    assignmentId: "assignment1",
    studentId: "student1",
    submittedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
    status: "submitted",
    content: "Here is my React component implementation...",
    maxScore: 100
  },
  {
    courseId: "course1",
    assignmentId: "assignment1",
    studentId: "student2",
    submittedAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
    status: "graded",
    grade: 85,
    feedback: "Good implementation! Consider adding error handling.",
    content: "My React component with error handling...",
    maxScore: 100
  },
  {
    courseId: "course2",
    assignmentId: "assignment3",
    studentId: "student1",
    submittedAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
    status: "submitted",
    content: "Database schema design document...",
    maxScore: 100
  }
];

const sampleAnnouncements = [
  {
    title: "Welcome to React Course",
    content: "Welcome everyone! This course will cover React fundamentals and advanced concepts. Please review the syllabus and prepare for our first assignment.",
    courseId: "course1",
    authorId: "teacher1",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)) // 5 days ago
  },
  {
    title: "Assignment Due Date Extended",
    content: "Due to technical issues, the JavaScript assignment due date has been extended by 2 days. Please use this extra time to improve your submissions.",
    courseId: "course1",
    authorId: "teacher1",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) // 2 days ago
  },
  {
    title: "Database Design Guidelines",
    content: "Please review the database design guidelines before submitting your assignment. Focus on normalization and proper relationships.",
    courseId: "course2",
    authorId: "teacher1",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)) // 1 day ago
  }
];

const sampleCourseMaterials = [
  {
    title: "React Documentation",
    type: "link",
    content: "Official React documentation for reference",
    url: "https://reactjs.org/docs/getting-started.html",
    courseId: "course1",
    teacherId: "teacher1",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: "JavaScript ES6 Cheat Sheet",
    type: "document",
    content: "Comprehensive guide to JavaScript ES6 features including arrow functions, destructuring, and modules",
    courseId: "course1",
    teacherId: "teacher1",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: "Database Design Principles",
    type: "video",
    content: "Video lecture covering database normalization and design principles",
    url: "https://example.com/database-design-video",
    courseId: "course2",
    teacherId: "teacher1",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
];

const sampleCourses = [
  {
    title: "React Development Fundamentals",
    description: "Learn React from the ground up with hands-on projects and real-world examples. This course covers components, state management, hooks, and modern React patterns.",
    instructor: "teacher1",
    category: "Web Development",
    duration: 40,
    isActive: true,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // 30 days ago
    updatedAt: Timestamp.now()
  },
  {
    title: "Database Design and Management",
    description: "Master database design principles, normalization, and SQL queries. Learn to design efficient database schemas for real-world applications.",
    instructor: "teacher1",
    category: "Database",
    duration: 35,
    isActive: true,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)), // 25 days ago
    updatedAt: Timestamp.now()
  },
  {
    title: "Advanced JavaScript Concepts",
    description: "Deep dive into advanced JavaScript topics including closures, prototypes, async programming, and modern ES6+ features.",
    instructor: "teacher1",
    category: "Programming",
    duration: 30,
    isActive: true,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)), // 20 days ago
    updatedAt: Timestamp.now()
  }
];

const sampleEnrollments = [
  {
    courseId: "course1",
    studentId: "student1",
    status: "active",
    progress: 65,
    completedLessons: ["lesson1", "lesson2", "lesson3"],
    enrolledAt: Timestamp.fromDate(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)), // 20 days ago
    lastAccessedAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)) // 1 day ago
  },
  {
    courseId: "course1",
    studentId: "student2",
    status: "active",
    progress: 80,
    completedLessons: ["lesson1", "lesson2", "lesson3", "lesson4"],
    enrolledAt: Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)), // 15 days ago
    lastAccessedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) // 2 days ago
  },
  {
    courseId: "course2",
    studentId: "student1",
    status: "active",
    progress: 45,
    completedLessons: ["lesson1", "lesson2"],
    enrolledAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
    lastAccessedAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) // 3 days ago
  }
];

export async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Add sample courses
    console.log('Adding sample courses...');
    const courseRefs = [];
    for (const course of sampleCourses) {
      const docRef = await addDoc(collection(db, 'courses'), course);
      courseRefs.push(docRef.id);
      console.log(`Added course: ${course.title} with ID: ${docRef.id}`);
    }

    // Update assignment courseIds with actual course IDs
    const assignmentsWithRealIds = sampleAssignments.map((assignment, index) => ({
      ...assignment,
      courseId: courseRefs[index % courseRefs.length]
    }));

    // Add sample assignments
    console.log('Adding sample assignments...');
    const assignmentRefs = [];
    for (const assignment of assignmentsWithRealIds) {
      const docRef = await addDoc(collection(db, 'assignments'), assignment);
      assignmentRefs.push(docRef.id);
      console.log(`Added assignment: ${assignment.title} with ID: ${docRef.id}`);
    }

    // Update submission courseIds and assignmentIds with actual IDs
    const submissionsWithRealIds = sampleSubmissions.map((submission, index) => ({
      ...submission,
      courseId: courseRefs[index % courseRefs.length],
      assignmentId: assignmentRefs[index % assignmentRefs.length]
    }));

    // Add sample submissions
    console.log('Adding sample submissions...');
    for (const submission of submissionsWithRealIds) {
      const docRef = await addDoc(collection(db, 'submissions'), submission);
      console.log(`Added submission for assignment: ${submission.assignmentId} with ID: ${docRef.id}`);
    }

    // Update announcement courseIds with actual course IDs
    const announcementsWithRealIds = sampleAnnouncements.map((announcement, index) => ({
      ...announcement,
      courseId: courseRefs[index % courseRefs.length]
    }));

    // Add sample announcements
    console.log('Adding sample announcements...');
    for (const announcement of announcementsWithRealIds) {
      const docRef = await addDoc(collection(db, 'announcements'), announcement);
      console.log(`Added announcement: ${announcement.title} with ID: ${docRef.id}`);
    }

    // Update course material courseIds with actual course IDs
    const materialsWithRealIds = sampleCourseMaterials.map((material, index) => ({
      ...material,
      courseId: courseRefs[index % courseRefs.length]
    }));

    // Add sample course materials
    console.log('Adding sample course materials...');
    for (const material of materialsWithRealIds) {
      const docRef = await addDoc(collection(db, 'courseMaterials'), material);
      console.log(`Added material: ${material.title} with ID: ${docRef.id}`);
    }

    // Update enrollment courseIds with actual course IDs
    const enrollmentsWithRealIds = sampleEnrollments.map((enrollment, index) => ({
      ...enrollment,
      courseId: courseRefs[index % courseRefs.length]
    }));

    // Add sample enrollments
    console.log('Adding sample enrollments...');
    for (const enrollment of enrollmentsWithRealIds) {
      const docRef = await addDoc(collection(db, 'enrollments'), enrollment);
      console.log(`Added enrollment for course: ${enrollment.courseId} with ID: ${docRef.id}`);
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seeding function if this file is executed directly
if (typeof window === 'undefined') {
  seedDatabase();
}