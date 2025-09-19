import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { forumService, FirestoreForumThread } from '@/lib/firestore';
import { Search, MessageCircle, Eye, ThumbsUp } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { api, ForumThread as ApiThread } from '@/lib/api';

const Forum = () => {
  const [threads, setThreads] = useState<Array<FirestoreForumThread | ApiThread>>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const { t } = useI18n();

  const categories = [
    'All Topics',
    'Theology & Scripture',
    'Liturgy & Worship',
    'Spiritual Formation',
    'Academic Discussion',
    'General Discussion'
  ];

  const reload = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      try {
        const resp = await api.getForumThreads({ limit: 50 });
        data = resp.success ? (resp.data || []) : [];
      } catch {
        // Fallback to Firestore public read if API fails
        data = await forumService.getForumThreads(50);
      }
      if (q) data = data.filter((ti: any) => String(ti.title || '').toLowerCase().includes(q.toLowerCase()) || String(ti.body || '').toLowerCase().includes(q.toLowerCase()));
      setThreads(data);
    } catch (error) {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(reload, 200);
    return () => clearTimeout(id);
  }, [q, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/src/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Discussion Forum</h1>
          <p className="text-xl opacity-90">Engage with our community</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Search Topics</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${selectedCategory === cat ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-3">
          {loading ? (
            <div className="text-center text-gray-500">{t('forum.loading')}</div>
          ) : (
            <div className="space-y-4">
              {threads.map((discussion: any) => (
                <a key={discussion.id} href={`/forum/${discussion.id}`} className="block bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">{(discussion.authorName || discussion.createdByName || 'U').slice(0,2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-1">{discussion.title}</div>
                      {discussion.body && <div className="text-gray-600 line-clamp-2">{discussion.body}</div>}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <div className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> 0</div>
                        <div className="flex items-center gap-1"><Eye className="w-4 h-4" /> —</div>
                        <div className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> —</div>
                        <span className="ml-auto">{new Date((discussion.createdAt?.toDate?.() || discussion.createdAt)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
              {!threads.length && (
                <div className="text-center text-gray-500 py-12">{t('forum.noTopics')}</div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Forum;