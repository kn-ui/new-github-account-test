import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { BookOpen, CheckCircle, XCircle, Eye, Search, Trash2, Plus, Target, Clock, Users, TrendingUp } from 'lucide-react';
import { courseService, FirestoreCourse } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CourseWithApproval extends FirestoreCourse {
  needsApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export default function CourseManager() {
  const location = useLocation();
  const [courses, setCourses] = useState<CourseWithApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<CourseWithApproval | null>(null);
  const [showCourseDialog, setShowCourseDialog] = useState(false);

  // Calculate stats
  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.isActive).length;
  const pendingCourses = courses.filter(c => !c.isActive).length;
  const totalStudents = courses.reduce((total, course) => total + (course.enrolledStudents || 0), 0);

  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search') || '';
    if (q) setSearchTerm(q);
  }, [location.search]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const [activeCourses, pendingCourses] = await Promise.all([
        courseService.getCourses(1000),
        courseService.getPendingCourses(1000),
      ]);
      setCourses([...(activeCourses as CourseWithApproval[]), ...(pendingCourses as CourseWithApproval[])]);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCourse = async (courseId: string) => {
    try {
      await courseService.updateCourse(courseId, { isActive: true });
      toast.success('Course approved successfully');
      loadCourses(); // Refresh the list
    } catch (error) {
      console.error('Error approving course:', error);
      toast.error('Failed to approve course');
    }
  };

  const handleRejectCourse = async (courseId: string) => {
    try {
      await courseService.updateCourse(courseId, { isActive: false });
      toast.success('Course rejected');
      loadCourses(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting course:', error);
      toast.error('Failed to reject course');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await courseService.deleteCourse(courseId);
      toast.success('Course deleted');
      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleViewCourse = (course: CourseWithApproval) => {
    setSelectedCourse(course);
    setShowCourseDialog(true);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'pending' && !course.isActive) ||
                         (statusFilter === 'approved' && course.isActive) ||
                         (statusFilter === 'rejected' && !course.isActive);
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (course: CourseWithApproval) => {
    return course.isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (course: CourseWithApproval) => {
    return course.isActive ? 'Approved' : 'Pending Approval';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3">Course Management</h1>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Manage courses, approve submissions, and monitor enrollment across the system.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{totalCourses}</div>
              <div className="text-blue-100 text-sm">All courses</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Active Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{activeCourses}</div>
              <div className="text-green-100 text-sm">Published & active</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{pendingCourses}</div>
              <div className="text-orange-100 text-sm">Awaiting review</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{totalStudents}</div>
              <div className="text-purple-100 text-sm">Enrolled students</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">Search Courses</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by title or instructor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2 block">Status Filter</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        <div className="grid gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Instructor: {course.instructorName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {course.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {course.duration} hours
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
                    <Badge 
                      variant="outline" 
                      className={`px-3 py-1 text-sm font-medium ${getStatusColor(course)}`}
                    >
                      {getStatusText(course)}
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCourse(course)}
                        className="hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      {!course.isActive && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveCourse(course.id)}
                            className="text-green-600 border-green-300 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectCourse(course.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Course</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{course.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCourse(course.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <Card className="text-center py-12 shadow-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first course'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => navigate('/create-course')} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Course Detail Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Course Details
            </DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedCourse.title}</h3>
                <p className="text-gray-600">{selectedCourse.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Instructor:</span>
                  <p className="text-gray-600">{selectedCourse.instructorName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <p className="text-gray-600">{selectedCourse.category}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Duration:</span>
                  <p className="text-gray-600">{selectedCourse.duration} hours</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Max Students:</span>
                  <p className="text-gray-600">{selectedCourse.maxStudents}</p>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Syllabus:</span>
                <p className="text-gray-600 mt-1">{selectedCourse.syllabus}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}