import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { blogService, FirestoreBlog } from '@/lib/firestore';
import { Search } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

const Blog = () => {
  const [posts, setPosts] = useState<FirestoreBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const { t } = useI18n();

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
        console.log('🔄 Loading blog posts...');
        const allPosts = await blogService.getBlogPosts(20);
        console.log('📖 Blog posts loaded:', allPosts);
        
        // Filter posts based on search query and category
        let filteredPosts = allPosts;
        
        if (q) {
          filteredPosts = filteredPosts.filter(post => 
            post.title.toLowerCase().includes(q.toLowerCase()) ||
            post.content.toLowerCase().includes(q.toLowerCase())
          );
        }
        
        if (category !== 'all') {
          // Note: We'll need to add category field to blog posts later
          // For now, just show all posts
        }
        
        console.log('🔍 Filtered posts:', filteredPosts);
        setPosts(filteredPosts);
      } catch (error) {
        console.error('❌ Failed to load blog posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [q, category]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm border-b p-6 rounded">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
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

        <section className="py-8">
          {loading ? (
            <div className="text-center text-gray-500">{t('blog.loading')}</div>
          ) : posts.length ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {posts.map(post => (
                <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors line-clamp-2">{post.title}</h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.content.substring(0, 150)}...</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{post.authorName}</span>
                      <span>{post.createdAt.toDate().toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-sm text-gray-500">❤️ {post.likes} likes</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">{t('blog.noPosts')}</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Blog;