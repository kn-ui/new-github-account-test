import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FirestoreBlog } from '@/lib/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center text-gray-500">{t('blog.loading')}</div>
        ) : blog ? (
          <article className="bg-white rounded-lg border p-6">
            <div className="text-sm text-gray-500 flex items-center justify-between">
              <span>{blog.authorName}</span>
              <span>{blog.createdAt.toDate().toLocaleString()}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-3">{blog.title}</h1>
            <div className="prose max-w-none mt-6 text-gray-800 whitespace-pre-wrap">
              {blog.content}
            </div>
          </article>
        ) : (
          <div className="text-center text-gray-500">{t('blog.notFound')}</div>
        )}
      </div>
    </div>
  );
}