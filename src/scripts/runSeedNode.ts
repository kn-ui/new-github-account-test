import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  Timestamp,
  connectFirestoreEmulator
} from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBtIY1wVdePkWCJ84bSr7alOMcI2aihVqw",
  authDomain: "school-management-system-67b85.firebaseapp.com",
  projectId: "school-management-system-67b85",
  storageBucket: "school-management-system-67b85.appspot.com",
  messagingSenderId: "103441012203195276037",
  appId: "1:103441012203195276037:web:abc123def456ghi789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data for seeding with real IDs
const sampleAssignments = [
  {
    title: "Introduction to React",
    description: "Create a simple React component with props and state management",
    courseId: "848emeF22B0qN1TnYZMg",
    teacherId: "7E4dj9z3tzgKtRwURyfR11dz0YG3",
    dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
    maxScore: 100,
    instructions: "Build a functional React component that displays user information",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: "JavaScript Fundamentals",
    description: "Complete exercises on JavaScript ES6 features",
    courseId: "848emeF22B0qN1TnYZMg",
    teacherId: "7E4dj9z3tzgKtRwURyfR11dz0YG3",
    dueDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 14 days from now
    maxScore: 100,
    instructions: "Implement arrow functions, destructuring, and async/await",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: "Database Design",
    description: "Design a normalized database schema for an e-commerce system",
    courseId: "course-001",
    teacherId: "HNSFVjZzngUyJvcrn7N8nrcCHNM2",
    dueDate: Timestamp.fromDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)), // 10 days from now
    maxScore: 100,
    instructions: "Create ERD diagrams and explain normalization process",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: "Advanced React Patterns",
    description: "Implement advanced React patterns including HOCs and Render Props",
    courseId: "course-002",
    teacherId: "VVz08cRZMedJsACARMvU4ApCH821",
    dueDate: Timestamp.fromDate(new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)), // 12 days from now
    maxScore: 100,
    instructions: "Create a Higher-Order Component and implement Render Props pattern",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: "SQL Queries and Optimization",
    description: "Write complex SQL queries and optimize database performance",
    courseId: "course-003",
    teacherId: "HNSFVjZzngUyJvcrn7N8nrcCHNM2",
    dueDate: Timestamp.fromDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)), // 15 days from now
    maxScore: 100,
    instructions: "Write optimized SQL queries for complex data retrieval",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
];

const sampleSubmissions = [
  {
    courseId: "848emeF22B0qN1TnYZMg",
    assignmentId: "assign1",
    studentId: "Bu4LUIMp9scCoMPqp31ZR7CG1y02",
    submittedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
    status: "submitted",
    content: "Here is my React component implementation...",
    maxScore: 100
  },
  {
    courseId: "848emeF22B0qN1TnYZMg",
    assignmentId: "assign1",
    studentId: "HhrOtnxV7BfZhkrUqJJ0009tKZD3",
    submittedAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
    status: "graded",
    grade: 85,
    feedback: "Good implementation! Consider adding error handling.",
    content: "My React component with error handling...",
    maxScore: 100
  },
  {
    courseId: "course-001",
    assignmentId: "assign3",
    studentId: "N5DSrzHPDu00J4XM3MZmdWYf1gZ2",
    submittedAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
    status: "submitted",
    content: "Database schema design document...",
    maxScore: 100
  },
  {
    courseId: "course-002",
    assignmentId: "assign4",
    studentId: "mQtPrxzkIAT7hNf4cGf880DnsAE3",
    submittedAt: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)), // 4 days ago
    status: "graded",
    grade: 92,
    feedback: "Excellent work! Great use of advanced React patterns.",
    content: "My HOC implementation with render props...",
    maxScore: 100
  },
  {
    courseId: "course-003",
    assignmentId: "assign5",
    studentId: "Bu4LUIMp9scCoMPqp31ZR7CG1y02",
    submittedAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
    status: "submitted",
    content: "SQL queries for complex data retrieval...",
    maxScore: 100
  }
];

