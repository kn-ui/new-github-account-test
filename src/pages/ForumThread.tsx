import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { forumService, FirestoreForumPost, FirestoreForumThread } from '@/lib/firestore';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';

const ForumThread = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { t } = useI18n();
  const [thread, setThread] = useState<FirestoreForumThread | null>(null);
  const [posts, setPosts] = useState<FirestoreForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');

  const load = async () => {
    if (!threadId) return;
    setLoading(true);
    try {
      const tdata = await forumService.getForumThreadById(threadId);
      setThread(tdata);
      const list = await forumService.getForumPosts(threadId, 200);
      setPosts(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const onCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadId || !newPost.trim()) return;
    await forumService.createForumPost(threadId, { body: newPost.trim(), authorId: 'anon', authorName: 'Anonymous' });
    setNewPost('');
    await load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <Link to="/forum" className="text-blue-600 hover:underline">{t('nav.forum')}</Link>
          {thread && <div className="text-sm text-gray-600">{thread.title}</div>}
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <form onSubmit={onCreatePost} className="space-y-3">
            <textarea
              className="w-full border rounded p-3"
              rows={4}
              placeholder={t('forum.create.titlePlaceholder')}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
            <div className="flex justify-end">
              <button className="bg-blue-600 text-white rounded px-4 py-2">{t('forum.create.post')}</button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">{t('forum.loading')}</div>
        ) : (
          <div className="space-y-4">
            {posts.map(p => (
              <div key={p.id} className="bg-white rounded-lg shadow-sm border p-4">
                <p className="text-sm text-gray-500 mb-2">{t('forum.by')} {p.createdByName} • {new Date(p.createdAt).toLocaleString()}</p>
                <div className="whitespace-pre-wrap text-gray-800">{p.body}</div>
              </div>
            ))}
            {!posts.length && (
              <div className="text-center text-gray-500 py-12">{t('forum.noTopics')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumThread;
