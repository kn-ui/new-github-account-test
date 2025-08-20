import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bell, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  BookOpen,
  MessageSquare,
  Calendar,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { announcementService, courseService, FirestoreAnnouncement } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function TeacherAnnouncements() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<FirestoreAnnouncement[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<FirestoreAnnouncement | null>(null);
  const [form, setForm] = useState({
    title: '',
    body: '',
    courseId: '',
    isImportant: false
  });

  useEffect(() => {
    loadData();
  }, [currentUser?.uid]);

  const loadData = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      const [teacherCourses, teacherAnnouncements] = await Promise.all([
        courseService.getCoursesByInstructor(currentUser.uid),
        announcementService.getAnnouncementsByInstructor(currentUser.uid)
      ]);
      
      setCourses(teacherCourses);
      setAnnouncements(teacherAnnouncements);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingAnnouncement(null);
    setForm({
      title: '',
      body: '',
      courseId: '',
      isImportant: false
    });
    setShowDialog(true);
  };

  const openEdit = (announcement: FirestoreAnnouncement) => {
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title,
      body: announcement.body,
      courseId: announcement.courseId || '',
      isImportant: announcement.isImportant || false
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title || !form.body) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        title: form.title,
        body: form.body,
        courseId: form.courseId || undefined,
        isImportant: form.isImportant,
        authorId: currentUser?.uid
      };

      if (editingAnnouncement) {
        await announcementService.updateAnnouncement(editingAnnouncement.id, payload as any);
        toast.success('Announcement updated successfully');
      } else {
        await announcementService.createAnnouncement(payload as any);
        toast.success('Announcement created successfully');
      }

      setShowDialog(false);
      await loadData();
    } catch (error) {
      console.error('Failed to save announcement:', error);
      toast.error('Failed to save announcement');
    }
  };

  const handleDelete = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await announcementService.deleteAnnouncement(announcementId);
      toast.success('Announcement deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'No date';
    
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Invalid date';
    }
  };

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
              <p className="text-gray-600">Manage announcements for your courses</p>
            </div>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements yet</h3>
            <p className="text-gray-600 mb-4">Create your first announcement to communicate with your students</p>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {announcements.map((announcement) => {
              const course = courses.find(c => c.id === announcement.courseId);
              return (
                <div key={announcement.id} className={`bg-white border rounded-lg p-6 ${announcement.isImportant ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
                        {announcement.isImportant && (
                          <Badge variant="default">Important</Badge>
                        )}
                        <Badge variant="outline">
                          {announcement.courseId ? 'Course-specific' : 'General'}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3 whitespace-pre-wrap">{announcement.body}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        {announcement.courseId && (
                          <div className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{course?.title || 'Unknown Course'}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(announcement.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>All students</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(announcement)}>
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(announcement.id)}
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

      {/* Announcement Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="course">Course (Optional)</Label>
              <Select value={form.courseId} onValueChange={(value) => setForm({ ...form, courseId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course or leave empty for general announcement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">General Announcement</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to create a general announcement visible to all students
              </p>
            </div>

            <div>
              <Label htmlFor="title">Announcement Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter announcement title"
              />
            </div>

            <div>
              <Label htmlFor="body">Message *</Label>
              <Textarea
                id="body"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Enter your announcement message"
                rows={5}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isImportant"
                checked={form.isImportant}
                onChange={(e) => setForm({ ...form, isImportant: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isImportant">Mark as important</Label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}