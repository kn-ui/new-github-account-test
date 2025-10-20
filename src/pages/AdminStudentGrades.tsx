import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { submissionService, assignmentService, enrollmentService, courseService, gradeService, examService, examAttemptService, otherGradeService, userService, settingsService, FirestoreGrade, FirestoreExam, FirestoreExamAttempt, FirestoreOtherGrade } from '@/lib/firestore';
import { calculateLetterGrade, calculateGPA } from '@/lib/gradeUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
  ChevronRight,
  ArrowLeft,
  User,
  GraduationCap
} from 'lucide-react';
import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';
import { toEthiopianDate } from '@/lib/ethiopianCalendar';
import LoadingSpinner from '@/components/LoadingSpinner';

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

interface StudentInfo {
  id: string;
  displayName: string;
  email: string;
  role: string;
}

export default function AdminStudentGrades() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { t } = useI18n();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [grades, setGrades] = useState<GradeWithDetails[]>([]);
  const [examGrades, setExamGrades] = useState<ExamGradeWithDetails[]>([]);
  const [finalGrades, setFinalGrades] = useState<FirestoreGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [expandedYears, setExpandedYears] = useState<{ [key: string]: boolean }>({
    '2025': true,
  });
  const [gradeType, setGradeType] = useState<'assignments' | 'courses' | 'exams' | 'others'>('courses');
  const [otherGrades, setOtherGrades] = useState<FirestoreOtherGrade[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<{ [key: string]: boolean }>({});
  const [expandedOtherCourses, setExpandedOtherCourses] = useState<{ [key: string]: boolean }>({});
  const [selectedCourseForGrade, setSelectedCourseForGrade] = useState<string>('');
  const [gradeRanges, setGradeRanges] = useState<any>({});
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (studentId && (userProfile?.role === 'admin' || userProfile?.role === 'super_admin')) {
      setIsInitialized(true);
      loadStudentData();
    }
  }, [studentId, userProfile?.role]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      // Load student information and enrollments in parallel
      const [studentData, enrollments] = await Promise.all([
        userService.getUserById(studentId!),
        enrollmentService.getEnrollmentsByStudent(studentId!)
      ]);

      if (!studentData) {
        console.error('Student not found');
        return;
      }
      setStudent(studentData);

      // Dedupe course IDs to avoid duplicate entries and duplicate React keys
      const uniqueCourseIds = Array.from(new Set(enrollments.map(enrollment => enrollment.courseId)));
      
      if (uniqueCourseIds.length === 0) {
        setGrades([]);
        setFinalGrades([]);
        setCourses([]);
        setLoading(false);
        return;
      }

      // Fetch all course details at once and cache them
      const coursesData = await Promise.all(
        uniqueCourseIds.map(id => courseService.getCourseById(id))
      );
      const validCourses = coursesData.filter(c => c !== null) as any[];
      // Ensure uniqueness by ID in case the service returns duplicates
      const uniqueCourses = Array.from(new Map(validCourses.map((c: any) => [c.id, c])).values());
      setCourses(uniqueCourses);

      // Create course lookup map for faster access
      const courseMap = new Map((validCourses as any[]).map(course => [course.id, course]));

      // Load all data in parallel: assignments, exams, other grades, and final grades
      const [assignmentsData, examsData, finalGradesData, otherGradesData] = await Promise.all([
        loadAssignmentGrades(uniqueCourseIds, courseMap),
        loadExamGrades(uniqueCourseIds, courseMap),
        loadFinalGrades(uniqueCourseIds),
        (async () => {
          try {
            const list = await Promise.all(uniqueCourseIds.map(cid => otherGradeService.getByCourse(cid)));
            return list.flat();
          } catch { return []; }
        })()
      ]);

      setGrades(assignmentsData);
      setExamGrades(examsData);
      setFinalGrades(finalGradesData);
      // Keep only this student's other grades for clarity
      setOtherGrades(otherGradesData.filter(g => g.studentId === studentId));
      try {
        const ranges = await settingsService.getGradeRanges();
        setGradeRanges(ranges);
      } catch {}

      // Do not auto-calculate or persist final grades here; admins assign letters explicitly elsewhere

    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentGrades = async (courseIds: string[], courseMap: Map<string, any>) => {
    try {
      // Get all assignments for enrolled courses in parallel
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

      if (allAssignments.length === 0) return [];

      // Get graded submissions for all assignments in parallel
      const submissionsPromises = allAssignments.map(async (assignment) => {
        try {
          const submissions = await submissionService.getSubmissionsByAssignment(assignment.id);
          const studentSubmissions = submissions.filter(s => 
            s.studentId === studentId && s.status === 'graded' && s.grade !== undefined
          );
          
          return studentSubmissions.map(submission => ({
            id: submission.id,
            assignmentId: submission.assignmentId,
            assignmentTitle: assignment.title,
            courseId: assignment.courseId,
            courseTitle: assignment.courseTitle,
            instructorName: assignment.instructorName,
            submittedAt: submission.submittedAt.toDate(),
            gradedAt: (submission as any).gradedAt?.toDate() || submission.submittedAt.toDate(),
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
      return submissionsArrays.flat();
    } catch (error) {
      console.error('Error loading assignment grades:', error);
      return [];
    }
  };

  const loadExamGrades = async (courseIds: string[], courseMap: Map<string, any>) => {
    try {
      // Get all exams for enrolled courses in parallel
      const examsPromises = courseIds.map(async (courseId) => {
        try {
          const courseExams = await examService.getExamsByCourse(courseId);
          const course = courseMap.get(courseId);
          
          // Get exam attempts for all exams in parallel
          const examAttemptsPromises = courseExams.map(async (exam) => {
            try {
              const attempt = await examAttemptService.getAttemptForStudent(exam.id, studentId!);
              if (attempt && attempt.status === 'graded' && attempt.isGraded) {
                const manualScores = attempt.manualScores || {};
                const manualScore = Object.values(manualScores).reduce((sum: number, score: any) => sum + (Number(score) || 0), 0);
                
                return {
                  id: attempt.id,
                  examId: exam.id,
                  examTitle: exam.title,
                  courseId: courseId,
                  courseTitle: course?.title || 'Unknown Course',
                  instructorName: course?.instructorName || 'Unknown Instructor',
                  submittedAt: attempt.submittedAt?.toDate() || new Date(),
                  gradedAt: attempt.submittedAt?.toDate() || new Date(),
                  grade: attempt.score || 0,
                  maxScore: exam.totalPoints,
                  feedback: attempt.manualFeedback || {},
                  status: 'graded' as const,
                  autoScore: attempt.autoScore || 0,
                  manualScore: manualScore
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

      const examGradesArrays = await Promise.all(examsPromises);
      return examGradesArrays.flat();
    } catch (error) {
      console.error('Error loading exam grades:', error);
      return [];
    }
  };

  const loadFinalGrades = async (courseIds: string[]) => {
    try {
      const finalGradesPromises = courseIds.map(async (courseId) => {
        try {
          const finalGrade = await gradeService.getGradeByStudentAndCourse(courseId, studentId!);
          return finalGrade;
        } catch (error) {
          console.error(`Error loading final grade for course ${courseId}:`, error);
          return null;
        }
      });

      const finalGradesResults = await Promise.all(finalGradesPromises);
      return finalGradesResults.filter(grade => grade !== null) as FirestoreGrade[];
    } catch (error) {
      console.error('Error loading final grades:', error);
      return [];
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

  const calculateLetterGradeWithRanges = (points: number): { letter: string; points: number } => {
    return calculateLetterGrade(points, 100, gradeRanges);
  };

  // Helper function to get normalized grade points for a final grade
  const getGradePoints = (grade: any): number => {
    let points = grade.gradePoints;
    if (!points || points === 0) {
      const pointsToGrade = Math.min(grade.finalGrade, 100);
      const { points: calculatedPoints } = calculateLetterGradeWithRanges(pointsToGrade);
      points = calculatedPoints;
    }
    // Ensure gradePoints is valid and within range (0-4.0)
    return isNaN(points) ? 0 : Math.min(4.0, Math.max(0, points));
  };

  // GPA Calculations (Semester, Yearly, Cumulative) using Ethiopian Calendar
  const gpaStats = useMemo(() => {
    // Helper to get semester based on Ethiopian calendar
    const getSemester = (ethiopianMonth: number) => {
      if (ethiopianMonth >= 1 && ethiopianMonth <= 5) {
        return 1; // Semester 1: Meskerem to Tir
      } else if (ethiopianMonth >= 6 && ethiopianMonth <= 12) {
        return 2; // Semester 2: Yekatit to Nehase
      }
      return null; // Pagume (month 13) is not assigned to a semester
    };

    const byYear: Record<string, { 
      semesters: Record<number, { totalPoints: number; count: number }>; 
      totalPoints: number; 
      count: number 
    }> = {};

    // Process each final grade and categorize by Ethiopian year and semester
    finalGrades.forEach((g) => {
      // Include all final grades (published and drafts) for admin GPA view
      const d = g.calculatedAt.toDate();
      const ethiopianDate = toEthiopianDate(d);
      const year = ethiopianDate.year.toString();
      const sem = getSemester(ethiopianDate.month);

      // Only process grades that fall within a semester (exclude Pagume)
      if (sem) {
        if (!byYear[year]) {
          byYear[year] = { 
            semesters: { 
              1: { totalPoints: 0, count: 0 }, 
              2: { totalPoints: 0, count: 0 } 
            }, 
            totalPoints: 0, 
            count: 0 
          };
        }
        
        const points = getGradePoints(g);
        
        // Add to semester totals
        byYear[year].semesters[sem].totalPoints += points;
        byYear[year].semesters[sem].count += 1;
        
        // Add to yearly totals
        byYear[year].totalPoints += points;
        byYear[year].count += 1;
      }
    });

    // Calculate GPAs for each year and semester
    const byYearGPA: Record<string, { semester1GPA: number; semester2GPA: number; yearlyGPA: number }> = {};
    
    Object.entries(byYear).forEach(([year, data]) => {
      const s1 = data.semesters[1];
      const s2 = data.semesters[2];
      
      // Calculate semester GPAs with proper rounding and range validation (0-4.0)
      const semester1GPA = s1.count > 0 ? 
        Math.min(4.0, Math.max(0, Math.round((s1.totalPoints / s1.count) * 100) / 100)) : 0;
      const semester2GPA = s2.count > 0 ? 
        Math.min(4.0, Math.max(0, Math.round((s2.totalPoints / s2.count) * 100) / 100)) : 0;
      
      // Calculate yearly GPA (average of all courses in that Ethiopian year)
      const yearlyGPA = data.count > 0 ? 
        Math.min(4.0, Math.max(0, Math.round((data.totalPoints / data.count) * 100) / 100)) : 0;
      
      byYearGPA[year] = { semester1GPA, semester2GPA, yearlyGPA };
    });

    // Calculate cumulative GPA using all final grades (regardless of semester assignment)
    const allGradePoints = finalGrades.map(getGradePoints);
    const cumulativeGPA = calculateGPA(allGradePoints);
    
    return { byYearGPA, cumulativeGPA };
  }, [finalGrades, gradeRanges]);

  const refreshFinalGrades = async () => {
    try {
      const courseIds = courses.map(c => c.id);
      const updated = await loadFinalGrades(courseIds);
      setFinalGrades(updated);
    } catch (e) {
      console.error('Failed to refresh final grades', e);
    }
  };

  const calculateFinalGradeForCourse = async (courseId: string) => {
    if (!student) return;

    try {
      // Get assignment grades for this course
      const courseAssignmentGrades = grades.filter(g => g.courseId === courseId);
      const assignmentPoints = courseAssignmentGrades.reduce((sum, g) => sum + g.grade, 0);
      const assignmentMax = courseAssignmentGrades.reduce((sum, g) => sum + g.maxScore, 0);

      // Get exam grades for this course
      const courseExamGrades = examGrades.filter(g => g.courseId === courseId);
      const examPoints = courseExamGrades.reduce((sum, g) => sum + g.grade, 0);
      const examMax = courseExamGrades.reduce((sum, g) => sum + g.maxScore, 0);

      // Get other grades for this course
      const courseOtherGrades = otherGrades.filter(g => g.courseId === courseId && g.studentId === student.id);
      const otherPoints = courseOtherGrades.reduce((sum, g) => sum + (g.points || 0), 0);

      const finalGradeInPoints = assignmentPoints + examPoints + otherPoints;

      const totalPossiblePoints = assignmentMax + examMax;

      const points = Math.min(finalGradeInPoints, 100);
      const { letter: letterGrade, points: gradePoints } = calculateLetterGradeWithRanges(points);

      // Check if grade already exists
      const existing = await gradeService.getGradeByStudentAndCourse(courseId, student.id!);
      
      const gradeData = {
        finalGrade: finalGradeInPoints,
        letterGrade,
        gradePoints,
        calculatedBy: userProfile?.id || (userProfile as any)?.uid || 'unknown',
        calculationMethod: 'automatic_sum' as any,
        assignmentsTotal: assignmentPoints,
        assignmentsMax: assignmentMax,
        examsTotal: examPoints,
        examsMax: examMax,
        otherTotal: otherPoints,
        isPublished: false, // Default to not published
        calculatedAt: new Date(),
        updatedAt: new Date()
      } as any;

      if (existing) {
        await gradeService.updateGrade(existing.id, gradeData);
        toast.success(`Final grade for course has been updated.`);
        await refreshFinalGrades();
      } else {
        await gradeService.createGrade({
          courseId: courseId,
          studentId: student.id!,
          ...gradeData
        } as any);
        toast.success(`Final grade for course has been created.`);
        await refreshFinalGrades();
      }
    } catch (error) {
      console.error(`Error calculating final grade for course ${courseId}:`, error);
    }
  };

  const calculateAllFinalGrades = async () => {
    if (!student || courses.length === 0) return;

    try {
      // Calculate final grades for all courses
      await Promise.all(courses.map(course => calculateFinalGradeForCourse(course.id)));
      
      // Refresh the final grades display
      await refreshFinalGrades();
    } catch (error) {
      console.error('Error calculating all final grades:', error);
    }
  };



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

  const toggleYear = (year: string) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const getCourseTotals = (courseId: string, year: string, type: 'assignments' | 'exams') => {
    let courseGrades: any[] = [];
    let totalItems = 0;
    
    if (type === 'assignments') {
      courseGrades = grades.filter(grade => 
        grade.courseId === courseId && 
        grade.gradedAt.getFullYear().toString() === year
      );
      totalItems = courseGrades.length;
    } else if (type === 'exams') {
      courseGrades = examGrades.filter(grade => 
        grade.courseId === courseId && 
        grade.gradedAt.getFullYear().toString() === year
      );
      totalItems = courseGrades.length;
    }

    const totalPoints = courseGrades.reduce((sum, grade) => sum + grade.grade, 0);
    const maxPoints = courseGrades.reduce((sum, grade) => sum + grade.maxScore, 0);
    const averageGrade = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    return {
      totalAssignments: type === 'assignments' ? courseGrades.length : 0,
      totalExams: type === 'exams' ? courseGrades.length : 0,
      totalItems,
      averageGrade: Math.round(averageGrade),
      totalPoints,
      maxPoints
    };
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
        averageGrade: Math.round(averageGrade),
        totalCourses: finalGrades.length,
        highestGrade: Math.round(highestGrade),
        lowestGrade: Math.round(lowestGrade)
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
        averageGrade: Math.round(averageGrade),
        totalExams: examGrades.length,
        highestGrade: Math.round(highestGrade),
        lowestGrade: Math.round(lowestGrade)
      };
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
        averageGrade: Math.round(averageGrade),
        totalAssignments: grades.length,
        highestGrade: Math.round(highestGrade),
        lowestGrade: Math.round(lowestGrade)
      };
    }
  };

  const stats = getStats();

  // Access control - only admins and super_admins can access
  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only administrators can access this page.</div>
        </div>
      </div>
    );
  }

  if (loading || !isInitialized) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/users')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-blue-600" />
                Student Grades
              </h1>
              <p className="text-gray-600 mt-1">Loading student grade information...</p>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading student grades..." />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Student Not Found</div>
          <div className="text-gray-600">The requested student could not be found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/users')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-blue-600" />
                Student Grades
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{student.displayName}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">{student.email}</span>
              </div>
            </div>
          </div>
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
            {/* Publish controls removed per requirements */}
          </div>
        </div>

        {/* GPA and Admin Grade Actions (Courses View) */}
        {gradeType === 'courses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="bg-white border-gray-100">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Cumulative GPA</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{gpaStats.cumulativeGPA.toFixed(2)}</div></CardContent>
            </Card>
            <Card className="bg-white border-gray-100 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Yearly & Semester GPA</CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Based on Ethiopian Calendar: Sem 1 (Meskerem-Tir), Sem 2 (Yekatit-Nehase)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(gpaStats.byYearGPA)
                    .sort((a,b) => Number(b[0]) - Number(a[0]))
                    .map(([year, g]) => (
                    <div key={year} className="p-3 border rounded-lg">
                      <div className="text-sm font-semibold text-gray-800">Ethiopian Year {year}</div>
                      <div className="mt-1 text-sm text-gray-700">Year GPA: <span className="font-semibold">{g.yearlyGPA.toFixed(2)}</span></div>
                      <div className="mt-1 text-xs text-gray-600">Sem 1: {g.semester1GPA.toFixed(2)} • Sem 2: {g.semester2GPA.toFixed(2)}</div>
                    </div>
                  ))}
                  {Object.keys(gpaStats.byYearGPA).length === 0 && (
                    <div className="text-sm text-gray-500">No final grades yet to compute GPA.</div>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Configure Grade Ranges button removed per requirements */}
          </div>
        )}

        {/* Course Filter for Assignments and Exams */}
        {(gradeType === 'assignments' || gradeType === 'exams') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <Label>Filter by Course:</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.title}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Grade Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <Award size={20} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {gradeType === 'courses' ? 'Average Final Grade' : gradeType === 'exams' ? 'Average Exam Grade' : 'Average Assignment Grade'}
              </span>
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats.averageGrade}</p>
          </div>
          
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <div className="flex items-center gap-3 mb-2">
              <Award size={20} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {gradeType === 'courses' ? 'Total Courses' : gradeType === 'exams' ? 'Total Exams' : 'Total Assignments'}
              </span>
            </div>
            <p className="text-3xl font-bold text-green-900">
              {gradeType === 'courses' ? stats.totalCourses : gradeType === 'exams' ? stats.totalExams : stats.totalAssignments}
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-2">
              <Award size={20} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Highest Grade</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">{stats.highestGrade}%</p>
          </div>
        </div>

        {/* Grades Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            {gradeType === 'assignments' ? (
              // Assignment Grades View - Grouped by Year and Course
              ['2025', '2024', '2023', '2022', '2021'].map((year) => {
                const yearGrades = filteredAndSortedGrades.filter(grade => 
                  grade.gradedAt.getFullYear().toString() === year
                );
                
                // Group by course
                const courseGroups = yearGrades.reduce((acc, grade) => {
                  if (!acc[grade.courseId]) {
                    acc[grade.courseId] = {
                      courseTitle: grade.courseTitle,
                      grades: []
                    };
                  }
                  acc[grade.courseId].grades.push(grade);
                  return acc;
                }, {} as { [key: string]: { courseTitle: string; grades: GradeWithDetails[] } });
                
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
                          
                          {Object.entries(courseGroups).map(([courseId, courseData]) => {
                            const courseTotals = getCourseTotals(courseId, year, 'assignments');
                            return (
                              <div key={courseId} className="mb-6">
                                <button
                                  onClick={() => toggleCourse(courseId)}
                                  className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 rounded-lg px-3 transition-colors border border-gray-200"
                                >
                                  <div className="flex items-center gap-2">
                                    {expandedCourses[courseId] ? (
                                      <ChevronDown size={16} className="text-gray-400" />
                                    ) : (
                                      <ChevronRight size={16} className="text-gray-400" />
                                    )}
                                    <span className="font-medium text-gray-800">{courseData.courseTitle}</span>
                                    <span className="text-sm text-gray-500">({courseTotals.totalAssignments} assignments)</span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Average: {courseTotals.averageGrade}%
                                  </div>
                                </button>

                                {expandedCourses[courseId] && (
                                  <div className="ml-6 mt-3">
                                    <div className="overflow-x-auto">
                                      <table className="w-full">
                                        <thead>
                                          <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Assignment</th>
                                            <th className="text-center py-3 px-4 font-medium text-gray-700">Grade</th>
                                            <th className="text-center py-3 px-4 font-medium text-gray-700">Date</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {courseData.grades.map((grade) => (
                                            <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                                              <td className="py-3 px-4 text-gray-800 truncate max-w-[200px]">{grade.assignmentTitle}</td>
                                              <td className="py-3 px-4 text-center">
                                                <span className={`font-semibold ${getGradeColor(grade.grade, grade.maxScore)}`}>
                                                  {grade.grade}/{grade.maxScore}
                                                </span>
                                              </td>
                                              <td className="py-3 px-4 text-center text-gray-600">{grade.gradedAt.toLocaleDateString()}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        <tfoot>
                                          <tr className="bg-gray-50 font-semibold">
                                            <td className="py-3 px-4 text-gray-800">Total</td>
                                            <td className="py-3 px-4 text-center">
                                              <span className={`font-semibold ${getGradeColor(courseTotals.totalPoints, courseTotals.maxPoints)}`}>
                                                {courseTotals.totalPoints}/{courseTotals.maxPoints}
                                              </span>
                                            </td>
                                            <td className="py-3 px-4 text-center text-gray-600">Average: {courseTotals.averageGrade}%</td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
              // Exam Grades View - Grouped by Year and Course
              filteredAndSortedExamGrades.length > 0 ? (
                ['2025', '2024', '2023', '2022', '2021'].map((year) => {
                  const yearGrades = filteredAndSortedExamGrades.filter(grade => 
                    grade.gradedAt.getFullYear().toString() === year
                  );
                  
                  // Group by course
                  const courseGroups = yearGrades.reduce((acc, grade) => {
                    if (!acc[grade.courseId]) {
                      acc[grade.courseId] = {
                        courseTitle: grade.courseTitle,
                        grades: []
                      };
                    }
                    acc[grade.courseId].grades.push(grade);
                    return acc;
                  }, {} as { [key: string]: { courseTitle: string; grades: ExamGradeWithDetails[] } });
                  
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
                            
                            {Object.entries(courseGroups).map(([courseId, courseData]) => {
                              const courseTotals = getCourseTotals(courseId, year, 'exams');
                              return (
                                <div key={courseId} className="mb-6">
                                  <button
                                    onClick={() => toggleCourse(courseId)}
                                    className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 rounded-lg px-3 transition-colors border border-gray-200"
                                  >
                                    <div className="flex items-center gap-2">
                                      {expandedCourses[courseId] ? (
                                        <ChevronDown size={16} className="text-gray-400" />
                                      ) : (
                                        <ChevronRight size={16} className="text-gray-400" />
                                      )}
                                      <span className="font-medium text-gray-800">{courseData.courseTitle}</span>
                                      <span className="text-sm text-gray-500">({courseTotals.totalExams} exams)</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      Average: {courseTotals.averageGrade}%
                                    </div>
                                  </button>

                                  {expandedCourses[courseId] && (
                                    <div className="ml-6 mt-3">
                                      <div className="overflow-x-auto">
                                        <table className="w-full">
                                          <thead>
                                            <tr className="border-b border-gray-200">
                                              <th className="text-left py-3 px-4 font-medium text-gray-700">Exam</th>
                                              <th className="text-center py-3 px-4 font-medium text-gray-700">Grade</th>
                                              <th className="text-center py-3 px-4 font-medium text-gray-700">Date</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {courseData.grades.map((grade) => (
                                              <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 text-gray-800 truncate max-w-[200px]">{grade.examTitle}</td>
                                                <td className="py-3 px-4 text-center">
                                                  <span className={`font-semibold ${getGradeColor(grade.grade, grade.maxScore)}`}>
                                                    {grade.grade}/{grade.maxScore}
                                                  </span>
                                                </td>
                                                <td className="py-3 px-4 text-center text-gray-600">{grade.gradedAt.toLocaleDateString()}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                          <tfoot>
                                            <tr className="bg-gray-50 font-semibold">
                                              <td className="py-3 px-4 text-gray-800">Total</td>
                                              <td className="py-3 px-4 text-center">
                                                <span className={`font-semibold ${getGradeColor(courseTotals.totalPoints, courseTotals.maxPoints)}`}>
                                                  {courseTotals.totalPoints}/{courseTotals.maxPoints}
                                                </span>
                                              </td>
                                              <td className="py-3 px-4 text-center text-gray-600">Average: {courseTotals.averageGrade}%</td>
                                            </tr>
                                          </tfoot>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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
                  <p className="text-gray-400">Exam grades will appear here once they're graded by instructors.</p>
                </div>
              )
            ) : gradeType === 'others' ? (
              // Other Grades view
              <div className="space-y-6">
                {['2025', '2024', '2023', '2022', '2021'].map((year) => {
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
                              const courseKey = `${year}_${courseId}`;
                              const totalPoints = entries.reduce((sum, e) => sum + (e.points || 0), 0);
                              
                              return (
                                <div key={courseId} className="mb-6">
                                  <button
                                    onClick={() => setExpandedOtherCourses(prev => ({ ...prev, [courseKey]: !prev[courseKey] }))}
                                    className="w-full flex items-center justify-between py-3 text-left rounded-lg px-3 border border-gray-200 hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      {expandedOtherCourses[courseKey] ? (
                                        <ChevronDown size={16} className="text-gray-400" />
                                      ) : (
                                        <ChevronRight size={16} className="text-gray-400" />
                                      )}
                                      <span className="font-medium text-gray-800">{course?.title || courseId}</span>
                                      <span className="text-sm text-gray-500">({entries.length} entries)</span>
                                    </div>
                                    <Badge variant="secondary">
                                      Total: {totalPoints} points
                                    </Badge>
                                  </button>
                                  {expandedOtherCourses[courseKey] && (
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
                                  )}
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
                })}
              </div>
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
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Method</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Calculated</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {yearGrades.map((grade) => {
                                    const letterGrade = grade.letterGrade || '';
                                    return (
                                      <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-800 font-medium">{grade.courseTitle}</td>
                                        <td className="py-3 px-4 text-gray-600">{grade.instructorName}</td>
                                        <td className="py-3 px-4 text-center">
                                          <span className={`font-semibold ${getGradeColor(grade.finalGrade, grade.assignmentsMax + grade.examsMax)}`}>
                                            {grade.finalGrade}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                          <Badge variant={letterGrade && letterGrade.startsWith('A') ? 'default' : letterGrade && letterGrade.startsWith('B') ? 'secondary' : letterGrade && letterGrade.startsWith('C') ? 'outline' : 'destructive'}>
                                            {letterGrade}
                                          </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-center text-gray-600 capitalize text-sm">
                                          {grade.calculationMethod.replace('_', ' ')}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                          <Badge variant={grade.isPublished ? 'default' : 'secondary'}>
                                            {grade.isPublished ? 'Published' : 'Draft'}
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
                  <p className="text-gray-400">Final course grades will appear here once they're calculated by instructors.</p>
                </div>
              )
            )}
          </div>
        </div>
    {/* Grade Ranges configuration dialog removed per requirements */}
    </div>
  );
}