import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { analyticsService, courseService, enrollmentService, submissionService, assignmentService, userService } from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Clock,
  Star,
  Award,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardHero from '@/components/DashboardHero';

interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  averageProgress: number;
  averageGrade: number;
  completionRate: number;
  totalAssignments: number;
  totalSubmissions: number;
  gradedSubmissions: number;
}

interface StudentPerformance {
  studentId: string;
  studentName: string;
  courseTitle: string;
  progress: number;
  averageGrade: number;
  totalAssignments: number;
  completedAssignments: number;
  lastActivity: Date;
}

export default function TeacherAnalytics() {
  const { t } = useI18n();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [courses, setCourses] = useState<any[]>([]);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [overallStats, setOverallStats] = useState<any>(null);

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'teacher') {
      loadAnalytics();
    }
  }, [currentUser?.uid, userProfile?.role]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load teacher's courses
      const teacherCourses = await courseService.getCoursesByInstructor(currentUser!.uid);
      
      // If no courses, keep lists empty
      if (teacherCourses.length === 0) {
        setCourses([]);
        setOverallStats(await analyticsService.getTeacherStats(currentUser!.uid));
        setCourseAnalytics([]);
        setStudentPerformance([]);
        setLoading(false);
        return;
      }
      
      setCourses(teacherCourses);

      // Load overall stats
      const stats = await analyticsService.getTeacherStats(currentUser!.uid);
      setOverallStats(stats);

      // Load course-specific analytics
      const courseAnalyticsPromises = teacherCourses.map(async (course) => {
        try {
          // Get enrollments for this course
          const enrollments = await enrollmentService.getEnrollmentsByCourse(course.id);
          const activeEnrollments = enrollments.filter(e => e.status === 'active');
          
          // Calculate average progress
          const averageProgress = activeEnrollments.length > 0 
            ? activeEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / activeEnrollments.length
            : 0;

          // Get assignments for this course
          const assignments = await assignmentService.getAssignmentsByCourse(course.id);
          
          // Get submissions for all assignments
          const submissionsPromises = assignments.map(async (assignment) => {
            try {
              const submissions = await submissionService.getSubmissionsByAssignment(assignment.id);
              return submissions;
            } catch (error) {
              console.error(`Error loading submissions for assignment ${assignment.id}:`, error);
              return [];
            }
          });
          
          const submissionsArrays = await Promise.all(submissionsPromises);
          const allSubmissions = submissionsArrays.flat();
          
          // Calculate average grade
          const gradedSubmissions = allSubmissions.filter(s => s.status === 'graded' && s.grade !== undefined);
          const averageGrade = gradedSubmissions.length > 0
            ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
            : 0;

          // Calculate completion rate
          const completionRate = activeEnrollments.length > 0
            ? (activeEnrollments.filter(e => (e.progress || 0) === 100).length / activeEnrollments.length) * 100
            : 0;

          return {
            courseId: course.id,
            courseTitle: course.title,
            totalStudents: activeEnrollments.length,
            averageProgress: Math.round(averageProgress),
            averageGrade: Math.round(averageGrade),
            completionRate: Math.round(completionRate),
            totalAssignments: assignments.length,
            totalSubmissions: allSubmissions.length,
            gradedSubmissions: gradedSubmissions.length
          };
        } catch (error) {
          console.error(`Error loading analytics for course ${course.id}:`, error);
          return null;
        }
      });

      const courseAnalyticsResults = await Promise.all(courseAnalyticsPromises);
      const validCourseAnalytics = courseAnalyticsResults.filter(result => result !== null) as CourseAnalytics[];
      setCourseAnalytics(validCourseAnalytics);

      // Load student performance data
      const studentPerformancePromises = teacherCourses.map(async (course) => {
        try {
          const enrollments = await enrollmentService.getEnrollmentsByCourse(course.id);
          const assignments = await assignmentService.getAssignmentsByCourse(course.id);
          
          const studentPromises = enrollments.map(async (enrollment) => {
            try {
              // Get student's submissions for this course
              const studentSubmissions = await submissionService.getSubmissionsByStudent(enrollment.studentId);
              const courseSubmissions = studentSubmissions.filter(s => 
                assignments.some(a => a.id === s.assignmentId)
              );
              
              const gradedSubmissions = courseSubmissions.filter(s => s.status === 'graded' && s.grade !== undefined);
              const averageGrade = gradedSubmissions.length > 0
                ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
                : 0;

              const completedAssignments = courseSubmissions.filter(s => s.status === 'graded').length;
              
              // Get student display name
              let displayName = enrollment.studentId;
              try {
                const u = await userService.getUserById(enrollment.studentId);
                if (u && (u as any).displayName) displayName = (u as any).displayName;
              } catch {
                // fallback remains id
              }

              return {
                studentId: enrollment.studentId,
                studentName: displayName,
                courseTitle: course.title,
                progress: enrollment.progress || 0,
                averageGrade: Math.round(averageGrade),
                totalAssignments: assignments.length,
                completedAssignments,
                lastActivity: (enrollment as any).lastAccessedAt?.toDate ? (enrollment as any).lastAccessedAt.toDate() : new Date()
              };
            } catch (error) {
              console.error(`Error loading student performance for ${enrollment.studentId}:`, error);
              return null;
            }
          });

          const studentResults = await Promise.all(studentPromises);
          return studentResults.filter(result => result !== null) as StudentPerformance[];
        } catch (error) {
          console.error(`Error loading student performance for course ${course.id}:`, error);
          return [];
        }
      });

      const studentPerformanceArrays = await Promise.all(studentPerformancePromises);
      const allStudentPerformance = studentPerformanceArrays.flat();
      setStudentPerformance(allStudentPerformance);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourseAnalytics = selectedCourse === 'all' 
    ? courseAnalytics 
    : courseAnalytics.filter(course => course.courseId === selectedCourse);

  const filteredStudentPerformance = selectedCourse === 'all'
    ? studentPerformance
    : studentPerformance.filter(student => student.courseTitle === courses.find(c => c.id === selectedCourse)?.title);

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!userProfile || userProfile.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only teachers can access this page.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title="Analytics Dashboard"
        subtitle="Track course performance and student progress"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Course Analytics</h2>
              <p className="text-sm text-gray-600">Select a course to view detailed analytics</p>
            </div>
            <div className="w-64">
              <Label htmlFor="course-select">Select Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overallStats?.activeCourses || courses.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overallStats?.totalStudents || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Average Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {courseAnalytics.length > 0 
                  ? Math.round(courseAnalytics.reduce((sum, c) => sum + c.averageProgress, 0) / courseAnalytics.length)
                  : 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Average Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {courseAnalytics.length > 0 
                  ? Math.round(courseAnalytics.reduce((sum, c) => sum + c.averageGrade, 0) / courseAnalytics.length)
                  : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {filteredCourseAnalytics.map(course => (
            <Card key={course.courseId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {course.courseTitle}
                </CardTitle>
                <CardDescription>Course Performance Overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{course.totalStudents}</div>
                    <div className="text-sm text-gray-600">Students</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{course.averageProgress}%</div>
                    <div className="text-sm text-gray-600">Avg Progress</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{course.averageGrade}</div>
                    <div className="text-sm text-gray-600">Avg Grade</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{course.completionRate}%</div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Assignments: {course.totalAssignments}</span>
                    <span>Submissions: {course.totalSubmissions}</span>
                    <span>Graded: {course.gradedSubmissions}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Student Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Performance
            </CardTitle>
            <CardDescription>Individual student progress and grades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Course</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Progress</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Avg Grade</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Assignments</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudentPerformance.map((student, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{student.studentName}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {student.courseTitle}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getProgressColor(student.progress)}`}
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${getGradeColor(student.averageGrade)}`}>
                          {student.averageGrade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {student.completedAssignments}/{student.totalAssignments}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {student.lastActivity.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredStudentPerformance.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No student data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}