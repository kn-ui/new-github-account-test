import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { courseService, FirestoreCourse } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  Trash2,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
import DashboardHero from '@/components/DashboardHero';

export default function TeacherCourses() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<FirestoreCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('title-asc');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<number>(1);
  const [createForm, setCreateForm] = useState<Partial<FirestoreCourse>>({
    title: '',
    description: '',
    category: '',
    duration: 8 as any,
    maxStudents: 30 as any,
    syllabus: '',
    isActive: false,
  } as any);

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'teacher') {
      loadCourses();
    }
  }, [currentUser?.uid, userProfile?.role]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const teacherCourses = await courseService.getCoursesByInstructor(currentUser!.uid);
      setCourses(teacherCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await courseService.deleteCourse(courseId);
      toast.success('Course deleted successfully');
      loadCourses(); // Refresh the list
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const getStatusColor = (course: FirestoreCourse) => {
    if (course.isActive) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (course: FirestoreCourse) => {
    if (course.isActive) {
      return 'Active';
    }
    return 'Pending Approval';
  };

  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && course.isActive) ||
                           (statusFilter === 'pending' && !course.isActive);
      return matchesSearch && matchesStatus;
    });

    // Sort courses
    switch (sortBy) {
      case 'title-asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'date-newest':
        filtered.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
        break;
      case 'date-oldest':
        filtered.sort((a, b) => a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime());
        break;
      case 'category':
        filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    return filtered;
  }, [courses, searchTerm, statusFilter, sortBy]);

  if (!userProfile || userProfile.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only teachers can access this page.</div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero 
        title="My Courses"
        subtitle="Manage your courses"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search Courses</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title-asc">Title: A → Z</SelectItem>
                  <SelectItem value="title-desc">Title: Z → A</SelectItem>
                  <SelectItem value="date-newest">Date: Newest</SelectItem>
                  <SelectItem value="date-oldest">Date: Oldest</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-700 hover:bg-blue-800">
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Courses ({filteredAndSortedCourses.length})
              </h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{course.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course)}`}>
                        {getStatusText(course)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.duration} weeks
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.createdAt.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link to={`/courses/${course.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link to={`/dashboard/courses/${course.id}/edit`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this course?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently remove the course
                                "{course.title}" and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDeleteCourse(course.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedCourses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || statusFilter !== 'all' ? 'No courses match your filters' : 'No courses found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
            {/* Create Course Wizard (multi-step) */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-700" />
              Create Course
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {createStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={String(createForm.title || '')} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value } as any)} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={String(createForm.category || '')} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value } as any)} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={String(createForm.description || '')} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value } as any)} />
                </div>
              </div>
            )}
            {createStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Duration (weeks)</Label>
                  <Input type="number" min={1} max={52} value={Number(createForm.duration || 1)} onChange={(e) => setCreateForm({ ...createForm, duration: Number(e.target.value) as any } as any)} />
                </div>
                <div>
                  <Label>Max Students</Label>
                  <Input type="number" min={1} max={1000} value={Number(createForm.maxStudents || 1)} onChange={(e) => setCreateForm({ ...createForm, maxStudents: Number(e.target.value) as any } as any)} />
                </div>
                <div>
                  <Label>Syllabus (optional)</Label>
                  <Textarea value={String(createForm.syllabus || '')} onChange={(e) => setCreateForm({ ...createForm, syllabus: e.target.value } as any)} />
                </div>
              </div>
            )}
            {createStep === 3 && (
              <div className="space-y-2 text-sm text-gray-700">
                <div><span className="font-medium">Title:</span> {String(createForm.title || '')}</div>
                <div><span className="font-medium">Category:</span> {String(createForm.category || '')}</div>
                <div><span className="font-medium">Duration:</span> {Number(createForm.duration || 1)} weeks</div>
                <div><span className="font-medium">Max Students:</span> {Number(createForm.maxStudents || 1)}</div>
                <div><span className="font-medium">Status:</span> Pending Approval</div>
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
                <Button className="bg-blue-700 hover:bg-blue-800" onClick={async () => {
                  try {
                    if (!currentUser || !userProfile) return;
                    await courseService.createCourse({
                      title: String(createForm.title || ''),
                      description: String(createForm.description || ''),
                      category: String(createForm.category || ''),
                      duration: Number(createForm.duration || 1),
                      maxStudents: Number(createForm.maxStudents || 1),
                      syllabus: String(createForm.syllabus || ''),
                      isActive: false, // teacher-created courses require approval
                      instructor: currentUser.uid,
                      instructorName: userProfile.displayName || userProfile.email || 'Instructor',
                    } as any);
                    setIsCreateOpen(false);
                    setCreateStep(1);
                    setCreateForm({ title: '', description: '', category: '', duration: 8 as any, maxStudents: 30 as any, syllabus: '', isActive: false } as any);
                    await loadCourses();
                    toast.success('Course created and pending approval');
                  } catch (e) {
                    console.error(e);
                    toast.error('Failed to create course');
                  }
                }}>Create</Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}