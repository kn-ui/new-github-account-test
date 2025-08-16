import React, { useEffect, useState } from 'react';
import { BookOpen, Users, Star, MessageSquare, FileText, TrendingUp, Calendar, Plus, Eye, BarChart3, Send } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { 
  courseService, 
  analyticsService, 
  submissionService,
  announcementService,
  FirestoreCourse,
  FirestoreSubmission
} from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TopStudent {
  name: string;
  course: string;
  progress: number;
  grade: number;
}

interface RecentMessage {
  student: string;
  course: string;
  message: string;
  time: string;
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [myCourses, setMyCourses] = useState<FirestoreCourse[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<FirestoreSubmission[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    body: '',
    courseId: ''
  });
  
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const { t } = useI18n();

  const teacherStats = [
    { label: 'Active Courses', key: 'activeCourses', value: '0', change: '+0%', icon: BookOpen, color: 'blue' },
    { label: 'Total Students', key: 'totalStudents', value: '0', change: '+0%', icon: Users, color: 'teal' },
    { label: 'Pending Reviews', key: 'pendingReviews', value: '0', change: '+0%', icon: FileText, color: 'orange' },
    { label: 'Average Rating', key: 'averageRating', value: '0.0', change: '+0.0', icon: Star, color: 'yellow' },
  ] as const;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (!currentUser?.uid) return;

        // Load all data in parallel
        const [teacherStatsData, coursesData, submissionsData] = await Promise.all([
          analyticsService.getTeacherStats(currentUser.uid),
          courseService.getCoursesByInstructor(currentUser.uid),
          submissionService.getSubmissionsByStudent(currentUser.uid) // This will be updated to get submissions for teacher's courses
        ]);

        setStats(teacherStatsData);
        setMyCourses(coursesData);

        // Transform submissions data
        const recentSubs = submissionsData.slice(0, 5);
        setRecentSubmissions(recentSubs);

        // Generate sample data for top students and messages (in real app, this would come from Firestore)
        setTopStudents([
          { name: 'John Doe', course: 'Biblical Studies', progress: 85, grade: 92 },
          { name: 'Jane Smith', course: 'Theology', progress: 78, grade: 88 },
          { name: 'Mike Johnson', course: 'Church History', progress: 92, grade: 95 },
        ]);

        setRecentMessages([
          { student: 'John Doe', course: 'Biblical Studies', message: 'Question about assignment 3', time: '2 hours ago' },
          { student: 'Jane Smith', course: 'Theology', message: 'Need clarification on chapter 5', time: '1 day ago' },
        ]);

      } catch (error) {
        console.error('Error loading teacher dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleCreateAnnouncement = async () => {
    try {
      if (!newAnnouncement.title || !newAnnouncement.body) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!currentUser?.uid) {
        toast.error('User not authenticated');
        return;
      }

      await announcementService.createAnnouncement({
        title: newAnnouncement.title,
        body: newAnnouncement.body,
        courseId: newAnnouncement.courseId || undefined,
        authorId: currentUser.uid
      });

      toast.success('Announcement created successfully!');
      setShowAnnouncementDialog(false);
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
              <Link to="/courses" className="text-sm px-3 py-2 rounded hover:bg-gray-100">Courses</Link>
              <Link to="/forum" className="text-sm px-3 py-2 rounded hover:bg-gray-100">Forum</Link>
              <button onClick={async () => { await logout(); navigate('/'); }} className="text-sm px-3 py-2 rounded hover:bg-gray-100">Logout</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {teacherStats.map((stat, index) => {
            const valueOverride = stats && stat.key in stats
              ? stat.key === 'averageRating'
                ? stats.averageRating.toFixed(1)
                : String((stats as any)[stat.key])
              : stat.value;
            return (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${getColorClasses(stat.color)}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium text-green-600">{stat.change}</span>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{valueOverride}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            );
          })}
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
                  <Link to="/create-course">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Course
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {myCourses.length > 0 ? (
                  <div className="space-y-4">
                    {myCourses.map((course) => (
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
                        </div>
                      </div>
                    ))}
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
                  <Button variant="outline" size="sm">
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
                          <p className="text-sm text-gray-600">Course: {submission.courseId}</p>
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
                        Grade: {student.grade}%
                      </div>
                    </div>
                  </div>
                ))}
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
                <Button className="w-full" onClick={() => setShowAnnouncementDialog(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Post Announcement
                </Button>
                <Link to="/create-course" className="block">
                  <Button className="w-full bg-teal-600 hover:bg-teal-700">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                </Link>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
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

      {/* Announcement Dialog */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="announcementTitle">Title</Label>
              <Input
                id="announcementTitle"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                placeholder="Enter announcement title"
              />
            </div>
            <div>
              <Label htmlFor="announcementCourse">Course (Optional)</Label>
              <Select value={newAnnouncement.courseId} onValueChange={(value) => setNewAnnouncement({...newAnnouncement, courseId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Students</SelectItem>
                  {myCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id!}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="announcementBody">Message</Label>
              <Textarea
                id="announcementBody"
                value={newAnnouncement.body}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, body: e.target.value})}
                placeholder="Enter announcement message"
                rows={4}
              />
            </div>
            <Button onClick={handleCreateAnnouncement} className="w-full">
              Post Announcement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}