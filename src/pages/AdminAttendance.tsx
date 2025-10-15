import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceService, courseService, userService, FirestoreAttendanceSheet, FirestoreCourse, FirestoreUser } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminAttendance() {
  const { userProfile } = useAuth();
  const [sheets, setSheets] = useState<FirestoreAttendanceSheet[]>([]);
  const [courseMap, setCourseMap] = useState<Record<string, FirestoreCourse | null>>({});
  const [teacherMap, setTeacherMap] = useState<Record<string, FirestoreUser | null>>({});
  const [filterCourse, setFilterCourse] = useState('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<FirestoreAttendanceSheet | null>(null);
  const [studentMap, setStudentMap] = useState<Record<string, FirestoreUser | null>>({});

  useEffect(() => {
    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) return;
    (async () => {
      const list = await attendanceService.getSubmittedSheets(500);
      setSheets(list);
      const courseIds = Array.from(new Set(list.map(s => s.courseId)));
      const teacherIds = Array.from(new Set(list.map(s => s.teacherId)));
      const courses: Record<string, FirestoreCourse | null> = {};
      await Promise.all(courseIds.map(async id => { courses[id] = await courseService.getCourseById(id); }));
      const teachers: Record<string, FirestoreUser | null> = {};
      await Promise.all(teacherIds.map(async id => { teachers[id] = await userService.getUserById(id); }));
      setCourseMap(courses);
      setTeacherMap(teachers);
    })();
  }, [userProfile]);

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Access denied</div>;
  }

  const courses = Array.from(new Set(sheets.map(s => s.courseId)));

  const openDetails = async (sheet: FirestoreAttendanceSheet) => {
    setSelectedSheet(sheet);
    // Build student list from sheet records and fetch names
    const studentIds = Object.keys(sheet.records || {});
    if (studentIds.length > 0) {
      const result = await userService.getUsersByIds(studentIds);
      setStudentMap(result);
    } else {
      setStudentMap({});
    }
    setDetailOpen(true);
  };

  const maxDay = useMemo(() => {
    if (!selectedSheet) return 30;
    // Determine max day present in records
    const days = Object.values(selectedSheet.records || {}).flatMap(r => Object.keys(r).map(d => Number(d)));
    return days.length ? Math.max(...days) : 30;
  }, [selectedSheet]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Submitted Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 w-72">
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger><SelectValue placeholder="Filter by course" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(cid => (
                    <SelectItem key={cid} value={cid}>{courseMap[cid]?.title || cid}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              {sheets
                .filter(s => filterCourse === 'all' || s.courseId === filterCourse)
                .map(s => (
                <div key={s.id} className="p-3 border rounded bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">{courseMap[s.courseId]?.title || s.courseId}</div>
                      <div className="text-sm text-gray-600">Teacher: {teacherMap[s.teacherId]?.displayName || s.teacherId}</div>
                    </div>
                    <Badge className={s.submitted ? 'bg-green-100 text-green-800 border-green-200' : ''}>{s.submitted ? 'Submitted' : 'Draft'}</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Ethiopian {s.ethiopianYear}/{s.ethiopianMonth}</div>
                  <div className="mt-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => openDetails(s)}>View Details</Button>
                  </div>
                </div>
              ))}
              {sheets.length === 0 && (
                <div className="text-sm text-gray-500">No submitted attendance yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
          </DialogHeader>
          {selectedSheet ? (
            <div className="overflow-x-auto">
              <div className="mb-3 text-sm text-gray-600">
                <div>Course: <span className="font-medium">{courseMap[selectedSheet.courseId]?.title || selectedSheet.courseId}</span></div>
                <div>Teacher: <span className="font-medium">{teacherMap[selectedSheet.teacherId]?.displayName || selectedSheet.teacherId}</span></div>
                <div>Month: <span className="font-medium">{selectedSheet.ethiopianYear}/{selectedSheet.ethiopianMonth}</span></div>
              </div>
              <table className="min-w-full border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 text-left text-xs">Student</th>
                    {Array.from({ length: maxDay }, (_, i) => i + 1).map(day => (
                      <th key={day} className="border px-1 py-1 text-center text-xs">{day}</th>
                    ))}
                    <th className="border px-2 py-1 text-center text-xs">Present</th>
                    <th className="border px-2 py-1 text-center text-xs">Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(selectedSheet.records || {}).map(studentId => {
                    const daysMap = selectedSheet.records[studentId] || {};
                    const presentCount = Object.values(daysMap).filter(Boolean).length;
                    const absentCount = Object.values(daysMap).filter(v => !v).length;
                    return (
                      <tr key={studentId}>
                        <td className="border px-2 py-1 text-xs whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis">
                          {studentMap[studentId]?.displayName || studentId}
                        </td>
                        {Array.from({ length: maxDay }, (_, i) => i + 1).map(day => (
                          <td key={day} className={`border px-1 py-1 text-center text-xs ${daysMap[day] === true ? 'bg-green-50' : daysMap[day] === false ? 'bg-red-50' : ''}`}>
                            {daysMap[day] === true ? '✓' : daysMap[day] === false ? '×' : ''}
                          </td>
                        ))}
                        <td className="border px-2 py-1 text-center text-xs">{presentCount}</td>
                        <td className="border px-2 py-1 text-center text-xs">{absentCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No data</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
