/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api, Course } from '@/lib/api';
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
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourseDetails();
    }
  }, [courseId, currentUser]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await api.getCourseById(courseId!);
      
      if (response.success && response.data) {
        setCourse(response.data);
        
        // Check if user is enrolled
        if (currentUser && response.data.enrolledStudents) {
          setIsEnrolled(response.data.enrolledStudents.includes(currentUser.uid));
        }
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

  const handleEnrollment = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (userProfile?.role !== 'student') {
      toast.error('Only students can enroll in courses');
      return;
    }

    try {
      setEnrolling(true);
      const response = await api.enrollInCourse(courseId!);
      
      if (response.success) {
        toast.success('Successfully enrolled in course!');
        setIsEnrolled(true);
        // Refresh course data to get updated enrollment count
        loadCourseDetails();
      }
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
    
    const enrolledCount = course.enrolledStudents?.length || 0;
    return enrolledCount < course.maxStudents;
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
    
    const enrolledCount = course.enrolledStudents?.length || 0;
    if (enrolledCount >= course.maxStudents) {
      return { message: 'Course is full', variant: 'destructive' as const };
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

  const enrolledCount = course.enrolledStudents?.length || 0;
  const enrollmentPercentage = (enrolledCount / course.maxStudents) * 100;
  const status = getEnrollmentStatus();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link 
              to="/courses" 
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Courses
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{course.title}</CardTitle>
                      <CardDescription className="text-base">
                        {course.description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-4 shrink-0">
                      {course.category}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Course Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    Course Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Instructor</p>
                        <p className="text-sm text-muted-foreground">{course.instructorName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Duration</p>
                        <p className="text-sm text-muted-foreground">{course.duration} weeks</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Created</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(course.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Class Size</p>
                        <p className="text-sm text-muted-foreground">
                          {enrolledCount}/{course.maxStudents} students
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Syllabus */}
              {course.syllabus && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Course Syllabus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{course.syllabus}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Course Content Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookMarked className="h-5 w-5 mr-2" />
                    What You'll Learn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {course.lessons && course.lessons.length > 0 ? (
                      course.lessons.slice(0, 3).map((lesson: any, index: number) => (
                        <div key={index} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-sm text-muted-foreground">{lesson.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Course content will be available after enrollment</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Enrollment Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Enrollment Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Enrollment</span>
                        <span className="text-sm text-muted-foreground">
                          {enrolledCount}/{course.maxStudents}
                        </span>
                      </div>
                      <Progress value={enrollmentPercentage} className="h-2" />
                    </div>

                    <Separator />

                    {/* Status Alert */}
                    {status && (
                      <Alert variant={status.variant}>
                        <Info className="h-4 w-4" />
                        <AlertDescription>{status.message}</AlertDescription>
                      </Alert>
                    )}

                    {/* Enrollment Button */}
                    {currentUser ? (
                      isEnrolled ? (
                        <Button disabled className="w-full">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Enrolled
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleEnrollment}
                          disabled={!canEnroll() || enrolling}
                          className="w-full"
                        >
                          {enrolling ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Enrolling...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Enroll Now
                            </>
                          )}
                        </Button>
                      )
                    ) : (
                      <Link to="/login" className="block">
                        <Button className="w-full">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Login to Enroll
                        </Button>
                      </Link>
                    )}

                    {/* Course Status */}
                    <div className="text-center pt-2">
                      <Badge 
                        variant={course.isActive ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {course.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Lessons</span>
                    <span className="font-medium">{course.lessons?.length || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Assignments</span>
                    <span className="font-medium">{course.assignments?.length || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Enrolled Students</span>
                    <span className="font-medium">{enrolledCount}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Available Spots</span>
                    <span className="font-medium text-green-600">
                      {course.maxStudents - enrolledCount}
                    </span>
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