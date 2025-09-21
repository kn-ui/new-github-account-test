/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-irregular-whitespace */
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Search
} from 'lucide-react';
import { eventService, Timestamp } from '@/lib/firestore';
import { toEthiopianDate, formatEthiopianDate } from '@/lib/ethiopianCalendar';
import { Input } from '@/components/ui/input';
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
  const [statusFilter, setStatusFilter] = useState('all');

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

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-6 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={(t('events.searchPlaceholder') as any)}
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
              <option value="all">{(t('events.allStatus') as any)}</option>
              <option value="upcoming">{(t('events.status.upcoming') as any)}</option>
              <option value="ongoing">{(t('events.status.ongoing') as any)}</option>
              <option value="completed">{(t('events.status.completed') as any)}</option>
            </select>
          </div>
        </CardContent>
      </Card>
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
                          {(() => {
                            try {
                              let gregorianEventDate: Date;
                              if (event.date instanceof Date) {
                                gregorianEventDate = event.date;
                              } else if (event.date && typeof (event.date as Timestamp).toDate === 'function') {
                                gregorianEventDate = (event.date as Timestamp).toDate();
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
                          })()}
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
                          {event.currentAttendees}/{event.maxAttendees} {t('events.attendees')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
