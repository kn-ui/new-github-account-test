/* eslint-disable @typescript-eslint/no-explicit-any */
import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { eventService, FirestoreEvent } from '@/lib/firestore';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const Calendar = () => {
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const { t } = useI18n();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const firestoreEvents = await eventService.getEvents(500);
        setEvents(firestoreEvents);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month]);

  const daysInMonth = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  }, [month]);

  const firstWeekdayOffset = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    return new Date(y, m - 1, 1).getDay();
  }, [month]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, FirestoreEvent[]> = {};
    for (let i = 1; i <= daysInMonth; i++) map[i] = [];
    const [y, m] = month.split('-').map(Number);
    events.forEach(e => {
      const eventDate: Date = (e.date as any)?.toDate ? (e.date as any).toDate() : (e.date as unknown as Date);
      if (!(eventDate instanceof Date)) return;
      const isSameMonth = eventDate.getFullYear() === y && eventDate.getMonth() + 1 === m;
      if (!isSameMonth) return;
      const day = eventDate.getDate();
      if (map[day]) map[day].push(e);
    });
    return map;
  }, [events, daysInMonth, month]);

  const weekdays = t('calendar.weekdays') as unknown as string[];

  const goToToday = () => {
    const d = new Date();
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const goToPrevMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    setMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const next = new Date(y, m, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
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
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border rounded px-3 py-2 ml-2"
              />
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
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                <div key={day} className="min-h-[120px] p-2 border border-gray-200 rounded">
                  <div className="font-semibold text-gray-900 mb-2">{day}</div>
                  <div className="space-y-1">
                    {(eventsByDay[day] || []).slice(0, 3).map(ev => (
                      <div key={ev.id} className="text-xs p-1 rounded truncate bg-blue-50 text-blue-800 border border-blue-200" title={ev.title}>
                        {ev.title}
                      </div>
                    ))}
                    {(eventsByDay[day] || []).length > 3 && (
                      <div className="text-xs text-gray-500">{t('calendar.more', { count: (eventsByDay[day] || []).length - 3 as any })}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;