/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import admin from '../config/firebase';
import { firestore as dbSvc } from '../config/firebase';

type Role = 'student' | 'teacher' | 'admin' | 'super_admin';

function ts(date: Date) {
  return (admin.firestore as any).Timestamp.fromDate(date);
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[], n: number) {
  const copy = [...arr]; const out: T[] = [];
  while (out.length < n && copy.length) out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
  return out;
}

async function clearCollection(collection: string) {
  if (!dbSvc) throw new Error('Firebase Admin not initialized');
  const snap = await dbSvc.collection(collection).get();
  if (snap.empty) return 0;
  const chunks: any[] = [];
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) chunks.push(docs.slice(i, i + 400));
  let deleted = 0;
  for (const chunk of chunks) {
    const batch = dbSvc.batch();
    for (const d of chunk) { batch.delete(d.ref); deleted++; }
    await batch.commit();
  }
  return deleted;
}

export async function clearAll(req: Request, res: Response) {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ success: false, message: 'Forbidden in production' });
  try {
    if (!dbSvc) return res.status(500).json({ success: false, message: 'Firebase Admin not initialized (set FIREBASE_* env vars or ADC)' });
    const cols = ['users','courses','announcements','assignments','submissions','enrollments','courseMaterials','events','blogs','forum_threads','forum_posts','activity_logs'];
    let total = 0;
    for (const c of cols) total += await clearCollection(c);
    return res.json({ success: true, message: 'Cleared all collections', data: { deleted: total } });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message || 'Clear failed' });
  }
}

