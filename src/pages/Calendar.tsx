import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { api, EventItem } from '@/lib/api';
import { useI18n } from '@/contexts/I18nContext';

const Calendar = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const { t } = useI18n();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const resp = await api.getEvents({ type: type === 'all' ? undefined : type, month, page: 1, limit: 200 });
        if (resp.success && Array.isArray(resp.data)) setEvents(resp.data);
        else setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [type, month]);

  const daysInMonth = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  }, [month]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, EventItem[]> = {};
    for (let i = 1; i <= daysInMonth; i++) map[i] = [];
    events.forEach(e => {
      const day = Number(e.date.split('-')[2]);
      if (map[day]) map[day].push(e);
    });
    return map;
  }, [events, daysInMonth]);

  const weekdays = t('calendar.weekdays') as unknown as string[];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm border-b p-6 rounded mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">{t('calendar.month')}</label>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded px-3 py-2" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">{t('calendar.type')}</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="border rounded px-3 py-2">
                <option value="all">{t('calendar.types.all')}</option>
                <option value="academic">{t('calendar.types.academic')}</option>
                <option value="religious">{t('calendar.types.religious')}</option>
                <option value="social">{t('calendar.types.social')}</option>
                <option value="examination">{t('calendar.types.examination')}</option>
                <option value="holiday">{t('calendar.types.holiday')}</option>
              </select>
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