import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { forumService, FirestoreForumThread, Timestamp } from '@/lib/firestore';
import { Search, MessageCircle, Eye, ThumbsUp } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { api, ForumThread as ApiThread } from '@/lib/api';

const Forum = () => {
  const [threads, setThreads] = useState<Array<FirestoreForumThread | ApiThread>>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPosts, setTotalPosts] = useState<number>(0);
  const [todaysPosts, setTodaysPosts] = useState<number>(0);
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
  const { t } = useI18n();
  const { userProfile } = useAuth();

  const categories = [
    'All Topics',
    'Theology',
    'Academic',
    'General'
  ];

  const reload = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      // Prefer Firestore first for authenticated users; fallback to API
      try {
        data = await forumService.getForumThreads(50);
      } catch (e) {
        data = [];
      }
      if (!data || data.length === 0) {
        try {
          const resp = await api.getForumThreads({ limit: 50 });
          data = resp.success ? (resp.data || []) : [];
        } catch {}
      }
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
  }, []);

  const filtered = useMemo(() => {
    let data = threads.slice();
    const text = q.toLowerCase();
    if (text) data = data.filter((ti: any) => String(ti.title || '').toLowerCase().includes(text) || String(ti.body || '').toLowerCase().includes(text));
    if (selectedCategory !== 'All Topics') data = data.filter((ti: any) => (ti.category || 'General') === selectedCategory);
    return data;
  }, [threads, q, selectedCategory]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [q, selectedCategory]);

  // Load per-thread reply counts and aggregate stats
  useEffect(() => {
    (async () => {
      if (!threads.length) {
        setReplyCounts({});
        setTotalPosts(0);
        setTodaysPosts(0);
        return;
      }
      try {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        const since = Timestamp.fromDate(todayStart);

        const perThread = await Promise.all(threads.map(async (t: any) => {
          try {
            const c = await forumService.countPosts(t.id);
            const todayC = await forumService.countPostsSince(t.id, since);
            return { id: t.id, c, todayC };
          } catch {
            return { id: t.id, c: 0, todayC: 0 };
          }
        }));

        const map: Record<string, number> = {};
        let total = 0;
        let today = 0;
        perThread.forEach(({ id, c, todayC }) => { map[id] = c; total += c; today += todayC; });
        setReplyCounts(map);
        setTotalPosts(total);
        setTodaysPosts(today);
      } catch {
        setReplyCounts({});
        setTotalPosts(0);
        setTodaysPosts(0);
      }
    })();
  }, [threads]);

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
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-500">Total Topics</div>
              <div className="text-2xl font-semibold text-gray-900">{threads.length}</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-500">Total Posts</div>
              <div className="text-2xl font-semibold text-gray-900">{totalPosts}</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-500">Today's Posts</div>
              <div className="text-2xl font-semibold text-gray-900">{todaysPosts}</div>
            </div>
          </div>
          {loading ? (
            <div className="text-center text-gray-500">{t('forum.loading')}</div>
          ) : (
            <div className="space-y-4">
              {paginated.map((discussion: any) => (
                <a key={discussion.id} href={`/forum/${discussion.id}`} className="block bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">{(discussion.authorName || discussion.createdByName || 'U').slice(0,2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-1">{discussion.title}</div>
                      {discussion.body && <div className="text-gray-600 line-clamp-2">{discussion.body}</div>}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <div className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {replyCounts[discussion.id] ?? 0}</div>
                        <div className="flex items-center gap-1"><Eye className="w-4 h-4" /> {discussion.views ?? '—'}</div>
                        <button
                          onClick={(e) => { e.preventDefault(); forumService.likeThread(discussion.id).then(reload); }}
                          className="flex items-center gap-1 hover:text-blue-600"
                          aria-label="Like thread"
                        >
                          <ThumbsUp className="w-4 h-4" /> {discussion.likes ?? 0}
                        </button>
                        <span className="ml-auto">{new Date((discussion.createdAt?.toDate?.() || discussion.createdAt)).toLocaleString()}</span>
                        <span className="">· By {discussion.authorName || 'Unknown'}</span>
                        {discussion.category && <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{discussion.category}</span>}
                      </div>
                      {/* Author controls: allow edit/delete if current user is thread author and user has role */}
                      {userProfile && (userProfile.role === 'super_admin' || userProfile.role === 'admin' || userProfile.role === 'teacher') && userProfile.uid === discussion.authorId && (
                        <div className="mt-3 flex gap-2 text-xs">
                          <button className="px-2 py-1 rounded border hover:bg-gray-50">Edit</button>
                          <button className="px-2 py-1 rounded border hover:bg-gray-50">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              ))}
              {!filtered.length && (
                <div className="text-center text-gray-500 py-12">{t('forum.noTopics')}</div>
              )}
              {/* Pagination */}
              {filtered.length > pageSize && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button disabled={page===1} onClick={() => setPage(p => Math.max(1, p-1))} className={`px-3 py-1 rounded border text-sm ${page===1?'text-gray-400 border-gray-200':'hover:bg-gray-50'}`}>Prev</button>
                  <div className="text-sm text-gray-600">Page {page} of {Math.ceil(filtered.length / pageSize)}</div>
                  <button disabled={page>=Math.ceil(filtered.length/pageSize)} onClick={() => setPage(p => Math.min(Math.ceil(filtered.length/pageSize), p+1))} className={`px-3 py-1 rounded border text-sm ${page>=Math.ceil(filtered.length/pageSize)?'text-gray-400 border-gray-200':'hover:bg-gray-50'}`}>Next</button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Forum;