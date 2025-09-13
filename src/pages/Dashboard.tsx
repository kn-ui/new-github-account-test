import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AdminOverview from '@/pages/dashboard/AdminOverview';
import TeacherOverview from '@/pages/dashboard/TeacherOverview';
import StudentOverview from '@/pages/dashboard/StudentOverview';
import SuperAdminOverview from '@/pages/dashboard/SuperAdminOverview';
import { PasswordChangeDialog } from '@/components/PasswordChangeDialog';

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [isPasswordChangeRequired, setIsPasswordChangeRequired] = useState(false);

  useEffect(() => {
    if (userProfile && userProfile.passwordChanged === false) {
      setIsPasswordChangeRequired(true);
    }
  }, [userProfile]);

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const renderOverview = () => {
    switch (userProfile.role) {
      case 'admin':
        return <AdminOverview />;
      case 'super_admin':
        return <SuperAdminOverview />;
      case 'teacher':
        return <TeacherOverview />;
      case 'student':
        return <StudentOverview />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <DashboardLayout userRole={userProfile.role}>
      {renderOverview()}
      <PasswordChangeDialog 
        open={isPasswordChangeRequired}
        onOpenChange={setIsPasswordChangeRequired}
        showCancelButton={false}
      />
    </DashboardLayout>
  );
}