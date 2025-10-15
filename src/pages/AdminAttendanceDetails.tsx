/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceService, courseService, userService, FirestoreAttendanceSheet, FirestoreCourse, FirestoreUser } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminAttendanceDetails() {
  const { userProfile } = useAuth();
  const { sheetId } = useParams<{ sheetId: string }>();
  const [sheet, setSheet] = useState<FirestoreAttendanceSheet | null>(null);
  const [course, setCourse] = useState<FirestoreCourse | null>(null);
  const [teacher, setTeacher] = useState<FirestoreUser | null>(null);
  const [studentMap, setStudentMap] = useState<Record<string, FirestoreUser | null>>({});

  useEffect(() => {
    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) return;
    if (!sheetId) return;
    (async () => {
      const sh = await attendanceService.getSheetById(sheetId);
      if (!sh) return;
      setSheet(sh);
      const c = await courseService.getCourseById(sh.courseId);
      setCourse(c);
      const t = await userService.getUserById(sh.teacherId);
      setTeacher(t);
      const studentIds = Object.keys(sh.records || {});
      if (studentIds.length) {
        const result = await userService.getUsersByIds(studentIds);
        setStudentMap(result);
      } else {
        setStudentMap({});
      }
    })();
  }, [sheetId, userProfile]);

  const maxDay = useMemo(() => {
    if (!sheet) return 30;
    const days = Object.values(sheet.records || {}).flatMap(r => Object.keys(r).map(d => Number(d)));
    return days.length ? Math.max(...days) : 30;
  }, [sheet]);

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Access denied</div>;
  }

  if (!sheet) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
              <div>
                <div>Course: <span className="font-medium">{course?.title || sheet.courseId}</span></div>
                <div>Teacher: <span className="font-medium">{teacher?.displayName || sheet.teacherId}</span></div>
                <div>Month: <span className="font-medium">{sheet.ethiopianYear}/{sheet.ethiopianMonth}</span></div>
              </div>
              <Link to="/dashboard/admin-attendance"><Button variant="outline">Back</Button></Link>
            </div>
            <div className="overflow-x-auto">
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
                  {Object.keys(sheet.records || {}).map(studentId => {
                    const daysMap = sheet.records[studentId] || {};
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