export async function seedAll(req: Request, res: Response) {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ success: false, message: 'Forbidden in production' });
  try {
    if (!dbSvc) return res.status(500).json({ success: false, message: 'Firebase Admin not initialized (set FIREBASE_* env vars or ADC)' });
    // Optional: clear first if requested
    if (req.query.clear !== 'false') {
      const cols = ['users','courses','announcements','assignments','submissions','enrollments','courseMaterials','events','blogs','forum_threads','forum_posts','activity_logs'];
      for (const c of cols) await clearCollection(c);
    }

    // 1) Users
    const teachers = Array.from({ length: 5 }).map((_, i) => ({ displayName: `Teacher ${i+1}`, email: `teacher${i+1}@example.com`, role: 'teacher' as Role, isActive: true }));
    const students = Array.from({ length: 10 }).map((_, i) => ({ displayName: `Student ${i+1}`, email: `student${i+1}@example.com`, role: 'student' as Role, isActive: true }));
    const superAdmin = { displayName: 'Super Admin', email: 'superadmin@example.com', role: 'super_admin' as Role, isActive: true };

    const usersBatch = dbSvc.batch();
    for (const u of [...teachers, ...students, superAdmin]) {
      const ref = dbSvc.collection('users').doc();
      (u as any).uid = ref.id;
      usersBatch.set(ref, { ...u, uid: ref.id, createdAt: ts(new Date()), updatedAt: ts(new Date()) });
    }
    await usersBatch.commit();

    // 2) Courses
    const courseDefs = [
      { title: 'React Fundamentals', description: 'Intro to React', category: 'Web Dev', duration: 8, maxStudents: 50, syllabus: 'Components, Hooks', isActive: true },
      { title: 'Database Design', description: 'ERD, SQL', category: 'Database', duration: 10, maxStudents: 40, syllabus: 'Normalization, SQL', isActive: true },
      { title: 'Algorithms 101', description: 'Algorithms & DS', category: 'CS', duration: 10, maxStudents: 40, syllabus: 'Sorting, Trees', isActive: true },
      { title: 'Networking Basics', description: 'OSI/TCP', category: 'Networking', duration: 6, maxStudents: 35, syllabus: 'OSI, IP, TCP', isActive: true },
      { title: 'Operating Systems', description: 'Processes', category: 'Systems', duration: 8, maxStudents: 45, syllabus: 'Scheduling, Memory', isActive: true },
    ];
    const courses: { id: string; instructorUid: string; title: string }[] = [];
    const coursesBatch = dbSvc.batch();
    courseDefs.forEach((c, i) => {
      const ref = dbSvc.collection('courses').doc();
      const t = teachers[i % teachers.length] as any;
      coursesBatch.set(ref, { ...c, instructor: t.uid, instructorName: t.displayName, createdAt: ts(new Date()), updatedAt: ts(new Date()) });
      courses.push({ id: ref.id, instructorUid: t.uid, title: c.title });
    });
    await coursesBatch.commit();

    // 3) Enrollments
    const enrollBatch = dbSvc.batch();
    for (const s of students as any[]) {
      const selected = pick(courses, Math.max(3, Math.min(5, courses.length)));
      for (const c of selected) {
        const ref = dbSvc.collection('enrollments').doc();
        enrollBatch.set(ref, { courseId: c.id, studentId: s.uid, status: 'active', progress: randInt(20,95), completedLessons: [], enrolledAt: ts(new Date(Date.now()-randInt(1,20)*86400000)), lastAccessedAt: ts(new Date()) });
      }
    }
    await enrollBatch.commit();

    // 4) Assignments
    const assignments: { id: string; courseId: string }[] = [];
    for (const c of courses) {
      const batch = dbSvc.batch();
      const count = randInt(2,4);
      for (let i = 0; i < count; i++) {
        const ref = dbSvc.collection('assignments').doc();
        batch.set(ref, { courseId: c.id, title: `Assignment ${i+1}`, description: 'Complete the task', dueDate: ts(new Date(Date.now()+randInt(7,21)*86400000)), maxScore: 100, teacherId: c.instructorUid, createdAt: ts(new Date()), updatedAt: ts(new Date()) });
        assignments.push({ id: ref.id, courseId: c.id });
      }
      await batch.commit();
    }

    // 5) Submissions
    for (const a of assignments) {
      const subset = pick(students as any[], randInt(5, Math.min(10, students.length)));
      const batch = dbSvc.batch();
      for (const s of subset) {
        const status = Math.random() < 0.6 ? 'graded' : 'submitted';
        const ref = dbSvc.collection('submissions').doc();
        batch.set(ref, { courseId: a.courseId, assignmentId: a.id, studentId: s.uid, submittedAt: ts(new Date(Date.now()-randInt(0,10)*86400000)), status, grade: status==='graded'?randInt(60,100):undefined, feedback: status==='graded'?'Good job.':undefined, content: 'Submission content', maxScore: 100 });
      }
      await batch.commit();
    }

    // 6) Materials
    for (const c of courses) {
      const batch = dbSvc.batch();
      const m1 = dbSvc.collection('courseMaterials').doc();
      batch.set(m1, { courseId: c.id, title: 'Syllabus PDF', description: 'Course syllabus', type: 'document', fileUrl: 'https://example.com/syllabus.pdf', createdAt: ts(new Date()), updatedAt: ts(new Date()) });
      const m2 = dbSvc.collection('courseMaterials').doc();
      batch.set(m2, { courseId: c.id, title: 'Intro Video', description: 'Welcome video', type: 'video', externalLink: 'https://example.com/video', createdAt: ts(new Date()), updatedAt: ts(new Date()) });
      await batch.commit();
    }

    // 7) Announcements
    {
      const batch = dbSvc.batch();
      for (const t of teachers as any[]) {
        const a1 = dbSvc.collection('announcements').doc();
        batch.set(a1, { title: `Welcome from ${t.displayName}`, body: 'Let\'s have a great term!', authorId: t.uid, createdAt: ts(new Date()) });
        const c = pick(courses, 1)[0];
        const a2 = dbSvc.collection('announcements').doc();
        batch.set(a2, { title: 'Syllabus update', body: 'Please review the syllabus.', courseId: c.id, authorId: t.uid, createdAt: ts(new Date()) });
      }
      await batch.commit();
    }

    // 8) Events
    {
      const batch = dbSvc.batch();
      for (let i=0;i<6;i++) {
        const r = dbSvc.collection('events').doc();
        batch.set(r, { title: `Event ${i+1}`, date: ts(new Date(Date.now()+randInt(1,30)*86400000)), description: 'Upcoming event', createdBy: (teachers as any[])[i%teachers.length].uid, type: 'academic', time: '10:00', location: 'Main Hall', maxAttendees: 200, currentAttendees: randInt(10,100), status: 'scheduled' });
      }
      await batch.commit();
    }

    // 9) Blogs
    {
      const batch = dbSvc.batch();
      for (let i=0;i<4;i++) {
        const t = (teachers as any[])[i%teachers.length];
        const r = dbSvc.collection('blogs').doc();
        batch.set(r, { title: `Blog ${i+1}`, content: 'Lorem ipsum...', authorId: t.uid, authorName: t.displayName, createdAt: ts(new Date()), likes: randInt(0,50) });
      }
      await batch.commit();
    }

    // 10) Forum threads & posts
    for (let i=0;i<3;i++) {
      const author = (teachers as any[])[i%teachers.length];
      const thread = await dbSvc.collection('forum_threads').add({ title: `Thread ${i+1}`, body: 'Discussion ...', authorId: author.uid, authorName: author.displayName, createdAt: ts(new Date()), lastActivityAt: ts(new Date()) });
      const posts = randInt(2,4);
      const batch = dbSvc.batch();
      for (let p=0;p<posts;p++) {
        const poster = (students as any[])[p%students.length];
        const ref = dbSvc.collection('forum_posts').doc();
        batch.set(ref, { threadId: thread.id, body: `Post ${p+1}`, authorId: poster.uid, authorName: poster.displayName, createdAt: ts(new Date()) });
      }
      await batch.commit();
    }

    // 11) Activity logs
    {
      const everyone = [...teachers as any[], ...students as any[], superAdmin as any];
      const batch = dbSvc.batch();
      for (const u of everyone) {
        const days = randInt(3,10);
        for (let i=0;i<days;i++) {
          const dateKey = new Date(Date.now()-i*86400000).toISOString().slice(0,10).replace(/-/g,'');
          const id = `${u.uid}_${dateKey}`;
          const ref = dbSvc.collection('activity_logs').doc(id);
          batch.set(ref, { userId: u.uid, dateKey, createdAt: ts(new Date(Date.now()-i*86400000)), source: 'seed' });
        }
      }
      await batch.commit();
    }

    return res.json({ success: true, message: 'Seeding complete', data: { users: 5+10+1 } });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ success: false, message: e.message || 'Seed failed' });
  }
}

