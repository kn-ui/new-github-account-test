import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, User, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const userName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'User';
  const userRole = userProfile?.role as 'student' | 'teacher' | 'admin' | undefined;

  const publicNavItems = [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
    { label: 'Academic', to: '/academic' },
    { label: 'Admissions', to: '/admissions' },
    { label: 'Blog', to: '/blog' },
    { label: 'Contact', to: '/contact' },
  ];

  const privateNavItems: Record<string, Array<{ label: string; to: string }>> = {
    student: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Courses', to: '/courses' },
      { label: 'Forum', to: '/forum' },
      { label: 'Calendar', to: '/calendar' },
    ],
    teacher: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Courses', to: '/courses' },
      { label: 'Forum', to: '/forum' },
      { label: 'Calendar', to: '/calendar' },
    ],
    admin: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Academic', to: '/academic' },
      { label: 'Forum', to: '/forum' },
      { label: 'Calendar', to: '/calendar' },
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
                <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900 transition-colors">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-gray-700 hover:text-blue-700 transition-colors font-medium">
                  Login
                </Link>
                <Link 
                  to="/signup"
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium flex items-center space-x-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Get Started</span>
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
                    Login
                  </Link>
                  <Link 
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-blue-700 text-white px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium text-left"
                  >
                    Get Started
                  </Link>
                </div>
              )}
              {currentUser && (
                <button 
                  onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                  className="text-left text-gray-700 hover:text-gray-900 transition-colors font-medium py-2"
                >
                  Logout
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