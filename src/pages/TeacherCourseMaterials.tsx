import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { courseMaterialService, courseService, FirestoreCourseMaterial } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  FileText,
  Video,
  Link,
  Paperclip
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function TeacherCourseMaterials() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<FirestoreCourseMaterial[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<FirestoreCourseMaterial | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    type: 'document' as 'document' | 'video' | 'link' | 'other',
    fileUrl: '',
    externalLink: ''
  });

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'teacher') {
      loadData();
    }
  }, [currentUser?.uid, userProfile?.role]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teacherCourses, teacherMaterials] = await Promise.all([
        courseService.getCoursesByInstructor(currentUser!.uid),
        courseMaterialService.getMaterialsByTeacher(currentUser!.uid)
      ]);
      setCourses(teacherCourses);
      setMaterials(teacherMaterials);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.courseId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.type === 'document' && !formData.fileUrl) {
      toast.error('Please provide a file URL for document materials');
      return;
    }

    if (formData.type === 'link' && !formData.externalLink) {
      toast.error('Please provide an external link for link materials');
      return;
    }

    try {
      const materialData = {
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        type: formData.type,
        fileUrl: formData.type === 'document' ? formData.fileUrl : undefined,
        externalLink: formData.type === 'link' ? formData.externalLink : undefined
      };

      if (editingMaterial) {
        await courseMaterialService.updateCourseMaterial(editingMaterial.id, materialData);
        toast.success('Material updated successfully');
      } else {
        await courseMaterialService.createCourseMaterial(materialData);
        toast.success('Material created successfully');
      }

      setShowCreateDialog(false);
      setEditingMaterial(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving material:', error);
      toast.error('Failed to save material');
    }
  };

  const handleEdit = (material: FirestoreCourseMaterial) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description,
      courseId: material.courseId,
      type: material.type,
      fileUrl: material.fileUrl || '',
      externalLink: material.externalLink || ''
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (materialId: string) => {
    try {
      await courseMaterialService.deleteCourseMaterial(materialId);
      toast.success('Material deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      courseId: '',
      type: 'document',
      fileUrl: '',
      externalLink: ''
    });
  };

  const openCreateDialog = () => {
    setEditingMaterial(null);
    resetForm();
    setShowCreateDialog(true);
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === 'all' || material.courseId === courseFilter;
    const matchesType = typeFilter === 'all' || material.type === typeFilter;
    return matchesSearch && matchesCourse && matchesType;
  });

  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Unknown Course';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'video': return <Video className="h-4 w-4 text-red-600" />;
      case 'link': return <Link className="h-4 w-4 text-green-600" />;
      case 'other': return <Paperclip className="h-4 w-4 text-gray-600" />;
      default: return <Paperclip className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'video': return 'bg-red-100 text-red-800';
      case 'link': return 'bg-green-100 text-green-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
        <div className="text-gray-600">Loading materials...</div>
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
              <p className="text-gray-600">Create and manage course materials</p>
            </div>
            <div>
              <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Materials</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="course-filter">Filter by Course</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter">Filter by Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="link">Links</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Materials List */}
        <div className="grid gap-4">
          {filteredMaterials.map(material => (
            <div key={material.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    {getTypeIcon(material.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">{material.title}</h3>
                      <Badge className={getTypeColor(material.type)}>
                        {material.type.charAt(0).toUpperCase() + material.type.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{material.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {material.createdAt.toDate().toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" />
                        {getCourseName(material.courseId)}
                      </span>
                    </div>
                    {material.fileUrl && (
                      <div className="mt-2">
                        <a 
                          href={material.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          View Document
                        </a>
                      </div>
                    )}
                    {material.externalLink && (
                      <div className="mt-2">
                        <a 
                          href={material.externalLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                        >
                          <Link className="h-3 w-3" />
                          Visit Link
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(material)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
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
                        <AlertDialogTitle>Delete this material?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently remove the material
                          "{material.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleDelete(material.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
          {filteredMaterials.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No materials found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Material Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Material title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="courseId">Course *</Label>
                <Select value={formData.courseId} onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the material"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Material Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                type: value as 'document' | 'video' | 'link' | 'other',
                fileUrl: '',
                externalLink: ''
              }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="link">External Link</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'document' && (
              <div>
                <Label htmlFor="fileUrl">File URL *</Label>
                <Input
                  id="fileUrl"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, fileUrl: e.target.value }))}
                  placeholder="https://example.com/file.pdf"
                  type="url"
                  required
                />
              </div>
            )}

            {formData.type === 'link' && (
              <div>
                <Label htmlFor="externalLink">External Link *</Label>
                <Input
                  id="externalLink"
                  value={formData.externalLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, externalLink: e.target.value }))}
                  placeholder="https://example.com/resource"
                  type="url"
                  required
                />
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingMaterial ? 'Update Material' : 'Add Material'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}