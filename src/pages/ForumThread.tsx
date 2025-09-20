import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { forumService, FirestoreForumPost, FirestoreForumThread, Timestamp } from '@/lib/firestore';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';

const ForumThread = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { t } = useI18n();
  const [thread, setThread] = useState<FirestoreForumThread | null>(null);
  const [posts, setPosts] = useState<FirestoreForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const { currentUser, userProfile } = useAuth();

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
    try {
      setPosting(true);
      const authorId = currentUser?.uid || 'anon';
      const authorName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'Anonymous';
      await forumService.createForumPost(threadId, { body: newPost.trim(), authorId, authorName });
      setNewPost('');
      await load();
    } finally {
      setPosting(false);
    }
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
              <button className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-60" disabled={posting}>
                {posting ? 'Posting…' : t('forum.create.post')}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">{t('forum.loading')}</div>
        ) : (
          <div className="space-y-4">
            {posts.map(p => (
              <div key={p.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>By {p.authorName || 'Unknown'}</span>
                  <span>{(p.createdAt as unknown as Timestamp)?.toDate?.().toLocaleString?.() || new Date(String(p.createdAt)).toLocaleString()}</span>
                </div>
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
