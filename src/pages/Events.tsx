import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Zap
} from 'lucide-react';
import { eventService } from '@/lib/firestore';
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

interface Event {
  id: string;
  title: string;
  description: string;
  date: any; // Timestamp from Firestore
  time: string;
  location: string;
  type: string;
  maxAttendees: number;
  currentAttendees: number;
  status: string;
}

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<Partial<Event>>({ title: '', description: '', date: new Date() as any, time: '', location: '', type: 'meeting', maxAttendees: 50, currentAttendees: 0, status: 'upcoming' } as any);
  const [editForm, setEditForm] = useState<Partial<Event>>({} as any);

  // Calculate stats
  const totalEvents = events.length;
  const upcomingEvents = events.filter(e => {
    const eventDate = e.date instanceof Date ? e.date : e.date.toDate();
    return eventDate > new Date();
  }).length;
  const pastEvents = events.filter(e => {
    const eventDate = e.date instanceof Date ? e.date : e.date.toDate();
    return eventDate <= new Date();
  }).length;

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = events;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status && event.status === statusFilter);
    }

    setFilteredEvents(filtered);
  }, [searchTerm, statusFilter, events]);

  const fetchEvents = async () => {
    try {
      const fetchedEvents = await eventService.getEvents();
      setEvents(fetchedEvents);
      setFilteredEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
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
    try {
      await eventService.updateEvent(selectedEvent.id, {
        title: editForm.title,
        description: editForm.description,
        time: editForm.time,
        location: editForm.location,
        type: editForm.type,
        maxAttendees: editForm.maxAttendees,
        status: editForm.status,
      } as any);
      setIsEditOpen(false);
      fetchEvents();
    } catch (e) {
      console.error(e);
    }
  };

  const submitCreate = async () => {
    try {
      await eventService.createEvent({
        title: String(createForm.title || ''),
        description: String(createForm.description || ''),
        date: (createForm.date as any) as any,
        createdBy: 'system',
        type: String(createForm.type || 'meeting'),
      } as any);
      setIsCreateOpen(false);
      fetchEvents();
    } catch (e) {
      console.error(e);
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

  // Mini Calendar Component
  const MiniCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get events for current month
    const monthEvents = events.filter(event => {
      const eventDate = event.date instanceof Date ? event.date : event.date.toDate();
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });

    const renderCalendarDays = () => {
      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const hasEvent = monthEvents.some(event => {
          const eventDate = event.date instanceof Date ? event.date : event.date.toDate();
          return eventDate.getDate() === day;
        });
        
        const isToday = day === today.getDate();
        
        days.push(
          <div
            key={day}
            className={`h-8 w-8 flex items-center justify-center text-sm rounded-full transition-colors ${
              isToday 
                ? 'bg-blue-600 text-white font-semibold' 
                : hasEvent 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {day}
          </div>
        );
      }
      
      return days;
    };

    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-purple-600" />
            {monthNames[currentMonth]} {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-3">
            {weekDays.map(day => (
              <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>
          <div className="mt-4 space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-100 rounded-full"></div>
              <span>Has Event</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Hero Section (condensed) */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Events Management</h1>
              <p className="text-sm sm:text-base text-purple-100 max-w-2xl mt-2">
                Manage system events, schedules, and activities.
              </p>
            </div>
            <div className="flex gap-3 mt-4 lg:mt-0">
              <Link to="/calendar">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600 transition-all duration-300">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  View Calendar
                </Button>
              </Link>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-white text-purple-600 hover:bg-purple-50 transition-all duration-300">
                <Plus className="h-5 w-5 mr-2" />
                Create Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{totalEvents}</div>
              <div className="text-blue-100 text-sm">All events</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{upcomingEvents}</div>
              <div className="text-green-100 text-sm">Scheduled events</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-100 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Past Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{pastEvents}</div>
              <div className="text-gray-100 text-sm">Completed events</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Mini Calendar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <MiniCalendar />
            </div>
          </div>

          {/* Events List */}
          <div className="lg:col-span-2">
            {/* Search and Filters */}
            <Card className="mb-6 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search events by title, description, or location..."
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
                    <option value="all">All Status</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Events Grid */}
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                            <CalendarIcon className="h-8 w-8 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                              <Badge 
                                variant={getTypeBadgeVariant(event.type)}
                                className="text-xs"
                              >
                                {event.type}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {event.date instanceof Date ? event.date.toLocaleDateString() : event.date.toDate().toLocaleDateString()}
                              </span>
                              {event.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {event.time}
                                </span>
                              )}
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {event.currentAttendees}/{event.maxAttendees} attendees
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
                        <Badge 
                          variant={getStatusBadgeVariant(event.status)}
                          className="text-sm px-3 py-1"
                        >
                          {event.status}
                        </Badge>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-gray-50"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            View
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
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 cursor-pointer"
                                onClick={() => setConfirmDeleteId(event.id)}
                              >
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <Card className="text-center py-12 shadow-lg">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first event'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
      {/* Create Event Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-purple-600" />
              Create Event
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input value={String(createForm.title || '')} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value } as any)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input type="date" value={(() => { const d = createForm.date instanceof Date ? createForm.date : new Date(); return d.toISOString().slice(0,10); })()} onChange={(e) => setCreateForm({ ...createForm, date: new Date(e.target.value) } as any)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <Input value={String(createForm.time || '')} onChange={(e) => setCreateForm({ ...createForm, time: e.target.value } as any)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Input value={String(createForm.type || '')} onChange={(e) => setCreateForm({ ...createForm, type: e.target.value } as any)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Input value={String(createForm.location || '')} onChange={(e) => setCreateForm({ ...createForm, location: e.target.value } as any)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea value={String(createForm.description || '')} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value } as any)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitCreate} className="bg-purple-600 hover:bg-purple-700">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Event Modal */}
      <Dialog open={!!selectedEvent && !isEditOpen} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-purple-600" />
              Event Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-2 text-sm text-gray-700">
              <div><span className="font-medium">Title:</span> {selectedEvent.title}</div>
              <div><span className="font-medium">Date:</span> {selectedEvent.date instanceof Date ? selectedEvent.date.toLocaleDateString() : selectedEvent.date.toDate().toLocaleDateString()}</div>
              {selectedEvent.time && (<div><span className="font-medium">Time:</span> {selectedEvent.time}</div>)}
              {selectedEvent.location && (<div><span className="font-medium">Location:</span> {selectedEvent.location}</div>)}
              <div><span className="font-medium">Type:</span> {selectedEvent.type}</div>
              <div><span className="font-medium">Status:</span> {selectedEvent.status}</div>
              <div><span className="font-medium">Description:</span> {selectedEvent.description}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-purple-600" />
              Edit Event
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input value={String(editForm.title || '')} onChange={(e) => setEditForm({ ...editForm, title: e.target.value } as any)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <Input value={String(editForm.time || '')} onChange={(e) => setEditForm({ ...editForm, time: e.target.value } as any)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Input value={String(editForm.type || '')} onChange={(e) => setEditForm({ ...editForm, type: e.target.value } as any)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Input value={String(editForm.location || '')} onChange={(e) => setEditForm({ ...editForm, location: e.target.value } as any)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Input value={String(editForm.status || '')} onChange={(e) => setEditForm({ ...editForm, status: e.target.value } as any)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea value={String(editForm.description || '')} onChange={(e) => setEditForm({ ...editForm, description: e.target.value } as any)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveEdit} className="bg-purple-600 hover:bg-purple-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!confirmDeleteId}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDeleteId && handleDeleteEvent(confirmDeleteId)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventsPage;

// Modals
// Create Event Modal
// Placed after default export intentionally for clarity; in real code we would keep before.
