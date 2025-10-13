import { collection, doc, getDocs, query, setDoc, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface GridEntry {
  courseId: string;
  studentId: string;
  day: number;
  monthKey: string; // YYYY-MM
  present: boolean;
  recordedBy: string;
  recordedAt: Timestamp;
}

const COL = 'attendance';

export const attendanceService = {
  async saveMonthlyGrid(courseId: string, monthKey: string, entries: GridEntry[]) {
    // use one doc per student per month: attendance_{courseId}_{studentId}_{monthKey}
    const grouped: Record<string, GridEntry[]> = {};
    entries.forEach(e => {
      const key = `${courseId}_${e.studentId}_${monthKey}`;
      (grouped[key] = grouped[key] || []).push(e);
    });
    await Promise.all(Object.entries(grouped).map(async ([key, list]) => {
      const [cId, studentId, mKey] = key.split('_');
      const days = list.map(l => l.day);
      await setDoc(doc(db, COL, `attendance_${key}`), {
        courseId: cId,
        studentId,
        monthKey: mKey,
        presentDays: Array.from(new Set(days)).sort((a,b)=>a-b),
        recordedBy: list[0].recordedBy,
        recordedAt: list[0].recordedAt,
      }, { merge: true });
    }));
  },

  async getMonthlyGrid(courseId: string, monthKey: string) {
    const qy = query(collection(db, COL), where('courseId','==', courseId), where('monthKey','==', monthKey));
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
};
