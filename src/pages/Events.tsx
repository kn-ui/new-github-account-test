/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-irregular-whitespace */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingButton from '@/components/ui/loading-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import DualDateInput from '@/components/ui/DualDateInput';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Search, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Target,
  Activity,
  Zap,
  Download
} from 'lucide-react';
import { eventService, Timestamp } from '@/lib/firestore';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import { toEthiopianDate, formatEthiopianDate } from '@/lib/ethiopianCalendar';
import { uploadToHygraph, deleteHygraphAsset } from '@/lib/hygraphUpload';
import EthiopianHolidays from '@/components/EthiopianHolidays';
import RichTextEditor from '@/components/ui/RichTextEditor';
import RichTextRenderer from '@/components/ui/RichTextRenderer';

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date | Timestamp;
  time: string;
  location: string;
  type: string;
  status: string;
  imageUrl?: string;
  fileUrl?: string;
}

const EventsPage = () => {
  const { t } = useI18n();
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<Partial<Event>>({ title: '', description: '', date: new Date(), time: '09:00', location: '', type: '', status: 'upcoming', imageUrl: '', fileUrl: '' });
  const [editForm, setEditForm] = useState<Partial<Event>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalEvents = events.length;
  const upcomingEvents = events.filter(e => {
    const eventDate = e.date instanceof Date ? e.date : (e.date as Timestamp)?.toDate();
    return eventDate && eventDate > new Date();
  }).length;
  const pastEvents = events.filter(e => {
    const eventDate = e.date instanceof Date ? e.date : (e.date as Timestamp)?.toDate();
    return eventDate && eventDate <= new Date();
  }).length;

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = events;
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status && event.status === statusFilter);
    }
    setFilteredEvents(filtered);
  }, [searchTerm, statusFilter, events]);

  const getEventStatus = (eventDate: Date | Timestamp) => {
    const now = new Date();
    const date = eventDate instanceof Date ? eventDate : (eventDate as Timestamp)?.toDate();
    
    if (!date) return 'upcoming';
    
    // Clear time portion for date comparison
    const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (eventDay > today) {
      return 'upcoming';
    } else if (eventDay.getTime() === today.getTime()) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  };

  const fetchEvents = async () => {
    try {
      const fetchedEvents = await eventService.getAllEvents();
      // Update status based on current date
      const eventsWithUpdatedStatus = fetchedEvents.map(event => ({
        ...event,
        status: getEventStatus(event.date)
      }));
      setEvents(eventsWithUpdatedStatus);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Events state updated
  }, [events]);

  useEffect(() => {
    // Search term or status filter changed
  }, [searchTerm, statusFilter]);

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const eventToDelete = events.find(e => e.id === eventId);
      if (eventToDelete) {
        if (eventToDelete.imageUrl) {
          await deleteHygraphAsset(eventToDelete.imageUrl);
        }
        if (eventToDelete.fileUrl) {
          await deleteHygraphAsset(eventToDelete.fileUrl);
        }
      }

      await eventService.deleteEvent(eventId);
      setConfirmDeleteId(null);
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const openEdit = (ev: Event) => {
    setSelectedEvent(ev);
    setEditForm({ ...ev });
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedEvent) return;
    setIsSubmitting(true);
    try {
      if (!editForm.title || editForm.title.trim().length === 0) {
        toast.error('Title is required');
        return;
      }

      let imageUrl = editForm.imageUrl || '';
      let fileUrl = editForm.fileUrl || '';

      if (imageFile) {
        if (editForm.imageUrl) {
          await deleteHygraphAsset(editForm.imageUrl);
        }
        const imageAsset = await uploadToHygraph(imageFile);
        if (imageAsset.success) {
          imageUrl = imageAsset.url;
        }
      }

      if (file) {
        if (editForm.fileUrl) {
          await deleteHygraphAsset(editForm.fileUrl);
        }
        const fileAsset = await uploadToHygraph(file);
        if (fileAsset.success) {
          fileUrl = fileAsset.url;
        }
      }

      const date = editForm.date || new Date();
      const timestampDate = date instanceof Date ? Timestamp.fromDate(date) : date;

      const description = editForm.description || '';

      await eventService.updateEvent(selectedEvent.id, {
        title: editForm.title,
        description,
        date: timestampDate,
        time: editForm.time,
        location: editForm.location,
        type: editForm.type,
        imageUrl,
        fileUrl,
      });

      setIsEditOpen(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
      setImageFile(null);
      setFile(null);
    }
  };

  const submitCreate = async () => {
    setIsSubmitting(true);
    try {
      if (!createForm.title || createForm.title.trim().length === 0) {
        toast.error('Title is required');
        return;
      }

      let imageUrl = '';
      let fileUrl = '';

      if (imageFile) {
        const imageAsset = await uploadToHygraph(imageFile);
        if (imageAsset.success) {
          imageUrl = imageAsset.url;
        }
      }

      if (file) {
        const fileAsset = await uploadToHygraph(file);
        if (fileAsset.success) {
          fileUrl = fileAsset.url;
        }
      }

      const date = createForm.date || new Date();
      const timestampDate = date instanceof Date ? Timestamp.fromDate(date) : date;

      const description = createForm.description || '';

      await eventService.createEvent({
        title: createForm.title || '',
        description,
        date: timestampDate,
        time: createForm.time || '',
        location: createForm.location || '',
        type: createForm.type || 'meeting',
        imageUrl,
        fileUrl,
        createdBy: 'system',
        status: getEventStatus(date),
      });

      setCreateForm({ title: '', description: '', date: new Date(), time: '09:00', location: '', type: '', status: 'upcoming', imageUrl: '', fileUrl: '' });
      setIsCreateOpen(false);
      fetchEvents();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
      setImageFile(null);
      setFile(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'default';
      case 'ongoing':
        return 'secondary';
      case 'completed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'workshop':
        return 'default';
      case 'seminar':
        return 'secondary';
      case 'meeting':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const MiniCalendar = () => {
    const today = new Date();
    const ethiopianToday = toEthiopianDate(today);
    const formattedEthiopianMonthYear = formatEthiopianDate(ethiopianToday).split(',')[0];
    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-purple-600" />
            {formattedEthiopianMonthYear}, {ethiopianToday.year} EC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-4xl font-bold text-blue-600 py-4">
            {ethiopianToday.day}
          </div>
          <p className="text-center text-sm text-gray-500">Today's Ethiopian Date</p>
          <div className="mt-4 space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-100 rounded-full"></div>
              <span>Has Event (Gregorian)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Access control - only admins and super_admins can access
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <DashboardHero 
        title={t('events.title')}
        subtitle={t('events.subtitle')}
      >
        <div className="flex gap-3 mt-4 lg:mt-0">
          <Link to="/calendar">
            <Button  className="bg-white text-purple-600 hover:bg-purple-50 transition-all duration-300">
              <CalendarIcon className="h-5 w-5 mr-2" />
              {t('events.viewCalendar')}
            </Button>
          </Link>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-white text-purple-600 hover:bg-purple-50 transition-all duration-300">
            <Plus className="h-5 w-5 mr-2" />
            {t('events.createEvent')}
          </Button>
        </div>
      </DashboardHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('events.totalEvents')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{totalEvents}</div>
              <div className="text-gray-600 text-sm">{t('events.allEventsLabel')}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t('events.upcomingEvents')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{upcomingEvents}</div>
              <div className="text-gray-600 text-sm">{t('events.scheduledLabel')}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {t('events.pastEvents')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{pastEvents}</div>
              <div className="text-gray-600 text-sm">{t('events.completedLabel')}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <MiniCalendar />
              <EthiopianHolidays />
            </div>
          </div>
          <div className="lg:col-span-2">
            <Card className="mb-6 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t('events.searchPlaceholder') as any}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="all">{t('events.allStatus')}</option>
                    <option value="upcoming">{t('events.status.upcoming')}</option>
                    <option value="ongoing">{t('events.status.ongoing')}</option>
                    <option value="completed">{t('events.status.completed')}</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {filteredEvents.map((event) => (

                <Card key={event.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border-l-4 border-purple-500">
                  <div className="flex flex-col md:flex-row">
                    {event.imageUrl && (
                      <div className="md:w-1/3 h-48 md:h-auto overflow-hidden">
                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <div className={`p-6 flex flex-col justify-between ${event.imageUrl ? 'md:w-2/3' : 'w-full'}`}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant={getTypeBadgeVariant(event.type)}
                            className="text-xs"
                          >
                            {event.type}
                          </Badge>
                          <Badge 
                            variant={getStatusBadgeVariant(event.status)}
                            className="text-xs"
                          >
                            {event.status}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-300">{event.title}</h3>
                                                <RichTextRenderer content={event.description} truncate={true} />
                      </div>
                      <div className="space-y-3 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-purple-500" />
                          <span>
                            {(() => {
                              try {
                                const date = event.date instanceof Date ? event.date : (event.date as Timestamp)?.toDate();
                                if (!date || isNaN(date.getTime())) return 'Invalid Date';
                                const ethiopianDate = toEthiopianDate(date);
                                return formatEthiopianDate(ethiopianDate);
                              } catch (error) {
                                console.error('Error converting date:', error);
                                return 'Date Conversion Error';
                              }
                            })()}
                          </span>
                          {event.time && (
                            <>
                              <span className="text-gray-300">|</span>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-purple-500" />
                                {event.time}
                              </div>
                            </>
                          )}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-purple-500" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}

                        {event.fileUrl && (
                          <div className="mt-4">
                            <a 
                              href={event.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Download File
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-2 mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-purple-600 hover:bg-purple-50"
                          onClick={() => setSelectedEvent(event)}
                        >
                          {t('common.viewDetails')}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(event)}>
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              {t('events.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 cursor-pointer"
                              onClick={() => setConfirmDeleteId(event.id)}
                            >
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              {t('events.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {filteredEvents.length === 0 && (
              <Card className="text-center py-12 shadow-lg">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('events.noEvents')}</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? t('searchResults.noResultsTipFiltered')
                    : t('searchResults.noResultsTipCreate')
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('events.createEvent')}
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-purple-600" />
              {t('events.createEventTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            <div>
              <label className="block text-sm font-medium mb-1">{t('events.title_label')}</label>
              <Input 
                value={String(createForm.title || '')} 
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value.slice(0, 100) } as any)}
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{(createForm.title || '').length}/100 characters</p>
            </div>
            <div>
              <DualDateInput
                label={t('events.date_label') as any}
                value={createForm.date instanceof Date ? createForm.date : new Date()}
                onChange={(d) => setCreateForm({ ...createForm, date: d })}
                defaultMode="ethiopian"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('events.time_label')}</label>
                <Input 
                  type="time" 
                  value={String(createForm.time || '09:00')} 
                  onChange={(e) => setCreateForm({ ...createForm, time: e.target.value } as any)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('events.type_label')} (max 50 characters)</label>
                <Input 
                  value={String(createForm.type || '')} 
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value.slice(0, 50) } as any)}
                  placeholder="meeting"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">{(createForm.type || '').length}/50 characters</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('events.location_label')} (max 150 characters)</label>
              <Input 
                value={String(createForm.location || '')} 
                onChange={(e) => setCreateForm({ ...createForm, location: e.target.value.slice(0, 150) } as any)}
                placeholder="e.g., Main Hall, Room 101"
                maxLength={150}
              />
              <p className="text-xs text-gray-500 mt-1">{(createForm.location || '').length}/150 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('events.description_label')}</label>
              <RichTextEditor
                content={createForm.description || ''}
                onChange={(content) => setCreateForm({ ...createForm, description: content })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('events.image_label')}</label>
                <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} />
                {imageFile && <img src={URL.createObjectURL(imageFile)} alt="Preview" className="mt-2 h-10 w-10 object-cover" />}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('events.file_label')}</label>
                <Input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
              </div>
            </div>

          </div>
          <DialogFooter>
            <LoadingButton onClick={submitCreate} className="bg-purple-600 hover:bg-purple-700" loading={isSubmitting} loadingText="Creating…">
              {t('events.create')}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEvent && !isEditOpen} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl p-0">
          {selectedEvent && (
            <div>
              {selectedEvent.imageUrl && (
                <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${selectedEvent.imageUrl})` }}></div>
              )}
              <div className="p-6">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-2xl font-bold text-gray-900">{selectedEvent.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-gray-600">
                                    <RichTextRenderer content={selectedEvent.description} truncate={false} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-semibold text-gray-800">Date</p>
                        <p>{formatEthiopianDate(toEthiopianDate(selectedEvent.date instanceof Date ? selectedEvent.date : (selectedEvent.date as Timestamp).toDate()))}</p>
                      </div>
                    </div>
                    {selectedEvent.time && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-semibold text-gray-800">Time</p>
                          <p>{selectedEvent.time}</p>
                        </div>
                      </div>
                    )}
                    {selectedEvent.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-semibold text-gray-800">Location</p>
                          <p>{selectedEvent.location}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Badge variant={getTypeBadgeVariant(selectedEvent.type)}>{selectedEvent.type}</Badge>
                      <Badge variant={getStatusBadgeVariant(selectedEvent.status)}>{selectedEvent.status}</Badge>
                    </div>
                  </div>
                  {selectedEvent.fileUrl && (
                    <div className="pt-4 border-t border-gray-200">
                      <a href={selectedEvent.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-purple-600 hover:underline font-semibold">
                        <Zap className="h-4 w-4" />
                        Download Attached File
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-purple-600" />
              {t('events.edit')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium mb-1">{t('events.title_label')}</label>
              <Input 
                value={String(editForm.title || '')} 
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value.slice(0, 100) } as any)}
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{(editForm.title || '').length}/100 characters</p>
            </div>
            <div>
              <DualDateInput
                label={t('events.date_label') as any}
                value={editForm.date instanceof Date ? editForm.date : (editForm.date as Timestamp)?.toDate() || new Date()}
                onChange={(d) => setEditForm({ ...editForm, date: d })}
                defaultMode="ethiopian"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('events.time_label')}</label>
                <Input value={String(editForm.time || '')} onChange={(e) => setEditForm({ ...editForm, time: e.target.value } as any)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('events.type_label')} (max 50 characters)</label>
                <Input 
                  value={String(editForm.type || '')} 
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value.slice(0, 50) } as any)}
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">{(editForm.type || '').length}/50 characters</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('events.location_label')} (max 150 characters)</label>
              <Input 
                value={String(editForm.location || '')} 
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value.slice(0, 150) } as any)}
                maxLength={150}
              />
              <p className="text-xs text-gray-500 mt-1">{(editForm.location || '').length}/150 characters</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t('events.description_label')}</label>
              <RichTextEditor
                content={editForm.description || ''}
                onChange={(content) => setEditForm({ ...editForm, description: content })}
              />
            </div>



            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('events.image_label')}</label>
                <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} />
                {imageFile ? (
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="mt-2 h-10 w-10 object-cover" />
                ) : (
                  editForm.imageUrl && <img src={editForm.imageUrl} alt="Current" className="mt-2 h-10 w-10 object-cover" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('events.file_label')}</label>
                <Input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                {editForm.fileUrl && <a href={editForm.fileUrl} target="_blank" rel="noreferrer">View Current File</a>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <LoadingButton onClick={saveEdit} className="bg-purple-600 hover:bg-purple-700" loading={isSubmitting} loadingText="Saving…">
              {t('common.saveChanges')}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDeleteId}>
        <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>{t('events.createEventTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('events.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteId(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDeleteId && handleDeleteEvent(confirmDeleteId)} className="bg-red-600 hover:bg-red-700">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventsPage;