import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService, enrollmentService, submissionService, announcementService, certificateService, activityLogService, assignmentService, FirestoreCertificate } from '@/lib/firestore';
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
          const enrolledIds = enrollments.map((e: any) => e.courseId);
          const allAssignments = [];
          for (const courseId of enrolledIds) {
            try {
              const assignments = await assignmentService.getAssignmentsByCourse(courseId);
              const courseTitle = enrollments.find((e: any) => e.courseId === courseId)?.course?.title || 'Course';
              allAssignments.push(...assignments.map((a: any) => ({
                ...a,
                courseTitle,
                dueDate: a.dueDate.toDate().toLocaleDateString()
              })));
            } catch (error) {
              console.error(`Error loading assignments for course ${courseId}:`, error);
            }
          }
          // Sort by due date and take upcoming ones
          const upcoming = allAssignments
            .filter((a: any) => new Date(a.dueDate) > new Date())
            .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5);
          setUpcomingAssignments(upcoming);

          // Load announcements filtered for this student (general, enrolled course, or direct-recipient)
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('student.title')}</h1>
            <p className="text-gray-600">{t('student.subtitle')} • {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('student.stats.enrolledCourses')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.enrolledCourses || enrolledCourses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('student.stats.pendingAssignments')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingAssignments || upcomingAssignments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('student.stats.averageProgress')}</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(averageProgress)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Award size={24} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('student.stats.certificates')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.certificates || certificates.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Courses */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('student.myCourses.title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrolledCourses.slice(0, 4).map((course) => (
                  <div key={course.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer">
                    <Link to={`/dashboard/course/${course.id}`} className="block" onClick={(e) => {
                      e.preventDefault();
                      console.log('Course clicked:', course.id, 'Navigating to:', `/dashboard/course/${course.id}`);
                      window.location.href = `/dashboard/course/${course.id}`;
                    }}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-600">{t('common.by')} {course.instructor}</p>
                        </div>
                        <Play className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-semibold text-blue-600">{course.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${course.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
              {enrolledCourses.length > 4 && (
                <div className="mt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/dashboard/student-courses">{t('admin.recentUsers.viewAll')}</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('student.upcomingAssignments.title')}</h2>
              <div className="space-y-2">
                {upcomingAssignments.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => {
                    // Navigate to assignments page and trigger detail view
                    window.location.href = `/dashboard/student-assignments?assignmentId=${assignment.id}`;
                  }}>
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText size={18} className="text-blue-600" />
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{assignment.title || 'Assignment'}</p>
                        <p className="text-sm text-gray-600">{assignment.courseTitle || 'Course'}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">
                          {assignment.dueDate || '-'}
                        </p>
                        <p className="text-xs capitalize text-blue-600">
                          assignment
                        </p>
                      </div>
                    </div>
                ))}
              </div>
              {upcomingAssignments.length === 0 && (
                <div className="text-center py-6 text-gray-500">{t('student.upcomingAssignments.none')}</div>
              )}
            </div>

            {/* Recent Notifications */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('student.announcements.title')}</h2>
              <div className="space-y-2">
                {announcements.slice(0, 3).map((announcement) => (
                  <div key={announcement.id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-gray-50`}>
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    <Bell size={16} className="text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-medium">
                        {announcement.title}
                      </p>
                      <p className="text-xs text-gray-500">{announcement.courseTitle || t('forum.categories.all')}</p>
                    </div>
                  </div>
                ))}
              </div>
              {announcements.length > 3 && (
                <div className="mt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/dashboard/student-announcements">{t('admin.recentUsers.viewAll')}</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}