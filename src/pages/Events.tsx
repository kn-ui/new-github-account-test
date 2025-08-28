import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
import DeleteConfirmationDialog from '@/components/ui/DeleteConfirmationDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
  const location = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    eventId: string | null;
    eventTitle: string;
  }>({
    isOpen: false,
    eventId: null,
    eventTitle: '',
  });
  const [createEventDialog, setCreateEventDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: '',
    customType: '',
    maxAttendees: 50,
    status: 'upcoming'
  });
  const [editEventDialog, setEditEventDialog] = useState(false);
  const [editEvent, setEditEvent] = useState({
    id: '' as string,
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: '',
    customType: '',
    maxAttendees: 50,
    status: 'upcoming'
  });

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
    const params = new URLSearchParams(location.search);
    const q = params.get('search') || '';
    if (q) setSearchTerm(q);
  }, [location.search]);

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

  const getTypeBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'workshop':
        return 'default';
      case 'seminar':
        return 'secondary';
      case 'conference':
        return 'destructive';
      case 'meeting':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'upcoming':
        return 'default';
      case 'ongoing':
        return 'secondary';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    setDeleteDialog({
      isOpen: true,
      eventId,
      eventTitle,
    });
  };

  const confirmDelete = async () => {
    if (deleteDialog.eventId) {
      try {
        await eventService.deleteEvent(deleteDialog.eventId);
        setEvents(events.filter(e => e.id !== deleteDialog.eventId));
        setDeleteDialog({ isOpen: false, eventId: null, eventTitle: '' });
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleEditEvent = (event: Event) => {
    const eventDate: Date = event.date instanceof Date ? event.date : event.date.toDate();
    const yyyy = eventDate.getFullYear();
    const mm = String(eventDate.getMonth() + 1).padStart(2, '0');
    const dd = String(eventDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const predefinedTypes = ['workshop', 'seminar', 'conference', 'meeting'];
    const isCustom = !predefinedTypes.includes((event.type || '').toLowerCase());

    setEditEvent({
      id: event.id,
      title: event.title,
      description: event.description || '',
      date: dateStr,
      time: event.time || '',
      location: event.location || '',
      type: isCustom ? 'custom' : (event.type || ''),
      customType: isCustom ? (event.type || '') : '',
      maxAttendees: event.maxAttendees || 50,
      status: event.status || 'upcoming',
    });
    setEditEventDialog(true);
  };

  const submitEditEvent = async () => {
    try {
      const updates = {
        title: editEvent.title,
        description: editEvent.description,
        date: new Date(editEvent.date + 'T' + (editEvent.time || '00:00')),
        time: editEvent.time,
        location: editEvent.location,
        type: editEvent.type === 'custom' ? editEvent.customType : editEvent.type,
        maxAttendees: editEvent.maxAttendees,
        status: editEvent.status,
      } as Partial<Event>;

      await eventService.updateEvent(editEvent.id, updates as any);
      setEditEventDialog(false);
      fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleViewEvent = (event: Event) => {
    // TODO: Implement view functionality
    console.log('View event:', event);
  };

  const handleCreateEvent = async () => {
    try {
      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        date: new Date(newEvent.date + 'T' + newEvent.time),
        time: newEvent.time,
        location: newEvent.location,
        type: newEvent.type === 'custom' ? newEvent.customType : newEvent.type,
        maxAttendees: newEvent.maxAttendees,
        currentAttendees: 0,
        status: newEvent.status,
        createdBy: 'admin', // TODO: Get from auth context
      };
      
      await eventService.createEvent(eventData);
      setCreateEventDialog(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        type: '',
        customType: '',
        maxAttendees: 50,
        status: 'upcoming'
      });
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
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
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3">Events Management</h1>
            <p className="text-lg text-purple-100 max-w-2xl mx-auto">
              Create, manage, and monitor events across the system.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mb-6">
          <Link to="/calendar">
            <Button variant="outline" className="border-2 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300">
              <CalendarIcon className="h-5 w-5 mr-2" />
              View Calendar
            </Button>
          </Link>
          <Dialog open={createEventDialog} onOpenChange={setCreateEventDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <Plus className="h-5 w-5 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Add details for the new event to be scheduled.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input
                    type="date"
                    id="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">
                    Time
                  </Label>
                  <Input
                    type="time"
                    id="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select onValueChange={(value) => setNewEvent({ ...newEvent, type: value })} defaultValue="workshop">
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newEvent.type === 'custom' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="customType" className="text-right">
                      Custom Type
                    </Label>
                    <Input
                      id="customType"
                      value={newEvent.customType}
                      onChange={(e) => setNewEvent({ ...newEvent, customType: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="maxAttendees" className="text-right">
                    Max Attendees
                  </Label>
                  <Input
                    type="number"
                    id="maxAttendees"
                    value={newEvent.maxAttendees}
                    onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: parseInt(e.target.value, 10) || 50 })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select onValueChange={(value) => setNewEvent({ ...newEvent, status: value })} defaultValue="upcoming">
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateEventDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateEvent}>Create Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

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
                            onClick={() => handleViewEvent(event)}
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
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => handleEditEvent(event)}
                              >
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 cursor-pointer"
                                onClick={() => handleDeleteEvent(event.id, event.title)}
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
                  <Link to="/create-event">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </Link>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, eventId: null, eventTitle: '' })}
        onConfirm={confirmDelete}
        title="Delete Event"
        description={`Are you sure you want to delete "${deleteDialog.eventTitle}"? This action cannot be undone.`}
        confirmText="Delete Event"
        cancelText="Cancel"
      />

      {/* Edit Event Dialog */}
      <Dialog open={editEventDialog} onOpenChange={setEditEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update the details for this event.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">Title</Label>
              <Input id="edit-title" value={editEvent.title} onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">Description</Label>
              <Textarea id="edit-description" value={editEvent.description} onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right">Date</Label>
              <Input type="date" id="edit-date" value={editEvent.date} onChange={(e) => setEditEvent({ ...editEvent, date: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-time" className="text-right">Time</Label>
              <Input type="time" id="edit-time" value={editEvent.time} onChange={(e) => setEditEvent({ ...editEvent, time: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-location" className="text-right">Location</Label>
              <Input id="edit-location" value={editEvent.location} onChange={(e) => setEditEvent({ ...editEvent, location: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right">Type</Label>
              <Select value={editEvent.type} onValueChange={(value) => setEditEvent({ ...editEvent, type: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editEvent.type === 'custom' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-customType" className="text-right">Custom Type</Label>
                <Input id="edit-customType" value={editEvent.customType} onChange={(e) => setEditEvent({ ...editEvent, customType: e.target.value })} className="col-span-3" />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-maxAttendees" className="text-right">Max Attendees</Label>
              <Input type="number" id="edit-maxAttendees" value={editEvent.maxAttendees} onChange={(e) => setEditEvent({ ...editEvent, maxAttendees: parseInt(e.target.value, 10) || 50 })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">Status</Label>
              <Select value={editEvent.status} onValueChange={(value) => setEditEvent({ ...editEvent, status: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEventDialog(false)}>Cancel</Button>
            <Button onClick={submitEditEvent}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsPage;