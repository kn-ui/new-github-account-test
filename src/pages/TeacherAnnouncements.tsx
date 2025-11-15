/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { truncateTitle, truncateText } from '@/lib/utils';
import { announcementService, courseService, userService, FirestoreAnnouncement } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import LoadingButton from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardHero from '@/components/DashboardHero';

import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  MessageSquare,
  Users,
  Eye,
  Clock,
  Filter,
  SortAsc,
  SortDesc
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
  const { t } = useI18n();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<FirestoreAnnouncement[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<FirestoreAnnouncement | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [courseStudents, setCourseStudents] = useState<{ id: string; name: string }[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [recipientNames, setRecipientNames] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    courseId: '',
    isGeneral: false,
    priority: 'normal',
    recipientStudentId: '',
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
      const [teacherCourses, teacherAnnouncements] = await Promise.all([
        courseService.getAllCoursesByInstructor(currentUser!.uid),
        announcementService.getAnnouncementsByTeacher(currentUser!.uid)
      ]);
      
      // If no courses, add mock data with real IDs
      if (teacherCourses.length === 0) {
        const mockCourses = [
          {
            id: '848emeF22B0qN1TnYZMg',
            title: 'React Development Fundamentals',
            description: 'Learn React from the ground up with hands-on projects and real-world examples.',
            instructor: '7E4dj9z3tzgKtRwURyfR11dz0YG3',
            category: 'Web Development',
            duration: 40,
            isActive: true,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() }
          },
          {
            id: 'course-001',
            title: 'Database Design and Management',
            description: 'Master database design principles, normalization, and SQL queries.',
            instructor: 'HNSFVjZzngUyJvcrn7N8nrcCHNM2',
            category: 'Database',
            duration: 35,
            isActive: true,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() }
          },
          {
            id: 'course-002',
            title: 'Advanced React Patterns',
            description: 'Deep dive into advanced React patterns including HOCs, Render Props, and Custom Hooks.',
            instructor: 'VVz08cRZMedJsACARMvU4ApCH821',
            category: 'Web Development',
            duration: 30,
            isActive: true,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() }
          }
        ];
        setCourses(mockCourses);
      } else {
        setCourses(teacherCourses);
      }
      
      setAnnouncements(teacherAnnouncements);

      // Resolve recipient student names for direct messages
      const ids = Array.from(new Set((teacherAnnouncements as any[])
        .map(a => (a as any).recipientStudentId)
        .filter(Boolean)));
      if (ids.length) {
        try {
          const usersMap = await (await import('@/lib/firestore')).userService.getUsersByIds(ids as string[]);
          const nameMap: Record<string, string> = {};
          Object.entries(usersMap).forEach(([id, u]: any) => { if (u?.displayName) nameMap[id] = u.displayName; });
          setRecipientNames(nameMap);
        } catch {}
      } else {
        setRecipientNames({});
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };


  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.body) {
      toast.error('Please fill in all required fields');
      return;
    }


    if (!formData.isGeneral && !formData.courseId && !formData.recipientStudentId) {
      toast.error('Select a course or a recipient student, or mark as general');
      return;
    }

    try {
      setSaving(true);
      const isGeneral = formData.isGeneral;
      
      // Build base announcement data
      const base: any = {
        title: formData.title,
        body: formData.body,
        authorId: currentUser!.uid,
      };
      
      if (!editingAnnouncement) {
        base.createdAt = new Date();
      }
      
      if (formData.externalLink) base.externalLink = formData.externalLink;
      
      // Set targeting based on announcement type
      if (isGeneral) {
        // General announcement to all teacher's students
        base.targetAudience = 'ALL_STUDENTS';
        base.courseId = null;
        base.recipientStudentId = null;
      } else if (formData.recipientStudentId) {
        // Direct message to specific student
        base.targetAudience = 'SPECIFIC_STUDENT';
        base.recipientStudentId = formData.recipientStudentId;
        base.courseId = null;
      } else if (formData.courseId) {
        // Course-specific announcement
        base.targetAudience = 'COURSE_STUDENTS';
        base.courseId = formData.courseId;
        base.recipientStudentId = null;
      }

      if (editingAnnouncement) {
        await announcementService.updateAnnouncement(editingAnnouncement.id, base);
        toast.success('Announcement updated successfully');
      } else {
        await announcementService.createAnnouncement(base);
        toast.success('Announcement created successfully');
      }

      setShowCreateDialog(false);
      setEditingAnnouncement(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };


  const handleEdit = (announcement: FirestoreAnnouncement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      body: announcement.body,
      courseId: announcement.courseId || '',
      isGeneral: !announcement.courseId && !('recipientStudentId' in (announcement as any) && (announcement as any).recipientStudentId),
      priority: 'normal',
      recipientStudentId: (announcement as any).recipientStudentId || '',
      externalLink: (announcement as any).externalLink || ''
    });
    setShowCreateDialog(true);
  };

  useEffect(() => {
    const loadStudents = async () => {
      try {
        if (!formData.courseId) { setCourseStudents([]); return; }
        const enrollments = await (await import('@/lib/firestore')).enrollmentService.getEnrollmentsByCourse(formData.courseId);
        const ids = Array.from(new Set(enrollments.map((e: any) => e.studentId)));
        const list: { id: string; name: string }[] = [];
        await Promise.all(ids.map(async (id) => {
          try { const u = await (await import('@/lib/firestore')).userService.getUserById(id); list.push({ id, name: (u as any)?.displayName || id }); } catch {}
        }));
        list.sort((a,b) => a.name.localeCompare(b.name));
        setCourseStudents(list);
      } catch (e) {
        setCourseStudents([]);
      }
    };
    loadStudents();
  }, [formData.courseId]);

  const handleDelete = async (announcementId: string) => {
    try {
      setDeletingId(announcementId);
      await announcementService.deleteAnnouncement(announcementId);
      toast.success('Announcement deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    } finally {
      setDeletingId(null);
    }
  };


  const resetForm = () => {
    setFormData({
      title: '',
      body: '',
      courseId: '',
      isGeneral: false,
      priority: 'normal',
      recipientStudentId: '',
      externalLink: ''
    });
  };

  const openCreateDialog = () => {
    setEditingAnnouncement(null);
    resetForm();
    setShowCreateDialog(true);
  };

  const filteredAndSortedAnnouncements = announcements
    .filter(announcement => {
      const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           announcement.body.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCourse = courseFilter === 'all' || 
                            (courseFilter === 'general' && !announcement.courseId) ||
                            announcement.courseId === courseFilter;
      return matchesSearch && matchesCourse;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
        case 'oldest':
          return a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'course':
          const aCourse = getCourseName(a.courseId);
          const bCourse = getCourseName(b.courseId);
          return aCourse.localeCompare(bCourse);
        default:
          return 0;
      }
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
          <div className="text-red-600 text-xl mb-4">{t('common.accessDenied')}</div>
          <div className="text-gray-600">{t('common.teacherOnly')}</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('teacher.announcements.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title={t('teacher.announcements.title')}
        subtitle={t('teacher.announcements.subtitle')}
      >
        <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          {t('teacher.announcements.createAnnouncement')}
        </Button>
      </DashboardHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">{t('teacher.announcements.searchPlaceholder')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('teacher.announcements.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="course-filter">{t('teacher.announcements.filterByCourse')}</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('teacher.announcements.allCourses')}</SelectItem>
                  <SelectItem value="general">General Announcements</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort">{t('teacher.announcements.sortBy')}</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">{t('teacher.announcements.newest')}</SelectItem>
                  <SelectItem value="oldest">{t('teacher.announcements.oldest')}</SelectItem>
                  <SelectItem value="title-asc">{t('teacher.courses.titleAsc')}</SelectItem>
                  <SelectItem value="title-desc">{t('teacher.courses.titleDesc')}</SelectItem>
                  <SelectItem value="course">{t('teacher.announcements.course')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">{filteredAndSortedAnnouncements.length} {t('teacher.announcements.countSuffix')}</div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">{t('common.view')}:</span>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>List</Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>Grid</Button>
            </div>
          </div>
        </div>

        {/* Announcements List */}
        {viewMode === 'list' ? (
          <div className="grid gap-4">
            {filteredAndSortedAnnouncements.map(announcement => (
              <div key={announcement.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{truncateTitle(announcement.title)}</h3>
                        {announcement.targetAudience === 'SPECIFIC_STUDENT' ? (
                          <Badge variant="outline" className="flex-shrink-0">
                            {t('teacher.announcements.messageTo')} {recipientNames[announcement.recipientStudentId!] || announcement.recipientStudentId}
                          </Badge>
                        ) : announcement.targetAudience === 'COURSE_STUDENTS' ? (
                          <Badge variant="default" className="flex-shrink-0">
                            Course Students
                          </Badge>
                        ) : announcement.targetAudience === 'ALL_STUDENTS' ? (
                          <Badge variant="secondary" className="flex-shrink-0">
                            All My Students
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex-shrink-0">
                            General
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 break-words overflow-hidden" title={announcement.body}>{truncateText(announcement.body)}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {announcement.createdAt.toDate().toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {announcement.targetAudience === 'ALL_STUDENTS' ? 'All My Students' : truncateText(getCourseName(announcement.courseId))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
                      <Edit className="h-4 w-4 mr-1" />
                      {t('teacher.announcements.edit')}
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
                          <AlertDialogTitle>{t('teacher.announcements.deleteConfirmTitle') || 'Delete this announcement?'}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('teacher.announcements.deleteConfirm') || 'This action cannot be undone. This will permanently remove the announcement'}
                            "{announcement.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <LoadingButton
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleDelete(announcement.id)}
                            loading={deletingId === announcement.id}
                            loadingText="Deleting..."
                          >
                            {t('common.delete')}
                          </LoadingButton>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedAnnouncements.map(announcement => (
              <div key={announcement.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <h3 className="font-medium text-gray-900">{truncateTitle(announcement.title)}</h3>
                  </div>
                  {announcement.targetAudience === 'SPECIFIC_STUDENT' ? (
                    <Badge variant="outline" className="flex-shrink-0">
                      {t('teacher.announcements.messageTo') || 'Message to'} {recipientNames[announcement.recipientStudentId!] || announcement.recipientStudentId}
                    </Badge>
                  ) : announcement.targetAudience === 'COURSE_STUDENTS' ? (
                    <Badge variant="default" className="flex-shrink-0">
                      Course Students
                    </Badge>
                  ) : announcement.targetAudience === 'ALL_STUDENTS' ? (
                    <Badge variant="secondary" className="flex-shrink-0">
                      All My Students
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex-shrink-0">
                      General
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3 break-words overflow-hidden" title={announcement.body}>{truncateText(announcement.body)}</p>
                <div className="text-xs text-gray-500 mb-3 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {announcement.createdAt.toDate().toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {announcement.targetAudience === 'ALL_STUDENTS' ? 'All My Students' : getCourseName(announcement.courseId)}</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
                    <Edit className="h-4 w-4 mr-1" /> {t('teacher.announcements.edit')}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('teacher.announcements.deleteConfirmTitle') || 'Delete this announcement?'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('teacher.announcements.deleteConfirm') || 'This action cannot be undone. This will permanently remove the announcement'}
                            "{announcement.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <LoadingButton className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(announcement.id)} loading={deletingId === announcement.id} loadingText="Deleting...">{t('common.delete')}</LoadingButton>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
        {filteredAndSortedAnnouncements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No announcements found</p>
          </div>
        )}
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
              <Label htmlFor="isGeneral">General announcement to all your students (not tied to a specific course)</Label>
            </div>
            
            {!formData.isGeneral && !formData.recipientStudentId && (
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

            {/* Announce to specific student */}
            {!formData.isGeneral && (
              <div>
                <Label htmlFor="recipientStudentId">Specific Student (optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Search student" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                  <Select value={formData.recipientStudentId} onValueChange={(v) => setFormData(prev => ({ ...prev, recipientStudentId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseStudents
                        .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                        .map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave empty to announce to all students in the course.</p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <Label htmlFor="ext">Attach Link (optional)</Label>
                    <Input id="ext" placeholder="https://..." value={formData.externalLink} onChange={(e) => setFormData(prev => ({ ...prev, externalLink: e.target.value }))} />
                  </div>
                  <div className="text-xs text-gray-500 flex items-end">If provided, the student sees the link with the message.</div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <LoadingButton type="submit" className="flex-1" loading={saving} loadingText={editingAnnouncement ? 'Updating…' : 'Creating…'}>
              {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
            </LoadingButton>
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