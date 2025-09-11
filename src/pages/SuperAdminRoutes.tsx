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
