/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BookOpen,
  Search,
  Filter,
  Users,
  Target,
  Clock,
  TrendingUp,
  GraduationCap,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';
import { courseService, FirestoreCourse } from '@/lib/firestore';
import { useI18n } from '@/contexts/I18nContext';

interface CourseWithApproval extends FirestoreCourse {
  needsApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

interface CoursesListProps {
  readOnly?: boolean;
  showAll?: boolean;
}

export const CoursesList: React.FC<CoursesListProps> = ({ readOnly, showAll }) => {
  const { t } = useI18n();
  const [courses, setCourses] = useState<CourseWithApproval[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseWithApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [instructorFilter, setInstructorFilter] = useState('all');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, categoryFilter, instructorFilter]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const activeCourses = await courseService.getCourses(1000);
      setCourses(activeCourses as CourseWithApproval[]);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses.filter(course => {
      const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.instructorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
      const matchesInstructor = instructorFilter === 'all' || (course.instructorName === instructorFilter);
      
      return matchesSearch && matchesCategory && matchesInstructor;
    });

    if (!showAll) {
      filtered = filtered.filter(course => course.isActive);
    }

    setFilteredCourses(filtered);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'programming': 'bg-blue-100 text-blue-800 border-blue-200',
      'design': 'bg-purple-100 text-purple-800 border-purple-200',
      'business': 'bg-orange-100 text-orange-800 border-orange-200',
      'marketing': 'bg-pink-100 text-pink-800 border-pink-200',
      'science': 'bg-green-100 text-green-800 border-green-200',
      'mathematics': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'language': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getUniqueCategories = () => {
    const categories = courses.map(course => course.category).filter(Boolean);
    return [...new Set(categories)];
  };

  const getUniqueInstructors = () => {
    const names = courses.map(c => c.instructorName).filter(Boolean);
    return [...new Set(names)];
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Loading Courses...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-green-900">
            <div className="p-2 bg-green-100 rounded-xl">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            {t('courses.title')} ({filteredCourses.length})
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search Courses</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title, instructor, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Filter by Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getUniqueCategories().map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Instructor Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Filter by Instructor</label>
              <Select value={instructorFilter} onValueChange={setInstructorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Instructors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instructors</SelectItem>
                  {getUniqueInstructors().map(name => (
                    <SelectItem key={name} value={name!}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-green-300 group">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Course Header */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-green-700 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {course.description}
                    </p>
                  </div>
                </div>

                {/* Instructor Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border-2 border-gray-200">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${course.instructorName}`} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                      {getInitials(course.instructorName || 'Unknown')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {course.instructorName || 'Unknown Instructor'}
                    </p>
                    <p className="text-xs text-gray-500">Instructor</p>
                  </div>
                </div>

                {/* Course Details */}
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{course.duration || 0} hours</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>Max {course.maxStudents || 'Unlimited'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{course.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>Level: {course.level || 'Beginner'}</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {course.category && (
                    <Badge className={`flex items-center gap-1 text-xs ${getCategoryColor(course.category)}`}>
                      <Target className="h-3 w-3" />
                      <span className="capitalize">{course.category}</span>
                    </Badge>
                  )}
                  
                  <Badge className={`flex items-center gap-1 text-xs ${getStatusColor(course.isActive)}`}>
                    {course.isActive ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    <span>{course.isActive ? 'Active' : 'Inactive'}</span>
                  </Badge>
                </div>

                {/* Action Button removed by request */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Footer */}
      <Card className="bg-gray-50">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {courses.filter(c => c.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Active Courses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {courses.filter(c => !c.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Inactive</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {getUniqueCategories().length}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {courses.length}
              </div>
              <div className="text-sm text-gray-600">Total Courses</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};