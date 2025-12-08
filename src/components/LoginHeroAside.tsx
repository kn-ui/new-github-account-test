import { ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

import logo from '/assets/logo.jpg';
import { useI18n } from '@/contexts/I18nContext';

const LoginHeroAside = () => {
  const { t } = useI18n();
  return (
    <aside className="hidden lg:block w-1/2 bg-gradient-to-br from-blue-600 to-[#13A0E2] relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img src="/assets/message-from-school-img.png" alt="Campus" className="w-full h-full object-cover" />
      </div>
      <div className="relative z-10 h-full flex flex-col justify-center p-16 text-white">
        <div className="flex items-center gap-3">
          <img src={logo} alt={t('auth.user')} className="h-16 w-auto rounded-lg" />
          <div>
            <h3 className="text-2xl font-bold">{t('site.brand',)}</h3>
            <p className="text-sm text-white/80">{t('site.taglineShort')}</p>
          </div>
        </div>
        <h2 className="mt-8 text-4xl font-extrabold leading-tight">{t('loginAside.headline')}</h2>
        <p className="mt-3 text-white/90 max-w-lg">{t('loginAside.subtitle')}</p>
        <div className="mt-8">
          <Link to="/courses" className="inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-md font-semibold">
            {t('loginAside.explore')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default LoginHeroAside;

