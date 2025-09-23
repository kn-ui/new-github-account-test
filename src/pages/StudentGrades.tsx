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

export default function StudentGrades() {
  const { currentUser, userProfile } = useAuth();
  const { t } = useI18n();
  const [grades, setGrades] = useState<GradeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [expandedYears, setExpandedYears] = useState<{ [key: string]: boolean }>({
    '2025': true,
  });

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
          const course = await courseService.getCourseById(courseId);
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

  const toggleYear = (year: string) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
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
        {/* Grade Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <Award size={20} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{t('student.grades.averageGrade')}</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats.averageGrade}%</p>
          </div>
          
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <div className="flex items-center gap-3 mb-2">
              <Award size={20} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">{t('student.grades.totalAssignments')}</span>
            </div>
            <p className="text-3xl font-bold text-green-900">{stats.totalAssignments}</p>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-2">
              <Award size={20} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-800">{t('student.grades.highestGrade')}</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">{stats.highestGrade}%</p>
          </div>
        </div>

        {/* Grades by Year */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            {['2025', '2024', '2023', '2022', '2021'].map((year) => {
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
                                  <td className="py-3 px-4 text-gray-800">{grade.assignmentTitle}</td>
                                  <td className="py-3 px-4 text-gray-600">{grade.courseTitle}</td>
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
            })}
          </div>
        </div>

      </div>
    </div>
  );
}