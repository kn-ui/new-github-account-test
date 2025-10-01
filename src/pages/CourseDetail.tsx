/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { courseService, enrollmentService, courseMaterialService, assignmentService, submissionService, FirestoreCourse, FirestoreEnrollment, FirestoreCourseMaterial } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
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
  BookMarked
} from 'lucide-react';
import { toast } from 'sonner';

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
            console.log('No enrollment found for this course');
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
    
    try {
      setMaterialsLoading(true);
      const materials = await courseMaterialService.getCourseMaterialsByCourse(courseId);
      setCourseMaterials(materials);
      
      // Load assignments for this course
      const assignments = await assignmentService.getAssignmentsByCourse(courseId);
      setCourseAssignments(assignments);
      
      // Load grades for this course if enrolled
      if (isEnrolled && currentUser?.uid) {
        const submissions = await submissionService.getSubmissionsByStudent(currentUser.uid);
        const courseSubmissions = submissions.filter((sub: any) => 
          assignments.some(assign => assign.id === sub.assignmentId)
        );
        setCourseGrades(courseSubmissions);
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
              <h1 className="text-2xl font-bold text-gray-900 truncate">{course.title}</h1>
              <p className="text-gray-600 truncate">Instructor: {course.instructorName}</p>
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
                <div className="space-y-6">
                  {/* Course Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Course Information</h3>
                    <p className="text-gray-700 leading-relaxed mb-6 line-clamp-4">{course.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{course.duration} weeks</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>Max {course.maxStudents} students</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{course.instructorName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span>{course.category}</span>
                      </div>
                    </div>
                  </div>
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
                            <h4 className="font-medium text-gray-800 truncate">{assignment.title}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
                            <p className="text-xs text-gray-500">Due: {assignment.dueDate.toDate().toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Max Score: {assignment.maxScore}</p>
                            <Link to={`/dashboard/student-assignments`}>
                              <Button variant="outline" size="sm">View Assignment</Button>
                            </Link>
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
                        <div key={material.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <FileText size={16} className="text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{material.title}</p>
                            <p className="text-sm text-gray-600 line-clamp-2">{material.description}</p>
                          </div>
                          {material.fileUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                                View
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No resources available yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'Grades' && isEnrolled && (
                <div className="space-y-6">
                  {/* Grade Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Award size={20} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Course Progress</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">{enrollmentPercentage}%</p>
                    </div>
                    
                    <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Award size={20} className="text-green-600" />
                        <span className="text-sm font-medium text-green-800">Assignments</span>
                      </div>
                      <p className="text-3xl font-bold text-green-900">{courseGrades.length}</p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Award size={20} className="text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Average Grade</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-900">
                        {courseGrades.length > 0 
                          ? Math.round(courseGrades.reduce((sum: number, grade: any) => sum + (grade.grade || 0), 0) / courseGrades.length)
                          : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Grades List */}
                  {courseGrades.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">Assignment Grades</h4>
                      {courseGrades.map((grade: any) => {
                        const assignment = courseAssignments.find(a => a.id === grade.assignmentId);
                        return (
                          <div key={grade.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h5 className="font-medium text-gray-800">{assignment?.title || 'Assignment'}</h5>
                              <p className="text-sm text-gray-600">Submitted: {grade.submittedAt.toDate().toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">{grade.grade || 0}/{assignment?.maxScore || 100}</p>
                              {grade.feedback && (
                                <p className="text-xs text-gray-500">Feedback available</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-600">No grades available yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetail;