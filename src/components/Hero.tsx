import { Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';

const Hero = () => {
  const { t } = useI18n();
  return (
    <div className="bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('hero.title1')}<br />
              {t('hero.title2Prefix')} <span className="text-yellow-300">{t('hero.title2Highlight')}</span>
            </h1>
            <p className="text-xl mb-8">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/admissions"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                {t('hero.applyNow')}
              </Link>
              <Link 
                to="/academic"
                className="border-2 border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white hover:text-blue-600 transition-colors"
              >
                {t('hero.explorePrograms')}
              </Link>
            </div>
          </div>
          <div>
            <img 
              src="/assets/hero-img.png"
              alt="Orthodox Church"
              className="w-full h-100 object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;