/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { Users, BookOpen, TrendingUp, MessageSquare, PlusCircle, BarChart3, Clock, CheckCircle, Plus, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { analyticsService, courseService, enrollmentService, submissionService, announcementService } from '@/lib/firestore';

export default function TeacherDashboard() {
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', body: '', courseId: '' });
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { t } = useI18n();

  const demoCourses = [
    {
      id: '1',
      title: 'Introduction to Biblical Studies',
      students: 245,
      completion: 78,
      assignments: 15,
      status: 'active'
    },
    {
      id: '2',
      title: 'Advanced Theology Concepts',
      students: 89,
      completion: 65,
      assignments: 12,
      status: 'active'
    },
    {
      id: '3',
      title: 'Christian Leadership Principles',
      students: 156,
      completion: 92,
      assignments: 8,
      status: 'completed'
    }
  ] as any[];

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        if (user?.uid) {
          // Load teacher stats
          const teacherStats = await analyticsService.getTeacherStats(user.uid);
          setStats(teacherStats);

          // Load my courses
          const courses = await courseService.getCoursesByInstructor(user.uid);
          setMyCourses(courses);

          // Fetch enrollments per course in parallel
          const entries = await Promise.all(
            courses.map(async (c) => {
              try {
                const enrollments = await enrollmentService.getEnrollmentsByCourse(c.id);
                const active = enrollments.filter((e: any) => e.status === 'active').length;
                return [c.id, active] as const;
              } catch {
                return [c.id, 0] as const;
              }
            })
          );
          const map: Record<string, number> = {};
          entries.forEach(([id, count]) => { map[id] = count; });
          setEnrollmentCounts(map);

          // Load recent submissions for my courses
          const submissions = await submissionService.getSubmissionsByStudent('all'); // This needs to be updated
          setRecentSubmissions(submissions.slice(0, 5));

          // Load announcements for my courses
          const courseAnnouncements = await Promise.all(
            courses.map(async (course) => {
              const courseAnnouncements = await announcementService.getAnnouncements(course.id, 3);
              return courseAnnouncements.map((announcement: any) => ({
                ...announcement,
                courseTitle: course.title,
              }));
            })
          );
          const allAnnouncements = courseAnnouncements.flat().sort((a: any, b: any) => 
            b.createdAt.toDate() - a.createdAt.toDate()
          );
          setAnnouncements(allAnnouncements.slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setMyCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.uid]);

/*   const recentSubmissions = [
    { id: 1, student: 'John Smith', assignment: 'Biblical Interpretation Essay', course: 'Introduction to Biblical Studies', submittedAt: '2 hours ago', status: 'pending' },
    { id: 2, student: 'Mary Johnson', assignment: 'Theology Research Paper', course: 'Advanced Theology Concepts', submittedAt: '4 hours ago', status: 'pending' },
    { id: 3, student: 'David Wilson', assignment: 'Leadership Case Study', course: 'Christian Leadership Principles', submittedAt: '1 day ago', status: 'graded' }
  ]; */

  const studentProgress = [
    { name: 'John Smith', progress: 85, lastActive: '2 hours ago' },
    { name: 'Mary Johnson', progress: 92, lastActive: '1 day ago' },
    { name: 'David Wilson', progress: 78, lastActive: '3 days ago' },
    { name: 'Sarah Brown', progress: 96, lastActive: '1 hour ago' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'graded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const coursesToDisplay = useMemo(() => {
    if (!myCourses.length) return demoCourses;
    return myCourses.map((c: any) => ({
      id: c.id,
      title: c.title,
      students: enrollmentCounts[c.id] ?? c.currentEnrollmentCount ?? 0,
      completion: 0,
      assignments: (c as any).assignments?.length || 0,
      status: c.isActive ? 'active' : 'completed',
    }));
  }, [myCourses, enrollmentCounts]);

  const totalStudents = coursesToDisplay.reduce((sum, c: any) => sum + (c.students || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('teacher.title')}</h1>
              <p className="text-gray-600">{t('teacher.subtitle')}</p>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats?.activeCourses || coursesToDisplay.length}</p>
                <p className="text-sm text-gray-600">Active Courses</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <div className="bg-teal-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalStudents || totalStudents}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats?.pendingReviews || 12}</p>
                <p className="text-sm text-gray-600">Pending Reviews</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats?.avgRating || 4.8}</p>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Courses */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">{t('teacher.myCourses.title')}</h2>
                <p className="text-gray-600">{t('teacher.myCourses.subtitle')}</p>
              </div>
              <div className="p-6 space-y-6">
                {coursesToDisplay.map((course: any) => (
                  <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                          {course.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{course.completion}% {t('teacher.myCourses.complete')}</p>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${course.completion}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">{course.students}</p>
                        <p className="text-xs text-gray-600">{t('teacher.myCourses.students')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">{course.assignments}</p>
                        <p className="text-xs text-gray-600">{t('teacher.myCourses.assignments')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">4.7</p>
                        <p className="text-xs text-gray-600">{t('teacher.myCourses.rating')}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        {t('teacher.myCourses.manageCourse')}
                      </button>
                      <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                        {t('teacher.myCourses.viewAnalytics')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">{t('teacher.recentSubmissions.title')}</h2>
                <p className="text-gray-600">{t('teacher.recentSubmissions.subtitle')}</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentSubmissions.map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          {submission.status === 'graded' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{submission.assignment}</h3>
                          <p className="text-sm text-gray-600">{t('teacher.recentSubmissions.by')} {submission.student}</p>
                          <p className="text-xs text-gray-500">{submission.course} • {submission.submittedAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 transition-colors">
                          {t('teacher.recentSubmissions.review')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Student Progress */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{t('teacher.topStudents')}</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {studentProgress.map((student, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.lastActive}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{student.progress}%</p>
                      <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">{t('teacher.quickActions.title')}</h2>
              </div>
              <div className="p-6 space-y-3">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>{t('teacher.quickActions.createAssignment')}</span>
                </button>
                <button className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>{t('teacher.quickActions.messageStudents')}</span>
                </button>
                <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>{t('teacher.quickActions.viewReports')}</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{t('teacher.messages')}</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">John Smith</p>
                  <p className="text-xs text-gray-600">Question about assignment requirements...</p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Mary Johnson</p>
                  <p className="text-xs text-gray-600">Thank you for the feedback on my essay...</p>
                  <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Post Announcement</h2>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="announcementTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="announcementTitle"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter announcement title"
                  required
                />
              </div>
              <div>
                <label htmlFor="announcementBody" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="announcementBody"
                  value={newAnnouncement.body}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, body: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter announcement message"
                  required
                />
              </div>
              <div>
                <label htmlFor="announcementCourse" className="block text-sm font-medium text-gray-700 mb-2">
                  Course (Optional)
                </label>
                <select
                  id="announcementCourse"
                  value={newAnnouncement.courseId}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, courseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">General Announcement</option>
                  {myCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await announcementService.createAnnouncement({
                        title: newAnnouncement.title,
                        body: newAnnouncement.body,
                        courseId: newAnnouncement.courseId || undefined,
                        authorId: user?.uid || '',
                      });
                      setNewAnnouncement({ title: '', body: '', courseId: '' });
                      setShowAnnouncementModal(false);
                      // Refresh announcements
                      window.location.reload();
                    } catch (error) {
                      console.error('Failed to create announcement:', error);
                    }
                  }}
                  disabled={!newAnnouncement.title || !newAnnouncement.body}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}