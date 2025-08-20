import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { enrollmentService, courseService, FirestoreEnrollment } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Search, 
  Eye, 
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  instructorName: string;
  progress: number;
  enrolledAt: Date;
  lastAccessed?: Date;
}

export default function StudentCourses() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [progressFilter, setProgressFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'student') {
      loadEnrolledCourses();
    }
  }, [currentUser?.uid, userProfile?.role]);

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser!.uid);
      
      // Get course details for each enrollment
      const coursesWithDetails = await Promise.all(
        enrollments.map(async (enrollment: any) => {
          try {
            const course = await courseService.getCourse(enrollment.courseId);
            if (course) {
              return {
                id: course.id,
                title: course.title,
                description: course.description,
                category: course.category,
                instructorName: course.instructorName,
                progress: enrollment.progress || 0,
                enrolledAt: enrollment.enrolledAt.toDate(),
                lastAccessed: enrollment.lastAccessed?.toDate()
              };
            }
            return null;
          } catch (error) {
            console.error(`Error loading course ${enrollment.courseId}:`, error);
            return null;
          }
        })
      );

      const validCourses = coursesWithDetails.filter(course => course !== null) as EnrolledCourse[];
      setEnrolledCourses(validCourses);
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
      toast.error('Failed to load enrolled courses');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedCourses = useMemo(() => {
    let filtered = enrolledCourses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
      
      let matchesProgress = true;
      if (progressFilter === 'not-started') matchesProgress = course.progress === 0;
      else if (progressFilter === 'in-progress') matchesProgress = course.progress > 0 && course.progress < 100;
      else if (progressFilter === 'completed') matchesProgress = course.progress === 100;
      
      return matchesSearch && matchesCategory && matchesProgress;
    });

    // Sort courses
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime());
        break;
      case 'progress-high':
        filtered.sort((a, b) => b.progress - a.progress);
        break;
      case 'progress-low':
        filtered.sort((a, b) => a.progress - b.progress);
        break;
      case 'title-asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return filtered;
  }, [enrolledCourses, searchTerm, categoryFilter, progressFilter, sortBy]);

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getProgressText = (progress: number) => {
    if (progress === 100) return 'Completed';
    if (progress >= 50) return 'In Progress';
    if (progress >= 25) return 'Getting Started';
    return 'Not Started';
  };

  if (!userProfile || userProfile.role !== 'student') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only students can access this page.</div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
              <p className="text-gray-600">Your enrolled courses and progress</p>
            </div>
            <div>
              <Button asChild>
                <Link to="/courses">
                  Browse More Courses
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search Courses</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title, description, or instructor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category-filter">Filter by Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.from(new Set(enrolledCourses.map(course => course.category))).map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="progress-filter">Filter by Progress</Label>
              <Select value={progressFilter} onValueChange={setProgressFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Progress</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="sort">Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Enrolled</SelectItem>
                <SelectItem value="progress-high">Progress: High to Low</SelectItem>
                <SelectItem value="progress-low">Progress: Low to High</SelectItem>
                <SelectItem value="title-asc">Title: A → Z</SelectItem>
                <SelectItem value="title-desc">Title: Z → A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid gap-6">
          {filteredAndSortedCourses.map(course => (
            <div key={course.id} className="bg-white border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                      <Badge variant="outline">{course.category}</Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{course.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        by {course.instructorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Enrolled {course.enrolledAt.toLocaleDateString()}
                      </span>
                      {course.lastAccessed && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Last accessed {course.lastAccessed.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Progress</span>
                        <span className="text-gray-600">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{getProgressText(course.progress)}</span>
                        <span className={`px-2 py-1 rounded-full ${getProgressColor(course.progress)} text-white`}>
                          {course.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/courses/${course.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Course
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filteredAndSortedCourses.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No courses found</h3>
              <p className="text-gray-400">
                {searchTerm || categoryFilter !== 'all' || progressFilter !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'You haven\'t enrolled in any courses yet'
                }
              </p>
              {!searchTerm && categoryFilter === 'all' && progressFilter === 'all' && (
                <Button asChild className="mt-4">
                  <Link to="/courses">Browse Available Courses</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}