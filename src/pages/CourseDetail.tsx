/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { courseService, enrollmentService, courseMaterialService, FirestoreCourse, FirestoreEnrollment, FirestoreCourseMaterial } from '@/lib/firestore';
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
  
  const [course, setCourse] = useState<FirestoreCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<FirestoreEnrollment | null>(null);
  const [courseMaterials, setCourseMaterials] = useState<FirestoreCourseMaterial[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

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
        navigate('/courses');
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
        navigate('/courses');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course details');
      navigate('/courses');
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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The course you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/courses">
              <Button>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Courses
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard/courses" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={20} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-gray-600">Instructor: {course.instructorName}</p>
            </div>
          </div>

          {/* Course Progress */}
          {isEnrolled && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Course Progress</h2>
                <span className="text-2xl font-bold text-blue-600">{enrollmentPercentage}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${enrollmentPercentage}%` }}></div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>{enrollment?.completedLessons?.length || 0} lessons completed</span>
                <span>{course.duration} week course</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {['Overview', 'Lessons', 'Assignments', 'Resources', 'Grades'].map((tab) => (
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
                    <p className="text-gray-700 leading-relaxed mb-6">{course.description}</p>
                    
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

              {activeTab === 'Lessons' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Course Lessons</h3>
                  <p className="text-gray-600">Lesson content will be displayed here.</p>
                </div>
              )}

              {activeTab === 'Assignments' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Course Assignments</h3>
                  <p className="text-gray-600">Assignment list will be displayed here.</p>
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
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{material.title}</p>
                            <p className="text-sm text-gray-600">{material.description}</p>
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
                        <span className="text-sm font-medium text-blue-800">Current Grade</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">B+</p>
                    </div>
                    
                    <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Award size={20} className="text-green-600" />
                        <span className="text-sm font-medium text-green-800">Assignments</span>
                      </div>
                      <p className="text-3xl font-bold text-green-900">{enrollmentPercentage}%</p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Award size={20} className="text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Participation</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-900">92%</p>
                    </div>
                  </div>
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