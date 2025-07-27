/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, Course } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  LogOut, 
  Plus,
  Clock,
  Star,
  TrendingUp,
  User,
  Settings,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

const Dashboard = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, userProfile]);


  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all courses
      const coursesResponse = await api.getCourses();
      if (coursesResponse.success && coursesResponse.data) {
        setCourses(coursesResponse.data);
      }

      // Load user-specific courses based on role
      if (userProfile?.role === 'teacher') {
        try {
          const myCoursesResponse = await api.getMyCourses();
          if (myCoursesResponse.success && myCoursesResponse.data) {
            setMyCourses(myCoursesResponse.data);
          }
        } catch (error) {
          console.log('No courses found for teacher');
        }
      } else if (userProfile?.role === 'student') {
        try {
          const enrollmentsResponse = await api.getMyEnrollments();
          if (enrollmentsResponse.success && enrollmentsResponse.data) {
            // Extract courses from enrollments
            const enrolledCourses = enrollmentsResponse.data.map((enrollment: any) => enrollment.course).filter(Boolean);
            setMyCourses(enrolledCourses);
          }
        } catch (error) {
          console.log('No enrollments found for student');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await api.enrollInCourse(courseId);
      toast.success('Successfully enrolled in course!');
      loadData(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to enroll in course');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'teacher': return 'bg-blue-500';
      case 'student': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Settings;
      case 'teacher': return GraduationCap;
      case 'student': return User;
      default: return User;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated but no profile exists, show profile completion prompt
  if (currentUser && !userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              We need to set up your profile to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Welcome {currentUser.displayName || currentUser.email}! 
              We're setting up your profile in the background.
            </p>
            <Button 
              onClick={loadData} 
              className="w-full"
            >
              Refresh Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full mt-2"
            >
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50 w-full border-b border-border/30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-soft">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-primary">
                St. Raguel Church School
              </h1>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm font-medium">{userProfile?.displayName || currentUser?.displayName}</p>
                <div className="flex items-center space-x-1">
                  {(() => {
                    const RoleIcon = getRoleIcon(userProfile?.role || 'student');
                    return <RoleIcon className="h-3 w-3" />;
                  })()}
                  <p className="text-xs text-muted-foreground capitalize">{userProfile?.role || 'student'}</p>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${getRoleColor(userProfile?.role || 'student')}`}></div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {userProfile?.displayName || currentUser?.displayName}!
          </h2>
          <p className="text-muted-foreground">
            {userProfile?.role === 'admin' && 'Manage your school system and oversee all activities.'}
            {userProfile?.role === 'teacher' && 'Create and manage your courses, track student progress.'}
            {userProfile?.role === 'student' && 'Continue your learning journey and explore new courses.'}
          </p>
        </div>

        {/* Dashboard Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">All Courses</TabsTrigger>
            <TabsTrigger value="my-courses">
              {userProfile?.role === 'student' ? 'My Enrollments' : 'My Courses'}
            </TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courses.length}</div>
                  <p className="text-xs text-muted-foreground">Available courses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {userProfile?.role === 'student' ? 'My Enrollments' : 'My Courses'}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{myCourses.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {userProfile?.role === 'student' ? 'Enrolled courses' : 'Created courses'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Status</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Active</div>
                  <p className="text-xs text-muted-foreground">Account status</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Courses</CardTitle>
                <CardDescription>Latest courses available in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.slice(0, 6).map((course) => (
                    <Card key={course.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <Badge variant="secondary" className="w-fit">
                          {course.category}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {course.duration} weeks
                          </span>
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {course.enrolledStudents.length}/{course.maxStudents}
                          </span>
                        </div>
                        {userProfile?.role === 'student' && (
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleEnroll(course.id)}
                          >
                            Enroll Now
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {userProfile?.role === 'teacher' && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      <Badge variant="outline">{course.category}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Instructor:</span>
                        <span className="font-medium">{course.instructorName}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Duration:</span>
                        <span>{course.duration} weeks</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Enrolled:</span>
                        <span>{course.enrolledStudents.length}/{course.maxStudents}</span>
                      </div>
                      
                      {userProfile?.role === 'student' && (
                        <Button 
                          className="w-full mt-4"
                          onClick={() => handleEnroll(course.id)}
                          disabled={course.enrolledStudents.length >= course.maxStudents}
                        >
                          {course.enrolledStudents.length >= course.maxStudents ? 'Course Full' : 'Enroll Now'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search terms' : 'No courses are available at the moment'}
                </p>
              </div>
            )}
          </TabsContent>

          {/* My Courses Tab */}
          <TabsContent value="my-courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">
                {userProfile?.role === 'student' ? 'My Enrollments' : 'My Courses'}
              </h3>
              {userProfile?.role === 'teacher' && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Course
                </Button>
              )}
            </div>

            {myCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      <Badge variant="default">{course.category}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{course.duration} weeks</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Students:</span>
                          <span>{course.enrolledStudents.length}/{course.maxStudents}</span>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full mt-4">
                        {userProfile?.role === 'student' ? 'Continue Learning' : 'Manage Course'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {userProfile?.role === 'student' ? 'No enrollments yet' : 'No courses created yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {userProfile?.role === 'student' 
                    ? 'Enroll in courses to start your learning journey'
                    : 'Create your first course to start teaching'
                  }
                </p>
                {userProfile?.role === 'teacher' && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {userProfile?.displayName || currentUser?.displayName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {userProfile?.email || currentUser?.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {(() => {
                        const RoleIcon = getRoleIcon(userProfile?.role || 'student');
                        return <RoleIcon className="h-4 w-4" />;
                      })()}
                      <p className="text-sm text-muted-foreground capitalize">
                        {userProfile?.role || 'student'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <p className="text-sm text-muted-foreground">Active</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="mt-4">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Add Label component import
const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={className}>{children}</label>
);

export default Dashboard;