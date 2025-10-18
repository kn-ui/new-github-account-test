/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  FileText, 
  Settings,
  Calendar,
  User,
  BookOpen as BookOpenIcon,
  Activity,
  Target,
  Zap,
  Bell,
  MessageSquare
} from 'lucide-react';
import { userService } from '@/lib/firestore';
import { useI18n } from '@/contexts/I18nContext';
import { courseService } from '@/lib/firestore';
import { eventService } from '@/lib/firestore';
import { analyticsService } from '@/lib/firestore';
  import DashboardHero from '@/components/DashboardHero';

interface User {
  id: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: any; // Timestamp from Firestore
}

interface Course {
  id: string;
  title: string;
  isActive: boolean;
  createdAt: any; // Timestamp from Firestore
}

interface Event {
  id: string;
  title: string;
  date: any; // Timestamp from Firestore
  type: string;
}

const AdminOverview = () => {
  const { t } = useI18n();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEvents: 0,
    pendingReviews: 0,
    totalTeachers: 0
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adminStats, users, courses, allEvents, recentEvents] = await Promise.all([
          analyticsService.getAdminStats(),
          userService.getUsers(5),
          courseService.getCourses(5),
          eventService.getAllEvents(),
          eventService.getEvents(5)
        ]);

        setStats({
          totalUsers: adminStats.totalUsers,
          totalCourses: adminStats.activeCourses,
          totalEvents: allEvents.length, // Use actual events count
          pendingReviews: adminStats.pendingCourses,
          totalTeachers: adminStats.totalTeachers
        });
        setRecentUsers(users);
        setRecentCourses(courses);
        setRecentEvents(recentEvents);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }





  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero 
        title={t('admin.title')}
        subtitle={t('admin.subtitle')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                {t('admin.systemStats.totalUsers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-gray-900">{stats.totalUsers}</div>
              {/* Real-time data visualization removed by request */}
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t('admin.systemStats.activeCourses')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{stats.totalCourses}</div>
              {/* Create Course (bottom line) removed by request */}
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {t('admin.systemStats.systemHealth')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">98%</div>
              {/* Analytics Chart Placeholder removed by request */}
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('admin.systemStats.totalEvents')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{stats.totalEvents}</div>
              {/* Total Events (bottom line) removed by request */}
            </CardContent>
          </Card>
        </div>


        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Users */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-blue-900">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                {t('admin.recentUsers.title')}
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/users">{t('admin.recentUsers.viewAll')}</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {recentUsers.length > 0 ? (
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{user.displayName}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={user.role === 'admin' ? 'default' : user.role === 'teacher' ? 'secondary' : 'outline'}
                        className="text-sm px-3 py-1"
                      >
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-lg font-medium">{t('admin.recentUsers.noUsers')}</p>
                  <p className="text-sm text-gray-400">{t('admin.recentUsers.subtitle')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Added Courses */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-green-900">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpenIcon className="h-6 w-6 text-green-600" />
                </div>
                {t('admin.recentCourses.title')}
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/courses">{t('admin.recentUsers.viewAll')}</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {recentCourses.length > 0 ? (
                <div className="space-y-4">
                  {recentCourses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-100 hover:border-green-200 transition-all duration-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-md">
                          <BookOpenIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{course.title}</p>
                          <p className="text-sm text-gray-600">
                            {t('calendar.loading').replace('Loading events...', 'Created')} {course.createdAt instanceof Date ? course.createdAt.toLocaleDateString() : course.createdAt.toDate().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 px-3 py-1">
                        {course.isActive ? t('courses.approved') : t('users.status.inactive')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpenIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-lg font-medium">{t('admin.recentCourses.noCourses')}</p>
                  <p className="text-sm text-gray-400">{t('admin.analytics.subtitle')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 mb-8">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-purple-900">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              {t('nav.events')}
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/events">{t('admin.recentUsers.viewAll')}</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {recentEvents.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentEvents.map((event) => (
                  <div key={event.id} className="p-2 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-600">
                          {event.date instanceof Date ? event.date.toLocaleDateString() : event.date.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="w-full justify-center">
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-lg font-medium">{t('calendar.loading')}</p>
                <p className="text-sm text-gray-400">{t('blog.noPosts')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Zap className="h-6 w-6 text-gray-600" />
              </div>
              {t('admin.quickActions.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <Link to="/dashboard/reports">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <FileText className="h-5 w-5 mr-3" />
                  {t('nav.reports')}
                </Button>
              </Link>
              <Link to="/dashboard/settings">
                <Button variant="outline" className="border-2 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1">
                  <Settings className="h-5 w-5 mr-3" />
                  {t('nav.settings')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;