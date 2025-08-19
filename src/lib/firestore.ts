/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp,
  writeBatch,
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

// Types for Firestore documents
export interface FirestoreUser {
  uid?: string; // Optional for backward compatibility
  id?: string;  // Document ID
  displayName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreCourse {

  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  maxStudents: number;
  syllabus: string;
  isActive: boolean;
  instructor: string;
  instructorName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export interface FirestoreEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  status: 'active' | 'completed';
  progress: number;
  completedLessons: string[];
  enrolledAt: Timestamp;
  lastAccessedAt: Timestamp;
}

export interface FirestoreSubmission {

  id: string;
  courseId: string;
  assignmentId: string;
  studentId: string;
  submittedAt: Timestamp;
  status: 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
}

export interface FirestoreAssignment {

  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  maxPoints: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreSupportTicket {

  id: string;
  userId?: string;
  name: string;
  email: string;
  subject: string;
  message: string;

  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: Timestamp;
}

export interface FirestoreBlog {

  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  likes: number;
}

export interface FirestoreAnnouncement {

  id: string;
  courseId?: string;
  title: string;
  body: string;
  authorId: string;
  createdAt: Timestamp;
}

export interface FirestoreEvent {

  id: string;
  title: string;
  date: Timestamp;
  description: string;
  createdBy: string;
}

export interface FirestoreForumThread {

  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  lastActivityAt: Timestamp;
}

export interface FirestoreForumPost {

  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
}


// Collection references
const collections = {
  users: () => collection(db, 'users'),
  courses: () => collection(db, 'courses'),
  enrollments: () => collection(db, 'enrollments'),
  submissions: () => collection(db, 'submissions'),
  supportTickets: () => collection(db, 'support_tickets'),
  blogs: () => collection(db, 'blogs'),
  announcements: () => collection(db, 'announcements'),
  assignments: () => collection(db, 'assignments'),
  events: () => collection(db, 'events'),
  forumThreads: () => collection(db, 'forum_threads'),
  forumPosts: (threadId: string) => collection(db, `forum_threads/${threadId}/posts`),
};

// User operations
export const userService = {
  async getUsers(limitCount = 10): Promise<FirestoreUser[]> {
    const q = query(
      collections.users(),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreUser));
  },

  async getUserById(uid: string): Promise<FirestoreUser | null> {
    // Look for user document where uid field matches the Firebase Auth UID
    const q = query(
      collections.users(),
      where('uid', '==', uid),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.docs.length > 0) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FirestoreUser;
    }
    return null;
  },

  async getUserByEmail(email: string): Promise<FirestoreUser | null> {
    const q = query(
      collections.users(),
      where('email', '==', email),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.docs.length > 0) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FirestoreUser;
    }
    return null;
  },


  async createUser(userData: Omit<FirestoreUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.users(), {
      ...userData,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async updateUser(uid: string, updates: Partial<FirestoreUser>): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },
};

