import React, { useState } from 'react';
import { Download, FileText, BarChart3, Users, BookOpen, GraduationCap } from 'lucide-react';
import { analyticsService, userService, courseService, enrollmentService } from '@/lib/firestore';

type ReportType = 'user-list' | 'enrollment-records' | 'course-analytics' | 'system-overview';
type ExportFormat = 'csv' | 'pdf';

export function Reports() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('user-list');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const reportTypes = [
    {
      id: 'user-list' as ReportType,
      name: 'User List',
      description: 'Complete list of all users with their details',
      icon: Users,
      color: 'blue',
    },
    {
      id: 'enrollment-records' as ReportType,
      name: 'Enrollment Records',
      description: 'Student enrollment data and progress tracking',
      icon: GraduationCap,
      color: 'green',
    },
    {
      id: 'course-analytics' as ReportType,
      name: 'Course Analytics',
      description: 'Course performance and completion statistics',
      icon: BookOpen,
      color: 'purple',
    },
    {
      id: 'system-overview' as ReportType,
      name: 'System Overview',
      description: 'Comprehensive system statistics and metrics',
      icon: BarChart3,
      color: 'indigo',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      indigo: 'bg-indigo-100 text-indigo-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      let data: any[] = [];
      let filename = '';

      switch (selectedReport) {
        case 'user-list':
          data = await userService.getUsers(1000); // Get all users
          filename = `user-list-${new Date().toISOString().split('T')[0]}`;
          break;

        case 'enrollment-records':
          const enrollments = await enrollmentService.getAllEnrollments();
          data = enrollments.map(enrollment => ({
            id: enrollment.id,
            courseId: enrollment.courseId,
            courseTitle: enrollment.course?.title || 'Unknown Course',
            studentId: enrollment.studentId,
            status: enrollment.status,
            progress: enrollment.progress,
            enrolledAt: enrollment.enrolledAt.toDate().toISOString(),
            lastAccessedAt: enrollment.lastAccessedAt.toDate().toISOString(),
          }));
          filename = `enrollment-records-${new Date().toISOString().split('T')[0]}`;
          break;

        case 'course-analytics':
          const courses = await courseService.getCourses(1000);
          data = courses.map(course => ({
            id: course.id,
            title: course.title,
            instructor: course.instructorName,
            category: course.category,
            duration: course.duration,
            maxStudents: course.maxStudents,
            isActive: course.isActive,
            createdAt: course.createdAt.toDate().toISOString(),
          }));
          filename = `course-analytics-${new Date().toISOString().split('T')[0]}`;
          break;

        case 'system-overview':
          const stats = await analyticsService.getAdminStats();
          data = [
            { metric: 'Total Users', value: stats.totalUsers },
            { metric: 'Total Students', value: stats.totalStudents },
            { metric: 'Active Courses', value: stats.activeCourses },
            { metric: 'Completion Rate', value: `${stats.completionRate}%` },
            { metric: 'System Health', value: `${stats.systemHealth}%` },
          ];
          filename = `system-overview-${new Date().toISOString().split('T')[0]}`;
          break;
      }

      if (selectedFormat === 'csv') {
        exportToCSV(data, filename);
      } else {
        exportToPDF(data, filename);
      }

    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (data: any[], filename: string) => {
    alert('PDF export functionality requires additional setup. For now, please use CSV export.');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Generate Reports</h3>
          <p className="text-sm text-gray-600">Export system data in various formats</p>
        </div>
        <Download className="h-6 w-6 text-gray-400" />
      </div>

      <div className="space-y-6">
        {/* Report Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Report Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`p-4 border rounded-xl text-left transition-all hover:shadow-md ${selectedReport === report.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getColorClasses(report.color)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{report.name}</h4>
                      <p className="text-sm text-gray-600">{report.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Export Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Export Format
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="csv"
                checked={selectedFormat === 'csv'}
                onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">CSV</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="pdf"
                checked={selectedFormat === 'pdf'}
                onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">PDF</span>
            </label>
          </div>
        </div>

        {/* Date Range (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Date Range (Optional)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-xs text-gray-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-xs text-gray-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Generating Report...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-3" />
                Generate Report
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <FileText className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Report Information</h4>
              <p className="text-sm text-blue-700 mt-1">
                Reports are generated based on the current system data. CSV files can be opened in Excel or Google Sheets. 
                PDF reports provide a formatted view suitable for printing and sharing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
