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
import { db, auth } from './firebase';

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
  isActive: boolean;
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
  content: string;
  attachments?: string[];
  maxScore?: number;
  instructions?: string;
  isActive: boolean;
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
  isActive: boolean;
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
  isActive: boolean;
}

export interface FirestoreExam {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  date: Timestamp; // legacy/scheduled date
  startTime?: Timestamp; // when exam becomes visible to students
  durationMinutes?: number; // how long the exam is available after start
  firstAttemptTimestamp?: Timestamp; // when first student started the exam
  totalPoints: number; // sum of all question points
  questions?: Array<{
    id: string;
    type: 'mcq' | 'truefalse' | 'short';
    prompt: string;
    options?: string[];
    correct: number | boolean;
    points: number;
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  startedAt: Timestamp;
  submittedAt?: Timestamp; // when student submitted the exam
  status: 'in_progress' | 'submitted' | 'graded';
  // Array of answers keyed by exam question id or index
  answers: Array<{ questionId: string; response: any }>;
  // Auto grading
  autoScore?: number;
  totalAutoPoints?: number;
  // Manual grading support
  manualScore?: number;
  feedback?: string;
  // New fields
  score: number; // total score (auto + manual)
  isGraded: boolean; // whether the exam has been fully graded
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

export interface FirestoreGrade {
  id: string;
  courseId: string;
  studentId: string;
  finalGrade: number;
  letterGrade: string;
  gradePoints: number;
  calculatedAt: Timestamp;
  calculatedBy: string;
  calculationMethod: 'weighted_average' | 'simple_average' | 'manual';
  assignmentGrades?: { assignmentId: string; grade: number; weight: number }[];
  notes?: string;
  // New fields for publication and breakdown
  isPublished?: boolean;
  publishedAt?: Timestamp;
  // Optional breakdown totals used for recomputation/debugging
  assignmentsTotal?: number;
  assignmentsMax?: number;
  examsTotal?: number;
  examsMax?: number;
  otherTotal?: number; // sum of other grade points
}

export interface FirestoreAttendanceSheet {
  id: string;
  courseId: string;
  teacherId: string;
  ethiopianYear: number;
  ethiopianMonth: number; // 1-13
  // records[studentId][day] = present: boolean
  records: Record<string, Record<number, boolean>>;
  submitted: boolean;
  submittedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Additional grade type for miscellaneous points (bonus/attendance/discipline/etc.)
export interface FirestoreOtherGrade {
  id: string;
  courseId: string;
  studentId: string;
  teacherId: string;
  reason: string;
  points: number; // 0..100 additive points; admins will clamp overall grade to <= 100
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreEditRequest {
  id: string;
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  teacherId: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: Timestamp;
  respondedAt?: Timestamp;
  response?: string;
  respondedBy?: string;
  isActive: boolean;
}

export interface FirestoreAnnouncement {
  id: string;
  courseId?: string;
  targetAudience?: 'ALL_STUDENTS' | 'COURSE_STUDENTS' | 'SPECIFIC_STUDENT';
  recipientStudentId?: string; // Keep for backward compatibility and specific student targeting
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
  isActive: boolean;
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
  grades: () => collection(db, 'grades'),
  editRequests: () => collection(db, 'editRequests'),
  attendance: () => collection(db, 'attendance'),
  otherGrades: () => collection(db, 'other_grades'),
  adminActions: () => collection(db, 'admin_actions'),
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
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as FirestoreUser))
      .filter(user => user.isActive !== false); // Client-side filter for isActive
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

  async getTeachers(): Promise<FirestoreUser[]> {
    const q = query(
      collections.users(),
      where('role', '==', 'teacher'),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreUser));
  },

  async getStudentsByTeacher(teacherId: string): Promise<FirestoreUser[]> {
    // Get all courses by the teacher
    const teacherCourses = await courseService.getCoursesByInstructor(teacherId);
    const courseIds = teacherCourses.map(course => course.id);
    
    if (courseIds.length === 0) return [];
    
    // Get all enrollments for these courses
    const enrollmentPromises = courseIds.map(courseId => 
      enrollmentService.getEnrollmentsByCourse(courseId)
    );
    const enrollmentArrays = await Promise.all(enrollmentPromises);
    const allEnrollments = enrollmentArrays.flat();
    
    // Get unique student IDs
    const studentIds = [...new Set(allEnrollments.map(enrollment => enrollment.studentId))];
    
    // Get student details
    const studentPromises = studentIds.map(studentId => 
      userService.getUserById(studentId)
    );
    const students = await Promise.all(studentPromises);
    
    return students.filter(student => student !== null) as FirestoreUser[];
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
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'user.create', targetType: 'user', targetId: userData.uid, details: { email: userData.email, role: userData.role } }); } catch {}
    return userData.uid;
  },

  async updateUser(uid: string, updates: Partial<FirestoreUser>): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'user.update', targetType: 'user', targetId: uid, details: updates }); } catch {}
  },

  async deleteUser(userId: string): Promise<void> {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: Timestamp.now()
    });
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'user.delete', targetType: 'user', targetId: userId }); } catch {}
  },

  async getInactiveUsers(limitCount?: number): Promise<FirestoreUser[]> {
    const q = limitCount
      ? query(
          collections.users(),
          where('isActive', '==', false),
          orderBy('updatedAt', 'desc'),
          limit(limitCount)
        )
      : query(collections.users(), where('isActive', '==', false), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreUser));
  },

  async getAllUsersIncludingInactive(limitCount?: number): Promise<FirestoreUser[]> {
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
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as FirestoreCourse));
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
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as FirestoreCourse))
      .filter(course => course.isActive !== false); // Client-side filter for isActive
  },

  async getAllCoursesByInstructor(instructorId: string): Promise<FirestoreCourse[]> {
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

  async getCoursesByIds(courseIds: string[]): Promise<{ [key: string]: FirestoreCourse }> {
    if (courseIds.length === 0) return {};
    
    // Get courses in parallel
    const coursePromises = courseIds.map(async (courseId) => {
      try {
        const course = await this.getCourseById(courseId);
        return course ? { [courseId]: course } : {};
      } catch (error) {
        console.error(`Error loading course ${courseId}:`, error);
        return {};
      }
    });
    
    const courseResults = await Promise.all(coursePromises);
    
    // Merge all course objects into one
    return courseResults.reduce((acc, courseObj) => ({ ...acc, ...courseObj }), {});
  },

  async createCourse(courseData: Omit<FirestoreCourse, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.courses(), {
      ...courseData,
      isActive: courseData.isActive !== undefined ? courseData.isActive : true,
      createdAt: now,
      updatedAt: now,
    });
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'course.create', targetType: 'course', targetId: docRef.id, details: { title: courseData.title } }); } catch {}
    return docRef.id;
  },

  async updateCourse(courseId: string, updates: Partial<FirestoreCourse>): Promise<void> {
    const docRef = doc(db, 'courses', courseId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'course.update', targetType: 'course', targetId: courseId, details: updates }); } catch {}
  },

  async deleteCourse(courseId: string): Promise<void> {
    const docRef = doc(db, 'courses', courseId);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: Timestamp.now()
    });
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'course.delete', targetType: 'course', targetId: courseId }); } catch {}
    
    // Clear student data cache for all enrolled students
    const enrollments = await enrollmentService.getEnrollmentsByCourse(courseId);
    const studentIds = enrollments.map(enrollment => enrollment.studentId);
    studentIds.forEach(studentId => {
      studentDataService.clearStudentCache(studentId);
    });
  },

  async deleteCourseWithDependencies(courseId: string): Promise<void> {
    // Soft delete the course
    await this.deleteCourse(courseId);
    
    // Soft delete all related assignments
    const assignments = await assignmentService.getAssignmentsByCourse(courseId);
    await Promise.all(
      assignments.map(assignment => assignmentService.deleteAssignment(assignment.id))
    );
    
    // Soft delete all related course materials
    const materials = await courseMaterialService.getCourseMaterialsByCourse(courseId);
    await Promise.all(
      materials.map(material => courseMaterialService.deleteCourseMaterial(material.id))
    );
    
    // Soft delete all related enrollments
    const enrollments = await enrollmentService.getEnrollmentsByCourse(courseId);
    await Promise.all(
      enrollments.map(enrollment => enrollmentService.deleteEnrollment(enrollment.id))
    );
    
    // Clear student data cache for all enrolled students
    const studentIds = enrollments.map(enrollment => enrollment.studentId);
    studentIds.forEach(studentId => {
      studentDataService.clearStudentCache(studentId);
    });
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
    const enrollments = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as FirestoreEnrollment))
      .filter(enrollment => enrollment.isActive !== false); // Client-side filter for isActive
    
    // Fetch course data for each enrollment
    const enrollmentsWithCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        try {
          const course = await courseService.getCourseById(enrollment.courseId);
          // Filter out inactive courses (isActive = false)
          if (course && course.isActive === false) {
            return null; // Return null for inactive courses
          }
          return Object.assign({}, enrollment, { course });
        } catch (error) {
          console.error(`Failed to fetch course ${enrollment.courseId}:`, error);
          return { ...(enrollment as any), course: undefined };
        }
      })
    );
    
    // Filter out enrollments with inactive courses
    return enrollmentsWithCourses.filter(enrollment => enrollment !== null);
  },

  async getEnrollmentsByCourse(courseId: string): Promise<FirestoreEnrollment[]> {
    const q = query(
      collections.enrollments(),
      where('courseId', '==', courseId),
      orderBy('enrolledAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as FirestoreEnrollment))
      .filter(enrollment => enrollment.isActive !== false); // Client-side filter for isActive
  },

  async createEnrollment(enrollmentData: Omit<FirestoreEnrollment, 'id' | 'enrolledAt' | 'lastAccessedAt' | 'isActive'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.enrollments(), {
      ...enrollmentData,
      enrolledAt: now,
      lastAccessedAt: now,
      isActive: true,
    });
    return docRef.id;
  },

  async getAllEnrollments(): Promise<(FirestoreEnrollment & { course?: FirestoreCourse })[]> {
    const q = query(
      collections.enrollments(),
      orderBy('enrolledAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const enrollments = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as FirestoreEnrollment))
      .filter(enrollment => enrollment.isActive !== false); // Client-side filter for isActive
    
    // Fetch course data for each enrollment
    const enrollmentsWithCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        try {
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
    await updateDoc(docRef, {
      isActive: false,
      lastAccessedAt: Timestamp.now()
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
    console.log('Received submission data in createSubmission:', submissionData);
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

  async updateBlogPost(blogId: string, blogData: Partial<Omit<FirestoreBlog, 'id' | 'createdAt' | 'likes' | 'authorId' | 'authorName'>>): Promise<void> {
    const docRef = doc(db, 'blogs', blogId);
    await updateDoc(docRef, {
      ...blogData,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteBlogPost(blogId: string): Promise<void> {
    const docRef = doc(db, 'blogs', blogId);
    await deleteDoc(docRef);
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
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'announcement.create', targetType: 'announcement', targetId: docRef.id, details: { courseId: announcementData.courseId, title: announcementData.title } }); } catch {}
    return docRef.id;
  },

  async getAnnouncementsByTeacher(teacherId: string): Promise<FirestoreAnnouncement[]> {
    // Get all courses by the teacher first
    const teacherCourses = await courseService.getAllCoursesByInstructor(teacherId);
    const courseIds = teacherCourses.map(course => course.id);
    
    if (courseIds.length === 0) return [];
    
    // Get all announcements by the teacher (using new targeting system)
    const teacherAnnouncementsQuery = query(
      collections.announcements(),
      where('authorId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );
    const teacherSnapshot = await getDocs(teacherAnnouncementsQuery);
    const allAnnouncements = teacherSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreAnnouncement));
    
    return allAnnouncements;
  },

  async getAdminAnnouncements(): Promise<FirestoreAnnouncement[]> {
    const q = query(
      collections.announcements(),
      where('isAdminAnnouncement', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreAnnouncement));
  },

  async getAnnouncementsForUser(userId: string, userRole: string): Promise<FirestoreAnnouncement[]> {
    const q = query(
      collections.announcements(),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const allAnnouncements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreAnnouncement));
    
    // Filter announcements based on user role and targeting
    return allAnnouncements.filter(announcement => {
      const targetAudience = (announcement as any).targetAudience;
      const recipientUserId = (announcement as any).recipientUserId;
      
      // Direct message to this user
      if (recipientUserId === userId) {
        return true;
      }
      
      // General announcements to all users
      if (targetAudience === 'GENERAL_ALL') {
        return true;
      }
      
      // Role-specific announcements
      if (userRole === 'student' && targetAudience === 'ALL_STUDENTS') {
        return true;
      }
      
      if ((userRole === 'teacher' || userRole === 'admin' || userRole === 'super_admin') && targetAudience === 'ALL_TEACHERS') {
        return true;
      }
      
      return false;
    });
  },


  async updateAnnouncement(announcementId: string, updates: Partial<FirestoreAnnouncement>): Promise<void> {
    const docRef = doc(db, 'announcements', announcementId);
    await updateDoc(docRef, updates as any);
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'announcement.update', targetType: 'announcement', targetId: announcementId, details: updates }); } catch {}
  },

  async deleteAnnouncement(announcementId: string): Promise<void> {
    const docRef = doc(db, 'announcements', announcementId);
    await deleteDoc(docRef);
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'announcement.delete', targetType: 'announcement', targetId: announcementId }); } catch {}
  },
};

