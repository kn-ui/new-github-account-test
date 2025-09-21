import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { submissionService, assignmentService, enrollmentService, courseService } from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Search, 
  TrendingUp, 
  BookOpen,
  Calendar,
  Star,
  Target,
  BarChart3,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';

interface GradeWithDetails {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  submittedAt: Date;
  gradedAt: Date;
  grade: number;
  maxScore: number;
  feedback: string;
  status: 'graded';
}

export default function StudentGrades() {
  const { currentUser, userProfile } = useAuth();
  const { t } = useI18n();
  const [grades, setGrades] = useState<GradeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

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

      // Get all assignments for enrolled courses
      const assignmentsPromises = courseIds.map(async (courseId) => {
        try {
          const courseAssignments = await assignmentService.getAssignmentsByCourse(courseId);
          const course = await courseService.getCourse(courseId);
          return courseAssignments.map(assignment => ({
            ...assignment,
            courseTitle: course?.title || 'Unknown Course',
            instructorName: course?.instructorName || 'Unknown Instructor'
          }));
        } catch (error) {
          console.error(`Error loading assignments for course ${courseId}:`, error);
          return [];
        }
      });

      const assignmentsArrays = await Promise.all(assignmentsPromises);
      const allAssignments = assignmentsArrays.flat();

      // Get graded submissions for all assignments
      const submissionsPromises = allAssignments.map(async (assignment) => {
        try {
          const submissions = await submissionService.getSubmissionsByAssignment(assignment.id);
          const studentSubmissions = submissions.filter(s => 
            s.studentId === currentUser!.uid && s.status === 'graded' && s.grade !== undefined
          );
          
          return studentSubmissions.map(submission => ({
            id: submission.id,
            assignmentId: submission.assignmentId,
            assignmentTitle: assignment.title,
            courseId: assignment.courseId,
            courseTitle: assignment.courseTitle,
            instructorName: assignment.instructorName,
            submittedAt: submission.submittedAt.toDate(),
            gradedAt: submission.gradedAt?.toDate() || submission.submittedAt.toDate(),
            grade: submission.grade || 0,
            maxScore: assignment.maxScore,
            feedback: submission.feedback || '',
            status: 'graded' as const
          }));
        } catch (error) {
          console.error(`Error loading submissions for assignment ${assignment.id}:`, error);
          return [];
        }
      });

      const submissionsArrays = await Promise.all(submissionsPromises);
      const allGrades = submissionsArrays.flat();
      setGrades(allGrades);

    } catch (error) {
      console.error('Error loading grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedGrades = useMemo(() => {
    let filtered = grades.filter(grade => {
      const matchesSearch = grade.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           grade.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           grade.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCourse = courseFilter === 'all' || grade.courseTitle === courseFilter;
      
      return matchesSearch && matchesCourse;
    });

    // Sort grades
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.gradedAt.getTime() - a.gradedAt.getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => a.gradedAt.getTime() - b.gradedAt.getTime());
        break;
      case 'grade-high':
        filtered.sort((a, b) => b.grade - a.grade);
        break;
      case 'grade-low':
        filtered.sort((a, b) => a.grade - b.grade);
        break;
      case 'course':
        filtered.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
        break;
      case 'assignment':
        filtered.sort((a, b) => a.assignmentTitle.localeCompare(b.assignmentTitle));
        break;
    }

    return filtered;
  }, [grades, searchTerm, courseFilter, sortBy]);

  const getGradeColor = (grade: number, maxScore: number) => {
    const percentage = (grade / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeLetter = (grade: number, maxScore: number) => {
    const percentage = (grade / maxScore) * 100;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getUniqueCourses = () => {
    return Array.from(new Set(grades.map(grade => grade.courseTitle)));
  };

  const getStats = () => {
    if (grades.length === 0) {
      return { averageGrade: 0, totalAssignments: 0, highestGrade: 0, lowestGrade: 0 };
    }

    const totalPoints = grades.reduce((sum, grade) => sum + grade.grade, 0);
    const maxPoints = grades.reduce((sum, grade) => sum + grade.maxScore, 0);
    const averageGrade = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
    const highestGrade = Math.max(...grades.map(grade => (grade.grade / grade.maxScore) * 100));
    const lowestGrade = Math.min(...grades.map(grade => (grade.grade / grade.maxScore) * 100));

    return {
      averageGrade: Math.round(averageGrade),
      totalAssignments: grades.length,
      highestGrade: Math.round(highestGrade),
      lowestGrade: Math.round(lowestGrade)
    };
  };

  const stats = getStats();

  if (!userProfile || userProfile.role !== 'student') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{t('common.accessDenied')}</div>
          <div className="text-gray-600">{t('common.studentOnly') || 'Only students can access this page.'}</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('student.grades.loading') || 'Loading grades...'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title={t('student.grades.title') || 'My Grades'}
        subtitle={t('student.grades.subtitle') || 'View your assignment grades and feedback'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="h-5 w-5" />
                {t('student.grades.averageGrade') || 'Average Grade'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.averageGrade}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t('student.grades.totalAssignments') || 'Total Assignments'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.totalAssignments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('student.grades.highestGrade') || 'Highest Grade'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.highestGrade}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('student.grades.lowestGrade') || 'Lowest Grade'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.lowestGrade}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">{t('student.grades.searchLabel') || 'Search Grades'}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('student.grades.searchPlaceholder') || 'Search by assignment, course, or instructor...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="course-filter">{t('student.grades.filterByCourse') || 'Filter by Course'}</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
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
              <Label htmlFor="sort">{t('student.grades.sortBy') || 'Sort By'}</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">{t('student.grades.sortRecent') || 'Most Recent'}</SelectItem>
                  <SelectItem value="oldest">{t('student.grades.sortOldest') || 'Oldest First'}</SelectItem>
                  <SelectItem value="grade-high">{t('student.grades.sortGradeHigh') || 'Grade: High to Low'}</SelectItem>
                  <SelectItem value="grade-low">{t('student.grades.sortGradeLow') || 'Grade: Low to High'}</SelectItem>
                  <SelectItem value="course">{t('student.grades.sortCourse') || 'Course'}</SelectItem>
                  <SelectItem value="assignment">{t('student.grades.sortAssignment') || 'Assignment'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Grades List */}
        <div className="grid gap-4">
          {filteredAndSortedGrades.map(grade => {
            const percentage = (grade.grade / grade.maxScore) * 100;
            const gradeLetter = getGradeLetter(grade.grade, grade.maxScore);
            
            return (
              <Card key={grade.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Award className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{grade.assignmentTitle}</h3>
                          <Badge className={getGradeColor(grade.grade, grade.maxScore)}>
                            {gradeLetter}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{grade.courseTitle}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {grade.instructorName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t('student.grades.gradedAt') || 'Graded'}: {grade.gradedAt.toLocaleDateString()}
                          </span>
                        </div>
                        {grade.feedback && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>{t('student.grades.feedback') || 'Feedback'}:</strong> {grade.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getGradeColor(grade.grade, grade.maxScore).split(' ')[0]}`}>
                        {grade.grade}/{grade.maxScore}
                      </div>
                      <div className="text-sm text-gray-600">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredAndSortedGrades.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Award className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('student.grades.none') || 'No grades yet'}</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || courseFilter !== 'all' 
                    ? (t('student.grades.noResultsTipFiltered') || 'No grades match your current filters')
                    : (t('student.grades.noResultsTip') || 'You haven\'t received any grades yet. Complete assignments to see your grades here.')
                  }
                </p>
                {!searchTerm && courseFilter === 'all' && (
                  <Button asChild>
                    <Link to="/dashboard/student-assignments">{t('student.grades.viewAssignments') || 'View Assignments'}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}