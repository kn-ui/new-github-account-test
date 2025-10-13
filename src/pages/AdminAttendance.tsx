import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { courseService, userService } from '@/lib/firestore';

export default function AdminAttendance() {
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [monthKey, setMonthKey] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });
  const [report, setReport] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      // Find all teachers by role
      const allTeachers = await (await import('@/lib/firestore')).userService.getTeachers();
      setTeacherIds(allTeachers.map(t => t.id || t.uid));
    };
    load();
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      if (!selectedTeacherId) return;
      const cs = await courseService.getAllCoursesByInstructor(selectedTeacherId);
      setCourses(cs.map(c => ({ id: c.id, title: c.title })));
    };
    loadCourses();
  }, [selectedTeacherId]);

  useEffect(() => {
    const loadReport = async () => {
      if (!selectedTeacherId || !selectedCourseId) return;
      const { attendanceService } = await import('@/services/attendance');
      const data = await attendanceService.getMonthlyGrid(selectedCourseId, monthKey);
      setReport(data);
    };
    loadReport();
  }, [selectedTeacherId, selectedCourseId, monthKey]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-64">
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {teacherIds.map(id => (
                    <SelectItem key={id} value={id}>{id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-64">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <input type="month" className="border rounded px-2 py-2" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} />
          </div>

          {report.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Student</th>
                    <th className="px-3 py-2 text-left">Days Present</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.map((row: any) => (
                    <tr key={row.studentId}>
                      <td className="px-3 py-2">{row.studentName || row.studentId}</td>
                      <td className="px-3 py-2">{row.presentDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No attendance submitted for this selection.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
