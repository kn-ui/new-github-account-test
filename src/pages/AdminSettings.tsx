import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { userService, courseService, eventService } from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Bell, 
  Shield, 
  BarChart3, 
  Settings,
  Activity,
  Eye,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { t } = useI18n();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const loadSettingsData = async () => {
      try {
        setLoading(true);
        
        if (currentUser?.uid) {
          // Load basic stats
          const [users, courses, events] = await Promise.all([
            userService.getUsers(1000),
            courseService.getCourses(1000),
            eventService.getEvents(1000)
          ]);

          setStats({
            totalUsers: users.length,
            totalCourses: courses.length,
            totalEvents: events.length,
            activeUsers: users.filter(u => u.isActive).length,
            pendingCourses: courses.filter(c => !c.isActive).length
          });

          // Mock recent activity data
          setRecentActivity([
            { id: 1, type: 'user_login', user: 'john.doe@example.com', timestamp: new Date(), details: 'User logged in' },
            { id: 2, type: 'course_created', user: 'teacher@example.com', timestamp: new Date(Date.now() - 3600000), details: 'New course created: Advanced Mathematics' },
            { id: 3, type: 'user_registered', user: 'student@example.com', timestamp: new Date(Date.now() - 7200000), details: 'New student registration' },
            { id: 4, type: 'system_backup', user: 'system', timestamp: new Date(Date.now() - 86400000), details: 'Daily backup completed' }
          ]);

          // Mock notifications
          setNotifications([
            { id: 1, type: 'warning', message: '5 courses pending approval', timestamp: new Date() },
            { id: 2, type: 'info', message: 'System maintenance scheduled for tonight', timestamp: new Date(Date.now() - 3600000) },
            { id: 3, type: 'success', message: 'Database backup completed successfully', timestamp: new Date(Date.now() - 7200000) }
          ]);
        }
      } catch (error) {
        console.error('Failed to load settings data:', error);
        toast.error('Failed to load settings data');
      } finally {
        setLoading(false);
      }
    };

    loadSettingsData();
  }, [currentUser?.uid]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_login': return <Users className="h-4 w-4 text-blue-600" />;
      case 'course_created': return <BookOpen className="h-4 w-4 text-green-600" />;
      case 'user_registered': return <Users className="h-4 w-4 text-purple-600" />;
      case 'system_backup': return <Settings className="h-4 w-4 text-gray-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only administrators can access system settings.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Manage system configuration and monitor activity</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers || 0} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingCourses || 0} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent User Activity</span>
              </CardTitle>
              <CardDescription>Monitor user actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <p className="text-sm font-medium">{activity.details}</p>
                        <p className="text-xs text-gray-500">{activity.user} • {activity.timestamp.toLocaleString()}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Activity Log
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>System Notifications</span>
              </CardTitle>
              <CardDescription>Manage system alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`p-3 rounded-lg border ${getNotificationColor(notification.type)}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{notification.message}</p>
                      <span className="text-xs">{notification.timestamp.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Role-Based Access Control</span>
              </CardTitle>
              <CardDescription>Manage user permissions and roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Admin</h4>
                    <p className="text-sm text-gray-600">Full system access</p>
                    <Badge className="mt-2">Super User</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Teacher</h4>
                    <p className="text-sm text-gray-600">Course management</p>
                    <Badge variant="secondary" className="mt-2">Limited</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Student</h4>
                    <p className="text-sm text-gray-600">Course access only</p>
                    <Badge variant="outline" className="mt-2">Restricted</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Permissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}