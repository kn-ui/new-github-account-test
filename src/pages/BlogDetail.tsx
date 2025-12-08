import RichTextRenderer from '@/components/ui/RichTextRenderer';
import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FirestoreBlog } from '@/lib/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Calendar, User } from 'lucide-react';

export default function BlogDetail() {
  const { t } = useI18n();
  const { blogId } = useParams<{ blogId: string }>();
  const [blog, setBlog] = useState<FirestoreBlog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!blogId) return;
      try {
        setLoading(true);
        const ref = doc(db, 'blogs', blogId);
        const snap = await getDoc(ref);
        setBlog(snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [blogId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center text-gray-500">{t('blog.loading')}</div>
        ) : blog ? (
          <article className=" rounded-2xl shadow-md overflow-hidden">
            {(blog as any).imageUrl && (
              <img src={(blog as any).imageUrl} alt={blog.title} className="w-full h-96 object-cover" />
            )}
            <div className="p-8 md:p-12">
              <div className="flex justify-between items-center space-x-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{blog.authorName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{blog.createdAt.toDate().toLocaleDateString()}</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold text-center text-gray-900 mb-6 leading-tight">{blog.title}</h1>
              <div className="prose prose-sm max-w-none text-gray-700">
                <RichTextRenderer content={blog.content} />
              </div>
            </div>

             <div className="mb-12 text-center">
                <Link to="/updates#blogs" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm bg-white text-blue-600 border-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                  {"Back to Blogs"}
              </Link>
            </div>
          </article>
        ) : (
          <div className="text-center text-gray-500 py-16">{t('blog.notFound')}</div>
        )}
      </div>
    </div>
  );
}