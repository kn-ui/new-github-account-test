import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { forumService, FirestoreForumThread } from '@/lib/firestore';
import { Search, MessageCircle, Eye, ThumbsUp } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

const Forum = () => {
  const [threads, setThreads] = useState<FirestoreForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const { t } = useI18n();

  const reload = async () => {
    setLoading(true);
    try {
      const allThreads = await forumService.getForumThreads(50);
      const data = q ? allThreads.filter(ti => ti.title.toLowerCase().includes(q.toLowerCase())) : allThreads;
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
  }, [q]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/src/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Discussion Forum</h1>
          <p className="text-xl mb-8">Engage in Meaningful Conversations with Our Community</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-xl mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('forum.searchPlaceholder')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">{t('forum.loading')}</div>
        ) : (
          <div className="space-y-4">
            {threads.map((discussion) => (
              <a key={discussion.id} href={`/forum/${discussion.id}`} className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold text-sm">{discussion.authorName?.slice(0,2) ?? 'U'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Topic</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-2">{discussion.title}</div>
                    <div className="text-xs text-gray-500">{t('forum.by')} {discussion.authorName} • {discussion.createdAt.toDate().toLocaleString()}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                      <div className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> 0</div>
                      <div className="flex items-center gap-1"><Eye className="w-4 h-4" /> —</div>
                      <div className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> —</div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
            {!threads.length && <div className="text-center text-gray-500 py-12">{t('forum.noTopics')}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Forum;