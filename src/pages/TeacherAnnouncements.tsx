
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { announcementService, courseService, FirestoreAnnouncement } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  MessageSquare
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

export default function TeacherAnnouncements() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<FirestoreAnnouncement[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<FirestoreAnnouncement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    courseId: '',
    isGeneral: false
  });

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'teacher') {
      loadData();
    }
  }, [currentUser?.uid, userProfile?.role]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teacherCourses, teacherAnnouncements] = await Promise.all([
        courseService.getCoursesByInstructor(currentUser!.uid),
        announcementService.getAnnouncementsByTeacher(currentUser!.uid)
      ]);
      setCourses(teacherCourses);
      setAnnouncements(teacherAnnouncements);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.body) {
      toast.error('Please fill in all required fields');
      return;
    }


    if (!formData.isGeneral && !formData.courseId) {
      toast.error('Please select a course or mark as general announcement');
      return;
    }

    try {
      const announcementData = {
        title: formData.title,
        body: formData.body,
        courseId: formData.isGeneral ? undefined : formData.courseId,
        authorId: currentUser!.uid,
        createdAt: new Date()
      };

      if (editingAnnouncement) {
        await announcementService.updateAnnouncement(editingAnnouncement.id, announcementData);
        toast.success('Announcement updated successfully');
      } else {
        await announcementService.createAnnouncement(announcementData);
        toast.success('Announcement created successfully');
      }

      setShowCreateDialog(false);
      setEditingAnnouncement(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
    }
  };


  const handleEdit = (announcement: FirestoreAnnouncement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      body: announcement.body,
      courseId: announcement.courseId || '',
      isGeneral: !announcement.courseId
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (announcementId: string) => {
    try {
      await announcementService.deleteAnnouncement(announcementId);
      toast.success('Announcement deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };


  const resetForm = () => {
    setFormData({
      title: '',
      body: '',
      courseId: '',
      isGeneral: false
    });
  };

  const openCreateDialog = () => {
    setEditingAnnouncement(null);
    resetForm();
    setShowCreateDialog(true);
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === 'all' || 
                         (courseFilter === 'general' && !announcement.courseId) ||
                         announcement.courseId === courseFilter;
    return matchesSearch && matchesCourse;
  });

  const getCourseName = (courseId?: string) => {
    if (!courseId) return 'General Announcement';
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Unknown Course';
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
        <div className="text-gray-600">Loading announcements...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>

              <p className="text-gray-600">Create and manage course announcements</p>
            </div>
            <div>
              <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Announcements</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title or content..."
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
                  <SelectItem value="all">All Announcements</SelectItem>
                  <SelectItem value="general">General Announcements</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="grid gap-4">
          {filteredAnnouncements.map(announcement => (
            <div key={announcement.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bell className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                      <Badge variant={announcement.courseId ? 'default' : 'secondary'}>
                        {announcement.courseId ? 'Course' : 'General'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{announcement.body}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {announcement.createdAt.toDate().toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {getCourseName(announcement.courseId)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
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
                        <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently remove the announcement
                          "{announcement.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleDelete(announcement.id)}
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
          {filteredAnnouncements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No announcements found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Announcement Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Announcement title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="body">Content *</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Announcement content"
                rows={4}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isGeneral"
                  checked={formData.isGeneral}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    isGeneral: e.target.checked,
                    courseId: e.target.checked ? '' : prev.courseId
                  }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isGeneral">General announcement (not tied to a specific course)</Label>
              </div>
              
              {!formData.isGeneral && (
                <div>
                  <Label htmlFor="courseId">Course</Label>
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
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
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