/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, LogIn, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

import mainLogo from '/assets/main-logo.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const location = useLocation();
  const [academicMobileOpen, setAcademicMobileOpen] = useState(false);
  const [academicOpen, setAcademicOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const userName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || t('auth.user');

  // Exclude Academic and Home from base list; Home will be rendered first
  const baseNavItems = [
    { label: t('nav.forum'), to: '/forum' },
    { label: t('nav.contact'), to: '/contact' },
  ];

  const navItems = currentUser ? [{ label: t('nav.dashboard'), to: '/dashboard' }, ...baseNavItems] : baseNavItems;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto pt-2 pb-2 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center">
              <img src={mainLogo} alt="St. Raguel Church" className="w-[70px] h-[70px] rounded-full" />
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-bold text-gray-900">St. Raguel Church</div>
              <div className="text-sm text-gray-600">Spiritual School</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {/* Home first */}
            <Link to="/" className={`${location.pathname === '/' ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}>{t('nav.home')}</Link>

            {/* Dashboard (when logged in) */}
            {currentUser && (
              <Link to="/dashboard" className={`${location.pathname.startsWith('/dashboard') ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}>{t('nav.dashboard')}</Link>
            )}

            {/* Academic dropdown: click to open */}
            <div
              className="relative"
            >
              <button
                className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium flex items-center"
                onClick={() => setAcademicOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={academicOpen}
              >
                {t('nav.academic')} <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              <div className={`${academicOpen ? 'block' : 'hidden'} absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50`}>
                <Link to="/academic" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{t('nav.academic')}</Link>
                <Link to="/admissions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{t('nav.admissions')}</Link>
                <Link to="/calendar" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{t('nav.calendar')}</Link>
                <Link to="/rules" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{t('nav.rulesAndRegulations')}</Link>
              </div>
            </div>

            {/* Updates link */}
            <Link to="/updates" className={`${location.pathname.startsWith('/updates') ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}>{t('nav.updates')}</Link>

            {/* Remaining items */}
            {baseNavItems.map((item) => (
              <Link key={item.label} to={item.to} className={`${location.pathname.startsWith(item.to) ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
                className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 pr-7 appearance-none bg-white"
                aria-label="Language selector"
              >
                <option value="en">English</option>
                <option value="am">አማርኛ</option>
              </select>
              <Globe className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {!currentUser ? (
              <>
                <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  {t('auth.getStarted')}
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{userName}</span>
                </Link>
                <button onClick={handleLogout} className="text-gray-700 hover:text-gray-900 flex items-center text-sm font-medium">
                  <LogOut className="w-4 h-4 mr-1" /> {t('auth.logout')}
                </button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-2">
            {!currentUser && (
              <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
                <LogIn className="w-4 h-4" />
              </Link>
            )}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 hover:text-gray-800 p-2">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Home first */}
              <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md" onClick={() => setIsMenuOpen(false)}>
                {t('nav.home')}
              </Link>

              {/* Dashboard (when logged in) */}
              {currentUser && (
                <Link to="/dashboard" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md" onClick={() => setIsMenuOpen(false)}>
                  {t('nav.dashboard')}
                </Link>
              )}

              {/* Academic mobile dropdown */}
              <button
                onClick={() => setAcademicMobileOpen(!academicMobileOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              >
                {t('nav.academic')}
                <ChevronDown className={`w-4 h-4 transition-transform ${academicMobileOpen ? 'rotate-180' : ''}`} />
              </button>
              {academicMobileOpen && (
                <div className="pl-4 space-y-1">
                  <Link to="/academic" className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md" onClick={() => setIsMenuOpen(false)}>
                    {t('nav.academic')}
                  </Link>
                  <Link to="/admissions" className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md" onClick={() => setIsMenuOpen(false)}>
                    {t('nav.admissions')}
                  </Link>
                  <Link to="/calendar" className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md" onClick={() => setIsMenuOpen(false)}>
                    {t('nav.calendar')}
                  </Link>
                  <Link to="/rules" className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md" onClick={() => setIsMenuOpen(false)}>
                    Rules and Regulations
                  </Link>
                </div>
              )}

              {/* Updates link (mobile) */}
              <Link to="/updates" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md" onClick={() => setIsMenuOpen(false)}>
                Updates
              </Link>

              {/* Remaining items */}
              {baseNavItems.map((item) => (
                <Link key={item.label} to={item.to} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md" onClick={() => setIsMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
              {currentUser && (
                <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                  {t('auth.logout')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;