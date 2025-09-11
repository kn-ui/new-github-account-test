/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { BookOpen, Users, Target, TrendingUp, Search } from 'lucide-react';
import { courseService, FirestoreCourse } from '@/lib/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/contexts/I18nContext';

interface CourseWithApproval extends FirestoreCourse {
  needsApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

interface CoursesListProps {
  readOnly?: boolean;
}

export const CoursesList: React.FC<CoursesListProps> = ({ readOnly }) => {
  const { t } = useI18n();
  const [courses, setCourses] = useState<CourseWithApproval[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseWithApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    const filtered = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
      // Only active courses are shown now
      const matchesStatus = course.isActive;
      return matchesSearch && matchesStatus;
    });
    setFilteredCourses(filtered);
  }, [searchTerm, courses]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const activeCourses = await courseService.getCourses(1000);
      setCourses(activeCourses as CourseWithApproval[]);
      setFilteredCourses(activeCourses as CourseWithApproval[]);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (course: CourseWithApproval) => {
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (course: CourseWithApproval) => {
    return 'Approved';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('blog.loading')}</div>
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-6 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">{t('courses.searchLabel')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('courses.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {/* Status filter removed per requirements (only Admin creates courses; no pending state) */}
          </div>
        </CardContent>
      </Card>
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
                          {t('courses.instructor')}: {course.instructorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {course.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {course.duration} {t('courses.hours')}
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
                    {course.isActive ? t('courses.approved') : t('courses.pendingApproval')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