const sampleAnnouncements = [
  {
    title: "Welcome to React Development Course",
    content: "Welcome everyone! This course will cover React fundamentals and advanced concepts. Please review the syllabus and prepare for our first assignment.",
    courseId: "848emeF22B0qN1TnYZMg",
    authorId: "7E4dj9z3tzgKtRwURyfR11dz0YG3",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)) // 5 days ago
  },
  {
    title: "Assignment Due Date Extended",
    content: "Due to technical issues, the JavaScript assignment due date has been extended by 2 days. Please use this extra time to improve your submissions.",
    courseId: "848emeF22B0qN1TnYZMg",
    authorId: "7E4dj9z3tzgKtRwURyfR11dz0YG3",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) // 2 days ago
  },
  {
    title: "Database Design Guidelines",
    content: "Please review the database design guidelines before submitting your assignment. Focus on normalization and proper relationships.",
    courseId: "course-001",
    authorId: "HNSFVjZzngUyJvcrn7N8nrcCHNM2",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)) // 1 day ago
  },
  {
    title: "Advanced React Patterns Workshop",
    content: "Join us for a hands-on workshop on advanced React patterns this Friday. We'll cover HOCs, Render Props, and Custom Hooks.",
    courseId: "course-002",
    authorId: "VVz08cRZMedJsACARMvU4ApCH821",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) // 3 days ago
  },
  {
    title: "SQL Performance Optimization Tips",
    content: "Here are some key tips for optimizing your SQL queries: use indexes properly, avoid SELECT *, and optimize JOIN operations.",
    courseId: "course-003",
    authorId: "HNSFVjZzngUyJvcrn7N8nrcCHNM2",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)) // 4 days ago
  }
];

const sampleCourseMaterials = [
  {
    title: "React Documentation",
    type: "link",
    content: "Official React documentation for reference",
    url: "https://reactjs.org/docs/getting-started.html",
    courseId: "848emeF22B0qN1TnYZMg",
    teacherId: "7E4dj9z3tzgKtRwURyfR11dz0YG3",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: "JavaScript ES6 Cheat Sheet",
    type: "document",
    content: "Comprehensive guide to JavaScript ES6 features including arrow functions, destructuring, and modules",
    courseId: "848emeF22B0qN1TnYZMg",
    teacherId: "7E4dj9z3tzgKtRwURyfR11dz0YG3",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: "Database Design Principles",
    type: "video",
    content: "Video lecture covering database normalization and design principles",
    url: "https://example.com/database-design-video",
    courseId: "course-001",
    teacherId: "HNSFVjZzngUyJvcrn7N8nrcCHNM2",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: "Advanced React Patterns Guide",
    type: "document",
    content: "Comprehensive guide to advanced React patterns including HOCs, Render Props, and Custom Hooks",
    courseId: "course-002",
    teacherId: "VVz08cRZMedJsACARMvU4ApCH821",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: "SQL Optimization Tutorial",
    type: "video",
    content: "Video tutorial on SQL query optimization and performance tuning",
    url: "https://example.com/sql-optimization-video",
    courseId: "course-003",
    teacherId: "HNSFVjZzngUyJvcrn7N8nrcCHNM2",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
];

const sampleCourses = [
  {
    title: "React Development Fundamentals",
    description: "Learn React from the ground up with hands-on projects and real-world examples. This course covers components, state management, hooks, and modern React patterns.",
    instructor: "7E4dj9z3tzgKtRwURyfR11dz0YG3",
    category: "Web Development",
    duration: 40,
    isActive: true,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // 30 days ago
    updatedAt: Timestamp.now()
  },
  {
    title: "Database Design and Management",
    description: "Master database design principles, normalization, and SQL queries. Learn to design efficient database schemas for real-world applications.",
    instructor: "HNSFVjZzngUyJvcrn7N8nrcCHNM2",
    category: "Database",
    duration: 35,
    isActive: true,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)), // 25 days ago
    updatedAt: Timestamp.now()
  },
  {
    title: "Advanced React Patterns",
    description: "Deep dive into advanced React patterns including Higher-Order Components, Render Props, Custom Hooks, and Context API.",
    instructor: "VVz08cRZMedJsACARMvU4ApCH821",
    category: "Web Development",
    duration: 30,
    isActive: true,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)), // 20 days ago
    updatedAt: Timestamp.now()
  },
  {
    title: "SQL Performance Optimization",
    description: "Learn advanced SQL techniques for query optimization, indexing strategies, and database performance tuning.",
    instructor: "HNSFVjZzngUyJvcrn7N8nrcCHNM2",
    category: "Database",
    duration: 25,
    isActive: true,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)), // 15 days ago
    updatedAt: Timestamp.now()
  }
];

