import { useAuth } from '@/contexts/AuthContext';
import SuperAdminUsers from './dashboard/SuperAdminUsers';
import SuperAdminCourses from './dashboard/SuperAdminCourses';
import SuperAdminEvents from './dashboard/SuperAdminEvents';
import UserManager from './UserManager';
import CourseManager from './CourseManager';
import Events from './Events';

interface SuperAdminRouteProps {
  page: 'users' | 'courses' | 'events';
}

export default function SuperAdminRoute({ page }: SuperAdminRouteProps) {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return null;
  }

  // Only super_admin and admin can access these routes
  if (userProfile.role === 'super_admin') {
    switch (page) {
      case 'users':
        return <SuperAdminUsers />;
      case 'courses':
        return <SuperAdminCourses />;
      case 'events':
        return <SuperAdminEvents />;
      default:
        return null;
    }
  }

  if (userProfile.role === 'admin') {
    switch (page) {
      case 'users':
        return <UserManager />;
      case 'courses':
        return <CourseManager />;
      case 'events':
        return <Events />;
      default:
        return null;
    }
  }

  // Students and teachers should not access these admin routes
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-600 text-xl mb-4">Access Denied</div>
        <div className="text-gray-600">Only administrators can access this page.</div>
      </div>
    </div>
  );
}
