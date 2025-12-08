import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { forumService, FirestoreForumThread, Timestamp } from '@/lib/firestore';
import { Search, MessageCircle, Eye, ThumbsUp, Plus } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { api, ForumThread as ApiThread } from '@/lib/api';
import SiteFooter from '@/components/SiteFooter';

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
  const canCreate = !!userProfile && ['super_admin','admin','teacher'].includes(userProfile.role as any);
  const isOwner = (thread: any) => userProfile && (thread.authorId === (userProfile.uid || userProfile.id));
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState('Theology');
  const [creating, setCreating] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editOpenFor, setEditOpenFor] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Theology');
  const [savingEdit, setSavingEdit] = useState(false);
  const visitorId = useMemo(() => {
    // For unauthenticated users, persist a stable id in localStorage
    const key = 'visitorId';
    let id = localStorage.getItem(key);
    if (!id) { id = crypto?.randomUUID?.() || String(Math.random()).slice(2); localStorage.setItem(key, id); }
    return (userProfile?.uid || (userProfile as any)?.id || id) as string;
  }, [userProfile]);

  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const categories = [
    'All Topics',
    'Theology',
    'Academic',
    'General'
  ];
  const categoryCounts = useMemo(() => {
    const count: Record<string, number> = { 'All Topics': threads.length, Theology: 0, Academic: 0, General: 0 };
    threads.forEach((t: any) => {
      const cat = t.category || 'General';
      if (count[cat] === undefined) count[cat] = 0;
      count[cat] += 1;
      count['All Topics'] += 0; // already set to total above
    });
    return count;
  }, [threads]);

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
        setLikedMap({});
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
            const liked = await forumService.hasVisitorLiked(t.id, visitorId);
            return { id: t.id, c, todayC, liked };
          } catch {
            return { id: t.id, c: 0, todayC: 0, liked: false };
          }
        }));

        const map: Record<string, number> = {};
        const liked: Record<string, boolean> = {};
        let total = 0;
        let today = 0;
        perThread.forEach(({ id, c, todayC, liked: lk }) => { map[id] = c; total += c; today += todayC; liked[id] = lk; });
        setReplyCounts(map);
        setLikedMap(liked);
        setTotalPosts(total);
        setTodaysPosts(today);
      } catch {
        setReplyCounts({});
        setTotalPosts(0);
        setTodaysPosts(0);
        setLikedMap({});
      }
    })();
  }, [threads, visitorId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('forum.title')}</h1>
          <p className="text-xl opacity-90">{t('forum.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('forum.searchTopics') || t('forum.searchPlaceholder')}</h3>
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
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('forum.categoriesTitle') || 'Categories'}</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between ${selectedCategory === cat ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span>{cat}</span>
                  <span className="ml-3 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full text-xs bg-gray-100 text-gray-700 flex-shrink-0">{categoryCounts[cat] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-3">
          {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4">
              <div className="text-sm text-gray-500">{t('forum.stats.totalTopics') || 'Total Topics'}</div>
              <div className="text-2xl font-semibold text-gray-900">{threads.length}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4">
              <div className="text-sm text-gray-500">{t('forum.stats.totalPosts') || 'Total Posts'}</div>
              <div className="text-2xl font-semibold text-gray-900">{totalPosts}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4">
              <div className="text-sm text-gray-500">{t('forum.stats.todaysPosts') || "Today's Posts"}</div>
              <div className="text-2xl font-semibold text-gray-900">{todaysPosts}</div>
            </div>
          </div>
          {/* Create thread button */}
          {canCreate && (
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm">
                <Plus className="w-4 h-4" /> {t('forum.newTopic')}
              </button>
            </div>
          )}

          {showCreate && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 mb-6">
              <div className="grid gap-3">
                <input value={newTitle} onChange={(e)=>setNewTitle(e.target.value)} placeholder={t('forum.create.titlePlaceholder')} className="border rounded px-3 py-2 text-sm" />
                <textarea value={newBody} onChange={(e)=>setNewBody(e.target.value)} placeholder={t('forum.create.titlePlaceholder')} rows={4} className="border rounded px-3 py-2 text-sm" />
                <select value={newCategory} onChange={(e)=>setNewCategory(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
                  {categories.filter(c=>c!=='All Topics').map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={()=>{setShowCreate(false); setNewTitle(''); setNewBody('');}} className="px-3 py-2 text-sm border rounded">Cancel</button>
                <button disabled={!newTitle.trim()||!newBody.trim()||creating} onClick={async ()=>{
                  if (!newTitle.trim()||!newBody.trim()) return; setCreating(true);
                  try {
                    await forumService.createForumThread({ title: newTitle.trim(), body: newBody.trim(), authorId: (userProfile?.uid||userProfile?.id) as any, authorName: userProfile?.displayName || 'Unknown', category: newCategory } as any);
                    setShowCreate(false); setNewTitle(''); setNewBody(''); await reload();
                  } finally { setCreating(false); }
                }} className="px-3 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-60">{creating?'Creating…':t('forum.create.post')}</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center text-gray-500">{t('forum.loading')}</div>
          ) : (
            <div className="space-y-4">
              {paginated.map((discussion: any) => (
                <a key={discussion.id} href={`/forum/${discussion.id}`} className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 hover:shadow-md transition-shadow" onClick={async ()=>{ try { await forumService.markViewedOnce(discussion.id, visitorId); } catch {} }}>
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
                          onClick={async (e) => {
                            e.preventDefault();
                            const toggled = likedMap[discussion.id];
                            try {
                              if (toggled) { await forumService.unlikeThreadOnce(discussion.id, visitorId); }
                              else { await forumService.likeThreadOnce(discussion.id, visitorId); }
                              setLikedMap((m) => ({ ...m, [discussion.id]: !toggled }));
                              // Optimistically update like count on the card without full reload
                              setThreads((prev) => prev.map((th: any) => th.id === discussion.id ? { ...th, likes: Math.max(0, (th.likes || 0) + (toggled ? -1 : 1)) } : th));
                            } catch {}
                          }}
                          className={`flex items-center gap-1 ${likedMap[discussion.id] ? 'text-blue-600' : 'hover:text-blue-600'}`}
                          aria-label="Like thread"
                        >
                          <ThumbsUp className="w-4 h-4" /> {discussion.likes ?? 0}
                        </button>
                        <span className="ml-auto">{new Date((discussion.createdAt?.toDate?.() || discussion.createdAt)).toLocaleString()}</span>
                        <span className="">· By {discussion.authorName || 'Unknown'}</span>
                        {discussion.category && <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{discussion.category}</span>}
                      </div>
                      {/* Author controls: allow edit/delete if current user is thread author and user has role */}
                      {isOwner(discussion) && canCreate && (
                        <div className="mt-3 flex gap-2 text-xs">
                          <button onClick={(e)=>{ e.preventDefault(); setEditOpenFor(discussion.id); setEditTitle(discussion.title || ''); setEditCategory(discussion.category || 'Theology'); }} className="px-2 py-1 rounded border hover:bg-gray-50">Edit</button>
                          <button onClick={(e)=>{ e.preventDefault(); setDeleteTargetId(discussion.id); }} className="px-2 py-1 rounded border hover:bg-gray-50">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              ))}
              {/* Inline Edit Dialog */}
              {editOpenFor && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                  <div className="bg-white w-full max-w-lg rounded-lg border p-5">
                    <div className="text-lg font-semibold mb-3">{t('forum.editThread')}</div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">{t('events.title_label') || 'Title'}</label>
                        <input value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" maxLength={140} />
                        <div className="text-xs text-gray-500 mt-1">{editTitle.length}/140</div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">{t('events.type_label') || 'Category'}</label>
                        <select value={editCategory} onChange={(e)=>setEditCategory(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
                          {categories.filter(c=>c!=='All Topics').map(c => (<option key={c} value={c}>{c}</option>))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-5">
                      <button onClick={()=>{ setEditOpenFor(null); }} className="px-3 py-2 text-sm border rounded">{t('forum.cancel') || t('common.cancel')}</button>
                      <button
                        disabled={!editTitle.trim()||savingEdit}
                        onClick={async ()=>{
                          if (!editOpenFor) return; if (!editTitle.trim()) return; setSavingEdit(true);
                          try {
                            await forumService.updateForumThread(editOpenFor, { title: editTitle.trim(), category: editCategory } as any);
                            setEditOpenFor(null); await reload();
                          } finally { setSavingEdit(false); }
                        }}
                        className="px-3 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-60"
                      >{savingEdit? (t('common.saving') || 'Saving…') : (t('forum.saveChanges') || t('common.saveChanges'))}</button>
                    </div>
                  </div>
                </div>
              )}
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
      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open)=>{ if (!open) setDeleteTargetId(null); }}
        onConfirm={async ()=>{ if (!deleteTargetId) return; await forumService.deleteForumThread(deleteTargetId); setDeleteTargetId(null); await reload(); }}
        title={t('forum.deleteThread')}
        description={t('forum.deleteConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="destructive"
      />
      <SiteFooter />

    </div>
  );
};

export default Forum;