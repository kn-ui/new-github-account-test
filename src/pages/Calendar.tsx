/* eslint-disable @typescript-eslint/no-explicit-any */
import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { eventService, FirestoreEvent } from '@/lib/firestore';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Info, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toEthiopianDate, formatEthiopianDate, getEthiopianDaysInMonth, getEthiopianFirstWeekdayOffset, toGeezNumber } from '@/lib/ethiopianCalendar';
import { EventsList } from '@/components/EventsList';
import EthiopianHolidays from '@/components/EthiopianHolidays';

const Calendar = () => {
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    const ethiopianDate = toEthiopianDate(d);
    return `${ethiopianDate.year}-${String(ethiopianDate.month).padStart(2, '0')}`;
  });
  const [selectedDayEvents, setSelectedDayEvents] = useState<FirestoreEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const { t } = useI18n();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const firestoreEvents = await eventService.getEvents(500);
        const eventsWithDates = firestoreEvents.map(event => ({ ...event, date: event.date.toDate() }));
        setEvents(eventsWithDates);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month]);

  const [ethiopianYear, ethiopianMonth] = month.split('-').map(Number);

  const daysInMonth = useMemo(() => getEthiopianDaysInMonth(ethiopianYear, ethiopianMonth), [ethiopianYear, ethiopianMonth]);
  const firstWeekdayOffset = useMemo(() => getEthiopianFirstWeekdayOffset(ethiopianYear, ethiopianMonth), [ethiopianYear, ethiopianMonth]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, FirestoreEvent[]> = {};
    for (let i = 1; i <= daysInMonth; i++) map[i] = [];
    const [currentEthiopianYear, currentEthiopianMonth] = month.split('-').map(Number);
    events.forEach(e => {
      try {
        const eventDate: Date = (e.date as any) as Date;
        const ethiopianEventDate = toEthiopianDate(eventDate);
        const isSameEthiopianMonth = ethiopianEventDate.year === currentEthiopianYear && ethiopianEventDate.month === currentEthiopianMonth;
        if (!isSameEthiopianMonth) return;
        const day = ethiopianEventDate.day;
        if (map[day]) map[day].push(e);
      } catch {}
    });
    return map;
  }, [events, daysInMonth, month]);

  const safeT = (key: string, fallback: string) => {
    const value: any = t(key as any);
    if (typeof value !== 'string') return fallback;
    // If translation equals a key-like string, fallback
    return /^[a-z0-9_.]+$/i.test(value) ? fallback : value;
  };
  const weekdaysFromT = t('calendar.weekdays') as unknown as string[] | undefined;
  const weekdays = Array.isArray(weekdaysFromT) && weekdaysFromT.length === 7
    ? weekdaysFromT
    : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const goToToday = () => {
    const d = new Date();
    const ethiopianDate = toEthiopianDate(d);
    setMonth(`${ethiopianDate.year}-${String(ethiopianDate.month).padStart(2, '0')}`);
  };

  const goToPrevMonth = () => {
    const [y, m] = month.split('-').map(Number);
    let newMonth = m - 1;
    let newYear = y;
    if (newMonth < 1) { newMonth = 13; newYear--; }
    setMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    let newMonth = m + 1;
    let newYear = y;
    if (newMonth > 13) { newMonth = 1; newYear++; }
    setMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const monthLabel = useMemo(() => {
    const today = new Date();
    const ethiopianToday = toEthiopianDate(today);
    return formatEthiopianDate(ethiopianToday);
  }, []);

  const academicYearInfo = {
    fallSemester: 'Sep 1 - Dec 15',
    winterBreak: 'Dec 16 - Jan 15',
    springSemester: 'Jan 16 - May 30',
    summerBreak: 'May 31 - Aug 31'
  };

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
              <button onClick={goToPrevMonth} className="p-2 rounded border hover:bg-gray-50" aria-label={safeT('calendar.prevMonth','Previous Month')}><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={goToToday} className="px-3 py-2 rounded border text-sm hover:bg-gray-50">{safeT('calendar.today','Today')}</button>
              <button onClick={goToNextMonth} className="p-2 rounded border hover:bg-gray-50" aria-label={safeT('calendar.nextMonth','Next Month')}><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-center text-gray-500">{safeT('calendar.loading','Loading...')}</div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                <div className="grid grid-cols-7 p-4 bg-gray-50 border-b border-gray-200">
                  {weekdays.map((d) => (
                    <div key={d} className="p-2 text-center font-bold text-sm text-gray-600">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                  {Array.from({ length: firstWeekdayOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-gray-50" />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const today = new Date();
                    const ethiopianToday = toEthiopianDate(today);
                    const isToday = ethiopianToday.year === ethiopianYear && ethiopianToday.month === ethiopianMonth && ethiopianToday.day === day;
                    const dayEvents = eventsByDay[day] || [];
                    return (
                      <div 
                        key={day} 
                        className={`relative min-h-[120px] p-2 bg-white ${dayEvents.length > 0 ? 'cursor-pointer hover:bg-gray-50 transition-colors duration-200' : ''}`}
                        onClick={() => { if (dayEvents.length > 0) { setSelectedDayEvents(dayEvents); setSelectedEventIndex(0); setIsModalOpen(true); } }}
                      >
                        <div className={`text-sm font-semibold ${isToday ? 'flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white' : 'text-gray-800'}`}>
                          {toGeezNumber(day)} ({day})
                        </div>
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map(ev => (
                            <div key={ev.id} className="text-xs p-1.5 rounded-lg truncate bg-blue-50 text-blue-800 border border-blue-200 font-medium" title={ev.title}>{ev.title}</div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500 font-semibold">+{dayEvents.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{safeT('calendar.sidebar.academicYear','Academic Year')}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">{safeT('calendar.sidebar.fallSemester','Fall Semester:')}</span><span className="font-medium">{academicYearInfo.fallSemester}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">{safeT('calendar.sidebar.winterBreak','Winter Break:')}</span><span className="font-medium">{academicYearInfo.winterBreak}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">{safeT('calendar.sidebar.springSemester','Spring Semester:')}</span><span className="font-medium">{academicYearInfo.springSemester}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">{safeT('calendar.sidebar.summerBreak','Summer Break:')}</span><span className="font-medium">{academicYearInfo.summerBreak}</span></div>
              </div>
            </div>
            <EthiopianHolidays />
          </div>
        </div>

        {/* Upcoming Events under calendar */}
        <div className="mt-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{safeT('events.upcomingEvents','Upcoming Events')}</h3>
          </div>
          <EventsList readOnly />
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl p-0">
          {selectedDayEvents.length > 0 && (
            <div className="p-6">
              <DialogHeader className="mb-4 flex flex-row justify-between items-center">
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Events for {formatEthiopianDate(toEthiopianDate(selectedDayEvents[0].date))}
                </DialogTitle>
                {selectedDayEvents.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedEventIndex(prev => (prev - 1 + selectedDayEvents.length) % selectedDayEvents.length)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">{selectedEventIndex + 1} of {selectedDayEvents.length}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedEventIndex(prev => (prev + 1) % selectedDayEvents.length)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </DialogHeader>
              <div className="space-y-6">
                {selectedDayEvents.map((event, index) => (
                  <div key={event.id} className={`${index === selectedEventIndex ? '' : 'hidden'}`}>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.title}</h3>
                    <p className="text-base leading-relaxed text-gray-600">{event.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mt-4 border-t border-gray-200">
                      {event.time && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-semibold text-gray-800">Time</p>
                            <p>{event.time}</p>
                          </div>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-semibold text-gray-800">Location</p>
                            <p>{event.location}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {event.fileUrl && (
                      <div className="pt-4 mt-4 border-t border-gray-200">
                        <a href={event.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:underline font-semibold">
                          <Download className="h-4 w-4" />
                          Download Attached File
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;