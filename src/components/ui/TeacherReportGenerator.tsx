/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Download, BookOpen, GraduationCap, Users } from 'lucide-react';
import { courseService, enrollmentService, analyticsService } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface TeacherReportGeneratorProps {
  onReportGenerated: (message: string) => void;
}

type ReportType = 'my-students' | 'my-enrollments' | 'my-course-analytics' | 'my-stats-summary';
type ExportFormat = 'csv' | 'pdf';

export default function TeacherReportGenerator({ onReportGenerated }: TeacherReportGeneratorProps) {
  const { currentUser } = useAuth();
  const [selectedReport, setSelectedReport] = useState<ReportType>('my-course-analytics');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    { id: 'my-course-analytics' as ReportType, name: 'My Course Analytics', desc: 'Performance of your courses', icon: BookOpen },
    { id: 'my-enrollments' as ReportType, name: 'My Enrollments', desc: 'Enrollments and progress in your courses', icon: GraduationCap },
    { id: 'my-students' as ReportType, name: 'My Students', desc: 'List of students in your courses', icon: Users },
    { id: 'my-stats-summary' as ReportType, name: 'My Stats Summary', desc: 'Summary of your teaching stats', icon: Download },
  ];

  const generateReport = async () => {
    if (!currentUser?.uid) return;
    setIsGenerating(true);
    try {
      let data: any[] = [];
      let filename = '';

      const myCourses = await courseService.getCoursesByInstructor(currentUser.uid);

      switch (selectedReport) {
        case 'my-course-analytics': {
          data = myCourses.map(c => ({
            id: c.id,
            title: c.title,
            category: c.category,
            duration_weeks: c.duration,
            max_students: c.maxStudents,
            is_active: c.isActive,
            created_at: c.createdAt.toDate().toISOString(),
          }));
          filename = `my-course-analytics-${today()}`;
          break;
        }
        case 'my-enrollments': {
          const lists = await Promise.all(myCourses.map(c => enrollmentService.getEnrollmentsByCourse(c.id)));
          data = lists.flat().map((en: any) => ({
            id: en.id,
            course_id: en.courseId,
            course_title: myCourses.find(c => c.id === en.courseId)?.title || '—',
            student_id: en.studentId,
            status: en.status,
            progress: en.progress,
            enrolled_at: en.enrolledAt.toDate().toISOString(),
            last_accessed_at: en.lastAccessedAt.toDate().toISOString(),
          }));
          filename = `my-enrollments-${today()}`;
          break;
        }
        case 'my-students': {
          const lists = await Promise.all(myCourses.map(c => enrollmentService.getEnrollmentsByCourse(c.id)));
          const seen = new Map<string, { student_id: string; courses: Set<string>; progress_sum: number; count: number }>();
          lists.forEach((arr, idx) => {
            arr.forEach((en: any) => {
              const rec = seen.get(en.studentId) || { student_id: en.studentId, courses: new Set<string>(), progress_sum: 0, count: 0 };
              rec.courses.add(myCourses[idx].title);
              rec.progress_sum += en.progress || 0;
              rec.count += 1;
              seen.set(en.studentId, rec);
            });
          });
          data = Array.from(seen.values()).map(r => ({
            student_id: r.student_id,
            courses: Array.from(r.courses).join(', '),
            avg_progress: r.count ? Math.round(r.progress_sum / r.count) : 0,
          }));
          filename = `my-students-${today()}`;
          break;
        }
        case 'my-stats-summary': {
          const stats = await analyticsService.getTeacherStats(currentUser.uid);
          data = [
            { metric: 'Active Courses', value: stats.activeCourses },
            { metric: 'Total Students', value: stats.totalStudents },
            { metric: 'Pending Reviews', value: stats.pendingReviews },
            { metric: 'Average Rating', value: stats.avgRating },
          ];
          filename = `my-stats-summary-${today()}`;
          break;
        }
      }

      if (selectedFormat === 'csv') exportToCSV(data, filename);
      else alert('PDF export requires additional setup. Please use CSV for now.');

      onReportGenerated('Report generated successfully');
    } catch (e) {
      console.error(e);
      onReportGenerated('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Teacher Reports</h3>
          <p className="text-sm text-gray-600">Export data scoped to your courses</p>
        </div>
        <Download className="h-6 w-6 text-gray-400" />
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Select Report Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map(rt => {
              const Icon = rt.icon as any;
              return (
                <button key={rt.id} onClick={() => setSelectedReport(rt.id)} className={`p-4 border rounded-lg text-left ${selectedReport === rt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600"><Icon className="h-5 w-5" /></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{rt.name}</h4>
                      <p className="text-sm text-gray-600">{rt.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input type="radio" className="h-4 w-4 text-blue-600" value="csv" checked={selectedFormat==='csv'} onChange={() => setSelectedFormat('csv')} />
              <span className="ml-2 text-sm">CSV</span>
            </label>
            <label className="flex items-center">
              <input type="radio" className="h-4 w-4 text-blue-600" value="pdf" checked={selectedFormat==='pdf'} onChange={() => setSelectedFormat('pdf')} />
              <span className="ml-2 text-sm">PDF</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={generateReport} disabled={isGenerating} className="inline-flex items-center px-6 py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }
  const headers = Object.keys(data[0]);
  const csv = [headers.join(','), ...data.map(row => headers.map(h => {
    const v = (row as any)[h];
    return typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

