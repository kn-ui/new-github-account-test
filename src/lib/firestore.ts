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
  uid: string;
  displayName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreCourse {
  id?: string;
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

export interface FirestoreLesson {
  id?: string;
  order: number;
  title: string;
  content: string;
  duration: number;
  createdAt: Timestamp;
}

export interface FirestoreAssignment {
  id?: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  maxPoints: number;
  createdAt: Timestamp;
}

export interface FirestoreEnrollment {
  id?: string;
  courseId: string;
  studentId: string;
  status: 'active' | 'completed';
  progress: number;
  completedLessons: string[];
  enrolledAt: Timestamp;
  lastAccessedAt: Timestamp;
}

export interface FirestoreSubmission {
  id?: string;
  courseId: string;
  assignmentId: string;
  studentId: string;
  submittedAt: Timestamp;
  status: 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
}

export interface FirestoreSupportTicket {
  id?: string;
  userId?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Timestamp;
}

export interface FirestoreBlog {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  likes: number;
}

export interface FirestoreAnnouncement {
  id?: string;
  courseId?: string;
  title: string;
  body: string;
  authorId: string;
  createdAt: Timestamp;
}

export interface FirestoreEvent {
  id?: string;
  title: string;
  date: Timestamp;
  description: string;
  createdBy: string;
}

export interface FirestoreForumThread {
  id?: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  lastActivityAt: Timestamp;
}

export interface FirestoreForumPost {
  id?: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
}

// Utility functions
const timestampToDate = (timestamp: Timestamp) => timestamp.toDate();
const dateToTimestamp = (date: Date) => Timestamp.fromDate(date);

// User operations
export const userService = {
  async createUser(userData: Omit<FirestoreUser, 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const userRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: now,
      updatedAt: now
    });
    return userRef.id;
  },

  async getUserById(uid: string): Promise<FirestoreUser | null> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as FirestoreUser;
    }
    return null;
  },

  async updateUser(uid: string, updates: Partial<FirestoreUser>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  },

  async getUsers(limitCount: number = 50): Promise<FirestoreUser[]> {
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreUser);
  },

  async getUsersByRole(role: string): Promise<FirestoreUser[]> {
    const q = query(
      collection(db, 'users'),
      where('role', '==', role),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreUser);
  }
};

