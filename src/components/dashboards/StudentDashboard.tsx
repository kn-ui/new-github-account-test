/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from 'react';
import { BookOpen, Clock, TrendingUp, Calendar, Bell, Award, Play, FileText, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { analyticsService, enrollmentService, submissionService, announcementService, activityLogService, assignmentService, courseService } from '@/lib/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface EnrolledCourse {
  id: string | number;
  title: string;
  progress?: number;
  nextLesson?: string;
  dueDate?: string;
  instructor?: string;
}

export default function StudentDashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>(null);
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAnnouncementsDialog, setShowAnnouncementsDialog] = useState(false);
  const [announcementsSearch, setAnnouncementsSearch] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const { t } = useI18n();



  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        if (currentUser?.uid) {
          // Load student stats
          const studentStats = await analyticsService.getStudentStats(currentUser.uid);
          setStats(studentStats);

          // Load enrollments with course data
          const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser.uid);
          
          const normalized: EnrolledCourse[] = enrollments.map((enrollment: any) => ({
            id: enrollment.courseId,
            title: enrollment.course?.title || 'Course Title',
            progress: typeof enrollment.progress === 'number' ? Math.round(enrollment.progress) : undefined,
            instructor: enrollment.course?.instructorName || 'Instructor',
            nextLesson: 'Next lesson',
            dueDate: undefined,
          }));
          setEnrolledCourses(normalized);

          // Log today's activity for attendance
          await activityLogService.upsertToday(currentUser.uid);

          // Load upcoming assignments with details
          const submissions = await submissionService.getSubmissionsByStudent(currentUser.uid);
          const topSubs = submissions.slice(0, 5);
          const assignmentIds = Array.from(new Set(topSubs.map((s: any) => s.assignmentId).filter(Boolean)));
          const assignmentMap = await assignmentService.getAssignmentsByIds(assignmentIds);
          const courseIds = Array.from(new Set(Object.values(assignmentMap).filter(Boolean).map((a: any) => a.courseId)));
          const courseMap: Record<string, any> = {};
          await Promise.all(courseIds.map(async (cid) => {
            try {
              const c = await courseService.getCourseById(cid);
              if (c) courseMap[cid] = c;
            } catch (error) {
              // Silently handle course loading errors
            }
          }));
          const enriched = topSubs
            // Hide if assignment no longer exists or was deleted
            .filter((s: any) => {
              const a = assignmentMap[s.assignmentId] as any;
              return Boolean(a && (a.isActive === undefined || a.isActive === true));
            })
            .map((s: any) => {
              const a = assignmentMap[s.assignmentId] as any;
              const c = a ? courseMap[a.courseId] : undefined;
              return {
                ...s,
                title: a?.title || 'Assignment',
                courseTitle: c?.title || 'Course',
                dueDate: a?.dueDate ? a.dueDate.toDate().toISOString().slice(0, 10) : '—',
              };
            });
          setUpcomingAssignments(enriched);

          // Load announcements filtered for this student
          const enrolledIds = enrollments.map((e: any) => e.courseId);
          const filteredAnns = await announcementService.getAnnouncementsForStudent(currentUser.uid, enrolledIds, 50);
          const withCourseTitles = filteredAnns.map((a: any) => ({
            ...a,
            courseTitle: a.courseId ? (enrollments.find((e: any) => e.courseId === a.courseId)?.course?.title || 'Course') : 'General'
          }));
          setAnnouncements(withCourseTitles);

        } else {
          // If no currentUser, show empty state instead of demo data
          setEnrolledCourses([]);
          setStats(null);
          setUpcomingAssignments([]);
          setAnnouncements([]);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Show empty state on error instead of demo data
        setEnrolledCourses([]);
        setStats(null);
        setUpcomingAssignments([]);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser?.uid]);

