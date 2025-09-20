import { Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';

const SiteFooter = () => {
  const { t } = useI18n();
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img src="/src/assets/main-logo.png" alt="Orthodox Church" className="w-[70px] h-[70px] rounded-full" />
              <div>
                <div className="text-lg font-bold">St. Raguel Church</div>
                <div className="text-sm text-gray-400">Spiritual School</div>
              </div>
            </div>
            <p className="text-sm text-gray-400">{t('footer.tagline')}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <div className="space-y-2">
              <Link to="/about" className="block text-sm text-gray-400 hover:text-white">{t('footer.about')}</Link>
              <Link to="/academic" className="block text-sm text-gray-400 hover:text-white">{t('footer.academicPrograms')}</Link>
              <Link to="/admissions" className="block text-sm text-gray-400 hover:text-white">{t('footer.admissions')}</Link>
              <Link to="/calendar" className="block text-sm text-gray-400 hover:text-white">{t('footer.academicCalendar')}</Link>
              <Link to="/rules" className="block text-sm text-gray-400 hover:text-white">{t('footer.rules')}</Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.resources')}</h3>
            <div className="space-y-2">
              <Link to="/updates" className="block text-sm text-gray-400 hover:text-white">{t('footer.latestUpdates')}</Link>
              <Link to="/forum" className="block text-sm text-gray-400 hover:text-white">{t('footer.discussionForum')}</Link>
              <Link to="/login" className="block text-sm text-gray-400 hover:text-white">{t('footer.studentPortal')}</Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.contact')}</h3>
            <div className="space-y-3 text-sm text-gray-400">
              <div>Addis Ketema Sub city , Merkato St, raguel Church</div>
              <div>+251 112784646</div>
              <div>info@straguelschool.org</div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} {t('footer.copyright')}</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link to="/privacy" className="text-sm text-gray-400 hover:text-white">{t('footer.privacy')}</Link>
            <Link to="/terms" className="text-sm text-gray-400 hover:text-white">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;

