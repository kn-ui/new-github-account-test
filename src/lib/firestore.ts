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
  // Merged maxScore and maxPoints from duplicate interfaces
  maxPoints: number; 
  instructions?: string;
  teacherId: string;
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

  async getAnnouncementsByTeacher(teacherId: string): Promise<FirestoreAnnouncement[]> {
    // Get all courses by the teacher first
    const teacherCourses = await courseService.getCoursesByInstructor(teacherId);
    const courseIds = teacherCourses.map(course => course.id);
    
    if (courseIds.length === 0) return [];
    
    // Get announcements for all teacher's courses plus general announcements by the teacher
    const courseAnnouncementsPromises = courseIds.map(courseId => 
      this.getAnnouncements(courseId, 1000)
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
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreAssignment));
  },

  async updateAssignment(assignmentId: string, updates: Partial<FirestoreAssignment>): Promise<void> {
    const docRef = doc(db, 'assignments', assignmentId);
    await updateDoc(docRef, {
      ...updates,
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
      this.getCourseMaterialsByCourse(courseId, 1000)
    );
    const materialsArrays = await Promise.all(materialsPromises);
    const allMaterials = materialsArrays.flat();
    
    // Sort by creation date (newest first)
    return allMaterials.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
  },
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