// Course operations
export const courseService = {
  async getCourses(limitCount = 10): Promise<FirestoreCourse[]> {
    const q = query(
      collections.courses(),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreCourse));
  },

  async getPendingCourses(limitCount = 10): Promise<FirestoreCourse[]> {
  const q = query(
    collections.courses(),
    where('isActive', '==', false),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreCourse));
},

  async getCourseById(courseId: string): Promise<FirestoreCourse | null> {
    const docRef = doc(db, 'courses', courseId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FirestoreCourse;
    }
    return null;
  },


  async getCoursesByInstructor(instructorId: string): Promise<FirestoreCourse[]> {
    const q = query(
      collections.courses(),
      where('instructor', '==', instructorId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreCourse));
  },

  async getCoursesByTitle(title: string): Promise<FirestoreCourse | null> {
    const q = query(
      collections.courses(),
      where('title', '==', title),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.docs.length > 0) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FirestoreCourse;
    }
    return null;
  },

  async createCourse(courseData: Omit<FirestoreCourse, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.courses(), {
      ...courseData,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async updateCourse(courseId: string, updates: Partial<FirestoreCourse>): Promise<void> {
    const docRef = doc(db, 'courses', courseId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },
  
  async deleteCourse(courseId: string): Promise<void> {
    const docRef = doc(db, 'courses', courseId);
    await deleteDoc(docRef);
  },
};

// Enrollment operations
export const enrollmentService = {

  async getEnrollmentsByStudent(studentId: string): Promise<(FirestoreEnrollment & { course?: FirestoreCourse })[]> {
    const q = query(
      collections.enrollments(),
      where('studentId', '==', studentId),
      orderBy('enrolledAt', 'desc')
    );
    const snapshot = await getDocs(q);

    const enrollments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreEnrollment));
    
    // Fetch course data for each enrollment
    const enrollmentsWithCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        try {
          console.log(enrollment);
          const course = await courseService.getCourseById(enrollment.courseId);
          return Object.assign({}, enrollment, { course });
        } catch (error) {
          console.error(`Failed to fetch course ${enrollment.courseId}:`, error);
          return { ...(enrollment as any), course: undefined };
        }
      })
    );

    return enrollmentsWithCourses;
  },

  async getEnrollmentsByCourse(courseId: string): Promise<FirestoreEnrollment[]> {
    const q = query(

      collections.enrollments(),
      where('courseId', '==', courseId),
      orderBy('enrolledAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreEnrollment));
  },

  async createEnrollment(enrollmentData: Omit<FirestoreEnrollment, 'id' | 'enrolledAt' | 'lastAccessedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.enrollments(), {
      ...enrollmentData,
      enrolledAt: now,
      lastAccessedAt: now,
    });
    return docRef.id;
  },

  async getAllEnrollments(): Promise<(FirestoreEnrollment & { course?: FirestoreCourse })[]> {
    const q = query(
      collections.enrollments(),
      orderBy('enrolledAt', 'desc')
    );
    const snapshot = await getDocs(q);

    const enrollments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreEnrollment));
    
    // Fetch course data for each enrollment
    const enrollmentsWithCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        try {
          console.log(enrollment);
          const course = await courseService.getCourseById(enrollment.courseId);
          return Object.assign({}, enrollment, { course });
        } catch (error) {
          console.error(`Failed to fetch course ${enrollment.courseId}:`, error);
          return { ...(enrollment as any), course: undefined };
        }
      })
    );

    return enrollmentsWithCourses;
  },

  async updateEnrollmentProgress(enrollmentId: string, progress: number, completedLessons: string[]): Promise<void> {
    const docRef = doc(db, 'enrollments', enrollmentId);
    await updateDoc(docRef, {
      progress,
      completedLessons,
      lastAccessedAt: Timestamp.now(),
    });
  },
};

// Submission operations
export const submissionService = {
  async getSubmissionsByStudent(studentId: string): Promise<FirestoreSubmission[]> {
    const q = query(
      collections.submissions(),
      where('studentId', '==', studentId),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreSubmission));
  },

  async getSubmissionsByAssignment(assignmentId: string): Promise<FirestoreSubmission[]> {
    const q = query(

      collections.submissions(),
      where('assignmentId', '==', assignmentId),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreSubmission));
  },

  async getSubmissionsByCourse(courseId: string): Promise<FirestoreSubmission[]> {
    const q = query(
      collections.submissions(),
      where('courseId', '==', courseId),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreSubmission));
  },

  async createSubmission(submissionData: Omit<FirestoreSubmission, 'id' | 'submittedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.submissions(), {
      ...submissionData,
      submittedAt: now,
    });
    return docRef.id;
  },

  async gradeSubmission(submissionId: string, grade: number, feedback: string): Promise<void> {
    const docRef = doc(db, 'submissions', submissionId);
    await updateDoc(docRef, {
      grade,
      feedback,
      status: 'graded',
    });
  },
};