// Course operations
export const courseService = {
  async createCourse(courseData: Omit<FirestoreCourse, 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const courseRef = await addDoc(collection(db, 'courses'), {
      ...courseData,
      createdAt: now,
      updatedAt: now
    });
    return courseRef.id;
  },

  async getCourseById(courseId: string): Promise<FirestoreCourse | null> {
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    if (courseDoc.exists()) {
      return { id: courseDoc.id, ...courseDoc.data() } as FirestoreCourse;
    }
    return null;
  },

  async getCourses(limitCount: number = 50): Promise<FirestoreCourse[]> {
    const q = query(
      collection(db, 'courses'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreCourse);
  },

  async getCoursesByInstructor(instructorId: string): Promise<FirestoreCourse[]> {
    const q = query(
      collection(db, 'courses'),
      where('instructor', '==', instructorId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreCourse);
  },

  async updateCourse(courseId: string, updates: Partial<FirestoreCourse>): Promise<void> {
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  },

  async deleteCourse(courseId: string): Promise<void> {
    await deleteDoc(doc(db, 'courses', courseId));
  }
};

// Enrollment operations
export const enrollmentService = {
  async createEnrollment(enrollmentData: Omit<FirestoreEnrollment, 'enrolledAt' | 'lastAccessedAt'>): Promise<string> {
    const now = Timestamp.now();
    const enrollmentRef = await addDoc(collection(db, 'enrollments'), {
      ...enrollmentData,
      enrolledAt: now,
      lastAccessedAt: now
    });
    return enrollmentRef.id;
  },

  async getEnrollmentsByStudent(studentId: string): Promise<FirestoreEnrollment[]> {
    const q = query(
      collection(db, 'enrollments'),
      where('studentId', '==', studentId),
      orderBy('enrolledAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreEnrollment);
  },

  async getEnrollmentsByCourse(courseId: string): Promise<FirestoreEnrollment[]> {
    const q = query(
      collection(db, 'enrollments'),
      where('courseId', '==', courseId),
      orderBy('enrolledAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreEnrollment);
  },

  async updateEnrollment(enrollmentId: string, updates: Partial<FirestoreEnrollment>): Promise<void> {
    const enrollmentRef = doc(db, 'enrollments', enrollmentId);
    await updateDoc(enrollmentRef, {
      ...updates,
      lastAccessedAt: Timestamp.now()
    });
  }
};

// Assignment and submission operations
export const assignmentService = {
  async createAssignment(courseId: string, assignmentData: Omit<FirestoreAssignment, 'createdAt'>): Promise<string> {
    const now = Timestamp.now();
    const assignmentRef = await addDoc(collection(db, `courses/${courseId}/assignments`), {
      ...assignmentData,
      createdAt: now
    });
    return assignmentRef.id;
  },

  async getAssignmentsByCourse(courseId: string): Promise<FirestoreAssignment[]> {
    const q = query(
      collection(db, `courses/${courseId}/assignments`),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreAssignment);
  }
};

export const submissionService = {
  async createSubmission(submissionData: Omit<FirestoreSubmission, 'submittedAt'>): Promise<string> {
    const now = Timestamp.now();
    const submissionRef = await addDoc(collection(db, 'submissions'), {
      ...submissionData,
      submittedAt: now
    });
    return submissionRef.id;
  },

  async getSubmissionsByStudent(studentId: string): Promise<FirestoreSubmission[]> {
    const q = query(
      collection(db, 'submissions'),
      where('studentId', '==', studentId),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreSubmission);
  },

  async getSubmissionsByAssignment(assignmentId: string): Promise<FirestoreSubmission[]> {
    const q = query(
      collection(db, 'submissions'),
      where('assignmentId', '==', assignmentId),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreSubmission);
  },

  async updateSubmission(submissionId: string, updates: Partial<FirestoreSubmission>): Promise<void> {
    const submissionRef = doc(db, 'submissions', submissionId);
    await updateDoc(submissionRef, updates);
  }
};

// Support ticket operations
export const supportTicketService = {
  async createTicket(ticketData: Omit<FirestoreSupportTicket, 'createdAt'>): Promise<string> {
    const now = Timestamp.now();
    const ticketRef = await addDoc(collection(db, 'support_tickets'), {
      ...ticketData,
      createdAt: now
    });
    return ticketRef.id;
  },

  async getTicketsByUser(userId: string): Promise<FirestoreSupportTicket[]> {
    const q = query(
      collection(db, 'support_tickets'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreSupportTicket);
  },

  async getAllTickets(): Promise<FirestoreSupportTicket[]> {
    const q = query(
      collection(db, 'support_tickets'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreSupportTicket);
  }
};

// Blog operations
export const blogService = {
  async createBlogPost(blogData: Omit<FirestoreBlog, 'createdAt'>): Promise<string> {
    const now = Timestamp.now();
    const blogRef = await addDoc(collection(db, 'blogs'), {
      ...blogData,
      createdAt: now
    });
    return blogRef.id;
  },

  async getBlogPosts(limitCount: number = 50): Promise<FirestoreBlog[]> {
    const q = query(
      collection(db, 'blogs'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreBlog);
  },

  async updateBlogLikes(blogId: string, newLikeCount: number): Promise<void> {
    const blogRef = doc(db, 'blogs', blogId);
    await updateDoc(blogRef, { likes: newLikeCount });
  }
};

// Announcement operations
export const announcementService = {
  async createAnnouncement(announcementData: Omit<FirestoreAnnouncement, 'createdAt'>): Promise<string> {
    const now = Timestamp.now();
    const announcementRef = await addDoc(collection(db, 'announcements'), {
      ...announcementData,
      createdAt: now
    });
    return announcementRef.id;
  },

  async getAnnouncements(courseId?: string): Promise<FirestoreAnnouncement[]> {
    let q;
    if (courseId) {
      q = query(
        collection(db, 'announcements'),
        where('courseId', '==', courseId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc')
      );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreAnnouncement);
  }
};

// Event operations
export const eventService = {
  async createEvent(eventData: Omit<FirestoreEvent, 'createdAt'>): Promise<string> {
    const now = Timestamp.now();
    const eventRef = await addDoc(collection(db, 'events'), {
      ...eventData,
      createdAt: now
    });
    return eventRef.id;
  },

  async getEvents(): Promise<FirestoreEvent[]> {
    const q = query(
      collection(db, 'events'),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreEvent);
  }
};

// Forum operations
export const forumService = {
  async createThread(threadData: Omit<FirestoreForumThread, 'createdAt' | 'lastActivityAt'>): Promise<string> {
    const now = Timestamp.now();
    const threadRef = await addDoc(collection(db, 'forum_threads'), {
      ...threadData,
      createdAt: now,
      lastActivityAt: now
    });
    return threadRef.id;
  },

  async getThreads(): Promise<FirestoreForumThread[]> {
    const q = query(
      collection(db, 'forum_threads'),
      orderBy('lastActivityAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreForumThread);
  },

  async createPost(threadId: string, postData: Omit<FirestoreForumPost, 'createdAt'>): Promise<string> {
    const now = Timestamp.now();
    const postRef = await addDoc(collection(db, `forum_threads/${threadId}/posts`), {
      ...postData,
      createdAt: now
    });

    // Update thread's lastActivityAt
    const threadRef = doc(db, 'forum_threads', threadId);
    await updateDoc(threadRef, { lastActivityAt: now });

    return postRef.id;
  },

  async getPosts(threadId: string): Promise<FirestoreForumPost[]> {
    const q = query(
      collection(db, `forum_threads/${threadId}/posts`),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirestoreForumPost);
  }
};

// Analytics and statistics
export const analyticsService = {
  async getSystemStats() {
    const [usersSnapshot, coursesSnapshot, enrollmentsSnapshot] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'enrollments'))
    ]);

    const totalUsers = usersSnapshot.size;
    const totalStudents = usersSnapshot.docs.filter(doc => doc.data().role === 'student').length;
    const activeCourses = coursesSnapshot.docs.filter(doc => doc.data().isActive).length;
    const totalEnrollments = enrollmentsSnapshot.size;

    // Calculate completion rate (simplified)
    const completedEnrollments = enrollmentsSnapshot.docs.filter(doc => doc.data().status === 'completed').length;
    const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

    return {
      totalUsers,
      totalStudents,
      activeCourses,
      totalEnrollments,
      completionRate: Math.round(completionRate)
    };
  },

  async getTeacherStats(teacherId: string) {
    const [coursesSnapshot, enrollmentsSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'courses'), where('instructor', '==', teacherId))),
      getDocs(collection(db, 'enrollments'))
    ]);

    const myCourses = coursesSnapshot.docs.filter(doc => doc.data().isActive);
    const totalStudents = enrollmentsSnapshot.docs.filter(doc => 
      myCourses.some(course => course.id === doc.data().courseId)
    ).length;

    // Calculate average rating (placeholder)
    const averageRating = 4.5;

    return {
      activeCourses: myCourses.length,
      totalStudents,
      averageRating
    };
  },

  async getStudentStats(studentId: string) {
    const [enrollmentsSnapshot, submissionsSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'enrollments'), where('studentId', '==', studentId))),
      getDocs(query(collection(db, 'submissions'), where('studentId', '==', studentId)))
    ]);

    const enrolledCourses = enrollmentsSnapshot.docs.length;
    const totalProgress = enrollmentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().progress || 0), 0);
    const averageProgress = enrolledCourses > 0 ? totalProgress / enrolledCourses : 0;
    const pendingAssignments = submissionsSnapshot.docs.filter(doc => doc.data().status === 'submitted').length;

    return {
      enrolledCourses,
      averageProgress: Math.round(averageProgress),
      pendingAssignments
    };
  }
};

// Real-time listeners
export const createRealtimeListener = <T>(
  collectionPath: string,
  callback: (data: T[]) => void,
  queryConstraints: any[] = []
) => {
  const q = query(collection(db, collectionPath), ...queryConstraints);
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
    callback(data);
  });
};