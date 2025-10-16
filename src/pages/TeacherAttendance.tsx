import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceService, courseService, enrollmentService, userService, FirestoreCourse, FirestoreEnrollment, FirestoreUser } from '@/lib/firestore';
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
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [studentSections, setStudentSections] = useState<Record<string, string>>({});
  const [selectedSection, setSelectedSection] = useState<string>('all');
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
      // Resolve student names and sections for display
      try {
        const ids = Array.from(new Set(ens.map(e => e.studentId)));
        const nameMap: Record<string, string> = {};
        const sectionMap: Record<string, string> = {};
        await Promise.all(ids.map(async (id) => {
          try {
            const u = await userService.getUserById(id);
            if (u?.displayName) nameMap[id] = u.displayName;
            if (u?.classSection) sectionMap[id] = u.classSection;
          } catch {}
        }));
        setStudentNames(nameMap);
        setStudentSections(sectionMap);
      } catch {}
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
  const todayEthiopian = toEthiopianDate(new Date());
  const isCurrentMonth = todayEthiopian.year === ethiopianYear && todayEthiopian.month === ethiopianMonth;
  
  // Filter enrollments by section and sort
  const filteredAndSortedEnrollments = useMemo(() => {
    let filtered = enrollments;
    if (selectedSection !== 'all') {
      filtered = enrollments.filter(en => studentSections[en.studentId] === selectedSection);
    }
    return filtered.slice().sort((a,b)=> (studentNames[a.studentId] || a.studentId).localeCompare(studentNames[b.studentId] || b.studentId));
  }, [enrollments, selectedSection, studentSections, studentNames]);

  // Get unique sections for filter dropdown
  const availableSections = useMemo(() => {
    const sections = new Set<string>();
    enrollments.forEach(en => {
      const section = studentSections[en.studentId];
      if (section) sections.add(section);
    });
    return Array.from(sections).sort();
  }, [enrollments, studentSections]);

  const toggleCell = (studentId: string, day: number) => {
    setRecords(prev => {
      const next = { ...prev };
      next[studentId] = { ...(next[studentId] || {}) };
      next[studentId][day] = !next[studentId]?.[day];
      return next;
    });
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
              {selectedCourseId && availableSections.length > 0 && (
                <div className="w-48">
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger><SelectValue placeholder="Filter by section" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {availableSections.map(section => (
                        <SelectItem key={section} value={section}>Section {section}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>Ethiopian:</span>
                <Input type="number" className="w-28" value={ethiopianYear} onChange={(e)=> setEthiopianYear(parseInt(e.target.value)||ethiopianYear)} />
                <Input type="number" className="w-20" value={ethiopianMonth} onChange={(e)=> setEthiopianMonth(parseInt(e.target.value)||ethiopianMonth)} />
                <span className="ml-2 text-xs text-gray-500">Today: {todayEthiopian.year}/{todayEthiopian.month}/{todayEthiopian.day}</span>
              </div>
              <Button onClick={submit} disabled={loading || !selectedCourseId}>Submit to Admin</Button>
            </div>

            {selectedCourseId && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left">No</th>
                      <th className="px-2 py-2 text-left">Student</th>
                      <th className="px-2 py-2 text-left">Section</th>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                        <th key={d} className={`px-2 py-2 text-center ${isCurrentMonth && d === todayEthiopian.day ? 'bg-yellow-100 border-2 border-yellow-400 font-bold' : ''}`}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedEnrollments.map((en, idx) => (
                      <tr key={en.id} className="border-t">
                        <td className="px-2 py-1">{idx + 1}</td>
                        <td className="px-2 py-1">{studentNames[en.studentId] || en.studentId}</td>
                        <td className="px-2 py-1">{studentSections[en.studentId] || '-'}</td>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                          <td key={d} className={`px-1 py-1 text-center ${isCurrentMonth && d === todayEthiopian.day ? 'bg-yellow-100 border-2 border-yellow-400' : ''}`}>
                            <button
                              className={`w-6 h-6 rounded border ${records[en.studentId]?.[d] ? 'bg-green-500 border-green-600' : 'bg-white'} ${isCurrentMonth && d === todayEthiopian.day ? 'ring-2 ring-yellow-400' : ''}`}
                              onClick={() => { if (!isCurrentMonth || d !== todayEthiopian.day) return; toggleCell(en.studentId, d); }}
                              aria-label={`Toggle ${en.studentId} day ${d}`}
                              disabled={!isCurrentMonth || d !== todayEthiopian.day}
                              title={!isCurrentMonth || d !== todayEthiopian.day ? 'Only current date is selectable' : 'Mark present/absent'}
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
