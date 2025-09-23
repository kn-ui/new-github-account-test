import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/I18nContext";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { eventService, FirestoreEvent, Timestamp } from "@/lib/firestore";

const Index = () => {
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const list = await eventService.getAllEvents();
        setEvents(list);
      } catch {
        setEvents([]);
      }
    })();
  }, []);

  const top3 = useMemo(() => {
    const now = new Date();
    return events
      .filter(ev => (ev.date as Timestamp).toDate() >= now)
      .slice(0, 3);
  }, [events]);

  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="/src/assets/message-from-school-img.png"
                alt="School Building"
                className="w-full h-80 object-cover rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('home.message.title')}</h2>
              <p className="text-gray-600 mb-4">{t('home.message.subtitle')}</p>
              <p className="text-gray-600 mb-6">{t('home.message.body')}</p>
              <Link 
                to="/admissions"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                {t('home.message.cta')}
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.events.title')}</h2>
              <p className="text-lg text-gray-600">{t('home.events.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {top3.map(ev => (
                <div key={ev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <CalendarDays className="w-4 h-4 mr-2 text-blue-600" />
                    {(ev.date as Timestamp).toDate().toLocaleDateString()}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{ev.title}</h3>
                  <p className="text-gray-600 mt-1 line-clamp-3">{ev.description}</p>
                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center"><Clock className="w-4 h-4 mr-2 text-gray-400" /> {ev.time || '—'}</div>
                    <div className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-gray-400" /> {ev.location || '—'}</div>
                  </div>
                </div>
              ))}
              {!top3.length && (
                <div className="md:col-span-3 text-center text-gray-500">{t('events.noEvents') || 'No upcoming events.'}</div>
              )}
            </div>
            <div className="text-center">
              <Link 
                to="/calendar"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                {t('events.viewCalendar')}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
