import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, EventItem } from '@/lib/api';

const fallbackEvents: EventItem[] = [
  { id: 'ev1', title: 'Fall Semester Begins', date: '2025-01-20', time: '08:00', type: 'academic', location: 'Main Campus', description: 'First day of classes for the fall semester' },
  { id: 'ev2', title: 'Timkat Celebration', date: '2025-01-19', time: '06:00', type: 'religious', location: 'Church Grounds', description: 'Ethiopian Orthodox celebration of Epiphany' },
  { id: 'ev3', title: 'New Student Orientation', date: '2025-01-18', time: '09:00', type: 'academic', location: 'Assembly Hall', description: 'Welcome and orientation for new students' },
  { id: 'ev4', title: 'Mid-term Examinations', date: '2025-02-15', time: '09:00', type: 'examination', location: 'Examination Halls', description: 'Mid-semester examinations for all courses' },
];

const typeBadge = (type: string) => {
  switch (type) {
    case 'academic': return 'bg-blue-100 text-blue-800';
    case 'religious': return 'bg-purple-100 text-purple-800';
    case 'examination': return 'bg-amber-100 text-amber-800';
    case 'holiday': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const UpcomingEvents = () => {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.getEvents({ page: 1, limit: 10 });
        if (resp.success && resp.data && resp.data.length) setEvents(resp.data.slice(0, 8));
        else setEvents(fallbackEvents);
      } catch {
        setEvents(fallbackEvents);
      }
    };
    load();
  }, []);

  return (
    <section className="bg-white py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Upcoming Events</h2>
          <p className="text-gray-600 mt-1">8 Major Upcoming Events Found</p>
        </div>
        <div className="divide-y rounded-lg border bg-white">
          {events.map((ev) => (
            <div key={ev.id} className="p-4 md:p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500">{new Date(ev.date).toLocaleDateString(undefined, { weekday: 'short' })}</div>
                  <div className="text-lg font-semibold text-gray-900">{new Date(ev.date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${typeBadge(ev.type)}`}>{ev.type?.charAt(0).toUpperCase() + ev.type?.slice(1)}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mt-1">{ev.title}</h3>
                  <div className="text-sm text-gray-600 mt-1 flex gap-4">
                    <span>{ev.time}</span>
                    <span>{ev.location}</span>
                  </div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link to="/calendar" className="inline-flex items-center gap-2 bg-[#0e4fb9] text-white px-5 py-2 rounded-md hover:bg-[#0d43a0]">More Events <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;

