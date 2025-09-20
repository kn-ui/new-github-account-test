import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';

const Admissions = () => {
  const { t } = useI18n();
  const extOnlineRegular = [
    'Photo',
    'Registration fee',
    'Academic Document (more than grade 10)',
    'Pre-exam pass point',
    'From other Sunday school: Equivalent Document and letter of transfer',
    'From different religion: Certificate of baptism',
    'Age more than 18'
  ];

  const childrenAdolescent = [
    'Photo',
    'Registration fee',
    'Academic Document (more than grade 10)',
    'Pre-exam pass point',
    'From other Sunday school: Equivalent Document and letter of transfer',
    'Birth certificate',
    'Family Profile',
    'Age less than 18'
  ];

  const youth = [
    'Certificate of continuum education',
    'Member of Sunday school',
    'Age more than 18 years'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/src/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('admissions.hero.title')}</h1>
          <p className="text-xl mb-8">{t('admissions.hero.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('admissions.extensionTitle')}</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              {extOnlineRegular.map((item, idx) => (<li key={idx}>{item}</li>))}
            </ul>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('admissions.childrenTitle')}</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              {childrenAdolescent.map((item, idx) => (<li key={idx}>{item}</li>))}
            </ul>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('admissions.youthTitle')}</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            {youth.map((item, idx) => (<li key={idx}>{item}</li>))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Admissions;