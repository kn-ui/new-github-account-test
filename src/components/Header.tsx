import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, User, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const userName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || t('auth.user');
  const userRole = userProfile?.role as 'student' | 'teacher' | 'admin' | undefined;

  const publicNavItems = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.about'), to: '/about' },
    { label: t('nav.academic'), to: '/academic' },
    { label: t('nav.admissions'), to: '/admissions' },
    { label: t('nav.blog'), to: '/blog' },
    { label: t('nav.contact'), to: '/contact' },
  ];

  const privateNavItems: Record<string, Array<{ label: string; to: string }>> = {
    student: [
      { label: t('nav.dashboard'), to: '/dashboard' },
      { label: t('nav.courses'), to: '/courses' },
      { label: t('nav.forum'), to: '/forum' },
      { label: t('nav.calendar'), to: '/calendar' },
    ],
    teacher: [
      { label: t('nav.dashboard'), to: '/dashboard' },
      { label: t('nav.courses'), to: '/courses' },
      { label: t('nav.forum'), to: '/forum' },
      { label: t('nav.calendar'), to: '/calendar' },
    ],
    admin: [
      { label: t('nav.dashboard'), to: '/dashboard' },
      { label: t('nav.academic'), to: '/academic' },
      { label: t('nav.forum'), to: '/forum' },
      { label: t('nav.calendar'), to: '/calendar' },
    ],
  };

  const navItems = currentUser && userRole ? privateNavItems[userRole] : publicNavItems;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-blue-700 p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <Link to="/" className="cursor-pointer">
              <h1 className="text-lg font-bold text-gray-900">St. Raguel Church</h1>
              <p className="text-xs text-gray-600">Spiritual School</p>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              item.to.startsWith('/#') ? (
                <a key={item.label} href={item.to} className="text-gray-700 hover:text-blue-700 transition-colors duration-200 font-medium">
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={item.to} className="text-gray-700 hover:text-blue-700 transition-colors duration-200 font-medium">
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* User Section */}
          <div className="hidden md:flex items-center space-x-4">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
              className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700"
              aria-label="Language selector"
            >
              <option value="en">English</option>
              <option value="am">አማርኛ</option>
            </select>
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <Link to="/dashboard" className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{userName}</span>
                  {userRole && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                      {userRole}
                    </span>
                  )}
                </Link>
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <Link 
                      to="/seed-database" 
                      className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
                    >
                      🗄️ Seed DB
                    </Link>
                    <Link 
                      to="/seed-auth-users" 
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                    >
                      🔐 Auth Users
                    </Link>
                    <Link 
                      to="/test-auth-uids" 
                      className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                    >
                      🧪 Test UIDs
                    </Link>
                    <Link 
                      to="/uid-mapper" 
                      className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                    >
                      🔄 UID Mapper
                    </Link>
                    <Link 
                      to="/simple-test" 
                      className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200 transition-colors"
                    >
                      🧪 Simple Test
                    </Link>
                    <Link 
                      to="/quick-uid-fix" 
                      className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                    >
                      🔧 Quick UID Fix
                    </Link>
                    <Link 
                      to="/auth-debugger" 
                      className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded hover:bg-indigo-200 transition-colors"
                    >
                      🐛 Auth Debugger
                    </Link>
                  </>
                )}
                <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900 transition-colors">
                  {t('auth.logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-gray-700 hover:text-blue-700 transition-colors font-medium">
                  {t('auth.login')}
                </Link>
                <Link 
                  to="/login"
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium flex items-center space-x-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{t('auth.getStarted')}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
                className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700"
                aria-label="Language selector"
              >
                <option value="en">English</option>
                <option value="am">አማርኛ</option>
              </select>
            </div>
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                item.to.startsWith('/#') ? (
                  <a
                    key={item.label}
                    href={item.to}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-left text-gray-700 hover:text-blue-700 transition-colors duration-200 font-medium py-2"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-left text-gray-700 hover:text-blue-700 transition-colors duration-200 font-medium py-2"
                  >
                    {item.label}
                  </Link>
                )
              ))}
              {!currentUser && (
                <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200">
                  <Link 
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-left text-gray-700 hover:text-blue-700 transition-colors font-medium py-2"
                  >
                    {t('auth.login')}
                  </Link>
                  <Link 
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-blue-700 text-white px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium text-left"
                  >
                    {t('auth.getStarted')}
                  </Link>
                </div>
              )}
              {currentUser && (
                <button 
                  onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                  className="text-left text-gray-700 hover:text-gray-900 transition-colors font-medium py-2"
                >
                  {t('auth.logout')}
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;