import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { courseService, enrollmentService, userService, Timestamp } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface CourseLite { id: string; title: string; }
interface Student { id: string; name: string; email?: string; }

export default function TeacherAttendance() {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState<CourseLite[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [daysInMonth, setDaysInMonth] = useState<number>(30);
  const [monthKey, setMonthKey] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });
  const [grid, setGrid] = useState<Record<string, Record<number, boolean>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!userProfile?.uid) return;
      const myCourses = await courseService.getAllCoursesByInstructor(userProfile.uid);
      setCourses(myCourses.map(c => ({ id: c.id, title: c.title })));
    };
    load();
  }, [userProfile?.uid]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedCourseId) return;
      const ens = await enrollmentService.getEnrollmentsByCourse(selectedCourseId);
      const ids = Array.from(new Set(ens.map(e => e.studentId)));
      const list: Student[] = [];
      for (const id of ids) {
        const u = await userService.getUserById(id);
        list.push({ id, name: u?.displayName || id, email: (u as any)?.email });
      }
      list.sort((a,b) => a.name.localeCompare(b.name));
      setStudents(list);
      // init grid for this course if not present
      setGrid(prev => prev[selectedCourseId] ? prev : { ...prev, [selectedCourseId]: {} });
    };
    loadStudents();
  }, [selectedCourseId]);

  useEffect(() => {
    const d = new Date(monthKey + '-01T00:00:00');
    setDaysInMonth(new Date(d.getFullYear(), d.getMonth()+1, 0).getDate());
  }, [monthKey]);

  const toggle = (studentId: string, day: number) => {
    setGrid(prev => {
      const courseGrid = prev[selectedCourseId] || {};
      const key = `${monthKey}:${studentId}:${day}`;
      const current = !!(courseGrid as any)[key];
      return {
        ...prev,
        [selectedCourseId]: { ...courseGrid, [key]: !current }
      };
    });
  };

  const save = async () => {
    if (!selectedCourseId || !userProfile) return;
    setSaving(true);
    try {
      const entries: Array<{ courseId: string; studentId: string; day: number; monthKey: string; present: boolean; recordedBy: string; recordedAt: Timestamp }>=[];
      const courseGrid = grid[selectedCourseId] || {};
      students.forEach(s => {
        for (let d=1; d<=daysInMonth; d++) {
          const key = `${monthKey}:${s.id}:${d}`;
          const present = !!(courseGrid as any)[key];
          if (present) {
            entries.push({ courseId: selectedCourseId, studentId: s.id, day: d, monthKey, present: true, recordedBy: userProfile.uid || (userProfile as any).id, recordedAt: Timestamp.now() });
          }
        }
      });
      const { attendanceService } = await import('@/services/attendance');
      await attendanceService.saveMonthlyGrid(selectedCourseId, monthKey, entries);
      alert('Attendance saved and reported');
    } catch (e) {
      console.error(e);
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-80">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Input type="month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} />
            </div>
            <Button onClick={save} disabled={!selectedCourseId || saving}>{saving ? 'Saving...' : 'Save & Report'}</Button>
          </div>
          {selectedCourseId && students.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">No</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    {Array.from({ length: daysInMonth }, (_,i) => i+1).map(d => (
                      <th key={d} className="px-2 py-2 text-center">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2">{idx+1}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{s.name}</td>
                      {Array.from({ length: daysInMonth }, (_,i) => i+1).map(d => {
                        const courseGrid = grid[selectedCourseId] || {};
                        const key = `${monthKey}:${s.id}:${d}`;
                        const checked = !!(courseGrid as any)[key];
                        return (
                          <td key={d} className="px-1 py-1 text-center">
                            <input type="checkbox" checked={checked} onChange={() => toggle(s.id, d)} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selectedCourseId && students.length === 0 && (
            <div className="text-sm text-gray-500">No students enrolled.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
