import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';
import { useI18n } from '@/contexts/I18nContext';

const Admissions = () => {
  const { t } = useI18n();
  const extOnlineRegular = [
    `${t('admissions.card1.point1')}`,
    `${t('admissions.card1.point2')}`,
    `${t('admissions.card1.point3')}`,
    `${t('admissions.card1.point4')}`,
  ];

  const childrenAdolescent = [
    `${t('admissions.card2.point1')}`,
    `${t('admissions.card2.point2')}`,
    `${t('admissions.card2.point3')}`,
    `${t('admissions.card2.point4')}`
  ];

  const youth = [
    `${t('admissions.card3.point1')}`,
    `${t('admissions.card3.point2')}`,
    `${t('admissions.card3.point3')}`
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('admissions.title')}</h1>
          <p className="text-xl mb-8">{t('admissions.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('admissions.card1.title')}</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              {extOnlineRegular.map((item, idx) => (<li key={idx}>{item}</li>))}
            </ul>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('admissions.card2.title')}</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              {childrenAdolescent.map((item, idx) => (<li key={idx}>{item}</li>))}
            </ul>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('admissions.card3.title')}</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            {youth.map((item, idx) => (<li key={idx}>{item}</li>))}
          </ul>
        </div>
      </div>
      <SiteFooter />

    </div>
  );
};

export default Admissions;