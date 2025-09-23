import React from 'react';
import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import AssignmentDetail from './components/Assignments/AssignmentDetail';
import CourseDetail from './components/Courses/CourseDetail';
import GradesPage from './components/Grades/GradesPage';
import NotificationsPage from './components/Notifications/NotificationsPage';

function App() {
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [currentView, setCurrentView] = useState('main');
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
    setCurrentView('main');
  };

  const handleCourseClick = (courseTitle?: string) => {
    setSelectedCourse(courseTitle || 'Systematic Theology');
    setCurrentView('course-detail');
  };
  const renderContent = () => {
    if (currentView === 'assignment-detail') {
      return <AssignmentDetail onBack={() => setCurrentView('main')} />;
    }
    
    if (currentView === 'course-detail') {
      return <CourseDetail onBack={() => setCurrentView('main')} courseTitle={selectedCourse} />;
    }

    switch (currentPage) {
      case 'Dashboard':
        return (
          <Dashboard 
            onAssignmentClick={() => setCurrentView('assignment-detail')}
            onCourseClick={handleCourseClick}
          />
        );
      case 'Grades':
        return <GradesPage />;
      case 'Notifications':
        return <NotificationsPage />;
      default:
        return <Dashboard onAssignmentClick={() => setCurrentView('assignment-detail')} onCourseClick={handleCourseClick} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigation}>
      {renderContent()}
    </Layout>
  );
}

export default App;