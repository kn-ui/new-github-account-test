import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { announcementService, blogService, eventService, FirestoreAnnouncement, FirestoreBlog, FirestoreEvent, Timestamp } from '@/lib/firestore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Plus, Edit, Trash2 } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Updates() {
  const { t } = useI18n();
  const { currentUser, userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<FirestoreAnnouncement[]>([]);
  const [blogs, setBlogs] = useState<FirestoreBlog[]>([]);
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [blogQ, setBlogQ] = useState('');
  const [eventQ, setEventQ] = useState('');
  const [eventStatus, setEventStatus] = useState<'all'|'upcoming'|'past'>('all');
  const [blogLikes, setBlogLikes] = useState<{ [blogId: string]: { count: number; liked: boolean } }>({});
  const [blogDialogOpen, setBlogDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<FirestoreBlog | null>(null);
  const [blogForm, setBlogForm] = useState<{ title: string; content: string }>({ title: '', content: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<FirestoreBlog | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [a, b, e] = await Promise.all([
          announcementService.getAllAnnouncements(100),
          blogService.getBlogPosts(30),
          eventService.getAllEvents(),
        ]);
        setAnnouncements(a);
        setBlogs(b);
        setEvents(e);
        
        // Initialize blog likes (in a real app, this would come from the database)
        const likesData: { [blogId: string]: { count: number; liked: boolean } } = {};
        b.forEach(blog => {
          likesData[blog.id] = {
            count: Math.floor(Math.random() * 50), // Random count for demo
            liked: false
          };
        });
        setBlogLikes(likesData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    // Only show announcements with targetAudience "GENERAL_ALL"
    return announcements.filter(a => a.targetAudience === 'GENERAL_ALL');
  }, [announcements]);

  const filteredBlogs = useMemo(() => {
    const q = blogQ.toLowerCase();
    return blogs.filter(b => [b.title, b.content, b.authorName].some(v => String(v).toLowerCase().includes(q)));
  }, [blogs, blogQ]);

  const filteredEvents = useMemo(() => {
    const q = eventQ.toLowerCase();
    const now = new Date();
    return events
      .filter(ev => [ev.title, ev.description, ev.location, ev.type, ev.status].filter(Boolean).some(v => String(v).toLowerCase().includes(q)))
      .filter(ev => {
        const dt = (ev.date as Timestamp).toDate();
        if (eventStatus === 'upcoming') return dt >= now;
        if (eventStatus === 'past') return dt < now;
        return true;
      });
  }, [events, eventQ, eventStatus]);

  const handleBlogLike = (blogId: string) => {
    setBlogLikes(prev => ({
      ...prev,
      [blogId]: {
        count: prev[blogId]?.liked ? prev[blogId].count - 1 : (prev[blogId]?.count || 0) + 1,
        liked: !prev[blogId]?.liked
      }
    }));
  };

  const openBlogDialog = (blog?: FirestoreBlog) => {
    if (blog) {
      setEditingBlog(blog);
      setBlogForm({ title: blog.title, content: blog.content });
    } else {
      setEditingBlog(null);
      setBlogForm({ title: '', content: '' });
    }
    setBlogDialogOpen(true);
  };

  const handleBlogSubmit = async () => {
    if (!currentUser || !userProfile) {
      toast.error('Not authenticated');
      return;
    }

    if (!blogForm.title.trim() || !blogForm.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      if (editingBlog) {
        await blogService.updateBlogPost(editingBlog.id, {
          title: blogForm.title,
          content: blogForm.content,
        });
        toast.success('Blog post updated');
      } else {
        await blogService.createBlogPost({
          title: blogForm.title,
          content: blogForm.content,
          authorId: currentUser.uid,
          authorName: userProfile.displayName || userProfile.email || 'Unknown Author',
        });
        toast.success('Blog post created');
      }
      
      // Refresh blogs
      const updatedBlogs = await blogService.getBlogPosts(30);
      setBlogs(updatedBlogs);
      
      setBlogDialogOpen(false);
      setEditingBlog(null);
      setBlogForm({ title: '', content: '' });
    } catch (error) {
      console.error('Error saving blog:', error);
      toast.error('Failed to save blog post');
    }
  };

  const handleBlogDelete = async () => {
    if (!blogToDelete) return;
    
    try {
      await blogService.deleteBlogPost(blogToDelete.id);
      toast.success('Blog post deleted');
      
      // Refresh blogs
      const updatedBlogs = await blogService.getBlogPosts(30);
      setBlogs(updatedBlogs);
      
      setShowDeleteConfirm(false);
      setBlogToDelete(null);
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog post');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/src/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{t('updatesPage.title')}</h1>
          <p className="text-xl opacity-90">{t('updatesPage.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="announcements">
          <TabsList>
            <TabsTrigger value="announcements">{t('nav.announcements') ?? 'Announcements'}</TabsTrigger>
            <TabsTrigger value="blogs">{t('nav.blog') ?? 'Blog Posts'}</TabsTrigger>
            <TabsTrigger value="events">{t('nav.events') ?? 'Events'}</TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="mt-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600">Showing general announcements for all users</p>
            </div>
            {loading ? <div className="text-gray-500 text-center">Loading...</div> : (
              <div className="space-y-4">
                {filteredAnnouncements.map(a => (
                  <div key={a.id} className="bg-white rounded-lg border p-4">
                    <div className="text-sm text-gray-500 mb-1">{a.createdAt.toDate().toLocaleString()}</div>
                    <div className="font-semibold text-gray-900">{a.title}</div>
                    <div className="text-gray-700 mt-1">{a.body}</div>
                    {(a as any).externalLink && (
                      <div className="mt-3">
                        <a 
                          href={(a as any).externalLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline text-sm"
                        >
                          🔗 External Link
                        </a>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      {(a.courseId ? 'Course' : 'General')}{a.recipientStudentId ? ' · Direct' : ''}
                    </div>
                  </div>
                ))}
                {!filteredAnnouncements.length && <div className="text-gray-500 text-center py-8">No announcements match.</div>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="blogs" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <input value={blogQ} onChange={(e) => setBlogQ(e.target.value)} placeholder="Search blog posts..." className="w-full md:w-80 border border-gray-300 rounded px-3 py-2 text-sm" />
              {(userProfile?.role === 'teacher' || userProfile?.role === 'admin') && (
                <Button onClick={() => openBlogDialog()} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Blog Post
                </Button>
              )}
            </div>
            {loading ? <div className="text-gray-500 text-center">Loading...</div> : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredBlogs.map(b => (
                  <article key={b.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{b.authorName}</span>
                        <span>{b.createdAt.toDate().toLocaleDateString()}</span>
                      </div>
                      {(userProfile?.role === 'teacher' || userProfile?.role === 'admin') && 
                       b.authorId === currentUser?.uid && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openBlogDialog(b)}
                            className="h-6 w-6 p-0 hover:bg-blue-50"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setBlogToDelete(b); setShowDeleteConfirm(true); }}
                            className="h-6 w-6 p-0 hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold mt-2 text-gray-900 mb-3">{b.title}</h3>
                    <p className="text-gray-700 mt-2 line-clamp-3 mb-4">{b.content}</p>
                    
                    {/* Love Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBlogLike(b.id)}
                        className="flex items-center gap-2 hover:bg-red-50"
                      >
                        <Heart 
                          size={18} 
                          className={`transition-colors ${
                            blogLikes[b.id]?.liked 
                              ? 'text-red-500 fill-red-500' 
                              : 'text-gray-400 hover:text-red-500'
                          }`} 
                        />
                        <span className={`text-sm ${blogLikes[b.id]?.liked ? 'text-red-500' : 'text-gray-600'}`}>
                          {blogLikes[b.id]?.count || 0}
                        </span>
                      </Button>
                      <span className="text-xs text-gray-400">
                        {blogLikes[b.id]?.liked ? 'You liked this' : 'Click to like'}
                      </span>
                    </div>
                  </article>
                ))}
                {!filteredBlogs.length && <div className="text-gray-500 text-center py-8 col-span-2">No blog posts match.</div>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <input value={eventQ} onChange={(e) => setEventQ(e.target.value)} placeholder="Search events..." className="w-full md:w-80 border border-gray-300 rounded px-3 py-2 text-sm" />
              <select value={eventStatus} onChange={(e) => setEventStatus(e.target.value as any)} className="border border-gray-300 rounded px-2 py-1 text-sm">
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
            {loading ? <div className="text-gray-500 text-center">Loading...</div> : (
              <div className="space-y-4">
                {filteredEvents.map(ev => (
                  <div key={ev.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">{(ev.date as Timestamp).toDate().toLocaleString()}</div>
                      <div className="font-semibold text-gray-900">{ev.title}</div>
                      <div className="text-gray-700">{ev.description}</div>
                    </div>
                  </div>
                ))}
                {!filteredEvents.length && <div className="text-gray-500 text-center py-8">No events match.</div>}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Blog Dialog */}
      <Dialog open={blogDialogOpen} onOpenChange={setBlogDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBlog ? 'Edit Blog Post' : 'Create Blog Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="blog-title">Title</Label>
              <Input
                id="blog-title"
                value={blogForm.title}
                onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                placeholder="Enter blog post title"
              />
            </div>
            <div>
              <Label htmlFor="blog-content">Content</Label>
              <Textarea
                id="blog-content"
                value={blogForm.content}
                onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                placeholder="Write your blog post content here..."
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlogDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBlogSubmit} className="bg-blue-600 hover:bg-blue-700">
              {editingBlog ? 'Update' : 'Create'} Blog Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog Post</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this blog post? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlogDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}