/*   const upcomingAssignments = [
    {
      id: 1,
      title: 'Biblical Interpretation Essay',
      course: 'Introduction to Biblical Studies',
      dueDate: '2025-01-18',
      status: 'pending'
    },
    {
      id: 2,
      title: 'Ethics Case Study Analysis',
      course: 'Christian Ethics and Moral Theology',
      dueDate: '2025-01-22',
      status: 'in-progress'
    },
    {
      id: 3,
      title: 'Historical Timeline Project',
      course: 'Church History and Traditions',
      dueDate: '2025-01-28',
      status: 'not-started'
    }
  ]; */

  const recentAnnouncements = [
    {
      id: 1,
      title: 'New Course Materials Available',
      message: 'Updated study guides for Biblical Studies course are now available in the resources section.',
      date: '2025-01-15',
      type: 'info'
    },
    {
      id: 2,
      title: 'Assignment Extension Notice',
      message: 'The deadline for Ethics Essay has been extended to January 25th due to technical issues.',
      date: '2025-01-14',
      type: 'warning'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'not-started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case 'info': return 'border-l-4 border-blue-500 bg-blue-50';
      case 'warning': return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'success': return 'border-l-4 border-green-500 bg-green-50';
      default: return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  const displayCourses = enrolledCourses;
  const averageProgress = useMemo(() => {
    const withProgress = displayCourses.filter(c => typeof c.progress === 'number') as Array<Required<Pick<EnrolledCourse,'progress'>>> & EnrolledCourse[];
    if (!withProgress.length) return 0;
    const total = withProgress.reduce((sum, c: any) => sum + (c.progress || 0), 0);
    return Math.round(total / withProgress.length);
  }, [displayCourses]);

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
              <h1 className="text-2xl font-bold text-gray-900">{t('student.title')}</h1>
              <p className="text-gray-600">{t('student.subtitle')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/" className="text-sm px-3 py-2 rounded hover:bg-gray-100">{t('nav.home')}</Link>
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
                <p className="text-2xl font-semibold text-gray-900">{stats?.enrolledCourses || displayCourses.length}</p>
                <p className="text-sm text-gray-600">Enrolled Courses</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="bg-teal-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-teal-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats?.averageProgress || averageProgress}%</p>
                <p className="text-sm text-gray-600">Average Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats?.pendingAssignments || 3}</p>
                <p className="text-sm text-gray-600">Pending Assignments</p>
              </div>
            </div>
          </div>

        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enrolled Courses */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">{t('student.myCourses.title')}</h2>
                <p className="text-gray-600">{t('student.myCourses.subtitle')}</p>
              </div>
              <div className="p-6 space-y-6">
                {displayCourses.slice(0, 3).map((course, index) => (
                  <div key={`dashboard-course-${course.id}-${index}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.title}</h3>
                        {course.instructor && (
                          <p className="text-sm text-gray-600">by {course.instructor}</p>
                        )}
                      </div>
                      {typeof course.progress === 'number' && (
                        <span className="text-sm font-medium text-blue-600">{course.progress}%</span>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    {typeof course.progress === 'number' && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div>
                        {course.nextLesson && (
                          <p className="text-sm text-gray-600">{t('student.next')}: {course.nextLesson}</p>
                        )}
                        {course.dueDate && (
                          <p className="text-xs text-gray-500">{t('student.due')}: {course.dueDate}</p>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/courses/${course.id}`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Play className="h-4 w-4" />
                        <span>{t('student.continue')}</span>
                      </button>
                    </div>
                  </div>
                ))}
                {displayCourses.length > 3 && (
                  <div className="pt-2">
                    <button
                      onClick={() => navigate('/courses')}
                      className="w-full border px-4 py-2 rounded"
                    >View Courses</button>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Assignments */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Assignments</h2>
                <p className="text-gray-600">Track your pending assignments and deadlines</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {upcomingAssignments.length > 0 ? (
                    upcomingAssignments.map((assignment, index) => (
                      <div key={`dashboard-assignment-${assignment.id}-${index}`} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gray-100 p-2 rounded-full">
                            <FileText className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{assignment.title || 'Assignment'}</h3>
                            <p className="text-sm text-gray-600">{assignment.courseTitle || 'Course'}</p>
                            <p className="text-xs text-gray-500">Due: {assignment.dueDate || 'No due date'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status || 'pending')}`}>
                            {(assignment.status || 'pending').replace('-', ' ')}
                          </span>
                          <button className="text-blue-600 hover:text-blue-800 transition-colors" onClick={() => setSelectedAssignment(assignment)}>
                            View
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No upcoming assignments</p>
                      <p className="text-sm">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Recent Announcements */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {announcements.length > 0 ? (
                  announcements.slice(0, 3).map((announcement, index) => (
                    <div key={`dashboard-announcement-${announcement.id}-${index}`} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">{announcement.title}</h3>
                      <p className="text-sm text-gray-700 mb-2">{announcement.body}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{announcement.courseTitle || 'General'}</span>
                        <span>{announcement.createdAt ? announcement.createdAt.toDate().toLocaleDateString() : 'Recent'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No announcements</p>
                    <p className="text-sm">Check back later for updates</p>
                  </div>
                )}
                {announcements.length > 3 && (
                  <button className="w-full border px-4 py-2 rounded" onClick={() => setShowAnnouncementsDialog(true)}>View Announcements</button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <button 
                  onClick={() => navigate('/dashboard/student-courses')}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>My Courses</span>
                </button>
                <button 
                  onClick={() => navigate('/dashboard/student-assignments')}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>My Assignments</span>
                </button>
                <button 
                  onClick={() => navigate('/dashboard/student-grades')}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Award className="h-4 w-4" />
                  <span>My Grades</span>
                </button>
                <button 
                  onClick={() => navigate('/courses')}
                  className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Browse Courses
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Modal */}
      <Dialog open={showAnnouncementsDialog} onOpenChange={setShowAnnouncementsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>All Announcements</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input placeholder="Search announcements..." value={announcementsSearch} onChange={(e) => setAnnouncementsSearch(e.target.value)} />
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-auto">
              {announcements.filter(a => [a.title, a.body, a.courseTitle].some((v: string) => v?.toLowerCase().includes(announcementsSearch.toLowerCase()))).map((a, index) => (
                <div key={`modal-announcement-${a.id}-${index}`} className="p-3 border rounded-lg">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{a.courseTitle || 'General'}</span>
                    <span>{a.createdAt ? a.createdAt.toDate().toLocaleString() : ''}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">{a.title}</div>
                  <div className="text-sm text-gray-700">{a.body}</div>
                </div>
              ))}
              {announcements.length === 0 && <div className="text-gray-500">No announcements</div>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Detail Modal */}
      <Dialog open={!!selectedAssignment} onOpenChange={(o) => !o && setSelectedAssignment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-2 text-sm">
              <div className="font-medium text-gray-900">{selectedAssignment.title}</div>
              <div className="text-gray-600">Course: {selectedAssignment.courseTitle}</div>
              <div className="text-gray-600">Due: {selectedAssignment.dueDate}</div>
              <div className="text-gray-600">Status: {(selectedAssignment.status || 'pending').replace('-', ' ')}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}