import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, 
  BookOpen, 
  Calendar, 
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Target,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { enrollmentService, courseService, assignmentService, submissionService } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface CourseProgress {
  id: string;
  title: string;
  instructorName: string;
  progress: number;
  totalAssignments: number;
  completedAssignments: number;
  averageGrade: number;
  lastActivity: any;
  enrollmentDate: any;
  estimatedCompletion: any;
}

export default function StudentProgress() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalCourses: 0,
    averageProgress: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    averageGrade: 0,
    studyStreak: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'semester'>('semester');

  useEffect(() => {
    loadProgress();
  }, [currentUser?.uid]);

  const loadProgress = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      
      // Get student's enrollments
      const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser.uid);
      
      // Get detailed progress for each course
      const progressData = await Promise.all(
        enrollments.map(async (enrollment: any) => {
          try {
            const course = await courseService.getCourseById(enrollment.courseId);
            const assignments = await assignmentService.getAssignmentsByCourse(enrollment.courseId);
            const submissions = await submissionService.getSubmissionsByStudent(currentUser.uid);
            
            // Filter submissions for this course
            const courseSubmissions = submissions.filter((s: any) => s.courseId === enrollment.courseId);
            const completedAssignments = courseSubmissions.filter((s: any) => s.status === 'graded').length;
            
            // Calculate average grade
            const gradedSubmissions = courseSubmissions.filter((s: any) => s.grade !== undefined);
            const averageGrade = gradedSubmissions.length > 0 
              ? gradedSubmissions.reduce((sum: number, s: any) => sum + (s.grade || 0), 0) / gradedSubmissions.length
              : 0;
            
            // Calculate progress based on completed assignments
            const progress = assignments.length > 0 
              ? Math.round((completedAssignments / assignments.length) * 100)
              : enrollment.progress || 0;
            
            // Estimate completion date
            const enrollmentDate = enrollment.enrolledAt?.toDate ? enrollment.enrolledAt.toDate() : new Date();
            const estimatedCompletion = new Date(enrollmentDate);
            estimatedCompletion.setDate(estimatedCompletion.getDate() + (assignments.length * 7)); // Rough estimate
            
            return {
              id: enrollment.courseId,
              title: course?.title || 'Unknown Course',
              instructorName: course?.instructorName || 'Unknown Instructor',
              progress: Math.max(progress, enrollment.progress || 0),
              totalAssignments: assignments.length,
              completedAssignments,
              averageGrade: Math.round(averageGrade),
              lastActivity: enrollment.lastActivity || enrollment.enrolledAt,
              enrollmentDate,
              estimatedCompletion
            };
          } catch (error) {
            console.warn(`Failed to load progress for course ${enrollment.courseId}:`, error);
            return {
              id: enrollment.courseId,
              title: 'Unknown Course',
              instructorName: 'Unknown Instructor',
              progress: enrollment.progress || 0,
              totalAssignments: 0,
              completedAssignments: 0,
              averageGrade: 0,
              lastActivity: enrollment.enrolledAt,
              enrollmentDate: enrollment.enrolledAt,
              estimatedCompletion: null
            };
          }
        })
      );
      
      setCourseProgress(progressData);
      
      // Calculate overall statistics
      const totalCourses = progressData.length;
      const averageProgress = progressData.length > 0 
        ? Math.round(progressData.reduce((sum, course) => sum + course.progress, 0) / progressData.length)
        : 0;
      const totalAssignments = progressData.reduce((sum, course) => sum + course.totalAssignments, 0);
      const completedAssignments = progressData.reduce((sum, course) => sum + course.completedAssignments, 0);
      const averageGrade = progressData.filter(c => c.averageGrade > 0).length > 0
        ? Math.round(progressData.filter(c => c.averageGrade > 0).reduce((sum, course) => sum + course.averageGrade, 0) / progressData.filter(c => c.averageGrade > 0).length)
        : 0;
      
      setOverallStats({
        totalCourses,
        averageProgress,
        totalAssignments,
        completedAssignments,
        averageGrade,
        studyStreak: Math.floor(Math.random() * 7) + 1 // Mock data for now
      });
      
    } catch (error) {
      console.error('Failed to load progress:', error);
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-blue-600';
    if (progress >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    if (grade >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading progress...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
            <p className="text-gray-600">Track your learning journey across all courses</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">
                Enrolled courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.averageProgress}%</div>
              <p className="text-xs text-muted-foreground">
                Across all courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.completedAssignments}/{overallStats.totalAssignments}</div>
              <p className="text-xs text-muted-foreground">
                Completed assignments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.averageGrade}%</div>
              <p className="text-xs text-muted-foreground">
                Overall performance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Timeframe Selector */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Progress Timeline</h2>
            <div className="flex space-x-2">
              {(['week', 'month', 'semester'] as const).map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className="capitalize"
                >
                  {timeframe}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            View your progress over the selected time period
          </p>
        </div>

        {/* Course Progress */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Course Progress</h2>
          
          {courseProgress.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses enrolled</h3>
              <p className="text-gray-600 mb-4">Enroll in courses to start tracking your progress</p>
              <Button onClick={() => navigate('/courses')}>
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Courses
              </Button>
            </div>
          ) : (
            courseProgress.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>by {course.instructorName}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getProgressColor(course.progress)}`}>
                        {course.progress}%
                      </div>
                      <div className="text-sm text-gray-500">Complete</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                    
                    {/* Course Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{course.totalAssignments}</div>
                        <div className="text-gray-500">Total Assignments</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{course.completedAssignments}</div>
                        <div className="text-gray-500">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-medium ${getGradeColor(course.averageGrade)}`}>
                          {course.averageGrade > 0 ? `${course.averageGrade}%` : 'N/A'}
                        </div>
                        <div className="text-gray-500">Average Grade</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">
                          {course.estimatedCompletion ? formatDate(course.estimatedCompletion) : 'N/A'}
                        </div>
                        <div className="text-gray-500">Est. Completion</div>
                      </div>
                    </div>
                    
                    {/* Course Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm text-gray-500">
                        Enrolled: {formatDate(course.enrollmentDate)}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/courses/${course.id}`)}>
                          <BookOpen className="h-4 w-4 mr-1" />
                          View Course
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/student-assignments')}>
                          <Target className="h-4 w-4 mr-1" />
                          View Assignments
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Study Streak */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Study Streak</span>
              </CardTitle>
              <CardDescription>Keep up the momentum!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {overallStats.studyStreak} days
                </div>
                <p className="text-gray-600 mb-4">
                  You've been studying consistently for {overallStats.studyStreak} day{overallStats.studyStreak !== 1 ? 's' : ''}!
                </p>
                <div className="flex justify-center space-x-1">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < overallStats.studyStreak ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">This week's activity</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}