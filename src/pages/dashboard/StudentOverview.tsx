import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { studentDataService, activityLogService } from '@/lib/firestore';
import SkeletonLoader from '@/components/SkeletonLoader';
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
  import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';

  
export default function StudentOverview() {
  const { t } = useI18n();
  const [stats, setStats] = useState<any>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        if (currentUser?.uid) {
          // Use optimized batch loading service
          const data = await studentDataService.getStudentDashboardData(currentUser.uid);
          
          setStats(data.stats);

          // Normalize enrollments for display
          const normalized = data.enrollments
            .filter((enrollment: any) => enrollment.course)
            .map((enrollment: any) => ({
              id: enrollment.courseId,
              title: enrollment.course.title,
              progress: typeof enrollment.progress === 'number' ? Math.round(enrollment.progress) : 0,
              instructor: enrollment.course.instructorName,
              nextLesson: 'Next lesson',
              dueDate: undefined,
            }));
          setEnrolledCourses(normalized);

          // Process assignments
          const upcoming = data.assignments
            .filter((a: any) => {
              const dueDate = a.dueDate instanceof Date ? a.dueDate : a.dueDate.toDate();
              return dueDate > new Date();
            })
            .sort((a: any, b: any) => {
              const aDate = a.dueDate instanceof Date ? a.dueDate : a.dueDate.toDate();
              const bDate = b.dueDate instanceof Date ? b.dueDate : b.dueDate.toDate();
              return aDate.getTime() - bDate.getTime();
            })
            .slice(0, 5)
            .map((a: any) => ({
              ...a,
              courseTitle: data.enrollments.find(e => e.courseId === a.courseId)?.course?.title || 'Course',
              dueDate: (a.dueDate instanceof Date ? a.dueDate : a.dueDate.toDate()).toLocaleDateString()
            }));
          setUpcomingAssignments(upcoming);
          
          // Process announcements
          const withCourseTitles = data.announcements.map((a: any) => ({
            ...a,
            courseTitle: a.courseId ? (data.enrollments.find(e => e.courseId === a.courseId)?.course?.title || 'Course') : t('forum.categories.all')
          }));
          setAnnouncements(withCourseTitles);

          // Log today's activity for attendance (non-blocking)
          activityLogService.upsertToday(currentUser.uid).catch(console.error);
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SkeletonLoader type="card" count={1} />
            </div>
            <div className="space-y-6">
              <SkeletonLoader type="card" count={2} />
            </div>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Courses */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('student.myCourses.title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrolledCourses.slice(0, 4).map((course) => (
                  <div key={course.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer">
                    <Link to={`/dashboard/course/${course.id}`} className="block">
                      <div className="flex items-center justify-between mb-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{t('common.by')} {course.instructor}</p>
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
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{assignment.title || 'Assignment'}</p>
                        <p className="text-sm text-gray-600 truncate">{assignment.courseTitle || 'Course'}</p>
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium truncate">
                        {announcement.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{announcement.courseTitle || t('forum.categories.all')}</p>
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