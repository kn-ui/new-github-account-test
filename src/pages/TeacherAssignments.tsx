import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { assignmentService, courseService, FirestoreAssignment } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import LoadingButton from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import DualDateInput from '@/components/ui/DualDateInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  Trash2,
  Calendar,
  Clock
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
import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';
// Hygraph upload via backend
import { truncateTitle, truncateText } from '@/lib/utils';
import { getAuthToken } from '@/lib/api';
import { uploadToHygraph } from '@/lib/hygraphUpload';

export default function TeacherAssignments() {
  const { t } = useI18n();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<FirestoreAssignment[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<FirestoreAssignment | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    dueDate: new Date().toISOString().slice(0, 10),
    dueTime: '',
    maxScore: 10,
    instructions: '',
    linkTitle: '',
    linkUrl: ''
  });
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {

    if (currentUser?.uid && userProfile?.role === 'teacher') {
      loadData();
    }
  }, [currentUser?.uid, userProfile?.role]);

  const loadData = async () => {
    try {
      setLoading(true);
      const teacherCourses = await courseService.getCoursesByInstructor(currentUser!.uid);
      const activeCourses = teacherCourses.filter(course => course.isActive);
      const activeCourseIds = activeCourses.map(course => course.id);

      const teacherAssignments = await assignmentService.getAssignmentsByTeacher(currentUser!.uid);
      const activeAssignments = teacherAssignments.filter(assignment => activeCourseIds.includes(assignment.courseId));

      setCourses(activeCourses);
      setAssignments(activeAssignments);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.courseId || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      // Parse due date in local time to avoid UTC off-by-one issues when Ethiopian calendar is used
      const [yearStr, monthStr, dayStr] = (formData.dueDate || new Date().toISOString().slice(0,10)).split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // JS Date months are 0-based
      const day = parseInt(dayStr, 10);
      const dueDate = new Date(year, month, day);
      if (formData.dueTime) {
        const [hh, mm] = formData.dueTime.split(':');
        const hours = parseInt(hh, 10);
        const minutes = parseInt(mm, 10);
        if (!isNaN(hours) && !isNaN(minutes)) dueDate.setHours(hours, minutes, 0, 0);
      } else {
        // Set to end of day local time if no time specified
        dueDate.setHours(23, 59, 59, 999);
      }

      const attachments: { type: 'file' | 'link'; url: string; title?: string; assetId?: string }[] = [];
      if (fileObj) {
        try {
          setIsUploading(true);
          const uploadResult = await uploadToHygraph(fileObj);
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Upload failed');
          }
          if (!uploadResult.url) {
            throw new Error('No URL returned from upload');
          }
          attachments.push({ 
            type: 'file', 
            url: uploadResult.url, 
            title: fileObj.name,
            ...(uploadResult.id ? { assetId: uploadResult.id } : {})
          });
          if (uploadResult.warning) {
            toast.warning(uploadResult.warning);
          }
        } catch (err) {
          console.error('Attachment upload failed', err);
          toast.error(`Failed to upload attachment: ${err instanceof Error ? err.message : 'Unknown error'}`);
          // Don't continue if upload failed
          setIsUploading(false);
          setSaving(false);
          return;
        }
      }
      if (formData.linkUrl) attachments.push({ type: 'link', url: formData.linkUrl, title: formData.linkTitle || undefined });

      const assignmentData = {
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        dueDate,
        maxScore: formData.maxScore,
        instructions: formData.instructions,
        teacherId: currentUser!.uid,
        ...(attachments.length ? { attachments } : {})
      } as any;

      if (editingAssignment) {
        await assignmentService.updateAssignment(editingAssignment.id, assignmentData);
        toast.success('Assignment updated successfully');
      } else {
        await assignmentService.createAssignment(assignmentData);
        toast.success('Assignment created successfully');
      }

      setShowCreateDialog(false);
      setEditingAssignment(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast.error('Failed to save assignment');
    }
    finally {
      setIsUploading(false);
      setSaving(false);
    }
  };


  const handleEdit = (assignment: FirestoreAssignment) => {
      setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      courseId: assignment.courseId,
      // Preserve the calendar-selected local date without unintended TZ shifts
      dueDate: (() => { const d = assignment.dueDate.toDate(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
      dueTime: '',
      maxScore: assignment.maxScore,
      instructions: assignment.instructions || '',
      linkTitle: '',
      linkUrl: ''
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (assignmentId: string) => {
    try {
      await assignmentService.deleteAssignment(assignmentId);
      toast.success('Assignment deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };


  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      courseId: '',
      dueDate: new Date().toISOString().slice(0, 10),
      dueTime: '',
      maxScore: 10,
      instructions: '',
      linkTitle: '',
      linkUrl: ''
    });
    setFileObj(null);
  };

  const openCreateDialog = () => {
    setEditingAssignment(null);
    resetForm();
    setShowCreateDialog(true);
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter === 'all' || assignment.courseId === courseFilter;
    return matchesSearch && matchesCourse;
  });

  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Unknown Course';
  };

  const getStatusColor = (dueDate: Date) => {
    const now = new Date();
    const due = dueDate;
    if (due < now) {
      return 'bg-red-100 text-red-800';
    } else if (due.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (dueDate: Date) => {
    const now = new Date();
    const due = dueDate;
    if (due < now) {
      return 'Overdue';
    } else if (due.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return 'Due Soon';
    }
    return 'Active';
  };

  if (!userProfile || userProfile.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{t('common.accessDenied')}</div>
          <div className="text-gray-600">{t('common.teacherOnly')}</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('teacher.grades.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title={t('teacher.assignments.title') || 'Assignments'}
        subtitle={t('teacher.assignments.subtitle') || 'Create and manage course assignments'}
      >
        <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          {t('teacher.assignments.create') || 'Create Assignment'}
        </Button>
      </DashboardHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">{t('teacher.grades.searchPlaceholder')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('teacher.assignments.searchPlaceholder') || 'Search by title or description...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="course-filter">{t('teacher.grades.filterByCourse')}</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('teacher.grades.allCourses')}</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {filteredAssignments.length} {t('teacher.assignments.countSuffix') || 'assignments found'}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">{t('common.view')}:</span>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                {t('common.list') || 'List'}
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                {t('common.grid')}
              </Button>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className={viewMode === 'grid' ? 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid gap-4'}>
          {filteredAssignments.map(assignment => (
            <div key={assignment.id} className="bg-white border rounded-lg p-4 flex flex-col h-full">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{truncateTitle(assignment.title)}</h3>
                  <p className="text-sm text-gray-600">{truncateText(assignment.description)}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {assignment.dueDate.toDate().toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('teacher.grades.maxScore')}: {assignment.maxScore}
                    </span>
                    <span>{truncateText(getCourseName(assignment.courseId))}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(assignment.dueDate.toDate())}>
                  {getStatusText(assignment.dueDate.toDate())}
                </Badge>
              </div>
              <div className="mt-auto pt-4 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(assignment)}>
                  <Edit className="h-4 w-4 mr-1" />
                  {t('teacher.materials.edit')}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t('common.delete')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('teacher.assignments.deleteTitle') || 'Delete this assignment?'}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('teacher.assignments.deleteDesc') || 'This action cannot be undone. This will permanently remove the assignment'}
                        "{assignment.title}" {t('teacher.assignments.deleteDesc2') || 'and all associated submissions.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(assignment.id)}>{t('common.delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {filteredAssignments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('teacher.grades.noSubmissions')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Assignment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? t('teacher.assignments.editTitle') || 'Edit Assignment' : t('teacher.assignments.createNew') || 'Create New Assignment'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">{t('teacher.grades.assignmentTitle') || 'Title'} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Assignment title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="courseId">Course *</Label>
                <Select value={formData.courseId} onValueChange={(value) => setFormData(prev => ({ ...prev, courseId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('teacher.materials.selectCourse')} />
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
                <Label htmlFor="description">{t('teacher.courses.description')} *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the assignment"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">{t('student.due')} *</Label>
                <DualDateInput
                  value={formData.dueDate ? new Date(formData.dueDate) : new Date()}
                  onChange={(d) => {
                    const year = d.getFullYear();
                    const month = (d.getMonth() + 1).toString().padStart(2, '0');
                    const day = d.getDate().toString().padStart(2, '0');
                    const formattedDate = `${year}-${month}-${day}`;
                    setFormData(prev => ({ ...prev, dueDate: formattedDate }));
                  }}
                  defaultMode="ethiopian"
                />
              </div>
              <div>
                <Label htmlFor="dueTime">{t('teacher.assignments.dueTime') || 'Due Time'}</Label>
                <Input id="dueTime" type="time" value={formData.dueTime} onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxScore">{t('teacher.grades.maxScore')}</Label>
                <Input
                  id="maxScore"
                  type="number"
                  value={formData.maxScore}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxScore: parseInt(e.target.value) }))}
                  min="1"
                  max="1000"
                />
              </div>
              <div>
                <Label htmlFor="file">{t('teacher.assignments.attachment') || 'Attachment (optional)'}</Label>
                <div className="flex items-center gap-2">
                  <Input id="file" type="file" onChange={(e) => setFileObj(e.target.files?.[0] || null)} className="flex-1" />
                  {fileObj && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{fileObj.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => setFileObj(null)}>X</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
                <Label htmlFor="instructions">{t('teacher.assignments.instructions') || 'Instructions'}</Label>
              <Textarea
                id="instructions"

                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Detailed instructions for students"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="linkTitle">{t('teacher.assignments.resourceTitle') || 'Resource Title (optional)'}</Label>
                <Input id="linkTitle" value={formData.linkTitle} onChange={(e) => setFormData(prev => ({ ...prev, linkTitle: e.target.value }))} placeholder="Syllabus link" />
              </div>
              <div>
                <Label htmlFor="linkUrl">{t('teacher.assignments.resourceUrl') || 'Resource URL (optional)'}</Label>
                <Input id="linkUrl" value={formData.linkUrl} onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))} placeholder="https://example.com/resource" />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <LoadingButton type="submit" className="flex-1" loading={saving || isUploading} loadingText={isUploading ? 'Uploading…' : 'Saving…'}>
                {editingAssignment ? (t('teacher.assignments.update') || 'Update Assignment') : (t('teacher.assignments.create') || 'Create Assignment')}
              </LoadingButton>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}