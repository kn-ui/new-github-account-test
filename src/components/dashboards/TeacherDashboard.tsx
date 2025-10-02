/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from 'react';
import { Users, BookOpen, TrendingUp, MessageSquare, PlusCircle, BarChart3, Clock, CheckCircle, Plus, Bell, Eye, FileText, Star, X, Send } from 'lucide-react';
import DualDateInput from '@/components/ui/DualDateInput';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { analyticsService, courseService, enrollmentService, submissionService, announcementService, assignmentService, FirestoreEnrollment } from '@/lib/firestore';
import CourseMaterialModal from '@/components/ui/CourseMaterialModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

// All dynamic; no hardcoded placeholders

export default function TeacherDashboard() {
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [topStudents, setTopStudents] = useState<{ name: string; course: string; progress: number; grade?: number }[]>([]);
  const [recentMessages, setRecentMessages] = useState<{ student: string; course: string; message: string; time: string }[]>([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', body: '', courseId: '' });
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedCourseForMaterial, setSelectedCourseForMaterial] = useState<any>(null);
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const { t } = useI18n();

  const coursesToDisplay = myCourses || [];
  const totalStudents = Object.values(enrollmentCounts).reduce((a, b) => a + b, 0);

  const teacherStats = [
    { label: 'Active Courses', key: 'activeCourses', value: '0', change: '+0%', icon: BookOpen, color: 'blue' },
    { label: 'Total Students', key: 'totalStudents', value: '0', change: '+0%', icon: Users, color: 'teal' },
    { label: 'Pending Reviews', key: 'pendingReviews', value: '0', change: '+0%', icon: FileText, color: 'orange' },
    { label: 'Average Rating', key: 'averageRating', value: '0.0', change: '+0.0', icon: Star, color: 'yellow' },
  ] as const;

  useEffect(() => {

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        if (currentUser?.uid) {
          // Load teacher stats
          const teacherStats = await analyticsService.getTeacherStats(currentUser.uid);
          setStats(teacherStats);

          // Load my courses
          const allCourses = await courseService.getCoursesByInstructor(currentUser.uid);
          const courses = allCourses.filter(c => c.isActive);
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

          // Load recent submissions for my courses (by course id)
          try {
            const allSubmissions = await Promise.all(
              courses.map(async (course) => {
                try {
                  const submissions = await submissionService.getSubmissionsByCourse(course.id);
                  return submissions.map((submission: any) => ({
                    ...submission,
                    courseTitle: course.title,
                  }));
                } catch (error) {
                  console.warn(`Failed to load submissions for course ${course.id}:`, error);
                  return [];
                }
              })
            );
            const flatSubmissions = allSubmissions.flat().filter((s: any) => s.submittedAt).sort((a: any, b: any) => {
              try {
                return b.submittedAt.toDate() - a.submittedAt.toDate();
              } catch {
                return 0;
              }
            });
            setRecentSubmissions(flatSubmissions.slice(0, 5));
          } catch (error) {
            console.error('Failed to load submissions:', error);
            setRecentSubmissions([]);
          }

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

          // Derive top students from enrollments (highest progress across the teacher's courses)
          try {
            const allEnrollments = await Promise.all(
              courses.map(async (course) => {
                const list = await enrollmentService.getEnrollmentsByCourse(course.id);
                return list.map((en: any) => ({ ...en, courseTitle: course.title }));
              })
            );
            const flatEnrollments: (FirestoreEnrollment & { courseTitle: string })[] = allEnrollments.flat();
            const sortedByProgress = flatEnrollments.sort((a, b) => (b.progress || 0) - (a.progress || 0));
            setTopStudents(sortedByProgress.slice(0, 3).map((en) => ({
              name: en.studentId,
              course: en.courseTitle,
              progress: en.progress || 0,
            })));
                      } catch (error) {
              console.warn(`Failed to load submissions for course ${course.id}:`, error);
            }

          // Messages placeholder: if there is a support tickets per course/student, could surface here.
          setRecentMessages([]);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setMyCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser?.uid]);

  const handleCreateAnnouncement = async () => {
    try {
      if (!newAnnouncement.title || !newAnnouncement.body) {
        toast.error('Please fill in all required fields');
        return;
      }

      await announcementService.createAnnouncement({
        title: newAnnouncement.title,
        body: newAnnouncement.body,
        courseId: newAnnouncement.courseId || undefined,
        authorId: currentUser?.uid || ''
      });

      toast.success('Announcement created successfully!');
      setShowAnnouncementModal(false);
      setNewAnnouncement({ title: '', body: '', courseId: '' });
    } catch (error: any) {
      toast.error('Failed to create announcement: ' + error.message);
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      teal: 'bg-teal-100 text-teal-600',
      orange: 'bg-orange-100 text-orange-600',
      yellow: 'bg-yellow-100 text-yellow-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading teacher overview...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600">Manage your courses and students</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/" className="text-sm px-3 py-2 rounded hover:bg-gray-100">Home</Link>
              <Link to="/forum" className="text-sm px-3 py-2 rounded hover:bg-gray-100">Forum</Link>
              <button onClick={async () => { await logout(); navigate('/'); }} className="text-sm px-3 py-2 rounded hover:bg-gray-100">Logout</button>
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
                <p className="text-2xl font-semibold text-gray-900">{stats?.pendingReviews || 0}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{stats?.avgRating || 0}</p>
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
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
                    <p className="text-gray-600">Manage your active courses</p>
                  </div>
                  {/* Teachers can no longer create courses */}
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <input
                    placeholder="Search by title..."
                    className="border rounded px-3 py-2 flex-1"
                    onChange={(e) => {
                      const q = e.target.value.toLowerCase();
                      setMyCourses(prev => prev.map((c: any) => ({ ...c, __match: c.title.toLowerCase().includes(q) })) as any);
                    }}
                  />
                  <select
                    className="border rounded px-3 py-2 w-full md:w-48"
                    onChange={(e) => {
                      const v = e.target.value;
                      setMyCourses(prev => {
                        const next = [...prev];
                        if (v === 'title-asc') next.sort((a, b) => a.title.localeCompare(b.title));
                        if (v === 'title-desc') next.sort((a, b) => b.title.localeCompare(a.title));
                        if (v === 'recent') next.sort((a: any, b: any) => b.createdAt.toMillis() - a.createdAt.toMillis());
                        return next;
                      });
                    }}
                  >
                    <option value="recent">Sort: Recent</option>
                    <option value="title-asc">Title A→Z</option>
                    <option value="title-desc">Title Z→A</option>
                  </select>
                </div>
                {myCourses.length > 0 ? (
                  <div className="space-y-4">
                    {myCourses.filter((c: any) => c.__match !== false).slice(0, 5).map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{course.title}</h3>
                          <p className="text-sm text-gray-600">{course.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>{course.category}</span>
                            <span>{course.duration} weeks</span>
                            <span>Max {course.maxStudents} students</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/courses/${course.id}`)}>
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSelectedCourseForMaterial(course);
                              setShowMaterialModal(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Material
                          </Button>
                          <Button variant="outline" size="sm" onClick={async () => {
                            try {
                              await courseService.updateCourse(course.id, { isActive: false });
                              toast.success('Course deactivated');
                              setMyCourses(prev => prev.filter((c: any) => c.id !== course.id));
                            } catch {
                              toast.error('Failed to update course');
                            }
                          }}>
                            Deactivate
                          </Button>
                        </div>
                      </div>
                    ))}
                    {myCourses.filter((c: any) => c.__match !== false).length > 5 && (
                      <div className="pt-2">
                        <Button variant="outline" className="w-full" onClick={() => navigate('/courses')}>
                          View All Courses
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No courses yet. Create your first course to get started.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Recent Submissions</h2>
                    <p className="text-gray-600">Review and grade student work</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/submissions')}>
                    View All
                  </Button>
                </div>
              </div>
              <div className="p-6">
                {recentSubmissions.length > 0 ? (
                  <div className="space-y-4">
                    {recentSubmissions.map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">Assignment Submission</h3>
                          <p className="text-sm text-gray-600">Course: {submission.courseTitle}</p>
                          <p className="text-sm text-gray-500">Student: {submission.studentId}</p>
                          <p className="text-xs text-gray-400">
                            Submitted: {submission.submittedAt.toDate().toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={submission.status === 'graded' ? 'default' : 'secondary'}>
                            {submission.status}
                          </Badge>
                          {submission.status === 'submitted' && (
                            <Button size="sm">
                              Grade
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent submissions to review.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Top Students */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Top Students</h2>
              </div>
              <div className="p-6 space-y-4">
                {topStudents.map((student, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-900">{student.name}</span>
                      <span className="text-xs text-gray-500">{student.course}</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{student.progress}%</span>
                        </div>
                        <Progress value={student.progress} className="h-2" />
                      </div>
                      <div className="text-xs text-gray-600">
                        {student.grade !== undefined ? `Grade: ${student.grade}%` : '—'}
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => navigate('/students')}>
                  Manage Students
                </Button>
              </div>
            </div>

            {/* Recent Messages */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
              </div>
              <div className="p-6 space-y-4">
                {recentMessages.map((message, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-900">{message.student}</span>
                      <span className="text-xs text-gray-500">{message.time}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{message.course}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{message.message}</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      <Send className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
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
                <Button className="w-full" onClick={() => setShowAnnouncementModal(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Post Announcement
                </Button>
                <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={() => setShowAssignmentModal(true)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/teacher-reports')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
                <Button className="w-full bg-gray-600 hover:bg-gray-700">
                  <Users className="h-4 w-4 mr-2" />
                  Message Students
                </Button>
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
                        authorId: currentUser?.uid || '',
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

      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Create Assignment</h2>
              <button onClick={() => setShowAssignmentModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
                <select
                  value={newAnnouncement.courseId}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, courseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select course</option>
                  {myCourses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={(newAnnouncement as any).assignmentTitle || ''}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, ...( { assignmentTitle: e.target.value } as any) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  value={(newAnnouncement as any).assignmentDescription || ''}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, ...( { assignmentDescription: e.target.value } as any) })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                  <DualDateInput
                    value={(newAnnouncement as any).assignmentDueDate ? new Date((newAnnouncement as any).assignmentDueDate) : new Date()}
                    onChange={(d) => setNewAnnouncement({ ...newAnnouncement, ...( { assignmentDueDate: d.toISOString().slice(0,10) } as any) })}
                    defaultMode="ethiopian"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Points *</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={(newAnnouncement as any).assignmentMaxPoints || 100}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, ...( { assignmentMaxPoints: Number(e.target.value) } as any) })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowAssignmentModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white">Cancel</button>
                <button
                  className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700"
                  onClick={async () => {
                    try {
                      const payload = {
                        courseId: newAnnouncement.courseId,
                        title: (newAnnouncement as any).assignmentTitle,
                        description: (newAnnouncement as any).assignmentDescription,
                        dueDate: new Date((newAnnouncement as any).assignmentDueDate) as any,
                        maxPoints: (newAnnouncement as any).assignmentMaxPoints || 100,
                      } as any;
                      await assignmentService.createAssignment(payload);
                      toast.success('Assignment created');
                      setShowAssignmentModal(false);
                    } catch {
                      toast.error('Failed to create assignment');
                    }
                  }}
                >
                  Create Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Material Modal */}
      {showMaterialModal && selectedCourseForMaterial && (
        <CourseMaterialModal
          isOpen={showMaterialModal}
          onClose={() => {
            setShowMaterialModal(false);
            setSelectedCourseForMaterial(null);
          }}
          courseId={selectedCourseForMaterial.id}
          courseTitle={selectedCourseForMaterial.title}
          onMaterialAdded={() => {
            // Refresh course data if needed
            toast.success('Course material added successfully!');
          }}
        />
      )}
    </div>
  );
}