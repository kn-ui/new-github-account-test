/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, XCircle, Eye, Search, Trash2, Plus, Target, Clock, Users, TrendingUp, Pencil, UserPlus, UserMinus, Upload } from 'lucide-react';
import { courseService, FirestoreCourse, enrollmentService, userService } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHero from '@/components/DashboardHero';

interface CourseWithApproval extends FirestoreCourse {
  needsApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export default function CourseManager() {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState<CourseWithApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<CourseWithApproval | null>(null);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [enrollTab, setEnrollTab] = useState<'manual'|'csv'>('manual');
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState<CourseWithApproval | null>(null);
  const [studentQuery, setStudentQuery] = useState('');
  const [foundStudents, setFoundStudents] = useState<any[]>([]);
  const [csvText, setCsvText] = useState('');
  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [createStep, setCreateStep] = useState<number>(1);
  const [totalEnrolledStudents, setTotalEnrolledStudents] = useState<number>(0);
  const [showArchived, setShowArchived] = useState(false);
  const { currentUser } = useAuth();

  const [editForm, setEditForm] = useState<Partial<FirestoreCourse>>({});
  const [createForm, setCreateForm] = useState<Partial<FirestoreCourse>>({
    title: '',
    description: '',
    category: '',
    duration: 8,
    maxStudents: 30,
    syllabus: '',
    isActive: false,
  });
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');

  // Calculate stats
  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.isActive).length;
  const totalStudents = totalEnrolledStudents;

  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
    loadTeachers();
  }, [showArchived]);

  const loadCourses = async () => {
    try {
      setLoading(true);

      const courses = showArchived 
        ? await courseService.getAllCourses(1000)
        : await courseService.getCourses(1000);
      setCourses(courses); // Added this line
      // compute total unique enrolled students across all courses
      try {
        const enrollments = await enrollmentService.getAllEnrollments();
        // Get unique student IDs
        const uniqueStudentIds = new Set(enrollments.map(e => e.studentId));
        setTotalEnrolledStudents(uniqueStudentIds.size);
      } catch {
        setTotalEnrolledStudents(0);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const teachersList = await userService.getTeachers();
      setTeachers(teachersList);
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error('Failed to load teachers');
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

  const openEnroll = (course: CourseWithApproval) => {
    setSelectedCourseForEnroll(course);
    setEnrollTab('manual');
    setStudentQuery('');
    setFoundStudents([]);
    setCsvText('');
    setShowEnrollDialog(true);
  };

  const openUnenroll = async (course: CourseWithApproval) => {
    setSelectedCourseForEnroll(course);
    try {
      // Load enrolled students for this course
      const enrollments = await enrollmentService.getEnrollmentsByCourse(course.id);
      const studentsWithDetails = await Promise.all(
        enrollments.map(async (enrollment: any) => {
          try {
            const user = await userService.getUserById(enrollment.studentId);
            return {
              ...enrollment,
              user: user
            };
          } catch (error) {
            return {
              ...enrollment,
              user: { displayName: 'Unknown User', email: enrollment.studentId }
            };
          }
        })
      );
      setEnrolledStudents(studentsWithDetails);
      setShowUnenrollDialog(true);
    } catch (error) {
      console.error('Error loading enrolled students:', error);
      toast.error('Failed to load enrolled students');
    }
  };

  const unenrollStudent = async (enrollmentId: string) => {
    try {
      await enrollmentService.deleteEnrollment(enrollmentId);
      toast.success('Student unenrolled successfully');
      // Refresh the enrolled students list
      if (selectedCourseForEnroll) {
        await openUnenroll(selectedCourseForEnroll);
      }
    } catch (error) {
      console.error('Error unenrolling student:', error);
      if (error instanceof Error) {
        toast.error(`Failed to unenroll student: ${error.message}`);
      } else {
        toast.error('Failed to unenroll student. Please try again.');
      }
    }
  };

  const searchStudents = async () => {
    try {
      const all = await userService.getUsers(500);
      const q = studentQuery.toLowerCase();
      
      // Filter to only include students, exclude current user, and apply search criteria
      const studentsOnly = all.filter(u => {
        const isStudent = u.role === 'student';
        const isNotCurrentUser = u.id !== currentUser?.uid && u.uid !== currentUser?.uid;
        const matchesSearch = (u.displayName||'').toLowerCase().includes(q) || 
                             (u.email||'').toLowerCase().includes(q) || 
                             (u.id||'').toLowerCase().includes(q);
        
        return isStudent && isNotCurrentUser && matchesSearch;
      }).slice(0, 10);
      
      setFoundStudents(studentsOnly);
      
      if (studentsOnly.length === 0 && q.length > 0) {
        toast.info('No students found matching your search criteria.');
      }
    } catch (error) {
      console.error('Error searching students:', error);
      setFoundStudents([]);
      toast.error('Failed to search students. Please try again.');
    }
  };

  const enrollStudent = async (studentId: string) => {
    if (!selectedCourseForEnroll) return;
    
    // Prevent self-enrollment
    if (studentId === currentUser?.uid) {
      toast.error('You cannot enroll yourself in a course.');
      return;
    }
    
    try {
      await enrollmentService.createEnrollment({ 
        courseId: selectedCourseForEnroll.id, 
        studentId, 
        status: 'active', 
        progress: 0, 
        completedLessons: [] 
      } as any);
      toast.success('Student enrolled successfully');
      
      // Clear search results after successful enrollment
      setFoundStudents([]);
      setStudentQuery('');
    } catch (error) {
      console.error('Error enrolling student:', error);
      if (error instanceof Error) {
        if (error.message.includes('already enrolled')) {
          toast.error('This student is already enrolled in this course.');
        } else {
          toast.error(`Failed to enroll student: ${error.message}`);
        }
      } else {
        toast.error('Failed to enroll student. Please try again.');
      }
    }
  };

  const processCsv = async () => {
    if (!selectedCourseForEnroll) return;
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let count = 0;
    let errors = 0;
    
    for (const line of lines) {
      const [emailOrId] = line.split(',').map(s => s.trim());
      if (!emailOrId) continue;
      
      try {
        let uid = emailOrId;
        let userRole = '';
        
        if (!uid.includes('@')) {
          // treat as uid - check if user exists and is a student
          try {
            const user = await userService.getUserById(emailOrId);
            uid = user?.id || emailOrId;
            userRole = user?.role || '';
          } catch {
            uid = emailOrId; // Fallback
          }
        } else {
          const u = await userService.getUserByEmail(emailOrId);
          uid = u?.uid || u?.id || '';
          userRole = u?.role || '';
        }
        
        // Only enroll students and prevent self-enrollment
        if (uid && userRole === 'student' && uid !== currentUser?.uid) {
          await enrollmentService.createEnrollment({ 
            courseId: selectedCourseForEnroll.id, 
            studentId: uid, 
            status: 'active', 
            progress: 0, 
            completedLessons: [] 
          } as any);
          count++;
        } else if (userRole !== 'student') {
          errors++;
        }
      } catch (error) {
        errors++;
      }
    }
    
    if (count > 0) {
      toast.success(`Successfully enrolled ${count} students`);
    }
    if (errors > 0) {
      toast.warning(`${errors} entries were skipped (not students or already enrolled)`);
    }
    if (count === 0 && errors === 0) {
      toast.error('No valid student entries found');
    }
    
    setCsvText('');
  };

  const openEdit = (course: CourseWithApproval) => {
    setSelectedCourse(course);
    setEditForm({ ...course });
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedCourse) return;
    
    // Validation for required fields
    if (!editForm.title || editForm.title.trim().length === 0) {
      toast.error('Title is required');
      return;
    }
    if (!editForm.description || editForm.description.trim().length === 0) {
      toast.error('Description is required');
      return;
    }
    if (!editForm.category || editForm.category.trim().length === 0) {
      toast.error('Category is required');
      return;
    }
    if (!editForm.duration || Number(editForm.duration) < 1) {
      toast.error('Duration must be at least 1 hour');
      return;
    }
    if (!editForm.maxStudents || Number(editForm.maxStudents) < 1) {
      toast.error('Max students must be at least 1');
      return;
    }
    if (!editForm.syllabus || editForm.syllabus.trim().length === 0) {
      toast.error('Syllabus is required');
      return;
    }
    if (!editForm.instructor) {
      toast.error('Please select an instructor');
      return;
    }

    const selectedTeacher = teachers.find(t => t.uid === editForm.instructor);
    if (!selectedTeacher) {
      toast.error('Selected instructor not found');
      return;
    }
    
    try {
      await courseService.updateCourse(selectedCourse.id, {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        duration: editForm.duration,
        maxStudents: editForm.maxStudents,
        syllabus: editForm.syllabus,
        isActive: editForm.isActive,
        instructor: editForm.instructor,
        instructorName: selectedTeacher.displayName || selectedTeacher.email || 'Instructor',
      } as Partial<FirestoreCourse>);
      toast.success('Course updated');
      setIsEditOpen(false);
      loadCourses();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update course');
    }
  };

  const startCreate = () => {
    setCreateForm({
      title: '', description: '', category: '', duration: 8 as any, maxStudents: 30 as any, syllabus: '', isActive: userProfile?.role === 'admin',
    } as any);
    setSelectedInstructor('');
    setCreateStep(1);
    setIsCreateOpen(true);
  };

  const submitCreate = async () => {
    try {
      if (!currentUser || !userProfile) {
        toast.error('Not authenticated');
        return;
      }
      // Only admins can create from this page; otherwise, block
      if (userProfile.role !== 'admin') {
        toast.error('Only administrators can create courses.');
        return;
      }
      
      // Validation for required fields
      if (!createForm.title || createForm.title.trim().length === 0) {
        toast.error('Title is required');
        return;
      }
      if (!createForm.description || createForm.description.trim().length === 0) {
        toast.error('Description is required');
        return;
      }
      if (!createForm.category || createForm.category.trim().length === 0) {
        toast.error('Category is required');
        return;
      }
      if (!createForm.duration || Number(createForm.duration) < 1) {
        toast.error('Duration must be at least 1 hour');
        return;
      }
      if (!createForm.maxStudents || Number(createForm.maxStudents) < 1) {
        toast.error('Max students must be at least 1');
        return;
      }
      if (!createForm.syllabus || createForm.syllabus.trim().length === 0) {
        toast.error('Syllabus is required');
        return;
      }
      if (!selectedInstructor) {
        toast.error('Please select an instructor');
        return;
      }

      const selectedTeacher = teachers.find(t => t.uid === selectedInstructor);
      if (!selectedTeacher) {
        toast.error('Selected instructor not found');
        return;
      }

      await courseService.createCourse({
        title: String(createForm.title || ''),
        description: String(createForm.description || ''),
        category: String(createForm.category || ''),
        duration: Number(createForm.duration || 1),
        maxStudents: Number(createForm.maxStudents || 1),
        syllabus: String(createForm.syllabus || ''),
        isActive: !!createForm.isActive,
        instructor: selectedInstructor,
        instructorName: selectedTeacher.displayName || selectedTeacher.email || 'Instructor',
      } as any);
      toast.success('Course created');
      setIsCreateOpen(false);
      loadCourses();
    } catch (e) {
      console.error(e);
      toast.error('Failed to create course');
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructorName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Access control - only admins and super_admins can access
  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only administrators can access this page.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <DashboardHero 
        title="Course Management"
        subtitle="Manage courses, approvals, and content."
      >
        {userProfile?.role === 'admin' && (
            <div className="mt-4 lg:mt-0">
              <Button 
                onClick={startCreate} 
                className="bg-white text-green-600 hover:bg-green-50 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Course
              </Button>
            </div>
        )}
      </DashboardHero>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{totalCourses}</div>
              <div className="text-gray-600 text-sm">All courses</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Active Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{activeCourses}</div>
              <div className="text-gray-600 text-sm">Published & active</div>
            </CardContent>
          </Card>
          

                    
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{totalStudents}</div>
              <div className="text-gray-600 text-sm">Enrolled students</div>
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
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant={showArchived ? "default" : "outline"}
                  onClick={() => setShowArchived(!showArchived)}
                  className="whitespace-nowrap"
                >
                  {showArchived ? "Hide Archived" : "Show Archived"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        <div className="grid gap-6">
          {filteredCourses.map((course) => (

            <Card key={course.id} className="shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="p-6 h-full">

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span className="truncate max-w-[100px]">{course.instructorName}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span className="truncate max-w-[80px]">{course.category}</span>

                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {course.duration}h
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
                    <Badge 
                      variant="outline" 
                      className={`px-3 py-1 text-sm font-medium ${course.isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {course.isActive ? 'Active' : 'Pending Approval'}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(course)}
                        className="hover:bg-gray-50"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {userProfile?.role === 'admin' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => openEnroll(course)}>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Students
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openUnenroll(course)}>
                            <UserMinus className="h-4 w-4 mr-1" />
                            Remove Students
                          </Button>
                        </>
                      )}
                      
                      
                      
                      {course.isActive && (
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
                      )}
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
                : 'No courses available.'
              }
            </p>
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
                <div className="mt-1 max-h-40 overflow-y-auto scrollbar-thin">
                  <p className="text-gray-600 whitespace-pre-wrap break-words text-sm">{selectedCourse.syllabus}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-green-600" />
              Edit Course
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2 scrollbar-thin">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={editForm.title || ''} 
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value.slice(0, 100) })}
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{(editForm.title || '').length}/100 characters</p>
            </div>
            <div>
              <Label htmlFor="category">Category (max 50 characters)</Label>
              <Input 
                id="category" 
                value={editForm.category || ''} 
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value.slice(0, 50) })}
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">{(editForm.category || '').length}/50 characters</p>
            </div>
            <div>
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input 
                id="duration" 
                type="text" 
                value={editForm.duration || ''} 
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setEditForm({ ...editForm, duration: value as any });
                  }
                }}
                placeholder="Enter duration in hours"
              />
            </div>
            <div>
              <Label htmlFor="max">Max Students</Label>
              <Input 
                id="max" 
                type="text" 
                value={editForm.maxStudents || ''} 
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setEditForm({ ...editForm, maxStudents: value as any });
                  }
                }}
                placeholder="Enter maximum number of students"
              />
            </div>
            <div>
              <Label htmlFor="instructor">Instructor</Label>
              <Select 
                value={editForm.instructor || ''} 
                onValueChange={(value) => setEditForm({ ...editForm, instructor: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an instructor" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.uid} value={teacher.uid}>
                      {teacher.displayName || teacher.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="isActive">Status</Label>
              <Select 
                value={String(editForm.isActive || false)} 
                onValueChange={(value) => setEditForm({ ...editForm, isActive: value === 'true' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea 
                id="desc" 
                value={editForm.description || ''} 
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value.slice(0, 300) })}
                maxLength={300}
              />
              <p className="text-xs text-gray-500 mt-1">{(editForm.description || '').length}/300 characters</p>
            </div>
            <div>
              <Label htmlFor="syllabus">Syllabus</Label>
              <Textarea 
                id="syllabus" 
                value={editForm.syllabus || ''} 
                onChange={(e) => setEditForm({ ...editForm, syllabus: e.target.value.slice(0, 25000) })}
                maxLength={25000}
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-1">{(editForm.syllabus || '').length}/25,000 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveEdit} className="bg-green-600 hover:bg-green-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {userProfile?.role === 'admin' && (
        <>
        <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-green-600" /> Enroll Students
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant={enrollTab==='manual'?'default':'outline'} size="sm" onClick={() => setEnrollTab('manual')}>Manual</Button>
                <Button variant={enrollTab==='csv'?'default':'outline'} size="sm" onClick={() => setEnrollTab('csv')}>CSV Import</Button>
              </div>
              {enrollTab === 'manual' ? (
                <div className="space-y-3">
                  <Label>Search student (name/email/id)</Label>
                  <div className="flex gap-2">
                    <Input value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} placeholder="john@school.edu or user id" />
                    <Button onClick={searchStudents}>Search</Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {foundStudents.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{s.displayName}</div>
                          <div className="text-xs text-gray-500">{s.email}</div>
                        </div>
                        <Button size="sm" onClick={() => enrollStudent(s.uid || s.id)}>Enroll</Button>
                      </div>
                    ))}
                    {foundStudents.length === 0 && (<div className="text-sm text-gray-500">No results</div>)}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label>Paste CSV (email or uid per line)</Label>
                  <Textarea rows={8} value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder="student1@example.com\nstudent2@example.com" />
                  <Button onClick={processCsv}><Upload className="h-4 w-4 mr-1" /> Import & Enroll</Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEnrollDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Create Course
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {createStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input 
                      value={String(createForm.title || '')} 
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value.slice(0, 100) } as any)}
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">{(createForm.title || '').length}/100 characters</p>
                  </div>
                  <div>
                    <Label>Category (max 50 characters)</Label>
                    <Input 
                      value={String(createForm.category || '')} 
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value.slice(0, 50) } as any)}
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">{(createForm.category || '').length}/50 characters</p>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea 
                      value={String(createForm.description || '')} 
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value.slice(0, 300) } as any)}
                      maxLength={300}
                    />
                    <p className="text-xs text-gray-500 mt-1">{(createForm.description || '').length}/300 characters</p>
                  </div>
                </div>
              )}
              {createStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label>Duration (hours)</Label>
                    <Input 
                      type="text" 
                      value={createForm.duration || ''} 
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                          setCreateForm({ ...createForm, duration: value as any } as any);
                        }
                      }}
                      placeholder="Enter duration in hours"
                    />
                  </div>
                  <div>
                    <Label>Max Students</Label>
                    <Input 
                      type="text" 
                      value={createForm.maxStudents || ''} 
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                          setCreateForm({ ...createForm, maxStudents: value as any } as any);
                        }
                      }}
                      placeholder="Enter maximum number of students"
                    />
                  </div>
                  <div>
                    <Label>Instructor</Label>
                    <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.uid} value={teacher.uid}>
                            {teacher.displayName || teacher.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Syllabus</Label>
                    <Textarea 
                      value={String(createForm.syllabus || '')} 
                      onChange={(e) => setCreateForm({ ...createForm, syllabus: e.target.value.slice(0, 25000) } as any)}
                      maxLength={25000}
                      rows={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">{(createForm.syllabus || '').length}/25,000 characters</p>
                  </div>
                </div>
              )}
              {createStep === 3 && (
                <div className="space-y-2 text-sm text-gray-700">
                  <div><span className="font-medium">Title:</span> {String(createForm.title || '')}</div>
                  <div><span className="font-medium">Category:</span> {String(createForm.category || '')}</div>
                  <div><span className="font-medium">Duration:</span> {Number(createForm.duration || 1)} hours</div>
                  <div><span className="font-medium">Max Students:</span> {Number(createForm.maxStudents || 1)}</div>
                  <div><span className="font-medium">Instructor:</span> {teachers.find(t => t.uid === selectedInstructor)?.displayName || teachers.find(t => t.uid === selectedInstructor)?.email || 'Not selected'}</div>
                  <div><span className="font-medium">Active:</span> {userProfile?.role === 'admin' ? 'Yes' : 'No (awaiting approval)'}</div>
                </div>
              )}
            </div>
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                {createStep > 1 && (
                  <Button variant="outline" onClick={() => setCreateStep((s) => Math.max(1, s - 1))}>Back</Button>
                )}
              </div>
              <div className="flex gap-2">
                {createStep < 3 && (
                  <Button onClick={() => setCreateStep((s) => Math.min(3, s + 1))}>Next</Button>
                )}
                {createStep === 3 && (
                  <Button className="bg-green-600 hover:bg-green-700" onClick={submitCreate}>Create</Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Un-enrollment Dialog */}
        <Dialog open={showUnenrollDialog} onOpenChange={setShowUnenrollDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Remove Students from {selectedCourseForEnroll?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">Select students to remove from this course:</p>
              <div className="max-h-96 overflow-y-auto space-y-2 scrollbar-thin">
                {enrolledStudents.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{enrollment.user?.displayName || 'Unknown User'}</div>
                      <div className="text-sm text-gray-500">{enrollment.user?.email}</div>
                      <div className="text-xs text-gray-400">Progress: {enrollment.progress || 0}%</div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => unenrollStudent(enrollment.id)}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
                {enrolledStudents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No students enrolled in this course
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUnenrollDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </>
      )}
    </div>
  );
}