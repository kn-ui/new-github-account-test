import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceService, courseService, enrollmentService, FirestoreCourse, FirestoreEnrollment } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { getEthiopianDaysInMonth, toEthiopianDate } from '@/lib/ethiopianCalendar';

export default function TeacherAttendance() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<FirestoreCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [enrollments, setEnrollments] = useState<FirestoreEnrollment[]>([]);
  const [ethiopianYear, setEthiopianYear] = useState<number>(() => toEthiopianDate(new Date()).year);
  const [ethiopianMonth, setEthiopianMonth] = useState<number>(() => toEthiopianDate(new Date()).month);
  const [records, setRecords] = useState<Record<string, Record<number, boolean>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userProfile || userProfile.role !== 'teacher') return;
    (async () => {
      const myCourses = await courseService.getCoursesByInstructor(userProfile.id || (userProfile as any).uid || '');
      setCourses(myCourses);
    })();
  }, [userProfile]);

  useEffect(() => {
    if (!selectedCourseId) return;
    (async () => {
      const ens = await enrollmentService.getEnrollmentsByCourse(selectedCourseId);
      setEnrollments(ens);
      const sheet = await attendanceService.getSheet(
        selectedCourseId,
        userProfile!.id || (userProfile as any)!.uid || '',
        ethiopianYear,
        ethiopianMonth
      );
      setRecords(sheet?.records || {});
    })();
  }, [selectedCourseId, ethiopianYear, ethiopianMonth, userProfile]);

  if (!userProfile || userProfile.role !== 'teacher') {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Access denied</div>;
  }

  const daysInMonth = getEthiopianDaysInMonth(ethiopianYear, ethiopianMonth);
  const sortedEnrollments = useMemo(() => enrollments.slice().sort((a,b)=> (a.studentId||'').localeCompare(b.studentId||'')), [enrollments]);

  const toggleCell = (studentId: string, day: number) => {
    setRecords(prev => {
      const next = { ...prev };
      next[studentId] = { ...(next[studentId] || {}) };
      next[studentId][day] = !next[studentId]?.[day];
      return next;
    });
  };

  const saveDraft = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      await attendanceService.upsertSheet(
        selectedCourseId,
        userProfile!.id || (userProfile as any)!.uid || '',
        ethiopianYear,
        ethiopianMonth,
        records
      );
    } finally { setLoading(false); }
  };

  const submit = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      await attendanceService.upsertSheet(
        selectedCourseId,
        userProfile!.id || (userProfile as any)!.uid || '',
        ethiopianYear,
        ethiopianMonth,
        records
      );
      await attendanceService.submitSheet(
        selectedCourseId,
        userProfile!.id || (userProfile as any)!.uid || '',
        ethiopianYear,
        ethiopianMonth
      );
      navigate('/dashboard/my-courses');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-64">
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input type="number" className="w-28" value={ethiopianYear} onChange={(e)=> setEthiopianYear(parseInt(e.target.value)||ethiopianYear)} />
              <Input type="number" className="w-20" value={ethiopianMonth} onChange={(e)=> setEthiopianMonth(parseInt(e.target.value)||ethiopianMonth)} />
              <Button onClick={saveDraft} disabled={loading || !selectedCourseId} variant="outline">Save Draft</Button>
              <Button onClick={submit} disabled={loading || !selectedCourseId}>Submit to Admin</Button>
            </div>

            {selectedCourseId && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left">No</th>
                      <th className="px-2 py-2 text-left">Student</th>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                        <th key={d} className="px-2 py-2 text-center">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEnrollments.map((en, idx) => (
                      <tr key={en.id} className="border-t">
                        <td className="px-2 py-1">{idx + 1}</td>
                        <td className="px-2 py-1">{en.studentId}</td>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                          <td key={d} className="px-1 py-1 text-center">
                            <button
                              className={`w-6 h-6 rounded border ${records[en.studentId]?.[d] ? 'bg-green-500 border-green-600' : 'bg-white'}`}
                              onClick={() => toggleCell(en.studentId, d)}
                              aria-label={`Toggle ${en.studentId} day ${d}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
