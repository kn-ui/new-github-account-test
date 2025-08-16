import React, { useEffect, useState } from 'react';
import { Users, BookOpen, TrendingUp, Shield, UserPlus, BarChart3, AlertCircle, CheckCircle, Settings, Download, Plus, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { analyticsService, userService, realtimeService } from '@/lib/firestore';
import { AnalyticsChart, EnrollmentTrendChart, CourseCompletionChart, UserActivityChart, RoleDistributionChart } from '@/components/ui/AnalyticsChart';
import AddUserModal from '@/components/ui/AddUserModal';
import ReportGenerator from '@/components/ui/ReportGenerator';

interface RecentUserRow {
  name: string;
  email: string;
  role: string;
  joinDate: string;
  status: 'active' | 'pending' | 'inactive';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ totalUsers?: number; totalStudents?: number; activeCourses?: number; completionRate?: number; systemHealth?: number; } | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUserRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [chartData, setChartData] = useState<any>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useI18n();

  const systemStats = [
    { label: t('admin.systemStats.totalUsers'), key: 'totalUsers', value: '1,247', change: '+12%', icon: Users, color: 'blue' },
    { label: t('admin.systemStats.activeCourses'), key: 'activeCourses', value: '45', change: '+5%', icon: BookOpen, color: 'teal' },
    { label: t('admin.systemStats.completionRate'), key: 'completionRate', value: '78%', change: '+3%', icon: TrendingUp, color: 'green' },
    { label: t('admin.systemStats.systemHealth'), key: 'systemHealth', value: '99.9%', change: '+0.1%', icon: Shield, color: 'purple' },
  ] as const;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // Load admin stats from Firestore
        const adminStats = await analyticsService.getAdminStats();
        setStats(adminStats);

        // Load recent users from Firestore
        const users = await userService.getUsers(10);
        const rows: RecentUserRow[] = users.map((u: any) => ({
          name: u.displayName || '—',
          email: u.email || '—',
          role: u.role || 'student',
          joinDate: u.createdAt ? u.createdAt.toDate().toISOString().slice(0, 10) : '—',
          status: u.isActive ? 'active' : 'inactive',
        }));
        setRecentUsers(rows);

        // Generate sample chart data
        setChartData({
          enrollmentTrends: [
            { name: 'Jan', enrollments: 45 },
            { name: 'Feb', enrollments: 52 },
            { name: 'Mar', enrollments: 48 },
            { name: 'Apr', enrollments: 61 },
            { name: 'May', enrollments: 55 },
            { name: 'Jun', enrollments: 67 },
          ],
          courseCompletion: [
            { name: 'Biblical Studies', completionRate: 78 },
            { name: 'Theology', completionRate: 65 },
            { name: 'Leadership', completionRate: 92 },
            { name: 'Ethics', completionRate: 71 },
            { name: 'History', completionRate: 84 },
          ],
          userActivity: [
            { name: 'Mon', activeUsers: 120 },
            { name: 'Tue', activeUsers: 135 },
            { name: 'Wed', activeUsers: 142 },
            { name: 'Thu', activeUsers: 128 },
            { name: 'Fri', activeUsers: 156 },
            { name: 'Sat', activeUsers: 98 },
            { name: 'Sun', activeUsers: 87 },
          ],
          roleDistribution: [
            { name: 'Students', value: 65 },
            { name: 'Teachers', value: 25 },
            { name: 'Admins', value: 10 },
          ],
        });

      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setStats(null);
        setRecentUsers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    const unsubscribeUsers = realtimeService.onUsersChange((snapshot) => {
      // Update users in real-time
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const rows: RecentUserRow[] = users.slice(0, 10).map((u: any) => ({
        name: u.displayName || '—',
        email: u.email || '—',
        role: u.role || 'student',
        joinDate: u.createdAt ? u.createdAt.toDate().toISOString().slice(0, 10) : '—',
        status: u.isActive ? 'active' : 'inactive',
      }));
      setRecentUsers(rows);
    });

    return () => {
      unsubscribeUsers();
    };
  }, []);

  const pendingApprovals = [
    { type: 'Course', name: 'Advanced Biblical Interpretation', author: 'Dr. Sarah Wilson', date: '2025-01-15' },
    { type: 'User', name: 'New Teacher Application', author: 'Rev. Mark Stevens', date: '2025-01-14' },
    { type: 'Course', name: 'Modern Christian Ethics', author: 'Prof. Lisa Chen', date: '2025-01-13' },
  ];

  const systemAlerts = [
    { type: 'warning', message: 'Server storage at 85% capacity', time: '2 hours ago' },
    { type: 'info', message: 'Scheduled maintenance on January 20th', time: '1 day ago' },
    { type: 'success', message: 'Database backup completed successfully', time: '2 days ago' },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      teal: 'bg-teal-100 text-teal-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleUserCreated = () => {
    setNotification({ message: 'User created successfully!', type: 'success' });
    // Refresh the dashboard data
    window.location.reload();
  };

  const handleReportGenerated = (message: string) => {
    setNotification({ message, type: 'success' });
  };

  const handleError = (message: string) => {
    setNotification({ message, type: 'error' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading admin overview...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header + Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
              <p className="text-gray-600">{t('admin.subtitle')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/" className="text-sm px-3 py-2 rounded hover:bg-gray-100">{t('nav.home')}</Link>
              <Link to="/courses" className="text-sm px-3 py-2 rounded hover:bg-gray-100">{t('nav.courses')}</Link>
              <Link to="/forum" className="text-sm px-3 py-2 rounded hover:bg-gray-100">{t('nav.forum')}</Link>
              <button onClick={async () => { await logout(); navigate('/'); }} className="text-sm px-3 py-2 rounded hover:bg-gray-100">{t('auth.logout')}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-md ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex justify-between items-center">
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {systemStats.map((stat, index) => {
            const valueOverride = stats && stat.key in (stats || {})
              ? stat.key === 'completionRate'
                ? `${stats.completionRate}%`
                : stat.key === 'systemHealth'
                  ? `${stats.systemHealth}%`
                  : String((stats as any)[stat.key])
              : stat.value;
            return (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${getColorClasses(stat.color)}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium text-green-600">{stat.change}</span>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{valueOverride}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Users */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{t('admin.recentUsers.title')}</h2>
                    <p className="text-gray-600">{t('admin.recentUsers.subtitle')}</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 transition-colors">
                    {t('admin.recentUsers.viewAll')}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.recentUsers.table.user')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.recentUsers.table.role')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.recentUsers.table.joinDate')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.recentUsers.table.status')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.recentUsers.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(recentUsers.length ? recentUsers : []).map((user, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 capitalize">{user.role}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.joinDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                          <button className="hover:text-blue-800 transition-colors">{t('admin.recentUsers.edit')}</button>
                        </td>
                      </tr>
                    ))}
                    {recentUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">{t('admin.recentUsers.noUsers')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Analytics Charts */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">System Analytics</h2>
                    <p className="text-gray-600">Real-time data visualization and insights</p>
                  </div>
                  <button 
                    onClick={() => setShowReportGenerator(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Generate Report</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {chartData.enrollmentTrends && (
                    <EnrollmentTrendChart data={chartData.enrollmentTrends} />
                  )}
                  {chartData.courseCompletion && (
                    <CourseCompletionChart data={chartData.courseCompletion} />
                  )}
                  {chartData.userActivity && (
                    <UserActivityChart data={chartData.userActivity} />
                  )}
                  {chartData.roleDistribution && (
                    <RoleDistributionChart data={chartData.roleDistribution} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Pending Approvals */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{t('admin.pendingApprovals')}</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {pendingApprovals.map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {item.type}
                      </span>
                      <span className="text-xs text-gray-500">{item.date}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm mb-1">{item.name}</h3>
                    <p className="text-xs text-gray-600">{t('admin.common.by')} {item.author}</p>
                    <div className="flex space-x-2 mt-3">
                      <button className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors">
                        {t('admin.common.approve')}
                      </button>
                      <button className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors">
                        {t('admin.common.reject')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Alerts */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{t('admin.systemAlerts')}</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {systemAlerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                    <div className="flex items-start space-x-2">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs opacity-75 mt-1">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <button 
                  onClick={() => setShowAddUserModal(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add New User</span>
                </button>
                <button 
                  onClick={() => navigate('/create-course')}
                  className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Create Course</span>
                </button>
                <button 
                  onClick={() => setShowReportGenerator(true)}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Generate Report</span>
                </button>
                <button 
                  onClick={() => navigate('/calendar')}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Calendar Events</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserCreated={handleUserCreated}
      />

      {/* Report Generator Modal */}
      {showReportGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Generate Reports</h2>
              <button
                onClick={() => setShowReportGenerator(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <ReportGenerator onReportGenerated={handleReportGenerated} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}