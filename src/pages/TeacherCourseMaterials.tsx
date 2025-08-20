import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FolderOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Download,
  FileText,
  Image,
  Video,
  File,
  BookOpen,
  Calendar,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { courseService, FirestoreCourse } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CourseMaterial {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'image' | 'link' | 'other';
  url: string;
  courseId: string;
  createdAt: any;
  updatedAt: any;
  isPublic: boolean;
  fileSize?: string;
  downloadCount?: number;
}

export default function TeacherCourseMaterials() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [courses, setCourses] = useState<FirestoreCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'document' as CourseMaterial['type'],
    url: '',
    courseId: '',
    isPublic: true
  });

  useEffect(() => {
    loadData();
  }, [currentUser?.uid]);

  const loadData = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      const teacherCourses = await courseService.getCoursesByInstructor(currentUser.uid);
      setCourses(teacherCourses);
      
      // For now, we'll create mock materials since the material service might not exist yet
      // In a real implementation, you'd load materials from a material service
      const mockMaterials: CourseMaterial[] = teacherCourses.map((course, index) => ({
        id: `material-${index}`,
        title: `Sample Material ${index + 1}`,
        description: `This is a sample material for ${course.title}`,
        type: ['document', 'video', 'image'][index % 3] as CourseMaterial['type'],
        url: 'https://example.com/sample-material.pdf',
        courseId: course.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        fileSize: '2.5 MB',
        downloadCount: Math.floor(Math.random() * 50)
      }));
      
      setMaterials(mockMaterials);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load course materials');
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingMaterial(null);
    setForm({
      title: '',
      description: '',
      type: 'document',
      url: '',
      courseId: '',
      isPublic: true
    });
    setShowDialog(true);
  };

  const openEdit = (material: CourseMaterial) => {
    setEditingMaterial(material);
    setForm({
      title: material.title,
      description: material.description,
      type: material.type,
      url: material.url,
      courseId: material.courseId,
      isPublic: material.isPublic
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title || !form.description || !form.url || !form.courseId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // In a real implementation, you'd save to a material service
      if (editingMaterial) {
        // Update existing material
        setMaterials(prev => prev.map(m => 
          m.id === editingMaterial.id 
            ? { ...m, ...form, updatedAt: new Date() }
            : m
        ));
        toast.success('Material updated successfully');
      } else {
        // Create new material
        const newMaterial: CourseMaterial = {
          id: `material-${Date.now()}`,
          ...form,
          createdAt: new Date(),
          updatedAt: new Date(),
          fileSize: 'Unknown',
          downloadCount: 0
        };
        setMaterials(prev => [...prev, newMaterial]);
        toast.success('Material created successfully');
      }

      setShowDialog(false);
    } catch (error) {
      console.error('Failed to save material:', error);
      toast.error('Failed to save material');
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      setMaterials(prev => prev.filter(m => m.id !== materialId));
      toast.success('Material deleted successfully');
    } catch (error) {
      console.error('Failed to delete material:', error);
      toast.error('Failed to delete material');
    }
  };

  const getTypeIcon = (type: CourseMaterial['type']) => {
    switch (type) {
      case 'document':
        return <FileText className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'link':
        return <File className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: CourseMaterial['type']) => {
    switch (type) {
      case 'document':
        return 'bg-blue-100 text-blue-800';
      case 'video':
        return 'bg-purple-100 text-purple-800';
      case 'image':
        return 'bg-green-100 text-green-800';
      case 'link':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMaterials = selectedCourse === 'all' 
    ? materials 
    : materials.filter(m => m.courseId === selectedCourse);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading course materials...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Materials</h1>
              <p className="text-gray-600">Manage materials and resources for your courses</p>
            </div>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center space-x-4">
            <Label htmlFor="course-filter">Filter by Course:</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">
              {filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>

        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
            <p className="text-gray-600 mb-4">
              {selectedCourse === 'all' 
                ? 'Create your first material to get started'
                : 'No materials found for this course'
              }
            </p>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMaterials.map((material) => {
              const course = courses.find(c => c.id === material.courseId);
              return (
                <div key={material.id} className="bg-white border rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-lg ${getTypeColor(material.type)}`}>
                          {getTypeIcon(material.type)}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">{material.title}</h3>
                        <Badge variant={material.isPublic ? 'default' : 'secondary'}>
                          {material.isPublic ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{material.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{course?.title || 'Unknown Course'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{material.updatedAt.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Download className="h-4 w-4" />
                          <span>{material.downloadCount || 0} downloads</span>
                        </div>
                        {material.fileSize && (
                          <div className="flex items-center space-x-1">
                            <File className="h-4 w-4" />
                            <span>{material.fileSize}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(material)}>
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(material.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Material Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="course">Course *</Label>
              <Select value={form.courseId} onValueChange={(value) => setForm({ ...form, courseId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Material Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter material title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter material description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Material Type *</Label>
                <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as CourseMaterial['type'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="url">URL/File Path *</Label>
                <Input
                  id="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="Enter URL or file path"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPublic">Make this material public to students</Label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingMaterial ? 'Update Material' : 'Add Material'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}