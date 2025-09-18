import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { announcementService, blogService, eventService, FirestoreAnnouncement, FirestoreBlog, FirestoreEvent, Timestamp } from '@/lib/firestore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useI18n } from '@/contexts/I18nContext';

export default function Updates() {
  const { t } = useI18n();
  const [announcements, setAnnouncements] = useState<FirestoreAnnouncement[]>([]);
  const [blogs, setBlogs] = useState<FirestoreBlog[]>([]);
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [a, b, e] = await Promise.all([
          announcementService.getAllAnnouncements(30),
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/src/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('updates.title') ?? 'Updates'}</h1>
          <p className="text-xl opacity-90">{t('updates.subtitle') ?? 'Announcements, blog posts, and events'}</p>
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
            {loading ? <div className="text-gray-500 text-center">Loading...</div> : (
              <div className="space-y-4">
                {announcements.map(a => (
                  <div key={a.id} className="bg-white rounded-lg border p-4">
                    <div className="text-sm text-gray-500 mb-1">{a.createdAt.toDate().toLocaleString()}</div>
                    <div className="font-semibold text-gray-900">{a.title}</div>
                    <div className="text-gray-700 mt-1">{a.body}</div>
                  </div>
                ))}
                {!announcements.length && <div className="text-gray-500 text-center py-8">No announcements yet.</div>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="blogs" className="mt-6">
            {loading ? <div className="text-gray-500 text-center">Loading...</div> : (
              <div className="grid md:grid-cols-2 gap-6">
                {blogs.map(b => (
                  <article key={b.id} className="bg-white rounded-lg border p-5">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{b.authorName}</span>
                      <span>{b.createdAt.toDate().toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-semibold mt-2 text-gray-900">{b.title}</h3>
                    <p className="text-gray-700 mt-2 line-clamp-3">{b.content}</p>
                  </article>
                ))}
                {!blogs.length && <div className="text-gray-500 text-center py-8 col-span-2">No blog posts yet.</div>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            {loading ? <div className="text-gray-500 text-center">Loading...</div> : (
              <div className="space-y-4">
                {events.map(ev => (
                  <div key={ev.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">{(ev.date as Timestamp).toDate().toLocaleString()}</div>
                      <div className="font-semibold text-gray-900">{ev.title}</div>
                      <div className="text-gray-700">{ev.description}</div>
                    </div>
                  </div>
                ))}
                {!events.length && <div className="text-gray-500 text-center py-8">No events yet.</div>}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}