const sampleEnrollments = [
  {
    courseId: "848emeF22B0qN1TnYZMg",
    studentId: "Bu4LUIMp9scCoMPqp31ZR7CG1y02",
    status: "active",
    progress: 75,
    completedLessons: ["lesson1", "lesson2", "lesson3", "lesson4"],
    enrolledAt: Timestamp.fromDate(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)), // 20 days ago
    lastAccessedAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)) // 1 day ago
  },
  {
    courseId: "848emeF22B0qN1TnYZMg",
    studentId: "HhrOtnxV7BfZhkrUqJJ0009tKZD3",
    status: "active",
    progress: 85,
    completedLessons: ["lesson1", "lesson2", "lesson3", "lesson4", "lesson5"],
    enrolledAt: Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)), // 15 days ago
    lastAccessedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) // 2 days ago
  },
  {
    courseId: "course-001",
    studentId: "N5DSrzHPDu00J4XM3MZmdWYf1gZ2",
    status: "active",
    progress: 60,
    completedLessons: ["lesson1", "lesson2", "lesson3"],
    enrolledAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
    lastAccessedAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) // 3 days ago
  },
  {
    courseId: "course-002",
    studentId: "mQtPrxzkIAT7hNf4cGf880DnsAE3",
    status: "active",
    progress: 70,
    completedLessons: ["lesson1", "lesson2", "lesson3", "lesson4"],
    enrolledAt: Timestamp.fromDate(new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)), // 12 days ago
    lastAccessedAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)) // 1 day ago
  },
  {
    courseId: "course-003",
    studentId: "Bu4LUIMp9scCoMPqp31ZR7CG1y02",
    status: "active",
    progress: 55,
    completedLessons: ["lesson1", "lesson2"],
    enrolledAt: Timestamp.fromDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)), // 8 days ago
    lastAccessedAt: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)) // 4 days ago
  }
];

async function seedDatabase() {
  try {
    console.log('Starting database seeding with real IDs...');

    // Add sample assignments (using real course and teacher IDs)
    console.log('Adding sample assignments...');
    const assignmentRefs = [];
    for (const assignment of sampleAssignments) {
      const docRef = await addDoc(collection(db, 'assignments'), assignment);
      assignmentRefs.push(docRef.id);
      console.log(`Added assignment: ${assignment.title} with ID: ${docRef.id}`);
    }

    // Add sample submissions (using real course, assignment, and student IDs)
    console.log('Adding sample submissions...');
    for (let i = 0; i < sampleSubmissions.length; i++) {
      const submission = sampleSubmissions[i];
      const assignmentId = assignmentRefs[i % assignmentRefs.length];
      const submissionWithAssignmentId = {
        ...submission,
        assignmentId: assignmentId
      };
      const docRef = await addDoc(collection(db, 'submissions'), submissionWithAssignmentId);
      console.log(`Added submission for assignment: ${assignmentId} with ID: ${docRef.id}`);
    }

    // Add sample announcements (using real course and teacher IDs)
    console.log('Adding sample announcements...');
    for (const announcement of sampleAnnouncements) {
      const docRef = await addDoc(collection(db, 'announcements'), announcement);
      console.log(`Added announcement: ${announcement.title} with ID: ${docRef.id}`);
    }

    // Add sample course materials (using real course and teacher IDs)
    console.log('Adding sample course materials...');
    for (const material of sampleCourseMaterials) {
      const docRef = await addDoc(collection(db, 'courseMaterials'), material);
      console.log(`Added material: ${material.title} with ID: ${docRef.id}`);
    }

    // Add sample enrollments (using real course and student IDs)
    console.log('Adding sample enrollments...');
    for (const enrollment of sampleEnrollments) {
      const docRef = await addDoc(collection(db, 'enrollments'), enrollment);
      console.log(`Added enrollment for course: ${enrollment.courseId} with ID: ${docRef.id}`);
    }

    console.log('Database seeding completed successfully!');
    console.log('Real IDs used:');
    console.log('- Courses: 848emeF22B0qN1TnYZMg, course-001, course-002, course-003');
    console.log('- Teachers: 7E4dj9z3tzgKtRwURyfR11dz0YG3, HNSFVjZzngUyJvcrn7N8nrcCHNM2, VVz08cRZMedJsACARMvU4ApCH821');
    console.log('- Students: Bu4LUIMp9scCoMPqp31ZR7CG1y02, HhrOtnxV7BfZhkrUqJJ0009tKZD3, N5DSrzHPDu00J4XM3MZmdWYf1gZ2, mQtPrxzkIAT7hNf4cGf880DnsAE3');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seeding
seedDatabase().then(() => {
  console.log('Seeding completed!');
  process.exit(0);
}).catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});