import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { enrollmentService, courseService, submissionService, assignmentService } from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  BookOpen, 
  Target,
  Award,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardHero from '@/components/DashboardHero';

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  instructorName: string;
  progress: number;
  enrolledAt: Date;
  lastAccessed?: Date;
  totalAssignments: number;
  completedAssignments: number;
  averageGrade: number;
  totalHours: number;
  estimatedHours: number;
}

interface LearningGoal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed';
}

export default function StudentProgress() {
  const { currentUser, userProfile } = useAuth();
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'student') {
      loadProgressData();
    }
  }, [currentUser?.uid, userProfile?.role]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      
      // Get student's enrollments
      const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser!.uid);
      
      if (enrollments.length === 0) {
        setCourseProgress([]);
        return;
      }

      // Load detailed progress for each course
      const progressPromises = enrollments.map(async (enrollment) => {
        try {
          const course = await courseService.getCourseById(enrollment.courseId);
          if (!course) return null;

          // Get assignments for this course
          const assignments = await assignmentService.getAssignmentsByCourse(enrollment.courseId);
          
          // Get student's submissions for this course
          const submissions = await submissionService.getSubmissionsByStudent(currentUser!.uid);
          const courseSubmissions = submissions.filter(s => 
            assignments.some(a => a.id === s.assignmentId)
          );
          
          const completedAssignments = courseSubmissions.filter(s => s.status === 'graded').length;
          const gradedSubmissions = courseSubmissions.filter(s => s.status === 'graded' && s.grade !== undefined);
          const averageGrade = gradedSubmissions.length > 0
            ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
            : 0;

          // Calculate estimated hours (simplified - in real app, this would be more sophisticated)
          const estimatedHours = assignments.length * 2; // 2 hours per assignment
          const totalHours = Math.round((enrollment.progress || 0) / 100 * estimatedHours);

          return {
            courseId: enrollment.courseId,
            courseTitle: course.title,
            instructorName: course.instructorName,
            progress: enrollment.progress || 0,
            enrolledAt: enrollment.enrolledAt.toDate(),
            lastAccessed: enrollment.lastAccessedAt?.toDate(),
            totalAssignments: assignments.length,
            completedAssignments,
            averageGrade: Math.round(averageGrade),
            totalHours,
            estimatedHours
          };
        } catch (error) {
          console.error(`Error loading progress for course ${enrollment.courseId}:`, error);
          return null;
        }
      });

      const progressResults = await Promise.all(progressPromises);
      const validProgress = progressResults.filter(result => result !== null) as CourseProgress[];
      setCourseProgress(validProgress);

      // Load learning goals (mock data for now)
      const mockGoals: LearningGoal[] = [
        {
          id: '1',
          title: 'Complete 3 courses this semester',
          description: 'Finish at least 3 courses with 80% or higher grade',
          targetDate: new Date('2024-06-30'),
          progress: 67,
          status: 'in-progress'
        },
        {
          id: '2',
          title: 'Improve assignment submission rate',
          description: 'Submit all assignments on time',
          targetDate: new Date('2024-05-31'),
          progress: 85,
          status: 'in-progress'
        },
        {
          id: '3',
          title: 'Master Biblical Studies',
          description: 'Achieve 90% or higher in Biblical Studies course',
          targetDate: new Date('2024-04-30'),
          progress: 100,
          status: 'completed'
        }
      ];
      setLearningGoals(mockGoals);

    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'not-started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGoalStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'not-started': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const overallStats = useMemo(() => {
    if (courseProgress.length === 0) {
      return { averageProgress: 0, totalCourses: 0, completedCourses: 0, averageGrade: 0 };
    }

    const averageProgress = courseProgress.reduce((sum, course) => sum + course.progress, 0) / courseProgress.length;
    const completedCourses = courseProgress.filter(course => course.progress === 100).length;
    const averageGrade = courseProgress.reduce((sum, course) => sum + course.averageGrade, 0) / courseProgress.length;

    return {
      averageProgress: Math.round(averageProgress),
      totalCourses: courseProgress.length,
      completedCourses,
      averageGrade: Math.round(averageGrade)
    };
  }, [courseProgress]);

  if (!userProfile || userProfile.role !== 'student') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only students can access this page.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading progress data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title="My Progress"
        subtitle="Track your learning journey and achievements"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Average Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{overallStats.averageProgress}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{overallStats.totalCourses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{overallStats.completedCourses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Average Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{overallStats.averageGrade}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Progress */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Progress
                </CardTitle>
                <CardDescription>Your progress in enrolled courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseProgress.map(course => (
                    <div key={course.courseId} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{course.courseTitle}</h3>
                          <p className="text-sm text-gray-600">by {course.instructorName}</p>
                        </div>
                        <Badge variant="outline">{course.progress}%</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        <div>
                          <span className="text-gray-600">Assignments:</span>
                          <span className="ml-2 font-medium">
                            {course.completedAssignments}/{course.totalAssignments}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Average Grade:</span>
                          <span className={`ml-2 font-medium ${getGradeColor(course.averageGrade)}`}>
                            {course.averageGrade}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Hours:</span>
                          <span className="ml-2 font-medium">
                            {course.totalHours}/{course.estimatedHours}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Accessed:</span>
                          <span className="ml-2 font-medium">
                            {course.lastAccessed?.toLocaleDateString() || 'Never'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/course/${course.courseId}`}>
                            Continue Learning
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {courseProgress.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No courses enrolled</p>
                      <Button asChild className="mt-2">
                        <Link to="/courses">Browse Courses</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learning Goals */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Learning Goals
                </CardTitle>
                <CardDescription>Track your personal learning objectives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {learningGoals.map(goal => (
                    <div key={goal.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                          <p className="text-sm text-gray-600">{goal.description}</p>
                        </div>
                        <Badge className={getGoalStatusColor(goal.status)}>
                          <div className="flex items-center gap-1">
                            {getGoalStatusIcon(goal.status)}
                            {goal.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                      
                      <div className="mt-3 text-sm text-gray-600">
                        <span>Target Date: {goal.targetDate.toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  
                  {learningGoals.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No learning goals set</p>
                      <Button variant="outline" className="mt-2">
                        Set Goals
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/dashboard/student-assignments">
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Assignments
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/dashboard/student-grades">
                      <Award className="h-4 w-4 mr-2" />
                      View Grades
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/courses">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse Courses
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}