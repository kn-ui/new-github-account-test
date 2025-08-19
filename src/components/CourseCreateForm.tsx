import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Save, 
  AlertCircle,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  syllabus: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  duration: z.number().min(1, 'Duration must be at least 1 week').max(52, 'Duration cannot exceed 52 weeks'),
  maxStudents: z.number().min(1, 'Must allow at least 1 student').max(1000, 'Cannot exceed 1000 students'),
  isActive: z.boolean().default(true),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface CourseCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultIsActive?: boolean; // if false, course will be created pending approval
}

const COURSE_CATEGORIES = [
  'Mathematics',
  'Science',
  'Literature',
  'History',
  'Geography',
  'Computer Science',
  'Art',
  'Music',
  'Physical Education',
  'Language Arts',
  'Foreign Languages',
  'Religious Studies',
  'Life Skills',
  'Other'
];

const CourseCreateForm = ({ onSuccess, onCancel, defaultIsActive = true }: CourseCreateFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      duration: 8,
      maxStudents: 30,
      isActive: defaultIsActive,
    }
  });

  const watchedCategory = watch('category');
  const watchedIsActive = watch('isActive');

  const onSubmit = async (data: CourseFormData) => {
    try {
      setIsSubmitting(true);
      
      // Use custom category if selected
      const finalCategory = data.category === 'custom' ? customCategory : data.category;
      
      const courseData = {
        ...data,
        category: finalCategory,
        isActive: defaultIsActive ? data.isActive : false,
      };

      const response = await api.createCourse(courseData);
      
      if (response.success) {
        toast.success('Course created successfully!');
        reset();
        setCustomCategory('');
        setShowCustomCategory(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomCategory(true);
      setValue('category', '');
    } else {
      setShowCustomCategory(false);
      setCustomCategory('');
      setValue('category', value);
    }
  };

  const handleCustomCategorySubmit = () => {
    if (customCategory.trim()) {
      setValue('category', customCategory.trim());
      setShowCustomCategory(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <BookOpen className="h-6 w-6 mr-2" />
          Create New Course
        </CardTitle>
        <CardDescription>
          Fill in the details below to create a new course for students to enroll in.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Course Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="e.g., Introduction to Mathematics"
                className="mt-1"
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                onValueChange={handleCategoryChange}
                value={showCustomCategory ? 'custom' : watchedCategory}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Category...</SelectItem>
                </SelectContent>
              </Select>
              
              {showCustomCategory && (
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Enter custom category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomCategorySubmit()}
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={handleCustomCategorySubmit}
                    disabled={!customCategory.trim()}
                  >
                    Add
                  </Button>
                </div>
              )}
              
              {errors.category && (
                <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="duration">Duration (weeks) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="52"
                {...register('duration', { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.duration && (
                <p className="text-sm text-destructive mt-1">{errors.duration.message}</p>
              )}
            </div>

            {/* Max Students */}
            <div>
              <Label htmlFor="maxStudents">Maximum Students *</Label>
              <Input
                id="maxStudents"
                type="number"
                min="1"
                max="1000"
                {...register('maxStudents', { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.maxStudents && (
                <p className="text-sm text-destructive mt-1">{errors.maxStudents.message}</p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={watchedIsActive}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
              <Label htmlFor="isActive">Course is active</Label>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Course Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Provide a comprehensive description of what students will learn in this course..."
              rows={4}
              className="mt-1"
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Syllabus */}
          <div>
            <Label htmlFor="syllabus">Course Syllabus (Optional)</Label>
            <Textarea
              id="syllabus"
              {...register('syllabus')}
              placeholder="Detailed course outline, learning objectives, topics covered, assessment methods, etc..."
              rows={6}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Provide a detailed syllabus including learning objectives, topics, and assessment methods.
            </p>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              After creating the course, you can add lessons, assignments, and other content from your dashboard.
              Students will be able to view and enroll in active courses from the course catalog.
            </AlertDescription>
          </Alert>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating Course...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Course
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CourseCreateForm;