/* eslint-disable @typescript-eslint/no-explicit-any */
import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { eventService, FirestoreEvent } from '@/lib/firestore';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toEthiopianDate, fromEthiopianDate, formatEthiopianDate, getEthiopianDaysInMonth, getEthiopianFirstWeekdayOffset } from '@/lib/ethiopianCalendar'; // New import

const Calendar = () => {
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    const ethiopianDate = toEthiopianDate(d);
    return `${ethiopianDate.year}-${String(ethiopianDate.month).padStart(2, '0')}`; // Store Ethiopian year and month
  });
  const [selectedEvent, setSelectedEvent] = useState<FirestoreEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const firestoreEvents = await eventService.getEvents(500);
        // Convert Firestore Timestamp to Date objects for consistent handling in the frontend
        const eventsWithDates = firestoreEvents.map(event => ({
          ...event,
          date: event.date.toDate() // Convert Timestamp to Date
        }));
        setEvents(eventsWithDates);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month]);

  const [ethiopianYear, ethiopianMonth] = month.split('-').map(Number);

  const daysInMonth = useMemo(() => {
    const days = getEthiopianDaysInMonth(ethiopianYear, ethiopianMonth);
    console.log('daysInMonth:', days);
    return days;
  }, [ethiopianYear, ethiopianMonth]);

  const firstWeekdayOffset = useMemo(() => {
    const offset = getEthiopianFirstWeekdayOffset(ethiopianYear, ethiopianMonth);
    console.log('firstWeekdayOffset:', offset);
    return offset;
  }, [ethiopianYear, ethiopianMonth]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, FirestoreEvent[]> = {};
    for (let i = 1; i <= daysInMonth; i++) map[i] = [];
    const [currentEthiopianYear, currentEthiopianMonth] = month.split('-').map(Number);

    events.forEach(e => {
      try {
        const eventDate: Date = (e.date as any)?.toDate ? (e.date as any).toDate() : (e.date as unknown as Date);
        if (!(eventDate instanceof Date)) {
          console.log('Event date is not a Date object:', e.title, eventDate);
          return;
        }

        const ethiopianEventDate = toEthiopianDate(eventDate); // Revert to const

        const isSameEthiopianMonth = ethiopianEventDate.year === currentEthiopianYear && ethiopianEventDate.month === currentEthiopianMonth;

        if (!isSameEthiopianMonth) return;
        const day = ethiopianEventDate.day;
        if (map[day]) map[day].push(e);
      } catch (error) {
        console.error('Error processing event:', e.title, error);
      }
    });
    console.log('eventsByDay map:', map);
    return map;
  }, [events, daysInMonth, month]);

  const weekdays = t('calendar.weekdays') as unknown as string[];

  const goToToday = () => {
    const d = new Date();
    const ethiopianDate = toEthiopianDate(d);
    setMonth(`${ethiopianDate.year}-${String(ethiopianDate.month).padStart(2, '0')}`);
    console.log('Month state changed to:', `${ethiopianDate.year}-${String(ethiopianDate.month).padStart(2, '0')}`);
  };

  const goToPrevMonth = () => {
    const [y, m] = month.split('-').map(Number);
    let newMonth = m - 1;
    let newYear = y;
    if (newMonth < 1) {
      newMonth = 13; // Go to Pagume of previous year
      newYear--;
    }
    setMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
    console.log('Month state changed to:', `${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    let newMonth = m + 1;
    let newYear = y;
    if (newMonth > 13) {
      newMonth = 1; // Go to Meskerem of next year
      newYear++;
    }
    setMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
    console.log('Month state changed to:', `${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const monthLabel = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    // Create a dummy EthiopianDate object to use formatEthiopianDate
    const ethiopianDate = { year: y, month: m, day: 1 };
    const formatted = formatEthiopianDate(ethiopianDate);
    // Extract month name and year from the formatted string
    const parts = formatted.split(', ');
    const label = `${parts[0]} ${parts[1].split(' ')[0]} EC`; // e.g., "Meskerem 2017 EC"
    console.log('monthLabel:', label);
    return label;
  }, [month]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm border p-4 rounded mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <div className="text-lg font-semibold text-gray-900">{monthLabel}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={goToPrevMonth} className="p-2 rounded border hover:bg-gray-50" aria-label="Previous Month">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={goToToday} className="px-3 py-2 rounded border text-sm hover:bg-gray-50">
                {t('calendar.today') ?? 'Today'}
              </button>
              <button onClick={goToNextMonth} className="p-2 rounded border hover:bg-gray-50" aria-label="Next Month">
                <ChevronRight className="h-4 w-4" />
              </button>
              {/* Removed Gregorian month input */}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">{t('calendar.loading')}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="grid grid-cols-7 gap-1 p-4">
              {weekdays.map((d) => (
                <div key={d} className="p-2 text-center font-semibold text-gray-600 bg-gray-50 rounded">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 p-4 pt-0">
              {Array.from({ length: firstWeekdayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[120px] p-2 border border-transparent rounded" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const today = new Date();
                const ethiopianToday = toEthiopianDate(today);
                const isToday = ethiopianToday.year === ethiopianYear && ethiopianToday.month === ethiopianMonth && ethiopianToday.day === day;

                const dayEvents = eventsByDay[day] || [];

                return (
                  <div
                    key={day}
                    className={`min-h-[120px] p-2 border border-gray-200 rounded ${isToday ? 'bg-blue-100' : ''} ${dayEvents.length > 0 ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={() => {
                      if (dayEvents.length > 0) {
                        setSelectedEvent(dayEvents[0]); // Select the first event for display
                        setIsModalOpen(true);
                      }
                    }}
                  >
                    <div className={`font-semibold text-gray-900 mb-2 ${isToday ? 'text-blue-700' : ''}`}>{day}</div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(ev => (
                        <div key={ev.id} className="text-xs p-1 rounded truncate bg-blue-50 text-blue-800 border border-blue-200" title={ev.title}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500">{t('calendar.more', { count: dayEvents.length - 3 as any })}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span>{formatEthiopianDate(toEthiopianDate(selectedEvent.date))}</span>
              </div>
              {selectedEvent.time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{selectedEvent.time}</span>
                </div>
              )}
              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-500" />
                <span>{selectedEvent.description}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;