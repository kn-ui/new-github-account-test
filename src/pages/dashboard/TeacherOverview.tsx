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
          
          // Filter out submissions for deleted/inactive assignments
          const { assignmentService } = await import('@/lib/firestore');
          const assignmentIds = Array.from(new Set(ok.flat().map((s: any) => s.assignmentId)));
          const assignmentsMap = await assignmentService.getAssignmentsByIds(assignmentIds);
          
          const validSubmissions = ok.flat().filter((submission: any) => {
            const assignment = assignmentsMap[submission.assignmentId];
            return assignment !== null && assignment.isActive !== false;
          });
          
          const flatSubmissions = validSubmissions
            .filter((s: any) => s && !!s?.submittedAt)
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
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('teacher.stats.activeCourses')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeCourses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('teacher.stats.totalStudents')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('teacher.stats.pendingReviews')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingReviews || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('teacher.stats.avgRating')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.avgRating || 4.8}</p>
              </div>
            </div>
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
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{submission.courseTitle}</p>
                        <p className="text-xs text-gray-500 truncate">{t('users.roles.student')}: {studentNames[submission.studentId] || submission.studentId}</p>
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
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{course.title}</p>
                        <p className="text-xs text-gray-500 truncate">{course.category}</p>
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