// Consolidated Assignment operations
export const assignmentService = {
  async createAssignment(assignmentData: Omit<FirestoreAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.assignments(), {
      ...assignmentData,
      dueDate: (assignmentData as any).dueDate instanceof Date ? Timestamp.fromDate((assignmentData as any).dueDate) : (assignmentData as any).dueDate,
      isActive: assignmentData.isActive !== undefined ? assignmentData.isActive : true,
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
    return list
      .filter(assignment => assignment.isActive !== false) // Client-side filter for isActive
      .sort((a, b) => a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime());
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

  async getAssignmentById(assignmentId: string): Promise<FirestoreAssignment | null> {
    const docRef = doc(db, 'assignments', assignmentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const assignment = { id: docSnap.id, ...docSnap.data() } as FirestoreAssignment;
      return assignment.isActive ? assignment : null;
    }
    return null;
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
    return list
      .filter(assignment => assignment.isActive !== false) // Client-side filter for isActive
      .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
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
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: Timestamp.now()
    });
  },
};

// Consolidated Course Material operations
export const courseMaterialService = {
  async createCourseMaterial(materialData: Omit<FirestoreCourseMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.courseMaterials(), {
      ...materialData,
      isActive: materialData.isActive !== undefined ? materialData.isActive : true,
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
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as FirestoreCourseMaterial))
      .filter(material => material.isActive !== false); // Client-side filter for isActive
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
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: Timestamp.now()
    });
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
    
    // Calculate total points from questions
    const totalPoints = exam.questions?.reduce((sum, question) => sum + question.points, 0) || 0;
    
    const ref = await addDoc(collections.exams(), { 
      ...exam, 
      totalPoints,
      firstAttemptTimestamp: null,
      createdAt: now, 
      updatedAt: now 
    });
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
    
    // If questions are being updated, recalculate totalPoints
    if (updates.questions) {
      const totalPoints = updates.questions.reduce((sum, question) => sum + question.points, 0);
      updates.totalPoints = totalPoints;
    }
    
    await updateDoc(ref, { ...updates, updatedAt: Timestamp.now() } as any);
  },
  async deleteExam(examId: string): Promise<void> {
    const ref = doc(db, 'exams', examId);
    await deleteDoc(ref);
  },
  
  // Check if exam is locked (can't be edited/deleted)
  async isExamLocked(examId: string): Promise<{ locked: boolean; reason?: string }> {
    const exam = await this.getExamById(examId);
    if (!exam) {
      return { locked: true, reason: 'Exam not found' };
    }
    
    const now = new Date();
    const examDate = exam.date.toDate();
    
    // Check if exam has started (current time >= exam date)
    if (now >= examDate) {
      return { locked: true, reason: 'Exam has already started' };
    }
    
    // Check if any student has started the exam
    if (exam.firstAttemptTimestamp) {
      return { locked: true, reason: 'Students have already started this exam' };
    }
    
    return { locked: false };
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
  async getAttemptsByExam(examId: string): Promise<FirestoreExamAttempt[]> {
    const q = query(collection(db, 'exam_attempts'), where('examId','==', examId), orderBy('submittedAt','desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreExamAttempt));
  },
  async createAttempt(examId: string, studentId: string): Promise<string> {
    const now = Timestamp.now();
    
    // Check if this is the first attempt for this exam
    const existingAttempts = await getDocs(
      query(collection(db, 'exam_attempts'), where('examId', '==', examId))
    );
    
    const isFirstAttempt = existingAttempts.empty;
    
    // If this is the first attempt, update the exam's firstAttemptTimestamp
    if (isFirstAttempt) {
      await examService.updateExam(examId, { firstAttemptTimestamp: now });
    }
    
    const ref = await addDoc(collection(db, 'exam_attempts'), {
      examId,
      studentId,
      startedAt: now,
      submittedAt: null,
      status: 'in_progress',
      answers: [],
      score: 0,
      isGraded: false,
    } as any);
    return ref.id;
  },
  async saveProgress(attemptId: string, answers: Array<{ questionId: string; response: any }>): Promise<void> {
    const ref = doc(db, 'exam_attempts', attemptId);
    await updateDoc(ref, { answers, updatedAt: Timestamp.now() } as any);
  },
  async submitAttempt(attemptId: string, payload: Partial<FirestoreExamAttempt>): Promise<void> {
    const now = Timestamp.now();
    
    // Get the attempt to access exam data
    const attemptRef = doc(db, 'exam_attempts', attemptId);
    const attemptSnap = await getDoc(attemptRef);
    const attempt = attemptSnap.data() as FirestoreExamAttempt;
    
    if (!attempt) {
      throw new Error('Exam attempt not found');
    }
    
    // Get the exam to access questions for auto-grading
    const exam = await examService.getExamById(attempt.examId);
    if (!exam || !exam.questions) {
      throw new Error('Exam not found or has no questions');
    }
    
    // Perform auto-grading
    let autoScore = 0;
    let hasManualQuestions = false;
    
    for (const answer of payload.answers || attempt.answers) {
      const question = exam.questions.find(q => q.id === answer.questionId);
      if (!question) continue;
      
      if (question.type === 'mcq') {
        // Multiple choice: check if selected option matches correct answer
        if (answer.response === question.correct) {
          autoScore += question.points;
        }
      } else if (question.type === 'truefalse') {
        // True/False: check if answer matches correct boolean
        if (answer.response === question.correct) {
          autoScore += question.points;
        }
      } else if (question.type === 'short') {
        // Short answer: requires manual grading
        hasManualQuestions = true;
      }
    }
    
    // Calculate total possible points for auto-graded questions
    const totalAutoPoints = exam.questions
      .filter(q => q.type !== 'short')
      .reduce((sum, q) => sum + q.points, 0);
    
    const ref = doc(db, 'exam_attempts', attemptId);
    await updateDoc(ref, { 
      ...payload, 
      submittedAt: now, 
      status: 'submitted', 
      autoScore,
      totalAutoPoints,
      score: autoScore, // Initial score is just auto score
      isGraded: !hasManualQuestions, // Fully graded if no manual questions
      updatedAt: now 
    } as any);
  },
  async gradeAttempt(attemptId: string, manualScore: number, feedback?: string): Promise<void> {
    // Get current attempt to calculate final score
    const attemptRef = doc(db, 'exam_attempts', attemptId);
    const attemptSnap = await getDoc(attemptRef);
    const attempt = attemptSnap.data() as FirestoreExamAttempt;
    
    if (!attempt) {
      throw new Error('Exam attempt not found');
    }
    
    // Calculate final score (auto score + manual score)
    const finalScore = (attempt.autoScore || 0) + manualScore;
    
    const ref = doc(db, 'exam_attempts', attemptId);
    await updateDoc(ref, { 
      manualScore, 
      feedback, 
      score: finalScore,
      isGraded: true,
      status: 'graded', 
      updatedAt: Timestamp.now() 
    } as any);
  },
  async updateAttempt(attemptId: string, updates: Partial<FirestoreExamAttempt>): Promise<void> {
    const ref = doc(db, 'exam_attempts', attemptId);
    await updateDoc(ref, { ...updates, updatedAt: Timestamp.now() } as any);
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
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as FirestoreEvent))
      .filter(event => event.isActive !== false); // Filter out soft-deleted events
  },

  async createEvent(eventData: Omit<FirestoreEvent, 'id'>): Promise<string> {
    const docRef = await addDoc(collections.events(), eventData);
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'event.create', targetType: 'event', targetId: docRef.id, details: { title: eventData.title } }); } catch {}
    return docRef.id;
  },

  async updateEvent(eventId: string, updates: Partial<FirestoreEvent>): Promise<void> {
    const docRef = doc(db, 'events', eventId);
    await updateDoc(docRef, updates as any);
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'event.update', targetType: 'event', targetId: eventId, details: updates }); } catch {}
  },

  async deleteEvent(eventId: string): Promise<void> {
    const docRef = doc(db, 'events', eventId);
    await updateDoc(docRef, {
      isActive: false
    });
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'event.delete', targetType: 'event', targetId: eventId }); } catch {}
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
    const [usersSnapshot, coursesSnapshot, enrollmentsSnapshot, eventsSnapshot] = await Promise.all([
      getDocs(collections.users()),
      getDocs(collections.courses()),
      getDocs(collections.enrollments()),
      getDocs(collections.events()),
    ]);

    const totalUsers = usersSnapshot.size;
    const totalStudents = usersSnapshot.docs.filter(doc => doc.data().role === 'student').length;
    const totalTeachers = usersSnapshot.docs.filter(doc => doc.data().role === 'teacher').length;
    const activeCourses = coursesSnapshot.docs.filter(doc => doc.data().isActive).length;
    const pendingCourses = coursesSnapshot.docs.filter(doc => !doc.data().isActive).length;
    const totalEvents = eventsSnapshot.size;

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
      totalEvents,
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
    const activeCourseIds = coursesSnapshot.docs.filter(doc => !!doc.data().isActive).map(doc => doc.id);
    const totalStudents = enrollmentsSnapshot.docs.filter(doc => activeCourseIds.includes(doc.data().courseId)).length;
    const pendingReviews = submissionsSnapshot.docs.filter(doc => activeCourseIds.includes(doc.data().courseId) && doc.data().status === 'submitted').length;
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
      getDocs(query(collections.enrollments(), where('studentId', '==', studentId), where('isActive', '==', true))),
      getDocs(query(collections.submissions(), where('studentId', '==', studentId))),
    ]);

    const enrollments = enrollmentsSnapshot.docs.map(d => d.data());
    
    // Get course IDs to filter for active courses only
    const courseIds = enrollments.map(e => e.courseId);
    const courses = await courseService.getCoursesByIds(courseIds);
    
    // Filter enrollments for active courses only
    const activeEnrollments = enrollments.filter(e => {
      const course = courses[e.courseId];
      return course && course.isActive !== false;
    });
    
    const enrolledCourses = activeEnrollments.length;
    const averageProgress = activeEnrollments.length
      ? Math.round(activeEnrollments.reduce((sum, e: any) => sum + (e.progress || 0), 0) / activeEnrollments.length)
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
  async createEditRequest(data: Omit<FirestoreEditRequest, 'id' | 'requestedAt' | 'status'>) {
    const docRef = await addDoc(collections.editRequests(), {
      ...data,
      requestedAt: Timestamp.now(),
      status: 'pending' as const,
      isActive: true
    });
    return docRef.id;
  },

  async getEditRequestsByStudent(studentId: string): Promise<FirestoreEditRequest[]> {
    const q = query(
      collections.editRequests(),
      where('studentId', '==', studentId),
      where('isActive', '==', true),
      orderBy('requestedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreEditRequest));
  },

  async getEditRequestsByTeacher(teacherId: string): Promise<FirestoreEditRequest[]> {
    const q = query(
      collections.editRequests(),
      where('teacherId', '==', teacherId),
      where('isActive', '==', true),
      orderBy('requestedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreEditRequest));
  },

  async getPendingEditRequestsByTeacher(teacherId: string): Promise<FirestoreEditRequest[]> {
    const q = query(
      collections.editRequests(),
      where('teacherId', '==', teacherId),
      where('status', '==', 'pending'),
      where('isActive', '==', true),
      orderBy('requestedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreEditRequest));
  },

  async updateEditRequest(requestId: string, updates: Partial<FirestoreEditRequest>) {
    const docRef = doc(db, 'editRequests', requestId);
    await updateDoc(docRef, {
      ...updates,
      respondedAt: Timestamp.now()
    });
  },

  async deleteEditRequest(requestId: string) {
    const docRef = doc(db, 'editRequests', requestId);
    await deleteDoc(docRef);
  },

  async approveEditRequest(requestId: string, response: string, respondedBy: string) {
    const docRef = doc(db, 'editRequests', requestId);
    await updateDoc(docRef, {
      status: 'approved' as const,
      response,
      respondedBy,
      respondedAt: Timestamp.now()
    });
  },

  async denyEditRequest(requestId: string, response: string, respondedBy: string) {
    const docRef = doc(db, 'editRequests', requestId);
    await updateDoc(docRef, {
      status: 'denied' as const,
      response,
      respondedBy,
      respondedAt: Timestamp.now()
    });
  }
};

// Simple in-memory cache for student data
const studentDataCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key: string) => {
  const cached = studentDataCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any, ttl = CACHE_TTL) => {
  studentDataCache.set(key, { data, timestamp: Date.now(), ttl });
};

// Retry utility function
const retry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Student Data Service - Optimized batch loading
export const studentDataService = {
  async getStudentDashboardData(studentId: string) {
    const cacheKey = `dashboard_${studentId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Load all student data in parallel with optimized queries and retry logic
      const [
        enrollments,
        stats,
        announcements,
        certificates
      ] = await Promise.all([
        // Get enrollments with course data
        retry(() => this.getEnrollmentsWithCourses(studentId)),
        // Get student stats
        retry(() => analyticsService.getStudentStats(studentId)),
        // Get announcements (limited to 10 for dashboard)
        retry(() => announcementService.getAnnouncementsForStudent(studentId, [], 10)),
        // Get certificates
        retry(() => certificateService.getCertificatesForUser(studentId)).catch(() => [])
      ]);

      // Get course IDs for additional data
      const courseIds = enrollments.map(e => e.courseId);
      
      // Load assignments for all courses in parallel
      const assignments = courseIds.length > 0 
        ? await this.getAssignmentsForCourses(courseIds)
        : [];

      const result = {
        enrollments,
        stats,
        announcements,
        certificates,
        assignments
      };

      setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error loading student dashboard data:', error);
      throw error;
    }
  },

  async getEnrollmentsWithCourses(studentId: string) {
    const q = query(
      collections.enrollments(),
      where('studentId', '==', studentId),
      where('isActive', '==', true),
      orderBy('enrolledAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const enrollments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreEnrollment));
    
    // Get course data for all enrollments in parallel
    const courseIds = enrollments.map(e => e.courseId);
    const courses = await this.getCoursesByIds(courseIds);
    
    // Merge course data with enrollments and filter out inactive courses
    return enrollments
      .map(enrollment => ({
        ...enrollment,
        course: courses[enrollment.courseId] || null
      }))
      .filter(enrollment => enrollment.course !== null);
  },

  async getCoursesByIds(courseIds: string[]) {
    if (courseIds.length === 0) return {};
    
    const courses = await courseService.getCoursesByIds(courseIds);
    
    // Filter out inactive courses (isActive = false)
    const activeCourses = Object.fromEntries(
      Object.entries(courses).filter(([_, course]) => course.isActive !== false)
    );
    
    return activeCourses;
  },

  async getAssignmentsForCourses(courseIds: string[]) {
    if (courseIds.length === 0) return [];
    
    // Load assignments for all courses in parallel
    const assignmentPromises = courseIds.map(courseId => 
      assignmentService.getAssignmentsByCourse(courseId).catch(() => [])
    );
    
    const assignmentArrays = await Promise.all(assignmentPromises);
    return assignmentArrays.flat();
  },

  async getStudentCoursesData(studentId: string) {
    const cacheKey = `courses_${studentId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const enrollments = await this.getEnrollmentsWithCourses(studentId);
      
      // Filter out enrollments without course data
      const validEnrollments = enrollments.filter(e => e.course);
      
      const result = validEnrollments.map(enrollment => ({
        id: enrollment.courseId,
        title: enrollment.course!.title,
        description: enrollment.course!.description,
        category: enrollment.course!.category,
        instructorName: enrollment.course!.instructorName,
        progress: enrollment.progress || 0,
        enrolledAt: enrollment.enrolledAt.toDate(),
        lastAccessed: enrollment.lastAccessedAt?.toDate()
      }));

      setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error loading student courses data:', error);
      throw error;
    }
  },

  async getStudentAssignmentsData(studentId: string) {
    const cacheKey = `assignments_${studentId}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('Using cached assignments data for student:', studentId);
      return cached;
    }

    try {
      const enrollments = await this.getEnrollmentsWithCourses(studentId);
      console.log('Enrollments for student:', studentId, enrollments.map(e => ({ courseId: e.courseId, courseTitle: e.course?.title, isActive: e.course?.isActive })));
      
      const courseIds = enrollments.map(e => e.courseId);
      
      if (courseIds.length === 0) return [];

      // Load assignments and submissions in parallel
      const [assignments, submissions] = await Promise.all([
        this.getAssignmentsForCourses(courseIds),
        submissionService.getSubmissionsByStudent(studentId)
      ]);
      
      console.log('Assignments loaded for student:', studentId, assignments.map(a => ({ id: a.id, title: a.title, courseId: a.courseId })));

      // Create a map of submissions by assignment ID
      const submissionMap = new Map();
      submissions.forEach(sub => {
        submissionMap.set(sub.assignmentId, sub);
      });

      // Merge assignment data with submission status
      const result = assignments.map(assignment => {
        const submission = submissionMap.get(assignment.id);
        const course = enrollments.find(e => e.courseId === assignment.courseId)?.course;
        
        let status: 'not-started' | 'in-progress' | 'submitted' | 'graded' = 'not-started';
        let submissionId: string | undefined;
        let grade: number | undefined;
        let feedback: string | undefined;

        if (submission) {
          submissionId = submission.id;
          if (submission.status === 'graded') {
            status = 'graded';
            grade = submission.grade;
            feedback = submission.feedback;
          } else if (submission.status === 'submitted') {
            status = 'submitted';
          }
        }

        return {
          ...assignment,
          courseTitle: course?.title || 'Unknown Course',
          instructorName: course?.instructorName || 'Unknown Instructor',
          status,
          submissionId,
          grade,
          feedback
        };
      });

      setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error loading student assignments data:', error);
      throw error;
    }
  },

  async getStudentSubmissionsData(studentId: string) {
    const cacheKey = `submissions_${studentId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const enrollments = await this.getEnrollmentsWithCourses(studentId);
      const courseIds = enrollments.map(e => e.courseId);
      
      if (courseIds.length === 0) return [];

      // Load assignments and submissions in parallel
      const [assignments, submissions] = await Promise.all([
        this.getAssignmentsForCourses(courseIds),
        submissionService.getSubmissionsByStudent(studentId)
      ]);

      // Create a map of assignments by ID
      const assignmentMap = new Map();
      assignments.forEach(assignment => {
        assignmentMap.set(assignment.id, assignment);
      });

      // Merge submission data with assignment details, filtering out submissions for deleted assignments
      const result = submissions
        .map(submission => {
          const assignment = assignmentMap.get(submission.assignmentId);
          const course = enrollments.find(e => e.courseId === assignment?.courseId)?.course;
          
          // Only include submissions for assignments that still exist
          if (!assignment || !course) {
            return null;
          }
          
          return {
            id: submission.id,
            assignmentId: submission.assignmentId,
            assignmentTitle: assignment.title,
            courseId: assignment.courseId,
            courseTitle: course.title,
            instructorName: course.instructorName,
            submittedAt: submission.submittedAt.toDate(),
            status: submission.status,
            grade: submission.grade,
            maxScore: assignment.maxScore || 100,
            feedback: submission.feedback,
            content: (submission as any).content || '',
            attachments: (submission as any).attachments || []
          };
        })
        .filter(submission => submission !== null);

      setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error loading student submissions data:', error);
      throw error;
    }
  },

  // Clear cache for a specific student (useful when data changes)
  clearStudentCache(studentId: string) {
    const keys = [`dashboard_${studentId}`, `courses_${studentId}`, `assignments_${studentId}`, `submissions_${studentId}`];
    console.log('Clearing cache for student:', studentId, 'keys:', keys);
    keys.forEach(key => {
      const deleted = studentDataCache.delete(key);
      console.log(`Cache key ${key} deleted:`, deleted);
    });
  }
};

// Grade operations
export const gradeService = {
  async getGradesByCourse(courseId: string): Promise<FirestoreGrade[]> {
    const q = query(
      collections.grades(),
      where('courseId', '==', courseId),
      orderBy('calculatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreGrade));
  },

  async getGradeByStudentAndCourse(courseId: string, studentId: string): Promise<FirestoreGrade | null> {
    const q = query(
      collections.grades(),
      where('courseId', '==', courseId),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FirestoreGrade;
  },

  async createGrade(gradeData: Omit<FirestoreGrade, 'id' | 'calculatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collections.grades(), {
      ...gradeData,
      calculatedAt: now,
      isPublished: gradeData.isPublished ?? false,
    });
    return docRef.id;
  },

  async updateGrade(gradeId: string, gradeData: Partial<Omit<FirestoreGrade, 'id' | 'calculatedAt' | 'courseId' | 'studentId'>>): Promise<void> {
    const docRef = doc(db, 'grades', gradeId);
    await updateDoc(docRef, {
      ...gradeData,
      calculatedAt: Timestamp.now(),
    });
  },

  async deleteGrade(gradeId: string): Promise<void> {
    const docRef = doc(db, 'grades', gradeId);
    await deleteDoc(docRef);
  },

  // Helper function to calculate letter grade and grade points
  calculateLetterGradeAndPoints(finalGrade: number): { letterGrade: string; gradePoints: number } {
    if (finalGrade >= 97) return { letterGrade: 'A+', gradePoints: 4.0 };
    if (finalGrade >= 93) return { letterGrade: 'A', gradePoints: 4.0 };
    if (finalGrade >= 90) return { letterGrade: 'A-', gradePoints: 3.7 };
    if (finalGrade >= 87) return { letterGrade: 'B+', gradePoints: 3.3 };
    if (finalGrade >= 83) return { letterGrade: 'B', gradePoints: 3.0 };
    if (finalGrade >= 80) return { letterGrade: 'B-', gradePoints: 2.7 };
    if (finalGrade >= 77) return { letterGrade: 'C+', gradePoints: 2.3 };
    if (finalGrade >= 73) return { letterGrade: 'C', gradePoints: 2.0 };
    if (finalGrade >= 70) return { letterGrade: 'C-', gradePoints: 1.7 };
    if (finalGrade >= 67) return { letterGrade: 'D+', gradePoints: 1.3 };
    if (finalGrade >= 63) return { letterGrade: 'D', gradePoints: 1.0 };
    if (finalGrade >= 60) return { letterGrade: 'D-', gradePoints: 0.7 };
    return { letterGrade: 'F', gradePoints: 0.0 };
  },

  // Calculate final grade based on assignment grades
  async calculateFinalGrade(
    courseId: string, 
    studentId: string, 
    assignmentGrades: { assignmentId: string; grade: number; weight: number }[],
    method: 'weighted_average' | 'simple_average' = 'weighted_average'
  ): Promise<{ finalGrade: number; letterGrade: string; gradePoints: number }> {
    if (assignmentGrades.length === 0) {
      return { finalGrade: 0, letterGrade: 'F', gradePoints: 0.0 };
    }

    let finalGrade: number;
    
    if (method === 'weighted_average') {
      const totalWeight = assignmentGrades.reduce((sum, ag) => sum + ag.weight, 0);
      if (totalWeight === 0) {
        // Fallback to simple average if no weights
        finalGrade = assignmentGrades.reduce((sum, ag) => sum + ag.grade, 0) / assignmentGrades.length;
      } else {
        finalGrade = assignmentGrades.reduce((sum, ag) => sum + (ag.grade * ag.weight), 0) / totalWeight;
      }
    } else {
      // Simple average
      finalGrade = assignmentGrades.reduce((sum, ag) => sum + ag.grade, 0) / assignmentGrades.length;
    }

    const { letterGrade, gradePoints } = this.calculateLetterGradeAndPoints(finalGrade);
    return { finalGrade: Math.round(finalGrade * 100) / 100, letterGrade, gradePoints };
  },

  async publishCourseGrades(courseId: string): Promise<void> {
    // Fetch all grades for the course, then batch update isPublished
    const qy = query(collections.grades(), where('courseId', '==', courseId));
    const snap = await getDocs(qy);
    const batch = writeBatch(db);
    const now = Timestamp.now();
    snap.docs.forEach(d => {
      const ref = doc(db, 'grades', d.id);
      batch.update(ref, { isPublished: true, publishedAt: now } as any);
    });
    await batch.commit();
  }
};

// Attendance operations
export const attendanceService = {
  async getSheet(courseId: string, teacherId: string, ethiopianYear: number, ethiopianMonth: number): Promise<FirestoreAttendanceSheet | null> {
    const qy = query(
      collections.attendance(),
      where('courseId', '==', courseId),
      where('teacherId', '==', teacherId),
      where('ethiopianYear', '==', ethiopianYear),
      where('ethiopianMonth', '==', ethiopianMonth),
      limit(1)
    );
    const snap = await getDocs(qy);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as FirestoreAttendanceSheet;
  },

  async upsertSheet(
    courseId: string,
    teacherId: string,
    ethiopianYear: number,
    ethiopianMonth: number,
    partialRecords: Record<string, Record<number, boolean>>
  ): Promise<string> {
    // Try to get existing sheet
    const existing = await this.getSheet(courseId, teacherId, ethiopianYear, ethiopianMonth);
    const now = Timestamp.now();
    if (existing) {
      // Merge records client-side
      const mergedRecords: Record<string, Record<number, boolean>> = { ...(existing.records || {}) };
      Object.entries(partialRecords).forEach(([studentId, daysMap]) => {
        mergedRecords[studentId] = { ...(mergedRecords[studentId] || {}) };
        Object.entries(daysMap).forEach(([dayStr, present]) => {
          const day = Number(dayStr);
          mergedRecords[studentId][day] = !!present;
        });
      });
      const ref = doc(db, 'attendance', existing.id);
      await updateDoc(ref, { records: mergedRecords, updatedAt: now } as any);
      return existing.id;
    } else {
      const docRef = await addDoc(collections.attendance(), {
        courseId,
        teacherId,
        ethiopianYear,
        ethiopianMonth,
        records: partialRecords,
        submitted: false,
        createdAt: now,
        updatedAt: now,
      } as any);
      return docRef.id;
    }
  },

  async submitSheet(courseId: string, teacherId: string, ethiopianYear: number, ethiopianMonth: number): Promise<void> {
    const sheet = await this.getSheet(courseId, teacherId, ethiopianYear, ethiopianMonth);
    if (!sheet) throw new Error('Attendance sheet not found');
    const ref = doc(db, 'attendance', sheet.id);
    await updateDoc(ref, { submitted: true, submittedAt: Timestamp.now(), updatedAt: Timestamp.now() } as any);
  },

  async getSubmittedSheets(limitCount = 200): Promise<FirestoreAttendanceSheet[]> {
    const qy = query(
      collections.attendance(),
      where('submitted', '==', true),
      orderBy('submittedAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreAttendanceSheet));
  },

  async getSheetsByTeacher(teacherId: string, limitCount = 200): Promise<FirestoreAttendanceSheet[]> {
    const qy = query(
      collections.attendance(),
      where('teacherId', '==', teacherId),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreAttendanceSheet));
  },
};

// Admin activity helpers (derived from grades created by admins)
export const adminActivityService = {
  async getGradesCalculatedByUser(userId: string, limitCount = 200): Promise<FirestoreGrade[]> {
    const qy = query(
      collections.grades(),
      where('calculatedBy', '==', userId),
      orderBy('calculatedAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreGrade));
  }
};

// Admin actions audit trail
export interface FirestoreAdminAction {
  id: string;
  userId: string; // actor (admin/super_admin)
  action: 'user.create' | 'user.update' | 'user.delete' | 'course.create' | 'course.update' | 'course.delete' | 'event.create' | 'event.update' | 'event.delete' | 'announcement.create' | 'announcement.update' | 'announcement.delete' | 'grade.publish' | 'grade.recompute' | string;
  targetType: 'user' | 'course' | 'event' | 'announcement' | 'grade' | string;
  targetId?: string;
  details?: any;
  createdAt: Timestamp;
}

export const adminActionService = {
  async log(entry: Omit<FirestoreAdminAction, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'admin_actions'), {
      ...entry,
      createdAt: Timestamp.now(),
    } as any);
    return docRef.id;
  },
  async getActions(params: { userId?: string; actionPrefix?: string; limitCount?: number; since?: Date }): Promise<FirestoreAdminAction[]> {
    const col = collection(db, 'admin_actions');
    const conditions: any[] = [];
    if (params.userId) conditions.push(where('userId', '==', params.userId));
    // We cannot do startsWith in Firestore; fetch all then filter client-side for actionPrefix
    const qy = query(col, orderBy('createdAt', 'desc'), limit(params.limitCount || 200));
    const snap = await getDocs(qy);
    let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any as FirestoreAdminAction));
    if (params.actionPrefix) list = list.filter(a => a.action.startsWith(params.actionPrefix!));
    if (params.userId) list = list.filter(a => a.userId === params.userId);
    if (params.since) list = list.filter(a => a.createdAt.toDate() >= params.since!);
    return list;
  }
};

// Other Grades operations (bonus/attendance/discipline/custom)
export const otherGradeService = {
  async add(other: Omit<FirestoreOtherGrade, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const ref = await addDoc(collections.otherGrades(), { ...other, createdAt: now, updatedAt: now } as any);
    // Audit
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'grade.other.create', targetType: 'grade', targetId: ref.id, details: { courseId: other.courseId, studentId: other.studentId } }); } catch {}
    return ref.id;
  },
  async update(id: string, updates: Partial<FirestoreOtherGrade>): Promise<void> {
    const ref = doc(db, 'other_grades', id);
    await updateDoc(ref, { ...updates, updatedAt: Timestamp.now() } as any);
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'grade.other.update', targetType: 'grade', targetId: id, details: updates }); } catch {}
  },
  async delete(id: string): Promise<void> {
    const ref = doc(db, 'other_grades', id);
    await deleteDoc(ref);
    try { await adminActionService.log({ userId: auth.currentUser?.uid || 'unknown', action: 'grade.other.delete', targetType: 'grade', targetId: id }); } catch {}
  },
  async getByCourse(courseId: string): Promise<FirestoreOtherGrade[]> {
    const qy = query(collections.otherGrades(), where('courseId', '==', courseId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreOtherGrade));
  },
  async getByStudentInCourse(courseId: string, studentId: string): Promise<FirestoreOtherGrade[]> {
    const qy = query(collections.otherGrades(), where('courseId', '==', courseId), where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreOtherGrade));
  }
};

