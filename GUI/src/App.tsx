import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import FeaturedCourses from './components/FeaturedCourses';
import AboutPage from './components/AboutPage';
import AcademicPage from './components/AcademicPage';
import AdmissionsPage from './components/AdmissionsPage';
import CalendarPage from './components/CalendarPage';
import RulesPage from './components/RulesPage';
import BlogPage from './components/BlogPage';
import ContactPage from './components/ContactPage';
import ForumPage from './components/ForumPage';
import LoginForm from './components/LoginForm';
import StudentDashboard from './components/dashboards/StudentDashboard';
import TeacherDashboard from './components/dashboards/TeacherDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import CourseCatalog from './components/CourseCatalog';

type UserRole = 'student' | 'teacher' | 'admin';
type ViewMode = 'home' | 'about' | 'academic' | 'admissions' | 'calendar' | 'rules' | 'blog' | 'contact' | 'forum' | 'login' | 'dashboard' | 'catalog';

function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName] = useState('John Doe');

  // Demo function to simulate login
  const simulateLogin = (role: UserRole) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setCurrentView('dashboard');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentView('home');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'about':
        return <AboutPage />;
      case 'academic':
        return <AcademicPage />;
      case 'admissions':
        return <AdmissionsPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'rules':
        return <RulesPage />;
      case 'blog':
        return <BlogPage />;
      case 'contact':
        return <ContactPage />;
      case 'forum':
        return <ForumPage />;
      case 'login':
        return <LoginForm />;
      case 'dashboard':
        if (!isAuthenticated || !userRole) return <LoginForm />;
        switch (userRole) {
          case 'student':
            return <StudentDashboard />;
          case 'teacher':
            return <TeacherDashboard />;
          case 'admin':
            return <AdminDashboard />;
          default:
            return <LoginForm />;
        }
      case 'catalog':
        return <CourseCatalog />;
      default:
        return (
          <>
            <Hero />
            <FeaturedCourses />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView !== 'login' && (
        <Header 
          isAuthenticated={isAuthenticated} 
          userRole={userRole || undefined} 
          userName={userName}
          onNavigate={setCurrentView}
        />
      )}
      
      {renderCurrentView()}
      
      {/* Demo Controls - Remove in production */}
      {currentView === 'home' && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
          <p className="text-sm font-medium text-gray-700 mb-3">Demo Navigation:</p>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setCurrentView('about')}
                className="w-full bg-teal-600 text-white px-3 py-2 rounded text-xs hover:bg-teal-700 transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => setCurrentView('academic')}
                className="w-full bg-purple-600 text-white px-3 py-2 rounded text-xs hover:bg-purple-700 transition-colors"
              >
                Academic
              </button>
              <button 
                onClick={() => setCurrentView('admissions')}
                className="w-full bg-green-600 text-white px-3 py-2 rounded text-xs hover:bg-green-700 transition-colors"
              >
                Admissions
              </button>
              <button 
                onClick={() => setCurrentView('calendar')}
                className="w-full bg-yellow-600 text-white px-3 py-2 rounded text-xs hover:bg-yellow-700 transition-colors"
              >
                Calendar
              </button>
              <button 
                onClick={() => setCurrentView('rules')}
                className="w-full bg-red-600 text-white px-3 py-2 rounded text-xs hover:bg-red-700 transition-colors"
              >
                Rules
              </button>
              <button 
                onClick={() => setCurrentView('blog')}
                className="w-full bg-indigo-600 text-white px-3 py-2 rounded text-xs hover:bg-indigo-700 transition-colors"
              >
                Blog
              </button>
              <button 
                onClick={() => setCurrentView('contact')}
                className="w-full bg-pink-600 text-white px-3 py-2 rounded text-xs hover:bg-pink-700 transition-colors"
              >
                Contact
              </button>
              <button 
                onClick={() => setCurrentView('forum')}
                className="w-full bg-orange-600 text-white px-3 py-2 rounded text-xs hover:bg-orange-700 transition-colors"
              >
                Forum
              </button>
            </div>
            <button 
              onClick={() => setCurrentView('login')}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Login Page
            </button>
            <button 
              onClick={() => setCurrentView('catalog')}
              className="w-full bg-teal-600 text-white px-3 py-2 rounded text-sm hover:bg-teal-700 transition-colors"
            >
              Course Catalog
            </button>
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-600 mb-2">Login as:</p>
              <div className="space-y-1">
                <button 
                  onClick={() => simulateLogin('student')}
                  className="w-full bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                >
                  Student
                </button>
                <button 
                  onClick={() => simulateLogin('teacher')}
                  className="w-full bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
                >
                  Teacher
                </button>
                <button 
                  onClick={() => simulateLogin('admin')}
                  className="w-full bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                >
                  Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isAuthenticated && (
        <button
          onClick={logout}
          className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-700 transition-colors"
        >
          Logout (Demo)
        </button>
      )}
    </div>
  );
}

export default App;