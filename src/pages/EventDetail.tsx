import RichTextRenderer from '@/components/ui/RichTextRenderer';
import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FirestoreEvent } from '@/lib/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Calendar, User } from 'lucide-react';

export default function EventDetail() {
  const { t } = useI18n();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<FirestoreEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      try {
        setLoading(true);
        const ref = doc(db, 'events', eventId);
        const snap = await getDoc(ref);
        setEvent(snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center text-gray-500">{t('events.loading')}</div>
        ) : event ? (
          <article className="rounded-2xl shadow-md overflow-hidden">
            {(event as any).imageUrl && (
              <img src={(event as any).imageUrl} alt={event.title} className="w-full h-96 object-cover" />
            )}
            <div className="p-8 md:p-12">
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{event.date.toDate().toLocaleDateString()}</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-tight">{event.title}</h1>
              <div className="prose prose-sm max-w-none text-gray-700">
                <RichTextRenderer content={event.description} />
              </div>
              {(event as any).fileUrl && (
                <div className="mt-4">
                  <a 
                    href={(event as any).fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
                    Download File
                  </a>
                </div>
              )}
              <div className="mt-12 text-center">
                  <Link to="/updates#events" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm bg-white text-blue-600 border-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                  {"Back to Events"}
                </Link>
              </div>
            </div>
          </article>
        ) : (
          <div className="text-center text-gray-500 py-16">{t('events.notFound')}</div>
        )}
      </div>
    </div>
  );
}