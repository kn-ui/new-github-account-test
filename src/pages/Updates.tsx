import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { announcementService, blogService, eventService, FirestoreAnnouncement, FirestoreBlog, FirestoreEvent, Timestamp } from '@/lib/firestore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useI18n } from '@/contexts/I18nContext';

export default function Updates() {
  const { t } = useI18n();
  const [announcements, setAnnouncements] = useState<FirestoreAnnouncement[]>([]);
  const [blogs, setBlogs] = useState<FirestoreBlog[]>([]);
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [annFilter, setAnnFilter] = useState<'all'|'general'|'course'>('all');
  const [blogQ, setBlogQ] = useState('');
  const [eventQ, setEventQ] = useState('');
  const [eventStatus, setEventStatus] = useState<'all'|'upcoming'|'past'>('all');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [a, b, e] = await Promise.all([
          announcementService.getPublicGeneralAnnouncements(100),
          blogService.getBlogPosts(30),
          eventService.getAllEvents(),
        ]);
        setAnnouncements(a);
        setBlogs(b);
        setEvents(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    if (annFilter === 'general') return announcements.filter(a => !a.courseId && !a.recipientStudentId);
    if (annFilter === 'course') return announcements.filter(a => !!a.courseId && !a.recipientStudentId);
    return announcements;
  }, [announcements, annFilter]);

  const filteredBlogs = useMemo(() => {
    const q = blogQ.toLowerCase();
    return blogs.filter(b => [b.title, b.content, b.authorName].some(v => String(v).toLowerCase().includes(q)));
  }, [blogs, blogQ]);

  const filteredEvents = useMemo(() => {
    const q = eventQ.toLowerCase();
    const now = new Date();
    return events
      .filter(ev => [ev.title, ev.description, ev.location, ev.type, ev.status].filter(Boolean).some(v => String(v).toLowerCase().includes(q)))
      .filter(ev => {
        const dt = (ev.date as Timestamp).toDate();
        if (eventStatus === 'upcoming') return dt >= now;
        if (eventStatus === 'past') return dt < now;
        return true;
      });
  }, [events, eventQ, eventStatus]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/src/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Updates & News</h1>
          <p className="text-xl opacity-90">Stay informed about School News, Events, and Insights</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="announcements">
          <TabsList>
            <TabsTrigger value="announcements">{t('nav.announcements') ?? 'Announcements'}</TabsTrigger>
            <TabsTrigger value="blogs">{t('nav.blog') ?? 'Blog Posts'}</TabsTrigger>
            <TabsTrigger value="events">{t('nav.events') ?? 'Events'}</TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm text-gray-700">Filter:</label>
              <select value={annFilter} onChange={e => setAnnFilter(e.target.value as any)} className="border border-gray-300 rounded px-2 py-1 text-sm">
                <option value="all">All</option>
                <option value="general">General</option>
                <option value="course">Course</option>
              </select>
            </div>
            {loading ? <div className="text-gray-500 text-center">Loading...</div> : (
              <div className="space-y-4">
                {filteredAnnouncements.map(a => (
                  <div key={a.id} className="bg-white rounded-lg border p-4">
                    <div className="text-sm text-gray-500 mb-1">{a.createdAt.toDate().toLocaleString()}</div>
                    <div className="font-semibold text-gray-900">{a.title}</div>
                    <div className="text-gray-700 mt-1">{a.body}</div>
                    <div className="mt-2 text-xs text-gray-500">
                      {(a.courseId ? 'Course' : 'General')}{a.recipientStudentId ? ' · Direct' : ''}
                    </div>
                  </div>
                ))}
                {!filteredAnnouncements.length && <div className="text-gray-500 text-center py-8">No announcements match.</div>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="blogs" className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <input value={blogQ} onChange={(e) => setBlogQ(e.target.value)} placeholder="Search blog posts..." className="w-full md:w-80 border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            {loading ? <div className="text-gray-500 text-center">Loading...</div> : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredBlogs.map(b => (
                  <article key={b.id} className="bg-white rounded-lg border p-5">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{b.authorName}</span>
                      <span>{b.createdAt.toDate().toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-semibold mt-2 text-gray-900">{b.title}</h3>
                    <p className="text-gray-700 mt-2 line-clamp-3">{b.content}</p>
                  </article>
                ))}
                {!filteredBlogs.length && <div className="text-gray-500 text-center py-8 col-span-2">No blog posts match.</div>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <input value={eventQ} onChange={(e) => setEventQ(e.target.value)} placeholder="Search events..." className="w-full md:w-80 border border-gray-300 rounded px-3 py-2 text-sm" />
              <select value={eventStatus} onChange={(e) => setEventStatus(e.target.value as any)} className="border border-gray-300 rounded px-2 py-1 text-sm">
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
            {loading ? <div className="text-gray-500 text-center">Loading...</div> : (
              <div className="space-y-4">
                {filteredEvents.map(ev => (
                  <div key={ev.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">{(ev.date as Timestamp).toDate().toLocaleString()}</div>
                      <div className="font-semibold text-gray-900">{ev.title}</div>
                      <div className="text-gray-700">{ev.description}</div>
                    </div>
                  </div>
                ))}
                {!filteredEvents.length && <div className="text-gray-500 text-center py-8">No events match.</div>}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}