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

  useEffect(() => {
    if (courseId) {
      loadCourseDetails();
    }
  }, [courseId, currentUser]);

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

  const handleEnrollment = async () => {
    if (!currentUser || !courseId) {
      navigate('/login');
      return;
    }

    if (userProfile?.role !== 'student') {
      toast.error('Only students can enroll in courses');
      return;
    }

    try {
      setEnrolling(true);
      
      const enrollmentData = {
        courseId,
        studentId: currentUser.uid,
        status: 'active' as const,
        progress: 0,
        completedLessons: []
      };

      const enrollmentId = await enrollmentService.createEnrollment(enrollmentData);
      
      // Update local state
      setIsEnrolled(true);
      setEnrollment({
        id: enrollmentId,
        ...enrollmentData,
        enrolledAt: new Date() as any, // Will be set by Firestore
        lastAccessedAt: new Date() as any
      });
      
      toast.success('Successfully enrolled in course!');
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const canEnroll = () => {
    if (!course || !currentUser || !userProfile) return false;
    if (userProfile.role !== 'student') return false;
    if (isEnrolled) return false;
    if (!course.isActive) return false;
    
    return true;
  };

  const getEnrollmentStatus = () => {
    if (!course) return null;
    
    if (!currentUser) {
      return { message: 'Login required to enroll', variant: 'default' as const };
    }
    
    if (userProfile?.role !== 'student') {
      return { message: 'Only students can enroll', variant: 'default' as const };
    }
    
    if (isEnrolled) {
      return { message: 'You are enrolled in this course', variant: 'default' as const };
    }
    
    if (!course.isActive) {
      return { message: 'This course is not currently available', variant: 'destructive' as const };
    }
    
    return null;
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link to="/courses" className="hover:text-foreground transition-colors">
              Courses
            </Link>
            <span>/</span>
            <span className="text-foreground">{course.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{course.title}</CardTitle>
                      <CardDescription className="text-base mt-2">
                        {course.description}
                      </CardDescription>
                    </div>
                    <Badge variant={course.isActive ? "default" : "secondary"}>
                      {course.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{course.duration} weeks</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Max {course.maxStudents} students</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{course.instructorName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{course.category}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Syllabus */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Course Syllabus</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{course.syllabus}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Course Materials */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Course Materials</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {materialsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : courseMaterials.length > 0 ? (
                    <div className="space-y-4">
                      {courseMaterials.map((material) => (
                        <div key={material.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex-shrink-0">
                            {material.type === 'document' && <FileText className="h-5 w-5 text-blue-600" />}
                            {material.type === 'video' && <div className="h-5 w-5 text-red-600">▶</div>}
                            {material.type === 'link' && <div className="h-5 w-5 text-green-600">🔗</div>}
                            {material.type === 'other' && <div className="h-5 w-5 text-gray-600">📎</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 mb-1">{material.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{material.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="capitalize">{material.type}</span>
                              <span>{material.createdAt.toDate().toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {material.fileUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                                  View
                                </a>
                              </Button>
                            )}
                            {material.externalLink && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={material.externalLink} target="_blank" rel="noopener noreferrer">
                                  Visit Link
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No course materials available yet.</p>
                      <p className="text-sm">Check back later for updates from your instructor.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enrollment Status */}
              {status && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{status.message}</AlertDescription>
                </Alert>
              )}

              {/* Progress (if enrolled) */}
              {isEnrolled && enrollment && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Overall Progress</span>
                          <span>{enrollmentPercentage}%</span>
                        </div>
                        <Progress value={enrollmentPercentage} className="h-2" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {enrollment.completedLessons.length} lessons completed
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Enrollment Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    {isEnrolled ? (
                      <div className="space-y-3">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                        <h3 className="font-semibold text-lg">Enrolled</h3>
                        <p className="text-sm text-muted-foreground">
                          You're successfully enrolled in this course
                        </p>
                        <Button className="w-full" variant="outline">
                          Continue Learning
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <BookMarked className="h-12 w-12 text-blue-600 mx-auto" />
                        <h3 className="font-semibold text-lg">Ready to Start?</h3>
                        <p className="text-sm text-muted-foreground">
                          Join this course and start your learning journey
                        </p>
                        <Button 
                          className="w-full" 
                          onClick={handleEnrollment}
                          disabled={!canEnroll() || enrolling}
                        >
                          {enrolling ? 'Enrolling...' : 'Enroll Now'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Course Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instructor:</span>
                    <span>{course.instructorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span>{course.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{course.duration} weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Students:</span>
                    <span>{course.maxStudents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{course.createdAt.toDate().toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetail;