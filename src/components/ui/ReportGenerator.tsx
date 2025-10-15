import React, { useState } from 'react';
import { Download, FileText, BarChart3, Users, BookOpen, GraduationCap } from 'lucide-react';
import { analyticsService, userService, courseService, enrollmentService, gradeService } from '@/lib/firestore';

interface ReportGeneratorProps {
  onReportGenerated: (message: string) => void;
}

type ReportType = 'user-list' | 'enrollment-records' | 'course-analytics' | 'system-overview' | 'course-final-grades';
type ExportFormat = 'csv' | 'pdf';

export default function ReportGenerator({ onReportGenerated }: ReportGeneratorProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>('user-list');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [calendarMode, setCalendarMode] = useState<'ethiopian' | 'gregorian'>('ethiopian');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [allCourses, setAllCourses] = useState<{ id: string; title: string }[]>([]);

  React.useEffect(() => {
    // Preload courses for dropdown
    (async () => {
      try {
        const list = await courseService.getAllCourses(1000);
        setAllCourses(list.map(c => ({ id: c.id, title: c.title })));
      } catch {}
    })();
  }, []);

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
    {
      id: 'course-final-grades' as ReportType,
      name: 'Course Final Grades',
      description: 'All students\' final grades for a selected course',
      icon: GraduationCap,
      color: 'blue',
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
          const users = await userService.getUsers(1000); // Get all users
          data = users.map(user => ({
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt?.toDate ? user.createdAt.toDate().toISOString() : 
                      (user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toISOString() : 
                       'N/A'),
            updatedAt: user.updatedAt?.toDate ? user.updatedAt.toDate().toISOString() : 
                      (user.updatedAt?.seconds ? new Date(user.updatedAt.seconds * 1000).toISOString() : 
                       'N/A'),
          }));
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
        case 'course-final-grades':
          if (!selectedCourseId) throw new Error('Please select a course');
          const course = await courseService.getCourseById(selectedCourseId);
          if (!course) throw new Error('Course not found');
          const grades = await gradeService.getGradesByCourse(course.id);
          // Fetch student names for display
          const studentIds = Array.from(new Set(grades.map(g => g.studentId)));
          const studentMap = await userService.getUsersByIds(studentIds);
          data = grades.map(g => ({
            student: studentMap[g.studentId]?.displayName || g.studentId,
            course: course.title,
            finalGrade: g.finalGrade,
            letterGrade: g.letterGrade,
            gradePoints: g.gradePoints,
            calculatedAt: g.calculatedAt.toDate().toISOString(),
            method: g.calculationMethod,
          }));
          filename = `course-final-grades-${course.title}-${new Date().toISOString().split('T')[0]}`;
          break;
      }

      if (selectedFormat === 'csv') {
        exportToCSV(data, filename);
      } else {
        exportToPDF(data, filename);
      }

      onReportGenerated(`${selectedReport.replace('-', ' ')} report generated successfully!`);
    } catch (error) {
      console.error('Failed to generate report:', error);
      onReportGenerated('Failed to generate report. Please try again.');
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
    // For now, we'll show an alert since PDF generation requires additional libraries
    // In a real implementation, you'd use a library like jsPDF or html2pdf
    alert('PDF export functionality requires additional setup. For now, please use CSV export.');
    
    // Placeholder for PDF generation
    // import jsPDF from 'jspdf';
    // const doc = new jsPDF();
    // ... PDF generation logic
    // doc.save(`${filename}.pdf`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
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
                  className={`p-4 border rounded-lg text-left transition-all ${
                    selectedReport === report.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
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

        {/* Course selector for Course Final Grades */}
        {selectedReport === 'course-final-grades' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Course</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={selectedCourseId}
              onChange={(e)=> setSelectedCourseId(e.target.value)}
            >
              <option value="">-- Choose a course --</option>
              {allCourses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}

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
          <div className="mt-2 text-xs text-gray-500">Dates shown in Gregorian; reports reflect the same range regardless of calendar preference.</div>
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