// Support ticket operations
export const supportTicketService = {

  async createTicket(ticketData: Omit<FirestoreSupportTicket, 'id' | 'createdAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.supportTickets(), {
      ...ticketData,
      status: 'open',
      createdAt: now,
    });
    return docRef.id;
  },

  async getTicketsByUser(userId: string): Promise<FirestoreSupportTicket[]> {
    const q = query(

      collections.supportTickets(),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreSupportTicket));
  },

  async deleteTicket(ticketId: string): Promise<void> {
  const docRef = doc(db, 'support_tickets', ticketId);
  await deleteDoc(docRef);
},

  async updateTicketStatus(ticketId: string, status: FirestoreSupportTicket['status']): Promise<void> {
    const docRef = doc(db, 'support_tickets', ticketId);
    await updateDoc(docRef, { status });
  },

  async getAllTickets(): Promise<FirestoreSupportTicket[]> {
    const q = query(
      collections.supportTickets(),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreSupportTicket));
  },
};

// Blog operations
export const blogService = {

  async getBlogPosts(limitCount = 10): Promise<FirestoreBlog[]> {
    const q = query(
      collections.blogs(),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreBlog));
  },

  async createBlogPost(blogData: Omit<FirestoreBlog, 'id' | 'createdAt' | 'likes'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.blogs(), {
      ...blogData,
      likes: 0,
      createdAt: now,
    });
    return docRef.id;
  },

  async likeBlogPost(blogId: string): Promise<void> {
    const docRef = doc(db, 'blogs', blogId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentLikes = docSnap.data().likes || 0;
      await updateDoc(docRef, { likes: currentLikes + 1 });
    }
  },
};

// Announcement operations
export const announcementService = {
  async getAnnouncements(courseId?: string, limitCount = 10): Promise<FirestoreAnnouncement[]> {
    let q;
    if (courseId) {
      q = query(
        collections.announcements(),
        where('courseId', '==', courseId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collections.announcements(),
        where('courseId', '==', null),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreAnnouncement));
  },

  async getAllAnnouncements(limitCount = 20): Promise<FirestoreAnnouncement[]> {
    const q = query(
      collections.announcements(),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreAnnouncement));
  },

  async createAnnouncement(announcementData: Omit<FirestoreAnnouncement, 'id' | 'createdAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.announcements(), {
      ...announcementData,
      createdAt: now,
    });
    return docRef.id;
  },
};

