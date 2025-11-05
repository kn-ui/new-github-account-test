/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { analyticsService } from '@/lib/firestore';
import { 
  RoleDistributionChart, 
  ChartData 
} from '@/components/ui/AnalyticsChart';
import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';

const SuperAdminOverview = () => {
  const { t } = useI18n();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEvents: 0,
    systemHealth: 0,
    totalStudents: 0,
    totalTeachers: 0,
    activeCourses: 0,
    pendingCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [roleDistributionData, setRoleDistributionData] = useState<ChartData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const adminStats = await analyticsService.getSuperAdminStats();

        setStats(adminStats);

        setRoleDistributionData([
          { name: 'Students', value: adminStats.totalStudents, fill: '#8884d8' },
          { name: 'Teachers', value: adminStats.totalTeachers, fill: '#82ca9d' },
          { name: 'Admins', value: adminStats.totalAdmins, fill: '#ffc658' },
          { name: 'Super Admins', value: adminStats.totalSuperAdmins, fill: '#ff8042' },
        ]);

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
        title={t('superadmin.title')}
        subtitle={t('superadmin.subtitle')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t('admin.systemStats.totalUsers')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t('admin.systemStats.activeCourses')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{t('admin.systemStats.systemHealth')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.systemHealth}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEvents || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role Distribution Chart */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              {t('superadmin.roleDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <RoleDistributionChart data={roleDistributionData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminOverview;