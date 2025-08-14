import React, { useState } from 'react';
import { Menu, X, BookOpen, User, LogIn } from 'lucide-react';

interface HeaderProps {
  isAuthenticated?: boolean;
  userRole?: 'student' | 'teacher' | 'admin';
  userName?: string;
  onNavigate?: (view: string) => void;
}

export default function Header({ isAuthenticated = false, userRole, userName, onNavigate }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const publicNavItems = [
    { label: 'Home', view: 'home' },
    { label: 'About', view: 'about' },
    { label: 'Academic', view: 'academic' },
    { label: 'Admissions', view: 'admissions' },
    { label: 'Blog', view: 'blog' },
    { label: 'Contact', view: 'contact' },
  ];

  const privateNavItems = {
    student: [
      { label: 'Dashboard', view: 'dashboard' },
      { label: 'Courses', view: 'catalog' },
      { label: 'Forum', view: 'forum' },
      { label: 'Calendar', view: 'calendar' },
    ],
    teacher: [
      { label: 'Dashboard', view: 'dashboard' },
      { label: 'Courses', view: 'catalog' },
      { label: 'Forum', view: 'forum' },
      { label: 'Calendar', view: 'calendar' },
    ],
    admin: [
      { label: 'Dashboard', view: 'dashboard' },
      { label: 'Academic', view: 'academic' },
      { label: 'Forum', view: 'forum' },
      { label: 'Calendar', view: 'calendar' },
    ],
  };

  const navItems = isAuthenticated && userRole ? privateNavItems[userRole] : publicNavItems;

  const handleNavClick = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    }
    setIsMenuOpen(false);
  };
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-blue-700 p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div 
              className="cursor-pointer"
              onClick={() => handleNavClick('home')}
            >
              <h1 className="text-lg font-bold text-gray-900">St. Raguel Church</h1>
              <p className="text-xs text-gray-600">Spiritual School</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.view)}
                className="text-gray-700 hover:text-blue-700 transition-colors duration-200 font-medium"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* User Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{userName}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                    {userRole}
                  </span>
                </div>
                <button className="text-gray-600 hover:text-gray-900 transition-colors">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button className="text-gray-700 hover:text-blue-700 transition-colors font-medium">
                  Login
                </button>
                <button 
                  onClick={() => handleNavClick('login')}
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium flex items-center space-x-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Get Started</span>
                </button>
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
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.view)}
                  className="text-left text-gray-700 hover:text-blue-700 transition-colors duration-200 font-medium py-2"
                >
                  {item.label}
                </button>
              ))}
              {!isAuthenticated && (
                <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => handleNavClick('login')}
                    className="text-left text-gray-700 hover:text-blue-700 transition-colors font-medium py-2"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => handleNavClick('login')}
                    className="bg-blue-700 text-white px-4 py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium text-left"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}