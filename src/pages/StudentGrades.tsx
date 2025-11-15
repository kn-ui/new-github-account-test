import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { submissionService, assignmentService, enrollmentService, courseService, gradeService, examService, examAttemptService, otherGradeService, FirestoreGrade, FirestoreExam, FirestoreExamAttempt, FirestoreOtherGrade } from '@/lib/firestore';
import { calculateLetterGrade, loadGradeRanges } from '@/lib/gradeUtils';
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
  Clock,
  ChevronDown,
  ChevronRight
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

interface ExamGradeWithDetails {
  id: string;
  examId: string;
  examTitle: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  submittedAt: Date;
  gradedAt: Date;
  grade: number;
  maxScore: number;
  feedback: string;
  status: 'graded';
  autoScore: number;
  manualScore: number;
}

export default function StudentGrades() {
  const { currentUser, userProfile } = useAuth();
  const { t } = useI18n();
  const [grades, setGrades] = useState<GradeWithDetails[]>([]);
  const [examGrades, setExamGrades] = useState<ExamGradeWithDetails[]>([]);
  const [finalGrades, setFinalGrades] = useState<FirestoreGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [expandedYears, setExpandedYears] = useState<{ [key: string]: boolean }>({
    '2025': true,
  });
  const [gradeType, setGradeType] = useState<'assignments' | 'courses' | 'exams' | 'others'>('courses');
  const [courses, setCourses] = useState<any[]>([]);
  const [otherGrades, setOtherGrades] = useState<FirestoreOtherGrade[]>([]);
  const [gradeRanges, setGradeRanges] = useState<any>(null);

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'student') {
      loadGrades();
      loadGradeRanges().then(setGradeRanges);
    }
  }, [currentUser?.uid, userProfile?.role]);

  const loadGrades = async () => {
    try {
      setLoading(true);
      
      // Get student's enrollments
      const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser!.uid);
      const courseIds = Array.from(new Set(enrollments.map(enrollment => enrollment.courseId)));
      
      if (courseIds.length === 0) {
        setGrades([]);
        setFinalGrades([]);
        setCourses([]);
        setLoading(false);
        return;
      }

      // Fetch all course details at once
      const coursesData = await Promise.all(
        courseIds.map(id => courseService.getCourseById(id))
      );
      const validCourses = coursesData.filter(c => c !== null);
      setCourses(validCourses);
      const courseMap = new Map(validCourses.map((c: any) => [c.id, c]));


      // Get all assignments for enrolled courses
      const assignmentsPromises = courseIds.map(async (courseId) => {
        try {
          const courseAssignments = await assignmentService.getAssignmentsByCourse(courseId);
          const course = courseMap.get(courseId);
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

      // Get graded submissions for the current student in one request
      const studentSubmissionsAll = await submissionService.getSubmissionsByStudent(currentUser!.uid);
      const assignmentById = new Map(allAssignments.map(a => [a.id, a]));
      const gradedSubmissions = studentSubmissionsAll.filter(s => s.status === 'graded' && s.grade !== undefined);
      const allGrades = gradedSubmissions.map(submission => {
        const assignment = assignmentById.get(submission.assignmentId);
        if (!assignment) return null;
        return {
          id: submission.id,
          assignmentId: submission.assignmentId,
          assignmentTitle: assignment.title,
          courseId: assignment.courseId,
          courseTitle: (assignment as any).courseTitle,
          instructorName: (assignment as any).instructorName,
          submittedAt: submission.submittedAt.toDate(),
          gradedAt: (submission as any).gradedAt?.toDate() || submission.submittedAt.toDate(),
          grade: parseFloat((submission.grade || 0).toFixed(1)),
          maxScore: assignment.maxScore,
          feedback: submission.feedback || '',
          status: 'graded' as const
        } as const;
      }).filter(Boolean) as any[];
      setGrades(allGrades);

      // Load exam grades for enrolled courses
      const examGradesPromises = courseIds.map(async (courseId) => {
        try {
          const courseExams = await examService.getExamsByCourse(courseId);
          const course = courseMap.get(courseId);
          
          const examAttemptsPromises = courseExams.map(async (exam) => {
            try {
              const attempt = await examAttemptService.getAttemptForStudent(exam.id, currentUser!.uid);
              if (attempt && attempt.status === 'graded' && attempt.isGraded) {
                // Calculate manual score from manualScores object
                const manualScores = attempt.manualScores || {};
                const manualScore = Object.values(manualScores).reduce((sum: number, score: any) => sum + parseFloat((Number(score) || 0).toFixed(1)), 0);
                
                return {
                  id: attempt.id,
                  examId: exam.id,
                  examTitle: exam.title,
                  courseId: courseId,
                  courseTitle: course?.title || 'Unknown Course',
                  instructorName: course?.instructorName || 'Unknown Instructor',
                  submittedAt: attempt.submittedAt?.toDate() || new Date(),
                  gradedAt: attempt.submittedAt?.toDate() || new Date(),
                  grade: parseFloat((attempt.score || 0).toFixed(1)),
                  maxScore: exam.totalPoints,
                  feedback: attempt.manualFeedback || {},
                  status: 'graded' as const,
                  autoScore: parseFloat((attempt.autoScore || 0).toFixed(1)),
                  manualScore: parseFloat(manualScore.toFixed(1))
                };
              }
              return null;
            } catch (error) {
              console.error(`Error loading exam attempt for exam ${exam.id}:`, error);
              return null;
            }
          });
          
          const examAttempts = await Promise.all(examAttemptsPromises);
          return examAttempts.filter(attempt => attempt !== null);
        } catch (error) {
          console.error(`Error loading exam grades for course ${courseId}:`, error);
          return [];
        }
      });

      const examGradesArrays = await Promise.all(examGradesPromises);
      const allExamGrades = examGradesArrays.flat();
      setExamGrades(allExamGrades);

      // Load final grades for courses
      const finalGradesPromises = courseIds.map(async (courseId) => {
        try {
          const finalGrade = await gradeService.getGradeByStudentAndCourse(courseId, currentUser!.uid);
          // Hide if not published
          if (finalGrade && (finalGrade as any).isPublished === false) return null;
          return finalGrade;
        } catch (error) {
          console.error(`Error loading final grade for course ${courseId}:`, error);
          return null;
        }
      });

      const finalGradesResults = await Promise.all(finalGradesPromises);
      const validFinalGrades = finalGradesResults.filter(grade => grade !== null) as FirestoreGrade[];
      const uniqueFinalGrades = Object.values(validFinalGrades.reduce((acc, g) => {
        if (!acc[g.courseId] || acc[g.courseId].calculatedAt.toDate() < g.calculatedAt.toDate()) {
          acc[g.courseId] = g;
        }
        return acc;
      }, {} as Record<string, FirestoreGrade>));
      setFinalGrades(uniqueFinalGrades);

      // Load "other" grades for this student across courses
      try {
        const otherPromises = courseIds.map((cid) => otherGradeService.getByStudentInCourse(cid, currentUser!.uid));
        const otherArrays = await Promise.all(otherPromises);
        const allOtherGrades = otherArrays.flat();
        const uniqueOtherGrades = Array.from(new Map(allOtherGrades.map(og => [og.id, og])).values());
        setOtherGrades(uniqueOtherGrades);
      } catch (e) {
        // Silently ignore
        setOtherGrades([]);
      }

    } catch (error) {
      // Suppress console noise; UI shows error states via empties
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

  const filteredAndSortedExamGrades = useMemo(() => {
    let filtered = examGrades.filter(grade => {
      const matchesSearch = grade.examTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           grade.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           grade.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCourse = courseFilter === 'all' || grade.courseTitle === courseFilter;
      
      return matchesSearch && matchesCourse;
    });

    // Sort exam grades
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
        filtered.sort((a, b) => a.examTitle.localeCompare(b.examTitle));
        break;
    }

    return filtered;
  }, [examGrades, searchTerm, courseFilter, sortBy]);

  const filteredAndSortedFinalGrades = useMemo(() => {
    // Get course names for final grades
    const finalGradesWithCourseNames = finalGrades.map(grade => {
      const course = courses.find(c => c.id === grade.courseId);
      return {
        ...grade,
        courseTitle: course?.title || 'Unknown Course',
        instructorName: course?.instructorName || 'Unknown Instructor'
      };
    });

    let filtered = finalGradesWithCourseNames.filter(grade => {
      const matchesSearch = grade.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           grade.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCourse = courseFilter === 'all' || grade.courseTitle === courseFilter;
      
      return matchesSearch && matchesCourse;
    });

    // Sort final grades
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.calculatedAt.toDate().getTime() - a.calculatedAt.toDate().getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => a.calculatedAt.toDate().getTime() - b.calculatedAt.toDate().getTime());
        break;
      case 'grade-high':
        filtered.sort((a, b) => b.finalGrade - a.finalGrade);
        break;
      case 'grade-low':
        filtered.sort((a, b) => a.finalGrade - b.finalGrade);
        break;
      case 'course':
        filtered.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
        break;
    }

    return filtered;
  }, [finalGrades, courses, searchTerm, courseFilter, sortBy]);

  const getGradeColor = (grade: number, maxScore: number) => {
    const percentage = (grade / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeLetter = (grade: number, maxScore: number) => {
    const { letter } = calculateLetterGrade(grade, maxScore, gradeRanges);
    return letter;
  };

  const getUniqueCourses = () => {
    return Array.from(new Set(grades.map(grade => grade.courseTitle)));
  };

  const toggleYear = (year: string) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  const getStats = () => {
    if (gradeType === 'courses') {
      // Stats for final course grades
      if (finalGrades.length === 0) {
        return { averageGrade: 0, totalCourses: 0, highestGrade: 0, lowestGrade: 0 };
      }

      const averageGrade = finalGrades.reduce((sum, grade) => sum + grade.finalGrade, 0) / finalGrades.length;
      const highestGrade = Math.max(...finalGrades.map(grade => grade.finalGrade));
      const lowestGrade = Math.min(...finalGrades.map(grade => grade.finalGrade));

      return {
        averageGrade: parseFloat(averageGrade.toFixed(1)),
        totalCourses: finalGrades.length,
        highestGrade: parseFloat(highestGrade.toFixed(1)),
        lowestGrade: parseFloat(lowestGrade.toFixed(1))
      };
    } else if (gradeType === 'exams') {
      // Stats for exam grades
      if (examGrades.length === 0) {
        return { averageGrade: 0, totalExams: 0, highestGrade: 0, lowestGrade: 0 };
      }

      const totalPoints = examGrades.reduce((sum, grade) => sum + grade.grade, 0);
      const maxPoints = examGrades.reduce((sum, grade) => sum + grade.maxScore, 0);
      const averageGrade = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
      const highestGrade = Math.max(...examGrades.map(grade => (grade.grade / grade.maxScore) * 100));
      const lowestGrade = Math.min(...examGrades.map(grade => (grade.grade / grade.maxScore) * 100));

      return {
        averageGrade: parseFloat(averageGrade.toFixed(1)),
        totalExams: examGrades.length,
        highestGrade: parseFloat(highestGrade.toFixed(1)),
        lowestGrade: parseFloat(lowestGrade.toFixed(1))
      };
    } else if (gradeType === 'others') {
      // Stats for other grades (points-based)
      if (otherGrades.length === 0) {
        return { averageGrade: 0, totalOthers: 0, highestGrade: 0, lowestGrade: 0 } as any;
      }
      const points = otherGrades.map(g => g.points || 0);
      const average = points.reduce((a, b) => a + b, 0) / points.length;
      const highest = Math.max(...points);
      const lowest = Math.min(...points);
      return { averageGrade: parseFloat(average.toFixed(1)), totalOthers: otherGrades.length, highestGrade: parseFloat(highest.toFixed(1)), lowestGrade: parseFloat(lowest.toFixed(1)) } as any;
    } else {
      // Stats for assignment grades
      if (grades.length === 0) {
        return { averageGrade: 0, totalAssignments: 0, highestGrade: 0, lowestGrade: 0 };
      }

      const totalPoints = grades.reduce((sum, grade) => sum + grade.grade, 0);
      const maxPoints = grades.reduce((sum, grade) => sum + grade.maxScore, 0);
      const averageGrade = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
      const highestGrade = Math.max(...grades.map(grade => (grade.grade / grade.maxScore) * 100));
      const lowestGrade = Math.min(...grades.map(grade => (grade.grade / grade.maxScore) * 100));

      return {
        averageGrade: parseFloat(averageGrade.toFixed(1)),
        totalAssignments: grades.length,
        highestGrade: parseFloat(highestGrade.toFixed(1)),
        lowestGrade: parseFloat(lowestGrade.toFixed(1))
      };
    }
  };

  const stats = getStats();

  if (!userProfile || userProfile.role !== 'student') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{t('common.accessDenied')}</div>
          <div className="text-gray-600">{t('common.studentOnly')}</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('student.grades.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('student.grades.title')}</h1>
        </div>

        {/* Grade Type Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <Label>View Grades By:</Label>
            <div className="flex items-center space-x-2">
              <Button
                variant={gradeType === 'courses' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGradeType('courses')}
              >
                Courses
              </Button>
              <Button
                variant={gradeType === 'assignments' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGradeType('assignments')}
              >
                Assignments
              </Button>
              <Button
                variant={gradeType === 'exams' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGradeType('exams')}
              >
                Exams
              </Button>
              <Button
                variant={gradeType === 'others' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGradeType('others')}
              >
                Other Grades
              </Button>
            </div>
          </div>
        </div>
        {/* Grade Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <Award size={20} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {gradeType === 'courses' ? 'Average Final Grade' : gradeType === 'exams' ? 'Average Exam Grade' : gradeType === 'others' ? 'Average Other Points' : t('student.grades.averageGrade')}
              </span>
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats.averageGrade}%</p>
          </div>
          
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <div className="flex items-center gap-3 mb-2">
              <Award size={20} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {gradeType === 'courses' ? 'Total Courses' : gradeType === 'exams' ? 'Total Exams' : gradeType === 'others' ? 'Total Entries' : t('student.grades.totalAssignments')}
              </span>
            </div>
            <p className="text-3xl font-bold text-green-900">
              {gradeType === 'courses' ? stats.totalCourses : gradeType === 'exams' ? stats.totalExams : gradeType === 'others' ? (stats as any).totalOthers : stats.totalAssignments}
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-2">
              <Award size={20} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-800">{t('student.grades.highestGrade')}</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">{stats.highestGrade}%</p>
          </div>
        </div>

        {/* Grades Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            {gradeType === 'assignments' ? (
              // Assignment Grades View
              ['2025', '2024', '2023', '2022', '2021'].map((year) => {
                const yearGrades = filteredAndSortedGrades.filter(grade => 
                  grade.gradedAt.getFullYear().toString() === year
                );
                
                return (
                  <div key={year} className="border-b border-gray-200 last:border-b-0">
                    <button
                      onClick={() => toggleYear(year)}
                      className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 rounded-lg px-2 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {expandedYears[year] ? (
                          <ChevronDown size={20} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-400" />
                        )}
                        <span className="font-semibold text-gray-900">{year}</span>
                      </div>
                    </button>

                    {expandedYears[year] && yearGrades.length > 0 && (
                      <div className="pl-8 pb-4 space-y-6">
                        <div className="border-l-4 border-blue-500 pl-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Year {year}</h3>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-3 px-4 font-medium text-gray-700">Assignment</th>
                                  <th className="text-left py-3 px-4 font-medium text-gray-700">Course</th>
                                  <th className="text-center py-3 px-4 font-medium text-gray-700">Grade</th>
                                  <th className="text-center py-3 px-4 font-medium text-gray-700">Max Score</th>
                                  <th className="text-center py-3 px-4 font-medium text-gray-700">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {yearGrades.map((grade) => (
                                  <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-gray-800 truncate max-w-[200px]">{grade.assignmentTitle}</td>
                                    <td className="py-3 px-4 text-gray-600 truncate max-w-[150px]">{grade.courseTitle}</td>
                                    <td className="py-3 px-4 text-center">
                                      <span className={`font-semibold ${getGradeColor(grade.grade, grade.maxScore)}`}>
                                        {grade.grade}/{grade.maxScore}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center text-gray-600">{grade.maxScore}</td>
                                    <td className="py-3 px-4 text-center text-gray-600">{grade.gradedAt.toLocaleDateString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {expandedYears[year] && yearGrades.length === 0 && (
                      <div className="pl-8 pb-4">
                        <p className="text-gray-500 italic">No grades available for this year</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : gradeType === 'exams' ? (
              // Exam Grades View - Grouped by Year
              filteredAndSortedExamGrades.length > 0 ? (
                ['2025', '2024', '2023', '2022', '2021'].map((year) => {
                  const yearGrades = filteredAndSortedExamGrades.filter(grade => 
                    grade.gradedAt.getFullYear().toString() === year
                  );
                  
                  return (
                    <div key={year} className="border-b border-gray-200 last:border-b-0">
                      <button
                        onClick={() => toggleYear(year)}
                        className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 rounded-lg px-2 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedYears[year] ? (
                            <ChevronDown size={20} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={20} className="text-gray-400" />
                          )}
                          <span className="font-semibold text-gray-900">{year}</span>
                        </div>
                      </button>

                      {expandedYears[year] && yearGrades.length > 0 && (
                        <div className="pl-8 pb-4 space-y-6">
                          <div className="border-l-4 border-blue-500 pl-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Year {year}</h3>
                            
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Exam</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Course</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Grade</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Max Score</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {yearGrades.map((grade) => (
                                    <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                                      <td className="py-3 px-4 text-gray-800 truncate max-w-[200px]">{grade.examTitle}</td>
                                      <td className="py-3 px-4 text-gray-600 truncate max-w-[150px]">{grade.courseTitle}</td>
                                      <td className="py-3 px-4 text-center">
                                        <span className={`font-semibold ${getGradeColor(grade.grade, grade.maxScore)}`}>
                                          {grade.grade}/{grade.maxScore}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 text-center text-gray-600">{grade.maxScore}</td>
                                      <td className="py-3 px-4 text-center text-gray-600">{grade.gradedAt.toLocaleDateString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {expandedYears[year] && yearGrades.length === 0 && (
                        <div className="pl-8 pb-4">
                          <p className="text-gray-500 italic">No exam grades available for this year</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Exam Grades Yet</h3>
                  <p className="text-gray-400">Your exam grades will appear here once they're graded by your instructors.</p>
                </div>
              )
            ) : gradeType === 'others' ? (
              // Other Grades View - Grouped by Year and Course
              otherGrades.length > 0 ? (
                ['2025', '2024', '2023', '2022', '2021'].map((year) => {
                  const yearOthers = otherGrades.filter(g => (g as any).createdAt?.toDate ? (g as any).createdAt.toDate().getFullYear().toString() === year : true);
                  // Group by course
                  const courseGroups = yearOthers.reduce((acc: any, og) => {
                    if (!acc[og.courseId]) acc[og.courseId] = [] as FirestoreOtherGrade[];
                    acc[og.courseId].push(og);
                    return acc;
                  }, {} as Record<string, FirestoreOtherGrade[]>);
                  return (
                    <div key={year} className="border-b border-gray-200 last:border-b-0">
                      <button
                        onClick={() => toggleYear(year)}
                        className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 rounded-lg px-2 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedYears[year] ? (
                            <ChevronDown size={20} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={20} className="text-gray-400" />
                          )}
                          <span className="font-semibold text-gray-900">{year}</span>
                        </div>
                      </button>

                      {expandedYears[year] && yearOthers.length > 0 && (
                        <div className="pl-8 pb-4 space-y-6">
                          <div className="border-l-4 border-blue-500 pl-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Year {year}</h3>
                            {Object.entries(courseGroups).map(([courseId, entries]) => {
                              const course = courses.find(c => c.id === courseId);
                              return (
                                <div key={courseId} className="mb-6">
                                  <div className="w-full flex items-center justify-between py-3 text-left rounded-lg px-3 border border-gray-200">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-800">{course?.title || courseId}</span>
                                      <span className="text-sm text-gray-500">({entries.length} entries)</span>
                                    </div>
                                  </div>
                                  <div className="ml-6 mt-3">
                                    <div className="overflow-x-auto">
                                      <table className="w-full">
                                        <thead>
                                          <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
                                            <th className="text-center py-3 px-4 font-medium text-gray-700">Points</th>
                                            <th className="text-center py-3 px-4 font-medium text-gray-700">Date</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {entries.map((og) => (
                                            <tr key={og.id} className="border-b border-gray-100 hover:bg-gray-50">
                                              <td className="py-3 px-4 text-gray-800 truncate max-w-[260px]">{og.reason}</td>
                                              <td className="py-3 px-4 text-center text-gray-900 font-semibold">+{og.points}</td>
                                              <td className="py-3 px-4 text-center text-gray-600">{(og as any).createdAt?.toDate ? (og as any).createdAt.toDate().toLocaleDateString() : ''}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        <tfoot>
                                          <tr className="bg-gray-50 font-semibold">
                                            <td className="py-3 px-4 text-gray-800">Total</td>
                                            <td className="py-3 px-4 text-center">
                                              +{entries.reduce((sum, og) => sum + (og.points || 0), 0)}
                                            </td>
                                            <td></td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {expandedYears[year] && yearOthers.length === 0 && (
                        <div className="pl-8 pb-4">
                          <p className="text-gray-500 italic">No other grades available for this year</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Other Grades Yet</h3>
                  <p className="text-gray-400">Other grades will appear here once they're added by your instructors.</p>
                </div>
              )
            ) : (
              // Final Course Grades View - Grouped by Year
              filteredAndSortedFinalGrades.length > 0 ? (
                ['2025', '2024', '2023', '2022', '2021'].map((year) => {
                  const yearGrades = filteredAndSortedFinalGrades.filter(grade => 
                    grade.calculatedAt.toDate().getFullYear().toString() === year
                  );
                  
                  return (
                    <div key={year} className="border-b border-gray-200 last:border-b-0">
                      <button
                        onClick={() => toggleYear(year)}
                        className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 rounded-lg px-2 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedYears[year] ? (
                            <ChevronDown size={20} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={20} className="text-gray-400" />
                          )}
                          <span className="font-semibold text-gray-900">{year}</span>
                        </div>
                      </button>

                      {expandedYears[year] && yearGrades.length > 0 && (
                        <div className="pl-8 pb-4 space-y-6">
                          <div className="border-l-4 border-blue-500 pl-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Year {year}</h3>
                            
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Course</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Instructor</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Final Grade</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Letter Grade</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Calculated</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {yearGrades.map((grade) => {
                                    const totalMax = (grade as any).assignmentsMax + (grade as any).examsMax;
                                    const letterGrade = grade.letterGrade || '';
                                    return (
                                      <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-800 font-medium">{grade.courseTitle}</td>
                                        <td className="py-3 px-4 text-gray-600">{grade.instructorName}</td>
                                        <td className="py-3 px-4 text-center">
                                          <span className={`font-semibold ${getGradeColor(grade.finalGrade, totalMax > 0 ? totalMax : 100)}`}>
                                            {grade.finalGrade}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                          <Badge variant={letterGrade === 'A' ? 'default' : letterGrade === 'B' ? 'secondary' : letterGrade === 'C' ? 'outline' : 'destructive'}>
                                            {letterGrade}
                                          </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-center text-gray-600 text-sm">
                                          {grade.calculatedAt.toDate().toLocaleDateString()}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {expandedYears[year] && yearGrades.length === 0 && (
                        <div className="pl-8 pb-4">
                          <p className="text-gray-500 italic">No final grades available for this year</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Final Grades Yet</h3>
                  <p className="text-gray-400">Your final course grades will appear here once they're calculated by your instructors.</p>
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}