import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogIn, Globe, Menu, X } from 'lucide-react';
// import { useLanguage } from '../contexts/LanguageContext';

const Header: React.FC = () => {
  const [academicDropdown, setAcademicDropdown] = useState(false);
  const [updatesDropdown, setUpdatesDropdown] = useState(false);
  const [languageDropdown, setLanguageDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAcademicOpen, setMobileAcademicOpen] = useState(false);
  const [mobileUpdatesOpen, setMobileUpdatesOpen] = useState(false);
  // const { language, setLanguage, t } = useLanguage();
  const [language, setLanguage] = useState('en');

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileAcademicOpen(false);
    setMobileUpdatesOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto pt-2 pb-2 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center">
              <div className="w-[70px] h[70px] rounded-full flex items-center justify-center">
                <img src="../../asset/main-logo.png" alt="" />
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">St. Raguel Church</div>
              <div className="text-sm text-gray-600">Spiritual School</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            <Link to="/" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Home
            </Link>


            {/* Academic Dropdown */}
            <div
              className="relative group"
              onClick={() => setAcademicDropdown((prev) => !prev)}
            >
              <button className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium flex items-center">
                Academic <ChevronDown className="ml-1 w-4 h-4" />
              </button>
              {academicDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <Link to="/academic" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Academic Programs
                  </Link>
                  <Link to="/admission" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Admission
                  </Link>
                  <Link to="/calendar" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Calendar
                  </Link>
                  <Link to="/rules" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Rules and Regulation
                  </Link>
                </div>
              )}
            </div>

            {/* Updates Dropdown */}
            
            <Link to="/blog" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Updates
            </Link>

            <Link to="/forum" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Forum
            </Link>

            <Link to="/contact" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Contact
            </Link>
          </nav>

          {/* Right side buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Dropdown */}
            <div
              className="relative"
              onClick={() => setLanguageDropdown((prev) => !prev)}

            >
              <button className="text-gray-600 hover:text-gray-800 flex items-center text-sm">
                <Globe className="w-4 h-4 mr-1" />
                {language === 'en' ? 'English' : 'አማርኛ'}
                <ChevronDown className="ml-1 w-4 h-4" />
              </button>
              {languageDropdown && (
                <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${language === 'en' ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLanguage('am')}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${language === 'am' ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                  >
                    አማርኛ
                  </button>
                </div>
              )}
            </div>

            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <LogIn className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-800 p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                onClick={closeMobileMenu}
              >
                Home
              </Link>

              <Link
                to="/about"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                onClick={closeMobileMenu}
              >
                About Us
              </Link>

              {/* Mobile Academic Dropdown */}
              <div>
                <button
                  onClick={() => setMobileAcademicOpen(!mobileAcademicOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                >
                  Academic
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${mobileAcademicOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileAcademicOpen && (
                  <div className="pl-4 space-y-1">
                    <Link
                      to="/academic"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                      onClick={closeMobileMenu}
                    >
                      Academic Programs
                    </Link>
                    <Link
                      to="/admission"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                      onClick={closeMobileMenu}
                    >
                      Admission
                    </Link>
                    <Link
                      to="/calendar"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                      onClick={closeMobileMenu}
                    >
                      Calendar
                    </Link>
                    <Link
                      to="/rules"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                      onClick={closeMobileMenu}
                    >
                      Rules and Regulation
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Updates Dropdown */}
              <div>
                <button
                  onClick={() => setMobileUpdatesOpen(!mobileUpdatesOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                >
                  Updates
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${mobileUpdatesOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileUpdatesOpen && (
                  <div className="pl-4 space-y-1">
                    <Link
                      to="/blog"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                      onClick={closeMobileMenu}
                    >
                      Blog
                    </Link>
                    <Link
                      to="/announcements"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                      onClick={closeMobileMenu}
                    >
                      Announcements
                    </Link>
                  </div>
                )}
              </div>

              <Link
                to="/forum"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                onClick={closeMobileMenu}
              >
                Discussion Forum
              </Link>

              <Link
                to="/contact"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                onClick={closeMobileMenu}
              >
                Contact
              </Link>

              {/* Mobile Language Selector */}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-500 mb-2">Language</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setLanguage('en');
                        closeMobileMenu();
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm rounded-md ${language === 'en' ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('am');
                        closeMobileMenu();
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm rounded-md ${language === 'am' ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      አማርኛ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;