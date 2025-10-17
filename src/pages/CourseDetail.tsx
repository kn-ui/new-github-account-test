/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { truncateTitle, truncateText } from '@/lib/utils';
import { courseService, enrollmentService, courseMaterialService, assignmentService, submissionService, gradeService, examService, examAttemptService, FirestoreCourse, FirestoreEnrollment, FirestoreCourseMaterial, FirestoreGrade, FirestoreExam, FirestoreExamAttempt } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import { 
  BookOpen, 
  Clock, 
  Users, 
  User,
  ChevronLeft,
  CheckCircle,
  FileText,
  Calendar,
  Award,
  Info,
  UserPlus,
  BookMarked,
  Download,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { isHygraphUrl, getFileIcon } from '@/lib/hygraphUpload';

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Check if we're in dashboard context
  const isDashboard = window.location.pathname.startsWith('/dashboard/');
  
  const [course, setCourse] = useState<FirestoreCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<FirestoreEnrollment | null>(null);
  const [courseMaterials, setCourseMaterials] = useState<FirestoreCourseMaterial[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [courseAssignments, setCourseAssignments] = useState<any[]>([]);
  const [courseGrades, setCourseGrades] = useState<any[]>([]);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<FirestoreCourseMaterial | null>(null);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [finalGrade, setFinalGrade] = useState<FirestoreGrade | null>(null);
  const [gradeViewMode, setGradeViewMode] = useState<'assignments' | 'final' | 'exams' | 'others'>('assignments');
  const [otherGrades, setOtherGrades] = useState<any[]>([]);
  const [courseExams, setCourseExams] = useState<FirestoreExam[]>([]);
  const [examGrades, setExamGrades] = useState<any[]>([]);

  useEffect(() => {
    if (courseId) {
      loadCourseDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      
      if (!courseId) {
        toast.error('Course ID is required');
        navigate('/dashboard/student-courses');
        return;
      }

      const courseData = await courseService.getCourseById(courseId);
      
      if (courseData) {
        setCourse(courseData);
        
        // Check if user is enrolled
        if (currentUser && userProfile?.role === 'student') {
          try {
            const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser.uid);
            const userEnrollment = enrollments.find(e => e.courseId === courseId);
            
            if (userEnrollment) {
              setIsEnrolled(true);
              setEnrollment(userEnrollment);
            }
          } catch (error) {
            // No enrollment found for this course
          }
        }

        // Load course materials
        await loadCourseMaterials();
      } else {
        toast.error('Course not found');
        navigate('/dashboard/student-courses');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course details');
      navigate('/dashboard/student-courses');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseMaterials = async () => {
    if (!courseId) return;
    setCourseGrades([]);
    
    try {
      setMaterialsLoading(true);
      const materials = await courseMaterialService.getCourseMaterialsByCourse(courseId);
      setCourseMaterials(materials);
      
      // Load assignments for this course
      const assignments = await assignmentService.getAssignmentsByCourse(courseId);
      setCourseAssignments(assignments);
      
      // Load exams for this course
      const exams = await examService.getExamsByCourse(courseId);
      setCourseExams(exams);
      
      // Load grades for this course if student
      if (currentUser?.uid && userProfile?.role === 'student') {
        try {
          const submissions = await submissionService.getSubmissionsByStudent(currentUser.uid);
          const courseSubmissions = submissions.filter((sub: any) => 
            assignments.some(assign => assign.id === sub.assignmentId)
          );
          setCourseGrades(courseSubmissions);
          console.log('Loaded course submissions:', courseSubmissions);
        } catch (error) {
          console.error('Error loading submissions:', error);
          setCourseGrades([]);
        }
        
      // Load exam grades for this course
        try {
          const examAttemptsPromises = exams.map(async (exam) => {
            try {
              const attempt = await examAttemptService.getAttemptForStudent(exam.id, currentUser.uid);
              if (attempt && attempt.status === 'graded' && attempt.isGraded) {
                // Calculate manual score from manualScores object
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
                  status: 'graded',
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
          const validExamGrades = examAttempts.filter(attempt => attempt !== null);
          setExamGrades(validExamGrades);
          console.log('Loaded exam grades:', validExamGrades);
        } catch (error) {
          console.error('Error loading exam grades:', error);
          setExamGrades([]);
        }
        
        // Load final grade for this course
        try {
          const finalGradeData = await gradeService.getGradeByStudentAndCourse(courseId, currentUser.uid);
          // Hide if not published
          setFinalGrade((finalGradeData as any)?.isPublished === false ? null : finalGradeData);
          console.log('Loaded final grade:', finalGradeData);
        } catch (error) {
          console.error('Error loading final grade:', error);
          setFinalGrade(null);
        }

        // Load other grades for this course
        try {
          const list = await (await import('@/lib/firestore')).otherGradeService.getByStudentInCourse(courseId, currentUser.uid);
          setOtherGrades(list);
        } catch (error) {
          console.error('Error loading other grades:', error);
          setOtherGrades([]);
        }
      }
    } catch (error) {
      console.error('Error loading course materials:', error);
    } finally {
      setMaterialsLoading(false);
    }
  };

  // Enrollment by students removed; only admin can enroll students.

  const canEnroll = () => false;

  const getEnrollmentStatus = () => {
    if (!course) return null;
    
    if (!currentUser) {
      return { message: 'Login required to enroll', variant: 'default' as const };
    }
    
    if (userProfile?.role === 'student' && isEnrolled) {
      return { message: 'You are enrolled in this course', variant: 'default' as const };
    }
    
    if (!course.isActive) {
      return { message: 'This course is not currently available', variant: 'destructive' as const };
    }
    
    return { message: 'Enrollment is managed by administrators. Please contact your admin.', variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className={isDashboard ? "space-y-6" : "min-h-screen bg-background"}>
        {!isDashboard && <Header />}
        <main className={isDashboard ? "" : "container mx-auto px-4 py-8"}>
          <div className={isDashboard ? "space-y-6" : "max-w-4xl mx-auto space-y-6"}>
            <Skeleton className="h-8 w-32" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-40 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={isDashboard ? "space-y-6" : "min-h-screen bg-background"}>
        {!isDashboard && <Header />}
        <main className={isDashboard ? "" : "container mx-auto px-4 py-8"}>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The course you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/dashboard/student-courses">
              <Button>
                <ChevronLeft className="h-4 w-4 mr-2" />
                {isDashboard ? "Back to My Courses" : "Back to Courses"}
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const enrollmentPercentage = enrollment?.progress || 0;
  const status = getEnrollmentStatus();

  return (
    <div className={isDashboard ? "space-y-6" : "min-h-screen bg-gray-50"}>
      {!isDashboard && <Header />}
      <main className={isDashboard ? "" : "container mx-auto px-4 py-8"}>
        <div className={isDashboard ? "space-y-6" : "max-w-7xl mx-auto space-y-6"}>
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard/student-courses" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={20} className="text-gray-600" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{truncateTitle(course.title)}</h1>
              <p className="text-gray-600">{truncateText(`Instructor: ${course.instructorName}`)}</p>
            </div>
          </div>

          {/* Course Progress Timeline */}
          {isEnrolled && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Course Progress</h2>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-blue-600">{enrollmentPercentage}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTimelineExpanded(!timelineExpanded)}
                  >
                    {timelineExpanded ? 'Hide Timeline' : 'Show Timeline'}
                  </Button>
                </div>
              </div>
              
              {/* Progress Bar - Always Visible */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${enrollmentPercentage}%` }}></div>
                </div>
              </div>

              {/* Expandable Timeline */}
              {timelineExpanded && (
                <div className="space-y-4 mt-6 pt-4 border-t border-gray-200">
                  {/* Enrollment */}
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Course Enrolled</p>
                      <p className="text-sm text-gray-600">{enrollment?.enrolledAt.toDate().toLocaleDateString()}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${enrollmentPercentage > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">In Progress</p>
                      <p className="text-sm text-gray-600">{enrollmentPercentage}% completed</p>
                    </div>
                    {enrollmentPercentage > 0 && <Clock className="h-5 w-5 text-blue-500" />}
                  </div>

                  {/* Completion */}
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${enrollmentPercentage === 100 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Course Completed</p>
                      <p className="text-sm text-gray-600">
                        {enrollmentPercentage === 100 ? 'Congratulations!' : 'Keep going!'}
                      </p>
                    </div>
                    {enrollmentPercentage === 100 && <Award className="h-5 w-5 text-green-500" />}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {['Overview', 'Assignments', 'Resources', 'Grades'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'Overview' && (
                <div className="space-y-8">
                  {/* Course Description */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      Course Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-base">{course.description}</p>
                  </div>

                  {/* Course Details */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      Course Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <Clock className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-semibold text-gray-900">{course.duration} weeks</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <Users className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Max Students</p>
                          <p className="font-semibold text-gray-900">{course.maxStudents}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <User className="h-6 w-6 text-purple-600" />
                        <div>
                          <p className="text-sm text-gray-500">Instructor</p>
                          <p className="font-semibold text-gray-900">{course.instructorName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <BookOpen className="h-6 w-6 text-orange-600" />
                        <div>
                          <p className="text-sm text-gray-500">Category</p>
                          <p className="font-semibold text-gray-900">{course.category}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Course Syllabus */}
                  {course.syllabus && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        Course Syllabus
                      </h3>
                      <div className="prose prose-gray max-w-none">
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {course.syllabus}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Assignments' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Course Assignments</h3>
                  {courseAssignments.length > 0 ? (
                    <div className="space-y-3">
                      {courseAssignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-gray-800">{truncateTitle(assignment.title)}</h4>
                            <p className="text-sm text-gray-600">{truncateText(assignment.description)}</p>
                            <p className="text-xs text-gray-500">Due: {assignment.dueDate.toDate().toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Max Score: {assignment.maxScore}</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/dashboard/student-assignments?assignmentId=${assignment.id}`)}
                            >
                              View Assignment
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No assignments available for this course.</p>
                  )}
                </div>
              )}

              {activeTab === 'Resources' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Course Resources</h3>
                  {courseMaterials.length > 0 ? (
                    <div className="space-y-3">
                      {courseMaterials.map((material) => (
                        <div key={material.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="text-2xl">
                            {material.type === 'document' ? getFileIcon(material.title) : 
                             material.type === 'video' ? '🎥' : 
                             material.type === 'link' ? '🔗' : '📎'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800">{truncateTitle(material.title)}</p>
                            <p className="text-sm text-gray-600">{truncateText(material.description)}</p>
                            <p className="text-xs text-gray-500 capitalize mt-1">
                              {material.type} • {material.createdAt.toDate().toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('View Details clicked for material:', material.title);
                                setSelectedMaterial(material);
                                setMaterialDialogOpen(true);
                              }}
                            >
                              View Details
                            </Button>
                            {material.fileUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-1" />
                                  {isHygraphUrl(material.fileUrl) ? 'Download' : 'Open'}
                                </a>
                              </Button>
                            )}
                            {material.externalLink && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={material.externalLink} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Visit Link
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No resources available yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'Grades' && (
                <div className="space-y-6">
                  {!isEnrolled ? (
                    // Not enrolled state
                    <div className="text-center py-12 text-gray-500">
                      <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Enrollment Required</h3>
                      <p className="text-gray-400 mb-4">You need to be enrolled in this course to view your grades.</p>
                      <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> Enrollment is managed by administrators. Please contact your admin to enroll in this course.
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Enrolled state - show grade content
                    <>
                      {/* Grade View Mode Selector */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-700">View Grades:</span>
                          <Select value={gradeViewMode} onValueChange={(value: 'assignments' | 'final' | 'exams' | 'others') => setGradeViewMode(value)}>
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="assignments">Assignment Grades</SelectItem>
                              <SelectItem value="exams">Exam Grades</SelectItem>
                              <SelectItem value="final">Final Grade</SelectItem>
                              <SelectItem value="others">Other Grades</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                  {/* Grade Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Award size={20} className="text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {gradeViewMode === 'final' ? 'Final Grade' : gradeViewMode === 'exams' ? 'Exams' : 'Assignments'}
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-green-900">
                        {gradeViewMode === 'final' 
                          ? (finalGrade ? `${finalGrade.finalGrade}%` : 'N/A')
                          : gradeViewMode === 'exams'
                          ? examGrades.length
                          : courseGrades.length
                        }
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Award size={20} className="text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">
                          {gradeViewMode === 'final' ? 'Letter Grade' : gradeViewMode === 'exams' ? 'Average Grade' : 'Average Grade'}
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-purple-900">
                        {gradeViewMode === 'final' 
                          ? (finalGrade ? finalGrade.letterGrade : 'N/A')
                          : gradeViewMode === 'exams'
                          ? (examGrades.length > 0 
                              ? Math.round(examGrades.reduce((sum: number, grade: any) => sum + (grade.grade || 0), 0) / examGrades.length)
                              : 0) + '%'
                          : (courseGrades.length > 0 
                              ? Math.round(courseGrades.reduce((sum: number, grade: any) => sum + (grade.grade || 0), 0) / courseGrades.length)
                              : 0) + '%'
                        }
                      </p>
                    </div>
                  </div>


                  {/* Final Grade Table - Only show for final grade view */}
                  {gradeViewMode === 'final' && finalGrade && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Final Grade Details</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-2">Course</th>
                              <th className="text-left px-4 py-2">Instructor</th>
                              <th className="text-center px-4 py-2">Final Grade</th>
                              <th className="text-center px-4 py-2">Letter Grade</th>
                              <th className="text-center px-4 py-2">Grade Points</th>
                              <th className="text-center px-4 py-2">Method</th>
                              <th className="text-center px-4 py-2">Status</th>
                              <th className="text-center px-4 py-2">Calculated</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            <tr>
                              <td className="px-4 py-2 font-medium">{course?.title || 'Course'}</td>
                              <td className="px-4 py-2">{course?.instructorName || 'Instructor'}</td>
                              <td className="px-4 py-2 text-center font-semibold">{finalGrade.finalGrade}%</td>
                              <td className="px-4 py-2 text-center">
                                <Badge variant={finalGrade.letterGrade === 'A' ? 'default' : finalGrade.letterGrade === 'B' ? 'secondary' : finalGrade.letterGrade === 'C' ? 'outline' : 'destructive'}>
                                  {finalGrade.letterGrade}
                                </Badge>
                              </td>
                              <td className="px-4 py-2 text-center">{finalGrade.gradePoints}</td>
                              <td className="px-4 py-2 text-center capitalize">{finalGrade.calculationMethod.replace('_', ' ')}</td>
                              <td className="px-4 py-2 text-center">
                                <Badge variant="default">
                                  Published
                                </Badge>
                              </td>
                              <td className="px-4 py-2 text-center">{finalGrade.calculatedAt.toDate().toLocaleDateString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* No Final Grade State */}
                  {gradeViewMode === 'final' && !finalGrade && (
                    <div className="text-center py-12 text-gray-500">
                      <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No Final Grade Yet</h3>
                      <p className="text-gray-400">Your final grade will appear here once it's calculated by your instructor.</p>
                    </div>
                  )}

                  {/* Assignment Grades Table - Only show for assignment grades view */}
                  {gradeViewMode === 'assignments' && (
                    <>
                      {courseGrades.length > 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignment Grades</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left px-4 py-2">Assignment</th>
                                  <th className="text-left px-4 py-2">Course</th>
                                  <th className="text-center px-4 py-2">Grade</th>
                                  <th className="text-center px-4 py-2">Max Score</th>
                                  <th className="text-center px-4 py-2">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {courseGrades
                                  .slice()
                                  .sort((a: any, b: any) => new Date(b.submittedAt.toDate()).getTime() - new Date(a.submittedAt.toDate()).getTime())
                                  .map((grade: any, index: number) => {
                                    const assignment = courseAssignments.find(a => a.id === grade.assignmentId);
                                    return (
                                      <tr key={index}>
                                        <td className="px-4 py-2 font-medium">{assignment?.title || 'Assignment'}</td>
                                        <td className="px-4 py-2">{course?.title || 'Course'}</td>
                                        <td className="px-4 py-2 text-center font-semibold">{grade.grade || 0}</td>
                                        <td className="px-4 py-2 text-center">{assignment?.maxScore || 100}</td>
                                        <td className="px-4 py-2 text-center">{grade.submittedAt.toDate().toLocaleDateString()}</td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-medium mb-2">No Grades Yet</h3>
                          <p className="text-gray-400">Your assignment grades will appear here once they're graded by your instructor.</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Exam Grades Table - Only show for exam grades view */}
                  {gradeViewMode === 'exams' && (
                    <>
                      {examGrades.length > 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Exam Grades</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left px-4 py-2">Exam</th>
                                  <th className="text-left px-4 py-2">Course</th>
                                  <th className="text-center px-4 py-2">Grade</th>
                                  <th className="text-center px-4 py-2">Max Score</th>
                                  <th className="text-center px-4 py-2">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {examGrades
                                  .slice()
                                  .sort((a: any, b: any) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime())
                                  .map((grade: any, index: number) => {
                                    return (
                                      <tr key={index}>
                                        <td className="px-4 py-2 font-medium">{grade.examTitle || 'Exam'}</td>
                                        <td className="px-4 py-2">{course?.title || 'Course'}</td>
                                        <td className="px-4 py-2 text-center font-semibold">{grade.grade || 0}</td>
                                        <td className="px-4 py-2 text-center">{grade.maxScore || 100}</td>
                                        <td className="px-4 py-2 text-center">{grade.gradedAt.toLocaleDateString()}</td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-medium mb-2">No Exam Grades Yet</h3>
                          <p className="text-gray-400">Your exam grades will appear here once they're graded by your instructor.</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Other Grades Table - Only show for other grades view */}
                  {gradeViewMode === 'others' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Other Grades</h3>
                      {otherGrades.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left px-4 py-2">Reason</th>
                                <th className="text-center px-4 py-2">Points</th>
                                <th className="text-center px-4 py-2">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {otherGrades.map((og: any) => (
                                <tr key={og.id}>
                                  <td className="px-4 py-2">{og.reason}</td>
                                  <td className="px-4 py-2 text-center font-semibold">+{og.points}</td>
                                  <td className="px-4 py-2 text-center text-gray-600">{og.createdAt?.toDate ? og.createdAt.toDate().toLocaleDateString() : ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-medium mb-2">No Other Grades</h3>
                          <p className="text-gray-400">Other grades will appear here when added by your instructor.</p>
                        </div>
                      )}
                    </div>
                  )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Material Detail Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {selectedMaterial?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMaterial && (
            <div className="space-y-6">
              {/* Material Type Badge */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {selectedMaterial.type}
                </Badge>
                <span className="text-sm text-gray-500">
                  Created: {selectedMaterial.createdAt.toDate().toLocaleDateString()}
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{selectedMaterial.description}</p>
              </div>

              {/* File/Link Information */}
              {selectedMaterial.fileUrl && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">{getFileIcon(selectedMaterial.title)}</span>
                    File Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Storage:</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isHygraphUrl(selectedMaterial.fileUrl) 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isHygraphUrl(selectedMaterial.fileUrl) ? 'Hygraph Storage' : 'External URL'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>File URL:</strong> 
                      <a 
                        href={selectedMaterial.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 ml-2 break-all"
                      >
                        {selectedMaterial.fileUrl}
                      </a>
                    </p>
                    <Button asChild className="mt-2">
                      <a 
                        href={selectedMaterial.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {isHygraphUrl(selectedMaterial.fileUrl) ? 'Download File' : 'Open File'}
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {selectedMaterial.externalLink && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">External Link</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>External URL:</strong> 
                      <a 
                        href={selectedMaterial.externalLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 ml-2 break-all"
                      >
                        {selectedMaterial.externalLink}
                      </a>
                    </p>
                    <Button asChild className="mt-2">
                      <a 
                        href={selectedMaterial.externalLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Link
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* Course Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Course Information</h3>
                <p className="text-sm text-gray-600">
                  <strong>Course:</strong> {course?.title}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Instructor:</strong> {course?.instructorName}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetail;