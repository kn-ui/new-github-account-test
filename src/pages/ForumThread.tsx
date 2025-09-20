import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { forumService, FirestoreForumPost, FirestoreForumThread, Timestamp } from '@/lib/firestore';
import { ThumbsUp } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const ForumThread = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { t } = useI18n();
  const [thread, setThread] = useState<FirestoreForumThread | null>(null);
  const [posts, setPosts] = useState<FirestoreForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const { currentUser, userProfile } = useAuth();
  const visitorId = useMemo(() => {
    const key = 'visitorId';
    let id = localStorage.getItem(key);
    if (!id) { id = crypto?.randomUUID?.() || String(Math.random()).slice(2); localStorage.setItem(key, id); }
    return id;
  }, []);

  // Mark a unique view per visitor on thread open
  useEffect(() => {
    if (!threadId) return;
    forumService.markViewedOnce(threadId, (currentUser?.uid || visitorId) as string).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [postLikedMap, setPostLikedMap] = useState<Record<string, boolean>>({});

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

  // Load liked state for replies
  useEffect(() => {
    if (!threadId || posts.length === 0) { setPostLikedMap({}); return; }
    let cancelled = false;
    (async () => {
      try {
        const visitor = (currentUser?.uid || visitorId) as string;
        const results = await Promise.all(posts.map(async (p) => {
          try {
            const liked = await forumService.hasVisitorLikedPost(threadId, p.id, visitor);
            return { id: p.id, liked };
          } catch {
            return { id: p.id, liked: false };
          }
        }));
        if (cancelled) return;
        const map: Record<string, boolean> = {};
        results.forEach(r => { map[r.id] = r.liked; });
        setPostLikedMap(map);
      } catch {
        if (!cancelled) setPostLikedMap({});
      }
    })();
    return () => { cancelled = true; };
  }, [threadId, posts, currentUser?.uid, visitorId]);

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
        {thread && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>By {thread.authorName || 'Unknown'}</span>
              <span>{(thread.createdAt as unknown as Timestamp)?.toDate?.().toLocaleString?.() || ''}</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{thread.title}</h2>
            {thread.body && <div className="text-gray-800 whitespace-pre-wrap">{thread.body}</div>}
          </div>
        )}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <form onSubmit={onCreatePost} className="space-y-3">
            <textarea
              className="w-full border rounded p-3"
              rows={4}
              placeholder={t('forum.create.titlePlaceholder')}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
            {!currentUser && (
              <div className="text-xs text-gray-500">{t('forum.publicReplyWarning')}</div>
            )}
            <div className="flex justify-end">
              <button className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-60" disabled={posting || !currentUser}>
                {posting ? (t('forum.posting') || 'Posting...') : t('forum.reply')}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">{t('forum.loading')}</div>
        ) : (
          <div className="space-y-4">
            {posts.map(p => {
              const canEdit = !!currentUser && (p.authorId === currentUser.uid);
              const postLiked = !!postLikedMap[p.id];
              return (
                <div key={p.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>By {p.authorName || 'Unknown'}</span>
                    <span>{(p.createdAt as unknown as Timestamp)?.toDate?.().toLocaleString?.() || new Date(String(p.createdAt)).toLocaleString()}</span>
                  </div>
                  {editId === p.id ? (
                    <div className="space-y-2">
                      <textarea value={editBody} onChange={(e)=>setEditBody(e.target.value)} rows={4} className="w-full border rounded p-2 text-sm" />
                      <div className="flex gap-2 justify-end">
                        <button onClick={()=>{ setEditId(null); setEditBody(''); }} className="px-3 py-1 text-sm border rounded">Cancel</button>
                        <button disabled={!editBody.trim()||savingEdit} onClick={async ()=>{
                          if (!threadId || !editId || !editBody.trim()) return; setSavingEdit(true);
                          try { await forumService.updateForumPost(threadId, editId, { body: editBody.trim() } as any); setEditId(null); setEditBody(''); await load(); }
                          finally { setSavingEdit(false); }
                        }} className="px-3 py-1 text-sm rounded bg-blue-600 text-white disabled:opacity-60">{savingEdit?'Saving…':'Save'}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-gray-800">{p.body}</div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={async ()=>{
                        if (!threadId) return;
                        try {
                          const visitor = (currentUser?.uid || visitorId) as string;
                          if (postLiked) { await forumService.unlikePostOnce(threadId, p.id, visitor); setPostLikedMap((m) => ({ ...m, [p.id]: false })); }
                          else { await forumService.likePostOnce(threadId, p.id, visitor); setPostLikedMap((m) => ({ ...m, [p.id]: true })); }
                        } catch {}
                      }}
                      className={`flex items-center gap-1 text-xs ${postLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                    >
                      <ThumbsUp className="w-3 h-3" /> {postLiked ? 'Liked' : 'Like'}
                    </button>
                    {canEdit && editId !== p.id && (
                      <div className="flex gap-2 text-xs">
                        <button onClick={()=>{ setEditId(p.id); setEditBody(p.body); }} className="px-2 py-1 border rounded hover:bg-gray-50">Edit</button>
                        <button onClick={()=> setDeleteId(p.id)} className="px-2 py-1 border rounded hover:bg-gray-50">Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {!posts.length && (
              <div className="text-center text-gray-500 py-12">{t('forum.noTopics')}</div>
            )}
          </div>
        )}
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open)=>{ if (!open) setDeleteId(null); }}
          onConfirm={async ()=>{ if (!threadId || !deleteId) return; await forumService.deleteForumPost(threadId, deleteId); setDeleteId(null); await load(); }}
          title={t('forum.deleteReply') || 'Delete Reply'}
          description={t('forum.deleteReplyConfirm') || 'Are you sure you want to delete this reply? This action cannot be undone.'}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          variant="destructive"
        />
      </div>
    </div>
  );
};

export default ForumThread;
