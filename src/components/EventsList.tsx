/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-irregular-whitespace */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar as CalendarIcon,
  Search,
  Filter,
  Clock,
  MapPin,
  Users,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Zap,
  Star
} from 'lucide-react';
import { eventService, Timestamp } from '@/lib/firestore';
import { toEthiopianDate, formatEthiopianDate } from '@/lib/ethiopianCalendar';
import { useI18n } from '@/contexts/I18nContext';

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date | Timestamp;
  time: string;
  location: string;
  type: string;
  maxAttendees: number;
  currentAttendees: number;
  status: string;
}

interface EventsListProps {
  readOnly?: boolean;
}

export const EventsList: React.FC<EventsListProps> = ({ readOnly }) => {
  const { t } = useI18n();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, typeFilter, statusFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const fetchedEvents = await eventService.getEvents();
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events.filter(event => {
      const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || event.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });

    setFilteredEvents(filtered);
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'workshop': 'bg-blue-100 text-blue-800 border-blue-200',
      'seminar': 'bg-purple-100 text-purple-800 border-purple-200',
      'meeting': 'bg-orange-100 text-orange-800 border-orange-200',
      'conference': 'bg-green-100 text-green-800 border-green-200',
      'webinar': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'training': 'bg-pink-100 text-pink-800 border-pink-200',
    };
    return colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'upcoming': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ongoing': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'upcoming': return <Clock className="h-3 w-3" />;
      case 'ongoing': return <Play className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'workshop': return <Target className="h-4 w-4" />;
      case 'seminar': return <Users className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'conference': return <Star className="h-4 w-4" />;
      case 'webinar': return <Zap className="h-4 w-4" />;
      default: return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const formatEventDate = (eventDate: Date | Timestamp) => {
    try {
      let gregorianEventDate: Date;
      if (eventDate instanceof Date) {
        gregorianEventDate = eventDate;
      } else if (eventDate && typeof (eventDate as Timestamp).toDate === 'function') {
        gregorianEventDate = (eventDate as Timestamp).toDate();
      } else {
        return 'Invalid Date';
      }

      if (isNaN(gregorianEventDate.getTime())) {
        return 'Invalid Date';
      }
      const ethiopianEventDate = toEthiopianDate(gregorianEventDate);
      return formatEthiopianDate(ethiopianEventDate);
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getUniqueTypes = () => {
    const types = events.map(event => event.type).filter(Boolean);
    return [...new Set(types)];
  };

  const getInitials = (title: string) => {
    return title?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-purple-600" />
            Loading Events...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-purple-900">
            <div className="p-2 bg-purple-100 rounded-xl">
              <CalendarIcon className="h-6 w-6 text-purple-600" />
            </div>
            {t('events.title')} ({filteredEvents.length})
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search Events</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Filter by Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {getUniqueTypes().map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Filter by Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-purple-300 group">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Event Header */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 border-2 border-gray-200">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${event.title}`} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-violet-600 text-white font-semibold">
                      {getInitials(event.title)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-700 transition-colors break-words">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1 break-words">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span>{formatEventDate(event.date)}</span>
                    {event.time && (
                      <>
                        <span>•</span>
                        <span>{event.time}</span>
                      </>
                    )}
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-purple-500" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span>{event.currentAttendees || 0}/{event.maxAttendees || 'Unlimited'} attendees</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {event.type && (
                    <Badge className={`flex items-center gap-1 text-xs ${getTypeColor(event.type)}`}>
                      {getTypeIcon(event.type)}
                      <span className="capitalize">{event.type}</span>
                    </Badge>
                  )}
                  
                  {event.status && (
                    <Badge className={`flex items-center gap-1 text-xs ${getStatusColor(event.status)}`}>
                      {getStatusIcon(event.status)}
                      <span className="capitalize">{event.status}</span>
                    </Badge>
                  )}
                </div>

                {/* Attendance percentage removed by request */}

                {/* View Event button removed by request */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Footer */}
      <Card className="bg-gray-50">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {events.filter(e => e.status === 'upcoming').length}
              </div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {events.filter(e => e.status === 'ongoing').length}
              </div>
              <div className="text-sm text-gray-600">Ongoing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {events.filter(e => e.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {events.length}
              </div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};