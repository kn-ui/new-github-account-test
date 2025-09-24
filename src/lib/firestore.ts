/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
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

export { Timestamp };

// Types for Firestore documents
export interface FirestoreUser {
  uid?: string; // Optional for backward compatibility
  id?: string;  // Document ID
  displayName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  isActive: boolean;
  passwordChanged?: boolean;
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
  maxScore?: number;
  instructions?: string;
}

// Consolidated Assignment interface
export interface FirestoreAssignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  maxScore: number;
  instructions?: string;
  teacherId: string;
  attachments?: { type: 'file' | 'link'; url: string; title?: string }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Consolidated CourseMaterial interface (was a duplicate)
export interface FirestoreCourseMaterial {
  id: string;
  courseId: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'other';
  fileUrl?: string;
  externalLink?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreExam {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  date: Timestamp; // legacy/scheduled date
  startTime?: Timestamp; // when exam becomes visible to students
  durationMinutes?: number; // how long the exam is available after start
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  startedAt: Timestamp;
  submittedAt?: Timestamp;
  status: 'in_progress' | 'submitted' | 'graded';
  // Array of answers keyed by exam question id or index
  answers: Array<{ questionId: string; response: any }>;
  // Auto grading
  autoScore?: number;
  totalAutoPoints?: number;
  // Manual grading support
  manualScore?: number;
  feedback?: string;
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

export interface FirestoreCertificate {
  id: string;
  type: 'top-performer' | 'perfect-attendance' | 'homework-hero';
  awardedAt: Timestamp;
  period: { start: Timestamp; end: Timestamp };
  details?: Record<string, any>;
}


export interface FirestoreAssignmentEditRequest {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  teacherId: string;
  submissionId?: string;
  requestedAt: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  requestedChanges?: string;
  teacherResponse?: string;
  handledAt?: Timestamp;
  dueDate: Timestamp;
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
  recipientStudentId?: string;
  title: string;
  body: string;
  authorId: string;
  createdAt: Timestamp;
  externalLink?: string;
}

export interface FirestoreEvent {
  id: string;
  title: string;
  date: Timestamp;
  description: string;
  createdBy: string;
  type: string;
  time: string;
  location: string;
  maxAttendees: number;
  currentAttendees: number;
  status: string;
}

export interface FirestoreForumThread {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  lastActivityAt: Timestamp;
  category?: string;
  likes?: number;
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
  courseMaterials: () => collection(db, 'courseMaterials'),
  exams: () => collection(db, 'exams'),
};

// User operations
export const userService = {
  async getUsers(limitCount?: number): Promise<FirestoreUser[]> {
    const q = limitCount
      ? query(
          collections.users(),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        )
      : query(collections.users(), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreUser));
  },

  async getUserById(uid: string): Promise<FirestoreUser | null> {
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

  async getUsersByIds(uids: string[]): Promise<Record<string, FirestoreUser | null>> {
    const result: Record<string, FirestoreUser | null> = {};
    const unique = Array.from(new Set(uids.filter(Boolean)));
    await Promise.all(unique.map(async (uid) => {
      try {
        const found = await this.getUserById(uid);
        result[uid] = found;
      } catch {
        result[uid] = null;
      }
    }));
    return result;
  },

  async createUser(userData: Omit<FirestoreUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    if (!userData.uid) {
      throw new Error("User data must include a uid.");
    }
    const userRef = doc(db, 'users', userData.uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: now,
      updatedAt: now,
    });
    return userData.uid;
  },

  async updateUser(uid: string, updates: Partial<FirestoreUser>): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteUser(userId: string): Promise<void> {
    const docRef = doc(db, 'users', userId);
    await deleteDoc(docRef);
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

  async getAllCourses(limitCount = 1000): Promise<FirestoreCourse[]> {
    const q = query(
      collections.courses(),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreCourse));
  },

  // Pending courses flow removed

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

  async deleteEnrollment(enrollmentId: string): Promise<void> {
    const docRef = doc(db, 'enrollments', enrollmentId);
    await deleteDoc(docRef);
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
      updatedAt: Timestamp.now(),
    });
  },

  async updateSubmission(submissionId: string, updates: Partial<FirestoreSubmission>): Promise<void> {
    const docRef = doc(db, 'submissions', submissionId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async getSubmission(submissionId: string): Promise<FirestoreSubmission | null> {
    const docRef = doc(db, 'submissions', submissionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as FirestoreSubmission;
    }
    return null;
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

  async getTickets(limitCount = 100): Promise<FirestoreSupportTicket[]> {
    const q = query(
      collections.supportTickets(),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreSupportTicket));
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

  async updateTicket(ticketId: string, updates: Partial<FirestoreSupportTicket>): Promise<void> {
    const docRef = doc(db, 'support_tickets', ticketId);
    await updateDoc(docRef, updates as any);
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
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreAnnouncement));
  },
  async getAnnouncementsForStudent(studentId: string, enrolledCourseIds: string[], limitCount = 20): Promise<FirestoreAnnouncement[]> {
    // General announcements (no course, no recipient)
    const generalQ = query(collections.announcements(), where('courseId', '==', null), orderBy('createdAt','desc'), limit(limitCount));
    const generalSnap = await getDocs(generalQ);
    const general = generalSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as FirestoreAnnouncement))
      .filter(a => !a.recipientStudentId);

    // Course announcements broadcast to course (no recipient)
    const courseAnnouncements: FirestoreAnnouncement[] = [];
    await Promise.all(enrolledCourseIds.map(async (cid) => {
      const q1 = query(collections.announcements(), where('courseId','==', cid), orderBy('createdAt','desc'), limit(limitCount));
      const snap1 = await getDocs(q1);
      courseAnnouncements.push(...snap1.docs
        .map(d => ({ id: d.id, ...d.data() } as FirestoreAnnouncement))
        .filter(a => !a.recipientStudentId)
      );
    }));

    // Direct announcements to this student (any courseId including null)
    const directQ = query(collections.announcements(), where('recipientStudentId','==', studentId), orderBy('createdAt','desc'), limit(limitCount));
    const directSnap = await getDocs(directQ);
    const direct = directSnap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreAnnouncement));

    const combined = [...general, ...courseAnnouncements, ...direct]
      .sort((a,b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
    // De-duplicate by id
    const seen = new Set<string>();
    const unique = combined.filter(a => (seen.has(a.id) ? false : (seen.add(a.id), true)));
    return unique;
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

  async getPublicGeneralAnnouncements(limitCount = 30): Promise<FirestoreAnnouncement[]> {
    // Query only by courseId == null, then filter out directs client-side to include docs
    // that may not have recipientStudentId set at all
    const q = query(
      collections.announcements(),
      where('courseId', '==', null),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as FirestoreAnnouncement))
      .filter(a => !a.recipientStudentId);
  },

  async createAnnouncement(announcementData: Omit<FirestoreAnnouncement, 'id' | 'createdAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.announcements(), {
      ...announcementData,
      createdAt: now,
    });
    return docRef.id;
  },

  async getAnnouncementsByTeacher(teacherId: string): Promise<FirestoreAnnouncement[]> {
    // Get all courses by the teacher first
    const teacherCourses = await courseService.getCoursesByInstructor(teacherId);
    const courseIds = teacherCourses.map(course => course.id);
    
    if (courseIds.length === 0) return [];
    
    // Get announcements for all teacher's courses plus general announcements by the teacher
    const courseAnnouncementsPromises = courseIds.map(courseId => 
      announcementService.getAnnouncements(courseId, 1000)
    );
    const courseAnnouncementsArrays = await Promise.all(courseAnnouncementsPromises);
    const allCourseAnnouncements = courseAnnouncementsArrays.flat();
    
    // Get general announcements by the teacher
    const generalAnnouncementsQuery = query(
      collections.announcements(),
      where('courseId', '==', null),
      where('authorId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );
    const generalSnapshot = await getDocs(generalAnnouncementsQuery);
    const generalAnnouncements = generalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreAnnouncement));
    
    // Combine and sort by creation date (newest first)
    const allAnnouncements = [...allCourseAnnouncements, ...generalAnnouncements];
    return allAnnouncements.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
  },

  async updateAnnouncement(announcementId: string, updates: Partial<FirestoreAnnouncement>): Promise<void> {
    const docRef = doc(db, 'announcements', announcementId);
    await updateDoc(docRef, updates as any);
  },

  async deleteAnnouncement(announcementId: string): Promise<void> {
    const docRef = doc(db, 'announcements', announcementId);
    await deleteDoc(docRef);
  },
};

