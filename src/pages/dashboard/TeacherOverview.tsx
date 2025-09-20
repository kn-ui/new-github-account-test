import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService, courseService, enrollmentService, submissionService } from '@/lib/firestore';
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
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
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

          // Load recent submissions for my courses (resilient)
          const allRes = await Promise.allSettled(
            courses.map(async (course) => {
              const submissions = await submissionService.getSubmissionsByCourse(course.id);
              return submissions.map((submission: any) => ({
                ...submission,
                courseTitle: course.title,
              }));
            })
          );
          const ok = allRes.flatMap((r: any) => (r.status === 'fulfilled' ? r.value : []));
          const flatSubmissions = ok
            .flat()
            .filter((s: any) => !!s?.submittedAt)
            .sort((a: any, b: any) => {
              const at = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(0);
              const bt = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(0);
              return bt - at;
            });
          setRecentSubmissions(flatSubmissions.slice(0, 5));

          // Resolve student names
          try {
            const ids = Array.from(new Set(flatSubmissions.map((s: any) => s.studentId)));
            const usersMap = await (await import('@/lib/firestore')).userService.getUsersByIds(ids);
            const nameMap: Record<string, string> = {};
            Object.entries(usersMap).forEach(([id, user]: any) => {
              if (user?.displayName) nameMap[id] = user.displayName;
            });
            setStudentNames(nameMap);
          } catch {}

          // Announcements moved elsewhere; keeping placeholder empty list
          setRecentAnnouncements([]);

          // No longer deriving top students here; replaced with My Courses section
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
                        <p className="text-xs text-gray-500">{t('users.roles.student')}: {studentNames[submission.studentId] || submission.studentId}</p>
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
                  <p>{t('teacher.recentSubmissions.none')}</p>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard/submissions">{t('common.viewAllSubmissions')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* My Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>{t('nav.myCourses')}</span>
            </CardTitle>
            <CardDescription>{t('teacher.courses.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myCourses.length > 0 ? (
                myCourses.slice(0, 5).map((course) => (
                  <div key={course.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{course.title}</p>
                        <p className="text-xs text-gray-500">{course.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/dashboard/my-courses/${course.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('teacher.courses.noCourses')}</p>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard/my-courses">{t('common.viewAll')}</Link>
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