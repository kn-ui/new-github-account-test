import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { studentDataService } from '@/lib/firestore';
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
  Clock,
  Grid3X3,
  List
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
  import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';

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

const StudentCourses = React.memo(() => {
  const { currentUser, userProfile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [progressFilter, setProgressFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'student') {
      loadEnrolledCourses();
    }
  }, [currentUser?.uid, userProfile?.role]);

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      const courses = await studentDataService.getStudentCoursesData(currentUser!.uid);
      setEnrolledCourses(courses);
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
      toast.error(t('errors.loadCourses') || 'Failed to load enrolled courses');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedCourses = useMemo(() => {
    if (!enrolledCourses.length) return [];
    
    let filtered = enrolledCourses.filter(course => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = course.title.toLowerCase().includes(searchLower) ||
                           course.description.toLowerCase().includes(searchLower) ||
                           course.instructorName.toLowerCase().includes(searchLower);
      
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
    if (progress === 100) return t('student.progress.completed');
    if (progress >= 50) return t('student.progress.inProgress');
    if (progress >= 25) return t('student.progress.gettingStarted');
    return t('student.progress.notStarted');
  };

  if (!userProfile || userProfile.role !== 'student') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{t('common.accessDenied')}</div>
          <div className="text-gray-600">{t('common.studentOnly')}</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('student.courses.loading')}</div>
      </div>
    );
  }




  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title={t('student.myCourses.title')}
        subtitle={t('student.myCourses.subtitle')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-end mb-6">
          <Button asChild>
            <Link to="/academic">
              {t('student.courses.browseMore')}
            </Link>
          </Button>
        </div>
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 hover:shadow-md transition-shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">{t('courses.searchLabel')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('student.courses.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category-filter">{t('courses.categoryFilter')}</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('courses.allCategories')}</SelectItem>
                  {Array.from(new Set(enrolledCourses.map(course => course.category))).map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="progress-filter">{t('student.courses.progressFilter')}</Label>
              <Select value={progressFilter} onValueChange={setProgressFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('student.courses.progressAll')}</SelectItem>
                  <SelectItem value="not-started">{t('student.courses.progressNotStarted')}</SelectItem>
                  <SelectItem value="in-progress">{t('student.courses.progressInProgress')}</SelectItem>
                  <SelectItem value="completed">{t('student.courses.progressCompleted')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Sort Options & View Mode */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label htmlFor="sort">{t('student.courses.sortBy')}</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">{t('student.courses.sortRecent')}</SelectItem>
                  <SelectItem value="progress-high">{t('student.courses.sortProgressHigh')}</SelectItem>
                  <SelectItem value="progress-low">{t('student.courses.sortProgressLow')}</SelectItem>
                  <SelectItem value="title-asc">{t('student.courses.sortTitleAsc')}</SelectItem>
                  <SelectItem value="title-desc">{t('student.courses.sortTitleDesc')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">{t('common.view')}:</span>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Courses Display */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid gap-6'}>
          {filteredAndSortedCourses.map(course => (
            <div key={course.id} className={`bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow ${viewMode === 'grid' ? 'p-4' : 'p-6'}`}>
              {viewMode === 'grid' ? (
                // Grid View
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{course.title}</h3>
                      <p className="text-sm text-gray-600 truncate">{t('common.by')} {course.instructorName}</p>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="text-xs">{course.category}</Badge>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{t('student.courses.progress')}</span>
                      <span className="text-gray-600">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to={`/dashboard/course/${course.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      {t('common.view')}
                    </Link>
                  </Button>
                </div>
              ) : (
                // List View
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 truncate">{course.title}</h3>
                        <Badge variant="outline" className="flex-shrink-0">{course.category}</Badge>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {t('common.by')} {course.instructorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {t('student.courses.enrolledOn')} {course.enrolledAt.toLocaleDateString()}
                        </span>
                        {course.lastAccessed && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {t('student.courses.lastAccessed')} {course.lastAccessed.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{t('student.courses.progress')}</span>
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
                      <Link to={`/dashboard/course/${course.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('common.view')}
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredAndSortedCourses.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">{t('student.courses.none')}</h3>
              <p className="text-gray-400">
                {searchTerm || categoryFilter !== 'all' || progressFilter !== 'all' 
                  ? t('student.courses.noResultsTipFiltered')
                  : t('student.courses.noResultsTip')
                }
              </p>
              {!searchTerm && categoryFilter === 'all' && progressFilter === 'all' && (
                <Button asChild className="mt-4">
                  <Link to="/academic">{t('student.courses.browseAvailable')}</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

StudentCourses.displayName = 'StudentCourses';

export default StudentCourses;