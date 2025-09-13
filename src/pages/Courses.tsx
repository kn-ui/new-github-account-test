import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, Course } from '@/lib/api';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Search,
  Filter,
  GraduationCap,
  User
} from 'lucide-react';
import { toast } from 'sonner';

const Courses = () => {
  const { t } = useI18n();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, selectedCategory]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await api.getCourses({ page: 1, limit: 100 });
      
      if (response.success && response.data) {
        const activeCourses = response.data.filter(course => course.isActive);
        setCourses(activeCourses);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(activeCourses.map(course => course.category))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    setFilteredCourses(filtered);
  };

  const CourseCard = ({ course }: { course: Course }) => (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 line-clamp-2">{course.title}</CardTitle>
            <CardDescription className="line-clamp-3">{course.description}</CardDescription>
          </div>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {course.category}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="h-4 w-4 mr-2" />
            <span>{course.instructorName}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>{course.duration} weeks</span>
            </div>
            
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span>{course.currentEnrollmentCount ?? 0}/{course.maxStudents}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-auto">
          <Link to={`/courses/${course.id}`}>
            <Button className="w-full">
              <BookOpen className="h-4 w-4 mr-2" />
              View Course
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const CourseCardSkeleton = () => (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="p-3 bg-gradient-primary rounded-lg shadow-soft">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">{t('courses.title')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('courses.subtitle')}
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('courses.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('courses.categoryFilter')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('courses.allCategories')}</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-6">
            <p className="text-muted-foreground">
              {filteredCourses.length === 1 
                ? '1 course found' 
                : `${filteredCourses.length} courses found`}
            </p>
          </div>
        )}

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))
          ) : filteredCourses.length > 0 ? (
            // Course cards
            filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))
          ) : (
            // No courses found
            <div className="col-span-full text-center py-12">
              <div className="p-4 rounded-lg bg-muted/50 max-w-md mx-auto">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or browse all available courses.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Courses;