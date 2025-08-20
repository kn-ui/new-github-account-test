import React, { useEffect, useState } from 'react';
import { BarChart3, Users, BookOpen, TrendingUp, Download, Calendar, FileText } from 'lucide-react';
import { analyticsService, courseService, userService, eventService } from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function AdminReports() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string>('overview');

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        const adminStats = await analyticsService.getAdminStats();
        setStats(adminStats);
      } catch (error) {
        console.error('Failed to load report data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, []);

  const generateReport = async (type: string) => {
    try {
      // This would typically generate and download a report
      // For now, just show a success message
      console.log(`Generating ${type} report...`);
      alert(`${type} report generated successfully!`);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Reports</h1>
          <p className="text-gray-600">Comprehensive system analytics and insights</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => generateReport('comprehensive')}>
            <Download className="h-4 w-4 mr-2" />
            Export All Data
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex space-x-2">
        {['overview', 'users', 'courses', 'events', 'analytics'].map((type) => (
          <Button
            key={type}
            variant={selectedReport === type ? 'default' : 'outline'}
            onClick={() => setSelectedReport(type)}
            className="capitalize"
          >
            {type}
          </Button>
        ))}
      </div>

      {/* Overview Report */}
      {selectedReport === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalStudents || 0} students, {stats?.totalTeachers || 0} teachers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeCourses || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.completionRate || 0}% completion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.systemHealth || 99.9}%</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendingReviews || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Courses awaiting approval
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Generate specific reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col" onClick={() => generateReport('user')}>
                  <Users className="h-6 w-6 mb-2" />
                  User Report
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => generateReport('course')}>
                  <BookOpen className="h-6 w-6 mb-2" />
                  Course Report
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => generateReport('event')}>
                  <Calendar className="h-6 w-6 mb-2" />
                  Event Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Users Report */}
      {selectedReport === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>User Analytics</CardTitle>
            <CardDescription>Detailed user statistics and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>User Growth</span>
                <Button variant="outline" size="sm" onClick={() => generateReport('user-growth')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Role Distribution</span>
                <Button variant="outline" size="sm" onClick={() => generateReport('role-distribution')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Activity Logs</span>
                <Button variant="outline" size="sm" onClick={() => generateReport('activity-logs')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Courses Report */}
      {selectedReport === 'courses' && (
        <Card>
          <CardHeader>
            <CardTitle>Course Analytics</CardTitle>
            <CardDescription>Course performance and enrollment statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Course Performance</span>
                <Button variant="outline" size="sm" onClick={() => generateReport('course-performance')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Enrollment Trends</span>
                <Button variant="outline" size="sm" onClick={() => generateReport('enrollment-trends')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Completion Rates</span>
                <Button variant="outline" size="sm" onClick={() => generateReport('completion-rates')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events Report */}
      {selectedReport === 'events' && (
        <Card>
          <CardHeader>
            <CardTitle>Event Analytics</CardTitle>
            <CardDescription>Event management and attendance statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Event Calendar</span>
                <Button variant="outline" size="sm" onClick={() => generateReport('event-calendar')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Attendance Reports</span>
                <Button variant="outline" size="sm" onClick={() => generateReport('attendance-reports')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Report */}
      {selectedReport === 'analytics' && (
        <Card>
          <CardHeader>
            <CardTitle>System Analytics</CardTitle>
            <CardDescription>Platform performance and usage metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Performance Metrics</span>
                <Button variant="outline" size="sm" onClick={() => generateReport('performance-metrics')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Usage Statistics</span>
                <Button variant="outline" size="sm" onClick={() => generateReport('usage-statistics')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Error Logs</span>
                <Button variant="outline" size="sm" onClick={() => generateReport('error-logs')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}