import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceService, courseService, userService, FirestoreAttendanceSheet, FirestoreCourse, FirestoreUser } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

export default function AdminAttendance() {
  const { userProfile } = useAuth();
  const [sheets, setSheets] = useState<FirestoreAttendanceSheet[]>([]);
  const [courseMap, setCourseMap] = useState<Record<string, FirestoreCourse | null>>({});
  const [teacherMap, setTeacherMap] = useState<Record<string, FirestoreUser | null>>({});
  const [filterCourse, setFilterCourse] = useState('all');
  const [selectedSheet, setSelectedSheet] = useState<FirestoreAttendanceSheet | null>(null);
  const [sheetDetailsOpen, setSheetDetailsOpen] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<FirestoreUser[]>([]);

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

  const handleViewDetails = async (sheet: FirestoreAttendanceSheet) => {
    setSelectedSheet(sheet);
    
    // Get enrolled students for the course
    try {
      const { enrollmentService } = await import('@/lib/firestore');
      const enrollments = await enrollmentService.getEnrollmentsByCourse(sheet.courseId);
      const studentIds = enrollments.map(e => e.studentId);
      
      // Get student details
      const studentPromises = studentIds.map(async (studentId) => {
        const student = await userService.getUserById(studentId);
        return student;
      });
      const students = await Promise.all(studentPromises);
      setEnrolledStudents(students.filter(s => s !== null) as FirestoreUser[]);
    } catch (error) {
      console.error('Error loading enrolled students:', error);
      setEnrolledStudents([]);
    }
    
    setSheetDetailsOpen(true);
  };

  const getMonthName = (monthNumber: number): string => {
    const ethiopianMonths = [
      'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
      'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
    ];
    return ethiopianMonths[monthNumber - 1] || `Month ${monthNumber}`;
  };

  const getDaysInMonth = (month: number): number => {
    // Ethiopian calendar: 12 months of 30 days + 13th month (Pagume) of 5-6 days
    return month === 13 ? 6 : 30;
  };

  const courses = Array.from(new Set(sheets.map(s => s.courseId)));

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
                    <div className="flex items-center gap-2">
                      <Badge className={s.submitted ? 'bg-green-100 text-green-800 border-green-200' : ''}>{s.submitted ? 'Submitted' : 'Draft'}</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDetails(s)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Ethiopian {s.ethiopianYear}/{s.ethiopianMonth}</div>
                </div>
              ))}
              {sheets.length === 0 && (
                <div className="text-sm text-gray-500">No submitted attendance yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Attendance Details Modal */}
        <Dialog open={sheetDetailsOpen} onOpenChange={setSheetDetailsOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Attendance Details - {selectedSheet && courseMap[selectedSheet.courseId]?.title || 'Unknown Course'}
              </DialogTitle>
              <div className="text-sm text-gray-600">
                {selectedSheet && (
                  <>
                    Teacher: {teacherMap[selectedSheet.teacherId]?.displayName || 'Unknown Teacher'} | 
                    Period: {getMonthName(selectedSheet.ethiopianMonth)} {selectedSheet.ethiopianYear} (Ethiopian Calendar)
                  </>
                )}
              </div>
            </DialogHeader>
            
            {selectedSheet && (
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-2 py-1 text-left font-medium">Student Name</th>
                        {Array.from({ length: getDaysInMonth(selectedSheet.ethiopianMonth) }, (_, i) => i + 1).map(day => (
                          <th key={day} className="border border-gray-300 px-1 py-1 text-center font-medium min-w-[30px]">
                            {day}
                          </th>
                        ))}
                        <th className="border border-gray-300 px-2 py-1 text-center font-medium">Total Present</th>
                        <th className="border border-gray-300 px-2 py-1 text-center font-medium">Total Days</th>
                        <th className="border border-gray-300 px-2 py-1 text-center font-medium">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledStudents.map(student => {
                        const studentRecords = selectedSheet.records?.[student.id!] || {};
                        const totalDays = getDaysInMonth(selectedSheet.ethiopianMonth);
                        const presentDays = Object.values(studentRecords).filter(Boolean).length;
                        const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
                        
                        return (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-2 py-1 font-medium">
                              {student.displayName}
                            </td>
                            {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
                              const isPresent = studentRecords[day];
                              return (
                                <td key={day} className="border border-gray-300 px-1 py-1 text-center">
                                  <span className={`inline-block w-4 h-4 rounded ${
                                    isPresent === true 
                                      ? 'bg-green-500' 
                                      : isPresent === false 
                                        ? 'bg-red-500' 
                                        : 'bg-gray-200'
                                  }`} title={
                                    isPresent === true 
                                      ? 'Present' 
                                      : isPresent === false 
                                        ? 'Absent' 
                                        : 'Not recorded'
                                  } />
                                </td>
                              );
                            })}
                            <td className="border border-gray-300 px-2 py-1 text-center font-medium text-green-600">
                              {presentDays}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              {totalDays}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center font-medium">
                              <span className={`${
                                percentage >= 80 
                                  ? 'text-green-600' 
                                  : percentage >= 60 
                                    ? 'text-yellow-600' 
                                    : 'text-red-600'
                              }`}>
                                {percentage}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded bg-green-500"></span>
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded bg-red-500"></span>
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded bg-gray-200"></span>
                    <span>Not recorded</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
