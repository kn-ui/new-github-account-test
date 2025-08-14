import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { api, ForumThread } from '@/lib/api';
import { Search } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

const Forum = () => {
  const [threads, setThreads] = useState<ForumThread[]>([]);
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
      const resp = await api.getForumThreads({ category: category === 'all' ? undefined : category, page: 1, limit: 20 });
      let data = resp.success && Array.isArray(resp.data) ? resp.data : [];
      if (q) data = data.filter(ti => ti.title.toLowerCase().includes(q.toLowerCase()));
      setThreads(data);
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
    await api.createForumThread({ title: newThreadTitle.trim(), category: newThreadCategory });
    setNewThreadTitle('');
    await reload();
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
                      <div className="flex items-center space-x-2 mb-2">
                        {ti.pinned && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">{t('forum.pinned')}</span>
                        )}
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800 capitalize">{t(`forum.categories.${ti.category}`)}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{ti.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{t('forum.by')} {ti.createdByName} • {new Date(ti.createdAt).toLocaleString()}</p>
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