// Consolidated Assignment operations
export const assignmentService = {
  async createAssignment(assignmentData: Omit<FirestoreAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.assignments(), {
      ...assignmentData,
      dueDate: (assignmentData as any).dueDate instanceof Date ? Timestamp.fromDate((assignmentData as any).dueDate) : (assignmentData as any).dueDate,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async getAssignmentsByCourse(courseId: string, limitCount = 50): Promise<FirestoreAssignment[]> {
    const q = query(
      collections.assignments(),
      where('courseId', '==', courseId),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => {
      const data: any = doc.data();
      const normalized: any = {
        ...data,
        maxScore: typeof data.maxScore === 'number' ? data.maxScore : (typeof data.maxPoints === 'number' ? data.maxPoints : 100),
      };
      return { id: doc.id, ...normalized } as FirestoreAssignment;
    });
    return list.sort((a, b) => a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime());
  },
  
  async getAssignmentsByIds(ids: string[]): Promise<Record<string, FirestoreAssignment | null>> {
    const results: Record<string, FirestoreAssignment | null> = {};
    await Promise.all(ids.map(async (id) => {
      try {
        const ref = doc(db, 'assignments', id);
        const snap = await getDoc(ref);
        results[id] = snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
      } catch {
        results[id] = null;
      }
    }));
    return results;
  },

  async getAssignmentsByTeacher(teacherId: string): Promise<FirestoreAssignment[]> {
    const q = query(
      collections.assignments(),
      where('teacherId', '==', teacherId)
    );
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => {
      const data: any = doc.data();
      const normalized: any = {
        ...data,
        maxScore: typeof data.maxScore === 'number' ? data.maxScore : (typeof data.maxPoints === 'number' ? data.maxPoints : 100),
      };
      return { id: doc.id, ...normalized } as FirestoreAssignment;
    });
    return list.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
  },

  async updateAssignment(assignmentId: string, updates: Partial<FirestoreAssignment>): Promise<void> {
    const docRef = doc(db, 'assignments', assignmentId);
    const next: any = { ...updates };
    if ((updates as any).dueDate instanceof Date) {
      next.dueDate = Timestamp.fromDate((updates as any).dueDate);
    }
    await updateDoc(docRef, {
      ...next,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteAssignment(assignmentId: string): Promise<void> {
    const docRef = doc(db, 'assignments', assignmentId);
    await deleteDoc(docRef);
  },
};

// Consolidated Course Material operations
export const courseMaterialService = {
  async createCourseMaterial(materialData: Omit<FirestoreCourseMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.courseMaterials(), {
      ...materialData,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async getCourseMaterialsByCourse(courseId: string, limitCount = 50): Promise<FirestoreCourseMaterial[]> {
    const q = query(
      collections.courseMaterials(),
      where('courseId', '==', courseId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreCourseMaterial));
  },

  async updateCourseMaterial(materialId: string, updates: Partial<FirestoreCourseMaterial>): Promise<void> {
    const docRef = doc(db, 'courseMaterials', materialId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteCourseMaterial(materialId: string): Promise<void> {
    const docRef = doc(db, 'courseMaterials', materialId);
    await deleteDoc(docRef);
  },

  async getMaterialsByTeacher(teacherId: string): Promise<FirestoreCourseMaterial[]> {
    // Get all courses by the teacher first
    const teacherCourses = await courseService.getCoursesByInstructor(teacherId);
    const courseIds = teacherCourses.map(course => course.id);
    
    if (courseIds.length === 0) return [];
    
    // Get materials for all teacher's courses
    const materialsPromises = courseIds.map(courseId => 
      courseMaterialService.getCourseMaterialsByCourse(courseId, 1000)
    );
    const materialsArrays = await Promise.all(materialsPromises);
    const allMaterials = materialsArrays.flat();
    
    // Sort by creation date (newest first)
    return allMaterials.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
  },
};

// Exams service
export const examService = {
  async createExam(exam: Omit<FirestoreExam, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const ref = await addDoc(collections.exams(), { ...exam, createdAt: now, updatedAt: now });
    return ref.id;
  },
  async getExamById(examId: string): Promise<FirestoreExam | null> {
    const ref = doc(db, 'exams', examId);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as FirestoreExam) : null;
  },
  async getExamsByCourse(courseId: string): Promise<FirestoreExam[]> {
    const q = query(collections.exams(), where('courseId', '==', courseId), orderBy('date', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreExam));
  },
  async updateExam(examId: string, updates: Partial<FirestoreExam>): Promise<void> {
    const ref = doc(db, 'exams', examId);
    await updateDoc(ref, { ...updates, updatedAt: Timestamp.now() } as any);
  },
  async deleteExam(examId: string): Promise<void> {
    const ref = doc(db, 'exams', examId);
    await deleteDoc(ref);
  },
};

// Exam Attempts service
export const examAttemptService = {
  async getAttemptForStudent(examId: string, studentId: string): Promise<FirestoreExamAttempt | null> {
    const q = query(collection(db, 'exam_attempts'), where('examId','==', examId), where('studentId','==', studentId), limit(1));
    const snap = await getDocs(q);
    if (snap.docs.length === 0) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as FirestoreExamAttempt;
  },
  async getAttemptById(attemptId: string): Promise<FirestoreExamAttempt | null> {
    const ref = doc(db, 'exam_attempts', attemptId);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as FirestoreExamAttempt) : null;
  },
  async getAttemptsByStudent(studentId: string): Promise<FirestoreExamAttempt[]> {
    const q = query(collection(db, 'exam_attempts'), where('studentId','==', studentId), orderBy('startedAt','desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreExamAttempt));
  },
  async createAttempt(examId: string, studentId: string): Promise<string> {
    const now = Timestamp.now();
    const ref = await addDoc(collection(db, 'exam_attempts'), {
      examId,
      studentId,
      startedAt: now,
      status: 'in_progress',
      answers: [],
    } as any);
    return ref.id;
  },
  async saveProgress(attemptId: string, answers: Array<{ questionId: string; response: any }>): Promise<void> {
    const ref = doc(db, 'exam_attempts', attemptId);
    await updateDoc(ref, { answers, updatedAt: Timestamp.now() } as any);
  },
  async submitAttempt(attemptId: string, payload: Partial<FirestoreExamAttempt>): Promise<void> {
    const ref = doc(db, 'exam_attempts', attemptId);
    await updateDoc(ref, { ...payload, submittedAt: Timestamp.now(), status: 'submitted', updatedAt: Timestamp.now() } as any);
  },
  async gradeAttempt(attemptId: string, manualScore: number, feedback?: string): Promise<void> {
    const ref = doc(db, 'exam_attempts', attemptId);
    await updateDoc(ref, { manualScore, feedback, status: 'graded', updatedAt: Timestamp.now() } as any);
  }
};

// Consolidated Certificates service
export const certificateService = {
  async getCertificatesForUser(uid: string): Promise<FirestoreCertificate[]> {
    const q = query(collection(db, `users/${uid}/certificates`), orderBy('awardedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreCertificate));
  },
  async award(uid: string, cert: Omit<FirestoreCertificate, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, `users/${uid}/certificates`), cert as any);
    return ref.id;
  },
};

// Consolidated Activity logs (simple daily marker for attendance)
export const activityLogService = {
  async upsertToday(uid: string): Promise<void> {
    const key = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const ref = doc(db, 'activity_logs', `${uid}_${key}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { userId: uid, dateKey: key, createdAt: Timestamp.now(), source: 'app-open' });
    }
  },
  async countDays(uid: string, daysBack: number): Promise<number> {
    const since = new Date(); since.setDate(since.getDate() - daysBack);
    const q = query(collection(db, 'activity_logs'), where('userId','==',uid), orderBy('createdAt','desc'));
    const snapshot = await getDocs(q);
    const recent = snapshot.docs.map(d => d.data()).filter((d: any) => d.createdAt.toDate() >= since);
    return new Set(recent.map((d: any) => d.dateKey)).size;
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

  async getAllEvents(): Promise<FirestoreEvent[]> {
    const q = query(
      collections.events(),
      orderBy('date', 'asc')
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

  async getForumThreadById(threadId: string): Promise<FirestoreForumThread | null> {
    const ref = doc(db, 'forum_threads', threadId);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as FirestoreForumThread) : null;
  },

  async createForumThread(threadData: Omit<FirestoreForumThread, 'id' | 'createdAt' | 'lastActivityAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.forumThreads(), {
      ...threadData,
      likes: 0,
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

  async updateForumPost(threadId: string, postId: string, updates: Partial<FirestoreForumPost>): Promise<void> {
    const ref = doc(db, `forum_threads/${threadId}/posts`, postId);
    await updateDoc(ref, { ...updates } as any);
  },

  async deleteForumPost(threadId: string, postId: string): Promise<void> {
    const ref = doc(db, `forum_threads/${threadId}/posts`, postId);
    await deleteDoc(ref);
  },

  // Post likes helpers: forum_threads/{threadId}/posts/{postId}/likes/{visitorId}
  async hasVisitorLikedPost(threadId: string, postId: string, visitorId: string): Promise<boolean> {
    const ref = doc(db, `forum_threads/${threadId}/posts/${postId}/likes`, visitorId);
    const snap = await getDoc(ref);
    return snap.exists();
  },

  async getPostLikeCount(threadId: string, postId: string): Promise<number> {
    const snap = await getDocs(collection(db, `forum_threads/${threadId}/posts/${postId}/likes`));
    return snap.size;
  },

  async likePostOnce(threadId: string, postId: string, visitorId: string): Promise<boolean> {
    const likeRef = doc(db, `forum_threads/${threadId}/posts/${postId}/likes`, visitorId);
    const likeSnap = await getDoc(likeRef);
    if (likeSnap.exists()) return false;
    await setDoc(likeRef, { visitorId, createdAt: Timestamp.now() } as any);
    return true;
  },

  async unlikePostOnce(threadId: string, postId: string, visitorId: string): Promise<boolean> {
    const likeRef = doc(db, `forum_threads/${threadId}/posts/${postId}/likes`, visitorId);
    const likeSnap = await getDoc(likeRef);
    if (!likeSnap.exists()) return false;
    await deleteDoc(likeRef);
    return true;
  },

  async likeThread(threadId: string): Promise<void> {
    const ref = doc(db, 'forum_threads', threadId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current = snap.data() as any;
    const nextLikes = (current.likes || 0) + 1;
    await updateDoc(ref, { likes: nextLikes, lastActivityAt: Timestamp.now() });
  },

  async countPosts(threadId: string): Promise<number> {
    const snap = await getDocs(collections.forumPosts(threadId));
    return snap.size;
  },

  async countPostsSince(threadId: string, since: Timestamp): Promise<number> {
    const q = query(collections.forumPosts(threadId), where('createdAt','>=', since));
    const snap = await getDocs(q);
    return snap.size;
  },

  // Per-visitor likes stored under subcollection: forum_threads/{id}/likes/{visitorId}
  async hasVisitorLiked(threadId: string, visitorId: string): Promise<boolean> {
    const ref = doc(db, `forum_threads/${threadId}/likes`, visitorId);
    const snap = await getDoc(ref);
    return snap.exists();
  },

  async getLikeCount(threadId: string): Promise<number> {
    const snap = await getDocs(collection(db, `forum_threads/${threadId}/likes`));
    return snap.size;
  },

  async likeThreadOnce(threadId: string, visitorId: string): Promise<boolean> {
    const likeRef = doc(db, `forum_threads/${threadId}/likes`, visitorId);
    const likeSnap = await getDoc(likeRef);
    if (likeSnap.exists()) return false;
    await setDoc(likeRef, { visitorId, createdAt: Timestamp.now() } as any);
    // Recalculate likes count to keep denormalized field in sync
    const count = await this.getLikeCount(threadId);
    const threadRef = doc(db, 'forum_threads', threadId);
    await updateDoc(threadRef, { likes: count });
    return true;
  },

  async unlikeThreadOnce(threadId: string, visitorId: string): Promise<boolean> {
    const likeRef = doc(db, `forum_threads/${threadId}/likes`, visitorId);
    const likeSnap = await getDoc(likeRef);
    if (!likeSnap.exists()) return false;
    await deleteDoc(likeRef);
    const count = await this.getLikeCount(threadId);
    const threadRef = doc(db, 'forum_threads', threadId);
    await updateDoc(threadRef, { likes: count });
    return true;
  },

  // Per-visitor views stored under subcollection: forum_threads/{id}/views/{visitorId}
  async hasVisitorViewed(threadId: string, visitorId: string): Promise<boolean> {
    const ref = doc(db, `forum_threads/${threadId}/views`, visitorId);
    const snap = await getDoc(ref);
    return snap.exists();
  },

  async getViewCount(threadId: string): Promise<number> {
    const snap = await getDocs(collection(db, `forum_threads/${threadId}/views`));
    return snap.size;
  },

  async markViewedOnce(threadId: string, visitorId: string): Promise<boolean> {
    const viewRef = doc(db, `forum_threads/${threadId}/views`, visitorId);
    const viewSnap = await getDoc(viewRef);
    if (viewSnap.exists()) return false;
    await setDoc(viewRef, { visitorId, createdAt: Timestamp.now() } as any);
    // Optionally denormalize view count
    try {
      const count = await this.getViewCount(threadId);
      const threadRef = doc(db, 'forum_threads', threadId);
      await updateDoc(threadRef, { views: count });
    } catch {}
    return true;
  },

  async updateForumThread(threadId: string, updates: Partial<FirestoreForumThread>): Promise<void> {
    const ref = doc(db, 'forum_threads', threadId);
    await updateDoc(ref, { ...updates, updatedAt: Timestamp.now() } as any);
  },

  async deleteForumThread(threadId: string): Promise<void> {
    const ref = doc(db, 'forum_threads', threadId);
    await deleteDoc(ref);
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
    const totalTeachers = usersSnapshot.docs.filter(doc => doc.data().role === 'teacher').length;
    const activeCourses = coursesSnapshot.docs.filter(doc => doc.data().isActive).length;
    const pendingCourses = coursesSnapshot.docs.filter(doc => !doc.data().isActive).length;

    const totalEnrollments = enrollmentsSnapshot.size;
    const completedEnrollments = enrollmentsSnapshot.docs.filter(doc => doc.data().status === 'completed').length;
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    return {
      totalUsers,
      totalStudents,
      totalTeachers,
      activeCourses,
      pendingCourses,
      completionRate,
      systemHealth: 99.9, // Placeholder
    };
  },

  async getTeacherStats(teacherId: string) {
    const [coursesSnapshot, enrollmentsSnapshot, submissionsSnapshot] = await Promise.all([
      getDocs(query(collections.courses(), where('instructor', '==', teacherId))),
      getDocs(collections.enrollments()),
      getDocs(collections.submissions()),
    ]);

    const myCourses = coursesSnapshot.size;
    const courseIds = coursesSnapshot.docs.map(doc => doc.id);
    const activeCourses = coursesSnapshot.docs.filter(doc => !!doc.data().isActive).length;
    const totalStudents = enrollmentsSnapshot.docs.filter(doc => courseIds.includes(doc.data().courseId)).length;
    const pendingReviews = submissionsSnapshot.docs.filter(doc => courseIds.includes(doc.data().courseId) && doc.data().status === 'submitted').length;
    const avgRating = 0; // Not tracked yet

    return {
      myCourses,
      activeCourses,
      totalStudents,
      pendingReviews,
      avgRating,
    };
  },

  async getStudentStats(studentId: string) {
    const [enrollmentsSnapshot, submissionsSnapshot] = await Promise.all([
      getDocs(query(collections.enrollments(), where('studentId', '==', studentId))),
      getDocs(query(collections.submissions(), where('studentId', '==', studentId))),
    ]);

    const enrollments = enrollmentsSnapshot.docs.map(d => d.data());
    const enrolledCourses = enrollments.length;
    const averageProgress = enrollments.length
      ? Math.round(enrollments.reduce((sum, e: any) => sum + (e.progress || 0), 0) / enrollments.length)
      : 0;
    const pendingAssignments = submissionsSnapshot.docs.filter(d => d.data().status === 'submitted').length;

    return {
      enrolledCourses,
      averageProgress,
      pendingAssignments,
    };
  },
};


// Assignment Edit Request Service
export const assignmentEditRequestService = {
  async createEditRequest(data: Omit<FirestoreAssignmentEditRequest, 'id' | 'requestedAt' | 'status'>) {
    const docRef = await addDoc(collection(db, 'assignmentEditRequests'), {
      ...data,
      requestedAt: Timestamp.now(),
      status: 'pending'
    });
    return docRef.id;
  },

  async getEditRequestsByStudent(studentId: string): Promise<FirestoreAssignmentEditRequest[]> {
    const q = query(
      collection(db, 'assignmentEditRequests'),
      where('studentId', '==', studentId),
      orderBy('requestedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreAssignmentEditRequest));
  },

  async getEditRequestsByTeacher(teacherId: string): Promise<FirestoreAssignmentEditRequest[]> {
    const q = query(
      collection(db, 'assignmentEditRequests'),
      where('teacherId', '==', teacherId),
      orderBy('requestedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreAssignmentEditRequest));
  },

  async getPendingEditRequestsByTeacher(teacherId: string): Promise<FirestoreAssignmentEditRequest[]> {
    const q = query(
      collection(db, 'assignmentEditRequests'),
      where('teacherId', '==', teacherId),
      where('status', '==', 'pending'),
      orderBy('requestedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreAssignmentEditRequest));
  },

  async updateEditRequest(requestId: string, updates: Partial<FirestoreAssignmentEditRequest>) {
    const docRef = doc(db, 'assignmentEditRequests', requestId);
    await updateDoc(docRef, {
      ...updates,
      handledAt: Timestamp.now()
    });
  },

  async deleteEditRequest(requestId: string) {
    const docRef = doc(db, 'assignmentEditRequests', requestId);
    await deleteDoc(docRef);
  }
};

