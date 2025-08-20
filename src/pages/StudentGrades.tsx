import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { enrollmentService, submissionService, FirestoreSubmission } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Award, 
  Search, 
  TrendingUp, 
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface GradeData {
  courseId: string;
  courseTitle: string;
  instructorName: string;
  assignments: {
    id: string;
    title: string;
    maxScore: number;
    grade?: number;
    feedback?: string;
    submittedAt: Date;
    gradedAt?: Date;
  }[];
  totalScore: number;
  maxPossibleScore: number;
  averageGrade: number;
  completedAssignments: number;
  totalAssignments: number;
}

export default function StudentGrades() {
  const { currentUser, userProfile } = useAuth();
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('average-grade');

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'student') {
      loadGrades();
    }
  }, [currentUser?.uid, userProfile?.role]);

  const loadGrades = async () => {
    try {
      setLoading(true);
      
      // Get student's enrollments
      const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser!.uid);
      const courseIds = enrollments.map(enrollment => enrollment.courseId);
      
      if (courseIds.length === 0) {
        setGrades([]);
        return;
      }

      // Get submissions for all enrolled courses
      const submissions = await submissionService.getSubmissionsByStudent(currentUser!.uid);
      const gradedSubmissions = submissions.filter(s => s.status === 'graded');

      // Group submissions by course and calculate grades
      const gradesData: GradeData[] = enrollments.map(enrollment => {
        const courseSubmissions = gradedSubmissions.filter(s => s.assignmentId && 
          enrollment.course?.assignments?.some(a => a.id === s.assignmentId));
        
        const assignments = courseSubmissions.map(submission => {
          const assignment = enrollment.course?.assignments?.find(a => a.id === submission.assignmentId);
          return {
            id: submission.id,
            title: assignment?.title || 'Unknown Assignment',
            maxScore: assignment?.maxScore || 0,
            grade: submission.grade,
            feedback: submission.feedback,
            submittedAt: submission.submittedAt,
            gradedAt: submission.gradedAt
          };
        });

        const totalScore = assignments.reduce((sum, a) => sum + (a.grade || 0), 0);
        const maxPossibleScore = assignments.reduce((sum, a) => sum + a.maxScore, 0);
        const averageGrade = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
        const completedAssignments = assignments.length;
        const totalAssignments = enrollment.course?.assignments?.length || 0;

        return {
          courseId: enrollment.courseId,
          courseTitle: enrollment.course?.title || 'Unknown Course',
          instructorName: enrollment.course?.instructorName || 'Unknown Instructor',
          assignments,
          totalScore,
          maxPossibleScore,
          averageGrade,
          completedAssignments,
          totalAssignments
        };
      });

      setGrades(gradesData);
    } catch (error) {
      console.error('Error loading grades:', error);
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedGrades = useMemo(() => {
    let filtered = grades.filter(grade => {
      const matchesSearch = grade.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           grade.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCourse = courseFilter === 'all' || grade.courseTitle === courseFilter;
      
      return matchesSearch && matchesCourse;
    });

    // Sort grades
    switch (sortBy) {
      case 'average-grade':
        filtered.sort((a, b) => b.averageGrade - a.averageGrade);
        break;
      case 'average-grade-asc':
        filtered.sort((a, b) => a.averageGrade - b.averageGrade);
        break;
      case 'course-name':
        filtered.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
        break;
      case 'completed-assignments':
        filtered.sort((a, b) => b.completedAssignments - a.completedAssignments);
        break;
    }

    return filtered;
  }, [grades, searchTerm, courseFilter, sortBy]);

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    if (grade >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeBadgeColor = (grade: number) => {
    if (grade >= 90) return 'bg-green-100 text-green-800';
    if (grade >= 80) return 'bg-blue-100 text-blue-800';
    if (grade >= 70) return 'bg-yellow-100 text-yellow-800';
    if (grade >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getLetterGrade = (grade: number) => {
    if (grade >= 90) return 'A';
    if (grade >= 80) return 'B';
    if (grade >= 70) return 'C';
    if (grade >= 60) return 'D';
    return 'F';
  };

  const getOverallStats = () => {
    if (grades.length === 0) return null;

    const totalAssignments = grades.reduce((sum, g) => sum + g.completedAssignments, 0);
    const totalScore = grades.reduce((sum, g) => sum + g.totalScore, 0);
    const totalMaxScore = grades.reduce((sum, g) => sum + g.maxPossibleScore, 0);
    const overallAverage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    return {
      totalCourses: grades.length,
      totalAssignments,
      overallAverage,
      letterGrade: getLetterGrade(overallAverage)
    };
  };

  const getUniqueCourses = () => {
    return Array.from(new Set(grades.map(grade => grade.courseTitle)));
  };

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
        <div className="text-gray-600">Loading grades...</div>
      </div>
    );
  }

  const overallStats = getOverallStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>
              <p className="text-gray-600">View your academic performance and feedback</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Stats */}
        {overallStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Courses</p>
                    <p className="text-xl font-semibold text-gray-900">{overallStats.totalCourses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed Assignments</p>
                    <p className="text-xl font-semibold text-gray-900">{overallStats.totalAssignments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Overall Average</p>
                    <p className={`text-xl font-semibold ${getGradeColor(overallStats.overallAverage)}`}>
                      {overallStats.overallAverage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Award className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Letter Grade</p>
                    <p className={`text-xl font-semibold ${getGradeColor(overallStats.overallAverage)}`}>
                      {overallStats.letterGrade}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Courses</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by course or instructor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="course-filter">Filter by Course</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {getUniqueCourses().map(courseTitle => (
                    <SelectItem key={courseTitle} value={courseTitle}>
                      {courseTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="average-grade">Highest Grade First</SelectItem>
                  <SelectItem value="average-grade-asc">Lowest Grade First</SelectItem>
                  <SelectItem value="course-name">Course Name</SelectItem>
                  <SelectItem value="completed-assignments">Most Assignments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Course Grades */}
        <div className="grid gap-6">
          {filteredAndSortedGrades.map(courseGrade => (
            <Card key={courseGrade.courseId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      {courseGrade.courseTitle}
                    </CardTitle>
                    <CardDescription>
                      Instructor: {courseGrade.instructorName}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getGradeColor(courseGrade.averageGrade)}`}>
                      {courseGrade.averageGrade.toFixed(1)}%
                    </div>
                    <Badge className={getGradeBadgeColor(courseGrade.averageGrade)}>
                      {getLetterGrade(courseGrade.averageGrade)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Score</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {courseGrade.totalScore}/{courseGrade.maxPossibleScore}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {courseGrade.completedAssignments}/{courseGrade.totalAssignments}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Completion Rate</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {courseGrade.totalAssignments > 0 
                        ? Math.round((courseGrade.completedAssignments / courseGrade.totalAssignments) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant="outline" className="mt-1">
                      {courseGrade.completedAssignments === courseGrade.totalAssignments ? 'Complete' : 'In Progress'}
                    </Badge>
                  </div>
                </div>

                {/* Assignment Details */}
                {courseGrade.assignments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Assignment Details</h4>
                    <div className="space-y-3">
                      {courseGrade.assignments.map(assignment => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{assignment.title}</h5>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span>Max Score: {assignment.maxScore}</span>
                              <span>Submitted: {assignment.submittedAt.toDate().toLocaleDateString()}</span>
                              {assignment.gradedAt && (
                                <span>Graded: {assignment.gradedAt.toDate().toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {assignment.grade !== undefined ? (
                              <div>
                                <div className={`text-lg font-semibold ${getGradeColor(assignment.grade)}`}>
                                  {assignment.grade}/{assignment.maxScore}
                                </div>
                                <div className={`text-sm ${getGradeColor(assignment.grade)}`}>
                                  {((assignment.grade / assignment.maxScore) * 100).toFixed(1)}%
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline">Not Graded</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {courseGrade.assignments.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No graded assignments yet</p>
                    <p className="text-sm">Complete assignments to see your grades here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredAndSortedGrades.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No grades found</p>
              <p className="text-sm">Complete assignments to see your grades</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}