/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { truncateTitle, truncateText } from '@/lib/utils';
import { announcementService, userService, FirestoreAnnouncement } from '@/lib/firestore';
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
  SortDesc,
  Globe,
  GraduationCap,
  BookOpen
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

export default function AdminAnnouncements() {
  const { t } = useI18n();
  const { currentUser, userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<FirestoreAnnouncement[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<FirestoreAnnouncement | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [userSearch, setUserSearch] = useState('');
  const [recipientNames, setRecipientNames] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    targetAudience: 'GENERAL_ALL', // GENERAL_ALL, ALL_STUDENTS, ALL_TEACHERS, SPECIFIC_USER
    recipientUserId: '',
    priority: 'normal',
    externalLink: ''
  });

  useEffect(() => {
    if (currentUser?.uid && (userProfile?.role === 'admin' || userProfile?.role === 'super_admin')) {
      loadData();
    }
  }, [currentUser?.uid, userProfile?.role]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [adminAnnouncements, users] = await Promise.all([
        announcementService.getAdminAnnouncements(),
        userService.getUsers()
      ]);
      
      setAnnouncements(adminAnnouncements);
      setAllUsers(users);

      // Resolve recipient user names for direct messages
      const ids = Array.from(new Set((adminAnnouncements as any[])
        .map(a => (a as any).recipientUserId)
        .filter(Boolean)));
      if (ids.length) {
        try {
          const usersMap = await userService.getUsersByIds(ids as string[]);
          const nameMap: Record<string, string> = {};
          Object.entries(usersMap).forEach(([id, u]: any) => { 
            if (u?.displayName) nameMap[id] = u.displayName; 
          });
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

    if (formData.targetAudience === 'SPECIFIC_USER' && !formData.recipientUserId) {
      toast.error('Please select a recipient user');
      return;
    }

    try {
      setSaving(true);
      // Build base announcement data
      const base: any = {
        title: formData.title,
        body: formData.body,
        authorId: currentUser!.uid,
        authorRole: userProfile?.role,
        isAdminAnnouncement: true,
      };
      
      if (!editingAnnouncement) {
        base.createdAt = new Date();
      }
      
      if (formData.externalLink) base.externalLink = formData.externalLink;
      
      // Set targeting based on announcement type
      base.targetAudience = formData.targetAudience;
      
      if (formData.targetAudience === 'SPECIFIC_USER') {
        base.recipientUserId = formData.recipientUserId;
      } else {
        base.recipientUserId = null;
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
      targetAudience: (announcement as any).targetAudience || 'GENERAL_ALL',
      recipientUserId: (announcement as any).recipientUserId || '',
      priority: 'normal',
      externalLink: (announcement as any).externalLink || ''
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
      targetAudience: 'GENERAL_ALL',
      recipientUserId: '',
      priority: 'normal',
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
      const matchesAudience = audienceFilter === 'all' || 
                             (announcement as any).targetAudience === audienceFilter;
      return matchesSearch && matchesAudience;
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
        default:
          return 0;
      }
    });

  const getAudienceLabel = (targetAudience: string) => {
    switch (targetAudience) {
      case 'GENERAL_ALL':
        return 'All Users';
      case 'ALL_STUDENTS':
        return 'All Students';
      case 'ALL_TEACHERS':
        return 'All Teachers';
      case 'SPECIFIC_USER':
        return 'Specific User';
      default:
        return 'General';
    }
  };

  const getAudienceIcon = (targetAudience: string) => {
    switch (targetAudience) {
      case 'GENERAL_ALL':
        return <Globe className="h-4 w-4" />;
      case 'ALL_STUDENTS':
        return <GraduationCap className="h-4 w-4" />;
      case 'ALL_TEACHERS':
        return <BookOpen className="h-4 w-4" />;
      case 'SPECIFIC_USER':
        return <Users className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only administrators can access this page.</div>
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
      <DashboardHero 
        title="Admin Announcements"
        subtitle="Manage system-wide announcements and communications"
      >
        <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </DashboardHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search announcements</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="audience-filter">Filter by Audience</Label>
              <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Announcements</SelectItem>
                  <SelectItem value="GENERAL_ALL">All Users</SelectItem>
                  <SelectItem value="ALL_STUDENTS">All Students</SelectItem>
                  <SelectItem value="ALL_TEACHERS">All Teachers</SelectItem>
                  <SelectItem value="SPECIFIC_USER">Specific User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort">Sort by</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title-asc">Title A-Z</SelectItem>
                  <SelectItem value="title-desc">Title Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">{filteredAndSortedAnnouncements.length} announcements</div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">View:</span>
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
                        <Badge variant="outline" className="flex-shrink-0 flex items-center gap-1">
                          {getAudienceIcon((announcement as any).targetAudience)}
                          {getAudienceLabel((announcement as any).targetAudience)}
                        </Badge>
                        {(announcement as any).targetAudience === 'SPECIFIC_USER' && (announcement as any).recipientUserId && (
                          <Badge variant="secondary" className="flex-shrink-0">
                            To: {recipientNames[(announcement as any).recipientUserId] || (announcement as any).recipientUserId}
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
                          {getAudienceLabel((announcement as any).targetAudience)}
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
                  <Badge variant="outline" className="flex-shrink-0 flex items-center gap-1">
                    {getAudienceIcon((announcement as any).targetAudience)}
                    {getAudienceLabel((announcement as any).targetAudience)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3 break-words overflow-hidden" title={announcement.body}>{truncateText(announcement.body)}</p>
                <div className="text-xs text-gray-500 mb-3 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {announcement.createdAt.toDate().toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {getAudienceLabel((announcement as any).targetAudience)}</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
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
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(announcement.id)}>Delete</AlertDialogAction>
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
            <div>
              <Label htmlFor="targetAudience">Target Audience *</Label>
              <Select value={formData.targetAudience} onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value, recipientUserId: '' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL_ALL">All Users (General Announcement)</SelectItem>
                  <SelectItem value="ALL_STUDENTS">All Students Only</SelectItem>
                  <SelectItem value="ALL_TEACHERS">All Teachers Only</SelectItem>
                  <SelectItem value="SPECIFIC_USER">Specific User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Specific User Selection */}
            {formData.targetAudience === 'SPECIFIC_USER' && (
              <div>
                <Label htmlFor="recipientUserId">Select User *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    placeholder="Search user..." 
                    value={userSearch} 
                    onChange={(e) => setUserSearch(e.target.value)} 
                  />
                  <Select value={formData.recipientUserId} onValueChange={(v) => setFormData(prev => ({ ...prev, recipientUserId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers
                        .filter(u => u.displayName.toLowerCase().includes(userSearch.toLowerCase()))
                        .map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.displayName} ({u.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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

            <div>
              <Label htmlFor="externalLink">External Link (optional)</Label>
              <Input 
                id="externalLink" 
                placeholder="https://..." 
                value={formData.externalLink} 
                onChange={(e) => setFormData(prev => ({ ...prev, externalLink: e.target.value }))} 
              />
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