// Assignment operations
export const assignmentService = {
  async createAssignment(assignmentData: Omit<FirestoreAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.assignments(), {
      ...assignmentData,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async getAssignmentsByCourse(courseId: string, limitCount = 50): Promise<FirestoreAssignment[]> {
    const q = query(
      collections.assignments(),
      where('courseId', '==', courseId),
      orderBy('dueDate', 'asc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreAssignment));
  },
};

// Event operations
export const eventService = {
  async getEvents(limitCount = 10): Promise<FirestoreEvent[]> {
    const q = query(
      collections.events(),
      orderBy('date', 'asc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreEvent));
  },

  async createEvent(eventData: Omit<FirestoreEvent, 'id'>): Promise<string> {
    const docRef = await addDoc(collections.events(), eventData);
    return docRef.id;
  },
    async updateEvent(eventId: string, updates: Partial<FirestoreEvent>): Promise<void> {
    const docRef = doc(db, 'events', eventId);
    await updateDoc(docRef, updates as any);
  },

  async deleteEvent(eventId: string): Promise<void> {
    const docRef = doc(db, 'events', eventId);
    await deleteDoc(docRef);
  },
};

// Forum operations
export const forumService = {

  async getForumThreads(limitCount = 10): Promise<FirestoreForumThread[]> {
    const q = query(
      collections.forumThreads(),
      orderBy('lastActivityAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreForumThread));
  },

  async createForumThread(threadData: Omit<FirestoreForumThread, 'id' | 'createdAt' | 'lastActivityAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.forumThreads(), {
      ...threadData,
      createdAt: now,
      lastActivityAt: now,
    });
    return docRef.id;
  },

  async getForumPosts(threadId: string, limitCount = 10): Promise<FirestoreForumPost[]> {
    const q = query(
      collections.forumPosts(threadId),
      orderBy('createdAt', 'asc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreForumPost));
  },

  async createForumPost(threadId: string, postData: Omit<FirestoreForumPost, 'id' | 'createdAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.forumPosts(threadId), {
      ...postData,
      createdAt: now,
    });
    
    // Update thread's lastActivityAt
    const threadRef = doc(db, 'forum_threads', threadId);
    await updateDoc(threadRef, { lastActivityAt: now });
    
    return docRef.id;
  },
};

// Analytics and statistics
export const analyticsService = {

  async getAdminStats() {
    const [usersSnapshot, coursesSnapshot, enrollmentsSnapshot] = await Promise.all([
      getDocs(collections.users()),
      getDocs(collections.courses()),
      getDocs(collections.enrollments()),
    ]);

    const totalUsers = usersSnapshot.size;
    const totalStudents = usersSnapshot.docs.filter(doc => doc.data().role === 'student').length;
    const activeCourses = coursesSnapshot.docs.filter(doc => doc.data().isActive).length;

    
    // Calculate completion rate from enrollments
    const totalEnrollments = enrollmentsSnapshot.size;
    const completedEnrollments = enrollmentsSnapshot.docs.filter(doc => doc.data().status === 'completed').length;
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    return {
      totalUsers,
      totalStudents,
      activeCourses,

      completionRate,
      systemHealth: 99.9, // Placeholder
    };
  },

  async getTeacherStats(teacherId: string) {
    const [coursesSnapshot, enrollmentsSnapshot] = await Promise.all([

      getDocs(query(collections.courses(), where('instructor', '==', teacherId))),
      getDocs(collections.enrollments()),
    ]);

    const myCourses = coursesSnapshot.size;
    const totalStudents = enrollmentsSnapshot.docs.filter(doc => 
      coursesSnapshot.docs.some(course => course.id === doc.data().courseId)
    ).length;

    // Calculate pending reviews (submissions that need grading)
    const submissionsSnapshot = await getDocs(
      query(collections.submissions(), where('status', '==', 'submitted'))
    );
    const pendingReviews = submissionsSnapshot.docs.filter(doc => 
      coursesSnapshot.docs.some(course => course.id === doc.data().courseId)
    ).length;

    return {
      activeCourses: myCourses,
      totalStudents,
      pendingReviews,
      avgRating: 4.8, // Placeholder
    };
  },

  async getStudentStats(studentId: string) {
    const [enrollmentsSnapshot, submissionsSnapshot] = await Promise.all([

      getDocs(query(collections.enrollments(), where('studentId', '==', studentId))),
      getDocs(query(collections.submissions(), where('studentId', '==', studentId))),
    ]);

    const enrolledCourses = enrollmentsSnapshot.size;
    const pendingAssignments = submissionsSnapshot.docs.filter(doc => doc.data().status === 'submitted').length;
    
    // Calculate average progress
    const progressSum = enrollmentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().progress || 0), 0);
    const averageProgress = enrolledCourses > 0 ? Math.round(progressSum / enrolledCourses) : 0;

    return {
      enrolledCourses,
      averageProgress,
      pendingAssignments,
      certificates: 2, // Placeholder
    };
  },
};

// Real-time listeners
export const realtimeService = {
  onUsersChange(callback: (snapshot: QuerySnapshot<DocumentData>) => void) {
    return onSnapshot(collections.users(), callback);
  },

  onCoursesChange(callback: (snapshot: QuerySnapshot<DocumentData>) => void) {
    return onSnapshot(collections.courses(), callback);
  },

  onEnrollmentsChange(callback: (snapshot: QuerySnapshot<DocumentData>) => void) {
    return onSnapshot(collections.enrollments(), callback);
  },

  onSubmissionsChange(callback: (snapshot: QuerySnapshot<DocumentData>) => void) {
    return onSnapshot(collections.submissions(), callback);
  },
};

export default {
  userService,
  courseService,
  enrollmentService,
  submissionService,
  supportTicketService,
  blogService,
  announcementService,
  assignmentService,
  eventService,
  forumService,
  analyticsService,
  realtimeService,
};