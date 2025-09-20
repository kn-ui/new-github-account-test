import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';

const Rules = () => {
  const { t } = useI18n();
  const items = [
    { title: t('rules.items.respect.title'), body: t('rules.items.respect.body') },
    { title: t('rules.items.attendance.title'), body: t('rules.items.attendance.body') },
    { title: t('rules.items.dress.title'), body: t('rules.items.dress.body') },
    { title: t('rules.items.integrity.title'), body: t('rules.items.integrity.body') },
    { title: t('rules.items.facilities.title'), body: t('rules.items.facilities.body') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/src/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('rules.hero.title')}</h1>
          <p className="text-xl mb-8">{t('rules.hero.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-4">
          {items.map((it, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{it.title}</h3>
              <p className="text-gray-600">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Rules;