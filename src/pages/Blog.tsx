import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { blogService, FirestoreBlog } from '@/lib/firestore';
import { Search } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { api, BlogPost } from '@/lib/api';

const Blog = () => {
  const [posts, setPosts] = useState<FirestoreBlog[] | BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const { t } = useI18n();
  const { currentUser } = useAuth();

  const categories = [
    { value: 'all', label: t('blog.categories.all') },
    { value: 'theology', label: t('blog.categories.theology') },
    { value: 'spirituality', label: t('blog.categories.spirituality') },
    { value: 'community', label: t('blog.categories.community') },
    { value: 'education', label: t('blog.categories.education') },
    { value: 'events', label: t('blog.categories.events') }
  ];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let allPosts: any[] = [];
        if (currentUser) {
          allPosts = await blogService.getBlogPosts(20);
        } else {
          const resp = await api.getBlogPosts({ limit: 20, q });
          allPosts = resp.success ? (resp.data || []) : [];
        }
        let filteredPosts: any[] = allPosts;
        if (q) {
          filteredPosts = filteredPosts.filter((post: any) => 
            String(post.title || '').toLowerCase().includes(q.toLowerCase()) ||
            String(post.content || '').toLowerCase().includes(q.toLowerCase())
          );
        }
        if (category !== 'all') {
          // optional future filter by category
        }
        setPosts(filteredPosts);
      } catch (error) {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [q, category, currentUser]);

  const formatDate = (d: any) => {
    try {
      if (d?.toDate) return d.toDate().toLocaleDateString();
      if (typeof d === 'string') return new Date(d).toLocaleDateString();
      return '';
    } catch { return ''; }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/src/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('blog.title') ?? 'Updates & Blog'}</h1>
          <p className="text-xl mb-8">{t('blog.subtitle') ?? 'News, updates, and stories from our community'}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('blog.searchPlaceholder')}
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

        {loading ? (
          <div className="text-center text-gray-500">{t('blog.loading')}</div>
        ) : posts.length ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {posts.map((post: any) => (
              <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors line-clamp-2">{post.title}</h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">{String(post.content || post.excerpt || '').substring(0, 200)}...</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{post.authorName}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">{t('blog.noPosts')}</div>
        )}
      </div>
    </div>
  );
};

export default Blog;