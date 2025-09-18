import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService, enrollmentService, submissionService, announcementService, certificateService, activityLogService, FirestoreCertificate } from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Calendar, 
  Bell, 
  Award,
  FileText,
  Play,
  Eye,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CertificateCard from '@/components/CertificateCard';
import { evaluateAndAwardCertificates } from '@/lib/certificates';
  import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';

  
export default function StudentOverview() {
  const { t } = useI18n();
  const [stats, setStats] = useState<any>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<FirestoreCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        if (currentUser?.uid) {
          // Load student stats
          const studentStats = await analyticsService.getStudentStats(currentUser.uid);
          setStats(studentStats);

          // Load enrollments with course data
          const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser.uid);
          const normalized = enrollments.map((enrollment: any) => ({
            id: enrollment.courseId,
            title: enrollment.course?.title || 'Course Title',
            progress: typeof enrollment.progress === 'number' ? Math.round(enrollment.progress) : undefined,
            instructor: enrollment.course?.instructorName || 'Instructor',
            nextLesson: 'Next lesson',
            dueDate: undefined,
          }));
          setEnrolledCourses(normalized);

          // Log today's activity for attendance
          await activityLogService.upsertToday(currentUser.uid);

          // Load upcoming assignments
          const submissions = await submissionService.getSubmissionsByStudent(currentUser.uid);
          setUpcomingAssignments(submissions.slice(0, 5));

          // Load announcements filtered for this student (general, enrolled course, or direct-recipient)
          const enrolledIds = enrollments.map((e: any) => e.courseId);
          const filteredAnns = await announcementService.getAnnouncementsForStudent(currentUser.uid, enrolledIds, 50);
          const withCourseTitles = filteredAnns.map((a: any) => ({
            ...a,
            courseTitle: a.courseId ? (enrollments.find((e: any) => e.courseId === a.courseId)?.course?.title || 'Course') : t('forum.categories.all')
          }));
          setAnnouncements(withCourseTitles);

          // Load certificates
          const certs = await certificateService.getCertificatesForUser(currentUser.uid);
          setCertificates(certs);
        }
      } catch (error) {
        console.error('Failed to load student dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser?.uid]);

  const averageProgress = enrolledCourses.reduce((sum, course) => sum + (course.progress || 0), 0) / Math.max(enrolledCourses.length, 1);

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
        title={t('student.title')}
        subtitle={t('student.subtitle')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('student.stats.enrolledCourses')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats?.enrolledCourses || enrolledCourses.length}</div>
            <p className="text-xs text-blue-100">
              {t('student.myCourses.subtitle')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('student.stats.averageProgress')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{Math.round(averageProgress)}%</div>
            <p className="text-xs text-green-100">
              {t('student.myCourses.subtitle')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('student.stats.pendingAssignments')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats?.pendingAssignments || upcomingAssignments.length}</div>
            <p className="text-xs text-orange-100">
              {t('student.upcomingAssignments.title')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
              <Award className="h-5 w-5" />
              {t('student.stats.certificates')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{stats?.certificates || certificates.length}</div>
            <p className="text-xs text-purple-100">
              {t('student.quickActions.myCertificates')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>{t('student.myCourses.title')}</span>
            </CardTitle>
            <CardDescription>{t('student.myCourses.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrolledCourses.slice(0, 3).map((course) => (
                <div key={course.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{course.title}</p>
                      <p className="text-xs text-gray-500">{t('admin.common.by')} {course.instructor}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-600">{course.progress || 0}%</span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/courses/${course.id}`}>
                        <Play className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {enrolledCourses.length > 3 && (

                <Button variant="outline" className="w-full" asChild>
                  <Link to="/dashboard/courses">{t('admin.recentUsers.viewAll')}</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>{t('student.announcements')}</span>
            </CardTitle>
            <CardDescription>{t('forum.categories.announcements')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Bell className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{announcement.title}</p>
                      <p className="text-xs text-gray-500">{announcement.courseTitle || t('forum.categories.all')}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/dashboard/announcements">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
              {announcements.length > 3 && (
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/dashboard/announcements">{t('admin.recentUsers.viewAll')}</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Assignments Section (replaces Certificates) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Upcoming Assignments</span>
          </CardTitle>
          <CardDescription>Next deadlines from your enrolled courses</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAssignments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAssignments.slice(0, 4).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{a.title || 'Assignment'}</div>
                    <div className="text-xs text-gray-600">{a.courseTitle || 'Course'}</div>
                  </div>
                  <div className="text-xs text-gray-500">Due: {a.dueDate || '-'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">No upcoming assignments</div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.quickActions.title')}</CardTitle>
          <CardDescription>{t('student.quickActions.title')}</CardDescription>
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
                {t('nav.assignments')}
              </Link>
            </Button>
            {/* Progress quick action removed */}
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/dashboard/certificates">
                <Award className="h-6 w-6 mb-2" />
                {t('student.quickActions.myCertificates')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}