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
  import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';

export default function TeacherOverview() {
  const { t } = useI18n();
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
          } catch (error) {
          console.warn(`Failed to load submissions for course ${course.id}:`, error);
        }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero 
        title={t('teacher.title')}
        subtitle={t('teacher.subtitle')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('teacher.stats.activeCourses')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats?.activeCourses || 0}</div>
            <p className="text-xs text-blue-100">
              {myCourses.length} {t('nav.courses').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('teacher.stats.totalStudents')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-green-100">
              {t('student.myCourses.subtitle')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('teacher.stats.pendingReviews')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats?.pendingReviews || 0}</div>
            <p className="text-xs text-orange-100">
              {t('teacher.recentSubmissions.title')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('teacher.stats.avgRating')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats?.avgRating || 4.8}</div>
            <p className="text-xs text-purple-100">
              {t('teacher.myCourses.rating')}
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
              <span>{t('teacher.recentSubmissions.title')}</span>
            </CardTitle>
            <CardDescription>{t('teacher.recentSubmissions.subtitle')}</CardDescription>
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
                        <p className="text-xs text-gray-500">{t('student.title').split(' ')[0]}: {submission.studentId}</p>
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
                <Link to="/dashboard/submissions">{t('common.viewAllSubmissions')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>{t('teacher.topStudents')}</span>
            </CardTitle>
            <CardDescription>{t('studentProgress.highest')}</CardDescription>
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
                  <p>{t('blog.noPosts')}</p>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard/students">{t('nav.students')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.quickActions.title')}</CardTitle>
          <CardDescription>{t('teacher.quickActions.title')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/dashboard/courses">
                <BookOpen className="h-6 w-6 mb-2" />
                {t('nav.myCourses')}
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/dashboard/assignments">
                <FileText className="h-6 w-6 mb-2" />
                {t('teacher.quickActions.createAssignment')}
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/dashboard/announcements">
                <Bell className="h-6 w-6 mb-2" />
                {t('teacher.quickActions.messageStudents')}
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/dashboard/reports">
                <BarChart3 className="h-6 w-6 mb-2" />
                {t('nav.reports')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}