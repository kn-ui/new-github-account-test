import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
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
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import DashboardHero from '@/components/DashboardHero';

export default function TeacherCourses() {
  const { t } = useI18n();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<FirestoreCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('title-asc');
    

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


  const getStatusColor = (course: FirestoreCourse) => {
    if (course.isActive) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (course: FirestoreCourse) => {
    if (course.isActive) {
      return t('teacher.courses.active');
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
        <div className="text-gray-600">{t('teacher.courses.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero 
        title={t('teacher.courses.title')}
        subtitle={t('teacher.courses.subtitle')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="search">{t('teacher.courses.searchPlaceholder')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('teacher.courses.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">{t('teacher.courses.filterByStatus')}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('teacher.courses.allStatuses')}</SelectItem>
                  <SelectItem value="active">{t('teacher.courses.active')}</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort">{t('teacher.courses.sortBy')}</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title-asc">{t('teacher.courses.titleAsc')}</SelectItem>
                  <SelectItem value="title-desc">{t('teacher.courses.titleDesc')}</SelectItem>
                  <SelectItem value="date-newest">Date: Newest</SelectItem>
                  <SelectItem value="date-oldest">Date: Oldest</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('teacher.courses.course')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('teacher.courses.category')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('teacher.courses.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('teacher.courses.duration')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('teacher.courses.created')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('teacher.courses.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm font-medium text-gray-900 mb-2">{course.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{course.description}</p>
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
                      {course.duration} {t('teacher.courses.weeks')}
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
                            {t('teacher.courses.view')}
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link to={`/dashboard/courses/${course.id}/edit`}>
                            <Edit className="h-4 w-4 mr-1" />
                            {t('teacher.courses.edit')}
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedCourses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || statusFilter !== 'all' ? 'No courses match your filters' : t('teacher.courses.noCourses')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
            
    </div>
  );
}