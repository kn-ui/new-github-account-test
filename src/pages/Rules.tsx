import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';
import { useI18n } from '@/contexts/I18nContext';
import { Users, BookOpen, Clock, AlertTriangle, Heart, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';



const Rules = () => {
  const { t } = useI18n();

  const ruleCategories = [
    {
      title: `${t('rules.ruleCategories.StudentConduct.title')}`,
      icon: Users,
      color: 'bg-blue-100 text-blue-800',
      rules: [
        `${t('rules.ruleCategories.StudentConduct.rules.0')}`,
        `${t('rules.ruleCategories.StudentConduct.rules.1')}`,
        `${t('rules.ruleCategories.StudentConduct.rules.2')}`,
        `${t('rules.ruleCategories.StudentConduct.rules.3')}`,
        `${t('rules.ruleCategories.StudentConduct.rules.4')}`
      ]
    },
    {
      title: `${t('rules.ruleCategories.AcademicStandards.title')}`,
      icon: BookOpen,
      color: 'bg-green-100 text-green-800',
      rules: [
        `${t('rules.ruleCategories.AcademicStandards.rules.0')}`,
        `${t('rules.ruleCategories.AcademicStandards.rules.1')}`,
        `${t('rules.ruleCategories.AcademicStandards.rules.2')}`,
        `${t('rules.ruleCategories.AcademicStandards.rules.3')}`,
        `${t('rules.ruleCategories.AcademicStandards.rules.4')}`
      ]
    },
    {
      title: `${t('rules.ruleCategories.AcademicPolicies.title')}`,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      rules: [
        `${t('rules.ruleCategories.AcademicPolicies.rules.0')}`,
        `${t('rules.ruleCategories.AcademicPolicies.rules.1')}`,
        `${t('rules.ruleCategories.AcademicPolicies.rules.2')}`,
        `${t('rules.ruleCategories.AcademicPolicies.rules.3')}`,
        `${t('rules.ruleCategories.AcademicPolicies.rules.4')}`
      ]
    },
    {
      title: `${t('rules.ruleCategories.CampusSafety.title')}`,
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800',
      rules: [
        `${t('rules.ruleCategories.CampusSafety.rules.0')}`,
        `${t('rules.ruleCategories.CampusSafety.rules.1')}`,
        `${t('rules.ruleCategories.CampusSafety.rules.2')}`,
        `${t('rules.ruleCategories.CampusSafety.rules.3')}`,
        `${t('rules.ruleCategories.CampusSafety.rules.4')}`
      ]
    },
    {
      title: `${t('rules.ruleCategories.SpiritualFormation.title')}`,
      icon: Heart,
      color: 'bg-purple-100 text-purple-800',
      rules: [
        `${t('rules.ruleCategories.SpiritualFormation.rules.0')}`,
        `${t('rules.ruleCategories.SpiritualFormation.rules.1')}`,
        `${t('rules.ruleCategories.SpiritualFormation.rules.2')}`,
        `${t('rules.ruleCategories.SpiritualFormation.rules.3')}`,
        `${t('rules.ruleCategories.SpiritualFormation.rules.4')}`
      ]
    },
    {
      title: `${t('rules.ruleCategories.DisciplinaryProcedures.title')}`,
      icon: FileText,
      color: 'bg-orange-100 text-orange-800',
      rules: [
        `${t('rules.ruleCategories.DisciplinaryProcedures.rules.0')}`,
        `${t('rules.ruleCategories.DisciplinaryProcedures.rules.1')}`,
        `${t('rules.ruleCategories.DisciplinaryProcedures.rules.2')}`,
        `${t('rules.ruleCategories.DisciplinaryProcedures.rules.3')}`,
        `${t('rules.ruleCategories.DisciplinaryProcedures.rules.4')}`
      ]
    }
  ];
  const downloadableDocuments = [
    {
      title: t('rules.Download.button.label'),
      description: t('rules.Download.button.subLabel'),
      size: 'PDF • 180 kb',
      icon: FileText
    }
  ];
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
        <img src="/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('rules.hero.title')}</h1>
          <p className="text-xl mb-8">{t('rules.hero.subtitle')}</p>
        </div>
      </div>

      {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-4">
          {items.map((it, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{it.title}</h3>
              <p className="text-gray-600">{it.body}</p>
            </div>
          ))}
        </div>
      </div> */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('rules.communityStandards.title')}</h2>
          <p className="text-lg text-gray-600">
            {t('rules.communityStandards.body')}
          </p>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {ruleCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <Icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{category.title}</h3>
                </div>
                <ul className="space-y-3">
                  {category.rules.map((rule, ruleIndex) => (
                    <li key={ruleIndex} className="flex items-start space-x-2 text-sm text-gray-700">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('rules.importantNotice.title')}</h3>
              <p className="text-blue-800 mb-2">
                {t('rules.importantNotice.body')}
              </p>
              <p className="text-blue-700 text-sm">
                {t('rules.importantNotice.body2')}
              </p>
            </div>
          </div>
        </div>

        {/* Download Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4"> {t('rules.Download.title')}</h2>
          <p className="text-lg text-gray-600 mb-8">
            {t('rules.Download.subTitle')}
          </p>

          <div className="flex justify-center">
            {downloadableDocuments.map((doc, index) => {
              const Icon = doc.icon;
              return (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                      <p className="text-xs text-gray-500">{doc.size}</p>
                    </div>
                    <button title='Download Document' className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors">
                      <a href="https://eu-west-2.graphassets.com/cmfa67mmp113s07ml7dd7fekg/cmhnntwcfven807msokzetwq9" download>
                        <Download className="w-5 h-5" />
                      </a>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('rules.Questions.title')}</h2>
          <p className="text-xl mb-8">
            {t('rules.Questions.body')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
              <Link to="/contact" >
                {t('rules.Questions.contactButton')}
                            </Link>
            </button>
           
          </div>
        </div>
      </div>
      <SiteFooter />

    </div>
  );
};

export default Rules;