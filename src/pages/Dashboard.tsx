import { useAuth } from '@/contexts/AuthContext';
import StudentDashboard from '@/components/dashboards/StudentDashboard';
import TeacherDashboard from '@/components/dashboards/TeacherDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';

const Dashboard = () => {
  const { currentUser, userProfile, loading } = useAuth();

  // Debug logging
  console.log('Dashboard Debug:', {
    currentUser: currentUser?.uid,
    userProfile: userProfile,
    userRole: userProfile?.role,
    loading
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">User profile not found. Please contact support.</p>
          <p className="text-sm text-gray-500 mt-2">User ID: {currentUser.uid}</p>
          <p className="text-sm text-gray-500">Email: {currentUser.email}</p>
        </div>
      </div>
    );
  }

  switch (userProfile.role) {
    case 'teacher':
      return <TeacherDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'student':
    default:
      return <StudentDashboard />;
  }
};

export default Dashboard;