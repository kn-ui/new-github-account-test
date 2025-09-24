/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
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
    completionRate: 0,
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
        const adminStats = await analyticsService.getAdminStats();

        setStats(adminStats);

        setRoleDistributionData([
          { name: 'Students', value: adminStats.totalStudents, fill: '#8884d8' },
          { name: 'Teachers', value: adminStats.totalTeachers, fill: '#82ca9d' },
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
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('admin.systemStats.totalUsers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{stats.totalUsers}</div>
              <div className="text-blue-100 text-sm flex items-center gap-1">
                <Activity className="h-4 w-4" />
                {t('admin.analytics.realtime')}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t('admin.systemStats.activeCourses')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{stats.activeCourses}</div>
              <div className="text-green-100 text-sm flex items-center gap-1">
                <Target className="h-4 w-4" />
                Published courses
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {t('admin.systemStats.systemHealth')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{stats.systemHealth}%</div>
              <div className="text-purple-100 text-sm flex items-center gap-1">
                <Activity className="h-4 w-4" />
                All systems operational
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('superadmin.completionRate')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{stats.completionRate}%</div>
              <div className="text-orange-100 text-sm flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {t('superadmin.completionRate')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role Distribution Chart */}
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="flex items-center gap-3 text-blue-900">
              <Users className="h-6 w-6 text-blue-600" />
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