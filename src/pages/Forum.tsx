import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { forumService, FirestoreForumThread } from '@/lib/firestore';
import { Search } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

const Forum = () => {
  const [threads, setThreads] = useState<FirestoreForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [q, setQ] = useState('');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('theology');
  const { t } = useI18n();

  const categories = [
    { value: 'all', label: t('forum.categories.all') },
    { value: 'theology', label: t('forum.categories.theology') },
    { value: 'spirituality', label: t('forum.categories.spirituality') },
    { value: 'academic', label: t('forum.categories.academic') },
    { value: 'community', label: t('forum.categories.community') },
    { value: 'announcements', label: t('forum.categories.announcements') }
  ];

  const reload = async () => {
    setLoading(true);
    try {
      const allThreads = await forumService.getForumThreads(20);
      let data = allThreads;
      if (q) data = data.filter(ti => ti.title.toLowerCase().includes(q.toLowerCase()));
      setThreads(data);
    } catch (error) {
      console.error('Failed to load forum threads:', error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(reload, 200);
    return () => clearTimeout(id);
  }, [category, q]);

  const onCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim()) return;
    try {
      await forumService.createForumThread({ 
        title: newThreadTitle.trim(), 
        body: newThreadTitle.trim(), // Using title as body for now
        authorId: 'current-user', // This should come from auth context
        authorName: 'Current User' // This should come from auth context
      });
      setNewThreadTitle('');
      await reload();
    } catch (error) {
      console.error('Failed to create forum thread:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm border-b p-6 rounded mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('forum.searchPlaceholder')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Create Thread */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <form onSubmit={onCreateThread} className="grid md:grid-cols-6 gap-3">
            <input
              className="md:col-span-3 border rounded px-3 py-2"
              placeholder={t('forum.create.titlePlaceholder')}
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
            />
            <select className="md:col-span-2 border rounded px-3 py-2" value={newThreadCategory} onChange={(e) => setNewThreadCategory(e.target.value)}>
              {categories.filter(c=>c.value!=='all').map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button className="md:col-span-1 bg-blue-600 text-white rounded px-4 py-2">{t('forum.create.post')}</button>
          </form>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">{t('forum.loading')}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="divide-y divide-gray-200">
              {threads.map(ti => (
                <a key={ti.id} href={`/forum/${ti.id}`} className="block p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{ti.title}</h3>
                      <p className="text-gray-600 mt-2 line-clamp-2">{ti.body}</p>
                      <p className="text-xs text-gray-500 mt-2">{t('forum.by')} {ti.authorName} • {ti.createdAt.toDate().toLocaleString()}</p>
                    </div>
                  </div>
                </a>
              ))}
              {!threads.length && (
                <div className="text-center text-gray-500 py-12">{t('forum.noTopics')}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Forum;