import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { FirestoreCourse, courseService, Timestamp } from '@/lib/firestore';
import { useI18n } from '@/contexts/I18nContext';

const Academic = () => {
  const [courses, setCourses] = useState<FirestoreCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const list = await courseService.getAllCourses(1000);
        setCourses(list);
      } catch (e) {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach(c => c.category && set.add(c.category));
    return ['All', ...Array.from(set)];
  }, [courses]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return courses.filter(c => {
      const matchesText = [c.title, c.description, c.instructorName, c.category].filter(Boolean).some(v => String(v).toLowerCase().includes(q));
      const matchesCat = categoryFilter === 'All' || c.category === categoryFilter;
      return matchesText && matchesCat;
    });
  }, [courses, query, categoryFilter]);

  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/src/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('academicPage.title')}</h1>
          <p className="text-xl mb-8">{t('academicPage.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder={t('courses.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 animate-pulse h-48" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(course => (
              <div key={course.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">{course.category || (t('common.general') as any) || 'General'}</span>
                  <span className="text-xs text-gray-500">{(course.createdAt as Timestamp).toDate().toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-3">{course.title}</h3>
                <p className="text-gray-600 mt-2 line-clamp-3">{course.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div><span className="text-gray-500">{t('courses.instructor')}:</span> <span className="font-medium text-gray-800">{course.instructorName || '—'}</span></div>
                  <div><span className="text-gray-500">{t('courses.hours')}:</span> <span className="font-medium text-gray-800">{course.duration ?? '—'}</span></div>
                  <div><span className="text-gray-500">{t('academicPage.maxStudents') || 'Max Students:'}</span> <span className="font-medium text-gray-800">{course.maxStudents ?? '—'}</span></div>
                  <div><span className="text-gray-500">{t('academicPage.status') || 'Status:'}</span> <span className={`font-medium ${course.isActive ? 'text-green-600' : 'text-gray-700'}`}>{course.isActive ? (t('academicPage.active') || 'Active') : (t('academicPage.planned') || 'Planned')}</span></div>
                </div>
                <div className="mt-5 flex gap-2">
                  <a href="/admissions" className="inline-flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">{t('academicPage.apply')}</a>
                  <a href="/contact" className="inline-flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium">{t('academicPage.contact')}</a>
                </div>
              </div>
            ))}
            {!filtered.length && (
              <div className="col-span-full text-center text-gray-500 py-12">{t('common.noResults') || 'No results found'}</div>
            )}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('academicPage.ctaTitle') || 'Ready to Start Your Academic Journey?'}</h2>
          <p className="text-xl mb-8">{t('academicPage.ctaSubtitle') || 'Take the first step towards your calling in spiritual leadership and service.'}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/admissions" className="bg-white text-blue-600 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">{t('academicPage.apply')}</a>
            <a href="/contact" className="border-2 border-white text-white px-8 py-3 rounded-md font-medium hover:bg-white hover:text-blue-600 transition-colors">{t('academicPage.contact')}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Academic;