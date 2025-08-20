import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService, courseService, enrollmentService, submissionService, announcementService } from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  FileText, 
  Bell, 
  Clock,
  Eye,
  Plus,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherOverview() {
  const [stats, setStats] = useState<any>(null);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        if (currentUser?.uid) {
          // Load teacher stats
          const teacherStats = await analyticsService.getTeacherStats(currentUser.uid);
          setStats(teacherStats);

          // Load my courses
          const courses = await courseService.getCoursesByInstructor(currentUser.uid);
          setMyCourses(courses);

          // Load recent submissions for my courses
          const allSubmissions = await Promise.all(
            courses.map(async (course) => {
              try {
                const submissions = await submissionService.getSubmissionsByCourse(course.id);
                return submissions.map((submission: any) => ({
                  ...submission,
                  courseTitle: course.title,
                }));
              } catch {
                return [];
              }
            })
          );
          const flatSubmissions = allSubmissions.flat().sort((a: any, b: any) => 
            b.submittedAt.toDate() - a.submittedAt.toDate()
          );
          setRecentSubmissions(flatSubmissions.slice(0, 5));

          // Load announcements for my courses
          const courseAnnouncements = await Promise.all(
            courses.map(async (course) => {
              const courseAnnouncements = await announcementService.getAnnouncements(course.id, 3);
              return courseAnnouncements.map((announcement: any) => ({
                ...announcement,
                courseTitle: course.title,
              }));
            })
          );
          const allAnnouncements = courseAnnouncements.flat().sort((a: any, b: any) => 
            b.createdAt.toDate() - a.createdAt.toDate()
          );
          setRecentAnnouncements(allAnnouncements.slice(0, 5));

          // Derive top students from enrollments (highest progress across the teacher's courses)
          try {
            const allEnrollments = await Promise.all(
              courses.map(async (course) => {
                const list = await enrollmentService.getEnrollmentsByCourse(course.id);
                return list.map((en: any) => ({ ...en, courseTitle: course.title }));
              })
            );
            const flatEnrollments = allEnrollments.flat();
            const sortedByProgress = flatEnrollments.sort((a, b) => (b.progress || 0) - (a.progress || 0));
            setTopStudents(sortedByProgress.slice(0, 3).map((en) => ({
              name: en.studentId,
              course: en.courseTitle,
              progress: en.progress || 0,
            })));
          } catch {}
        }
      } catch (error) {
        console.error('Failed to load teacher dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser?.uid]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600">Manage your courses and students</p>
        </div>
        <div className="flex space-x-3">
          <Button asChild>
            <Link to="/create-course">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/assignments">
              <FileText className="h-4 w-4 mr-2" />
              Create Assignment
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCourses || 0}</div>
            <p className="text-xs text-muted-foreground">
              {myCourses.length} total courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled across all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingReviews || 0}</div>
            <p className="text-xs text-muted-foreground">
              Submissions to grade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgRating || 4.8}</div>
            <p className="text-xs text-muted-foreground">
              Student satisfaction
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recent Submissions</span>
            </CardTitle>
            <CardDescription>Latest student submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSubmissions.length > 0 ? (
                recentSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{submission.courseTitle}</p>
                        <p className="text-xs text-gray-500">Student: {submission.studentId}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={submission.status === 'submitted' ? 'secondary' : 'default'}>
                        {submission.status}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/dashboard/submissions/${submission.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent submissions</p>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard/submissions">View All Submissions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Top Students</span>
            </CardTitle>
            <CardDescription>Students with highest progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topStudents.length > 0 ? (
                topStudents.map((student, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.course}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-green-600">{student.progress}%</span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/dashboard/students">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No student data available</p>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard/students">Manage Students</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common teaching tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/dashboard/courses">
                <BookOpen className="h-6 w-6 mb-2" />
                My Courses
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/dashboard/assignments">
                <FileText className="h-6 w-6 mb-2" />
                Create Assignment
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/dashboard/announcements">
                <Bell className="h-6 w-6 mb-2" />
                Post Announcement
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/dashboard/reports">
                <BarChart3 className="h-6 w-6 mb-2" />
                View Reports
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}