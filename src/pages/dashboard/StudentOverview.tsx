import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService, enrollmentService, submissionService, announcementService, certificateService, activityLogService, FirestoreCertificate } from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Calendar, 
  Bell, 
  Award,
  FileText,
  Play,
  Eye,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CertificateCard from '@/components/CertificateCard';
import { evaluateAndAwardCertificates } from '@/lib/certificates';

export default function StudentOverview() {
  const [stats, setStats] = useState<any>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<FirestoreCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

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
          const normalized = enrollments.map((enrollment: any) => ({
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

          // Load upcoming assignments
          const submissions = await submissionService.getSubmissionsByStudent(currentUser.uid);
          setUpcomingAssignments(submissions.slice(0, 5));

          // Load announcements for enrolled courses and general announcements
          const [courseAnnouncements, generalAnnouncements] = await Promise.all([
            Promise.all(
              enrollments.map(async (enrollment) => {
                const courseAnnouncements = await announcementService.getAnnouncements(enrollment.courseId, 3);
                return courseAnnouncements.map((announcement: any) => ({
                  ...announcement,
                  courseTitle: enrollment.course?.title || 'Course',
                }));
              })
            ),
            announcementService.getAllAnnouncements(5)
          ]);
          
          const allAnnouncements = [...courseAnnouncements.flat(), ...generalAnnouncements]
            .sort((a: any, b: any) => b.createdAt.toDate() - a.createdAt.toDate())
          setAnnouncements(allAnnouncements);

          // Load certificates
          const certs = await certificateService.getCertificatesForUser(currentUser.uid);
          setCertificates(certs);
        }
      } catch (error) {
        console.error('Failed to load student dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser?.uid]);

  const averageProgress = enrolledCourses.reduce((sum, course) => sum + (course.progress || 0), 0) / Math.max(enrolledCourses.length, 1);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
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
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Track your learning progress</p>
        </div>
        <div className="flex space-x-3">
          <Button asChild>
            <Link to="/courses">

              <Plus className="h-4 w-4 mr-2" />
              Browse Courses
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/certificates">
              <Award className="h-4 w-4 mr-2" />
              View Certificates
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.enrolledCourses || enrolledCourses.length}</div>
            <p className="text-xs text-muted-foreground">
              Active enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageProgress)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingAssignments || upcomingAssignments.length}</div>
            <p className="text-xs text-muted-foreground">
              To complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.certificates || certificates.length}</div>
            <p className="text-xs text-muted-foreground">
              Earned achievements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>My Courses</span>
            </CardTitle>
            <CardDescription>Your enrolled courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrolledCourses.slice(0, 3).map((course) => (
                <div key={course.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{course.title}</p>
                      <p className="text-xs text-gray-500">by {course.instructor}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-600">{course.progress || 0}%</span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/courses/${course.id}`}>
                        <Play className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {enrolledCourses.length > 3 && (

                <Button variant="outline" className="w-full" asChild>
                  <Link to="/dashboard/courses">View All Courses</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Recent Announcements</span>
            </CardTitle>
            <CardDescription>Latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Bell className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{announcement.title}</p>
                      <p className="text-xs text-gray-500">{announcement.courseTitle || 'General'}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/dashboard/announcements">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
              {announcements.length > 3 && (
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/dashboard/announcements">View All Announcements</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificates Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>My Certificates</span>
              </CardTitle>
              <CardDescription>Your earned achievements</CardDescription>
            </div>
            <Button
              onClick={async () => {
                if (!currentUser) return;
                await evaluateAndAwardCertificates(currentUser.uid);
                const list = await certificateService.getCertificatesForUser(currentUser.uid);
                setCertificates(list);
              }}
              size="sm"
            >
              Check for new
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {certificates.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {certificates.slice(0, 2).map((cert) => (
                <CertificateCard
                  key={cert.id}
                  type={cert.type}
                  studentName={currentUser?.email || 'Student'}
                  awardedAt={cert.awardedAt.toDate()}
                  details={cert.details}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No certificates yet</p>
              <p className="text-sm">Complete courses and assignments to earn certificates</p>
            </div>
          )}
          {certificates.length > 2 && (
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/dashboard/certificates">View All Certificates</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common student tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/dashboard/courses">
                <BookOpen className="h-6 w-6 mb-2" />
                My Courses
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/dashboard/assignments">
                <FileText className="h-6 w-6 mb-2" />
                View Assignments
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/dashboard/progress">
                <TrendingUp className="h-6 w-6 mb-2" />
                Track Progress
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link to="/dashboard/certificates">
                <Award className="h-6 w-6 mb-2" />
                My Certificates
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}