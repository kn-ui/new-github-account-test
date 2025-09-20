import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';

const About = () => {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/src/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('about.hero.title')}</h1>
          <p className="text-xl mb-8">{t('about.hero.subtitle')}</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('about.mission.title')}</h2>
            <p className="text-lg text-gray-600 mb-6">{t('about.mission.p1')}</p>
            <p className="text-gray-600">{t('about.mission.p2')}</p>
          </div>
          <div>
            <img src="https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg" alt="Students in classroom" className="w-full h-80 object-cover rounded-lg shadow-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { icon: '📖', title: t('about.values.academic.title'), desc: t('about.values.academic.desc') },
            { icon: '❤️', title: t('about.values.spiritual.title'), desc: t('about.values.spiritual.desc') },
            { icon: '👥', title: t('about.values.community.title'), desc: t('about.values.community.desc') },
            { icon: '🏆', title: t('about.values.tradition.title'), desc: t('about.values.tradition.desc') },
          ].map((v, i) => (
            <div key={i} className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">{v.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{v.title}</h3>
              <p className="text-sm text-gray-600">{v.desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">{t('about.history.title')}</h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="mb-4">{t('about.history.p1')}</p>
            <p className="mb-4">{t('about.history.p2')}</p>
            <p>{t('about.history.p3')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;