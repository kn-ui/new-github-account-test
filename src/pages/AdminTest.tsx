import React from 'react';
import { useImprovedClerkAuth } from '@/contexts/ImprovedClerkAuthContext';
import { UserSyncStatus } from '@/components/admin/UserSyncStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Calendar } from 'lucide-react';

const AdminTest = () => {
  const { currentUser, userProfile, loading } = useImprovedClerkAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to access this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Test Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Test the Clerk and Firebase integration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>User Information</span>
              </CardTitle>
              <CardDescription>
                Current user data from Clerk and Firebase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <strong>Display Name:</strong> {userProfile.displayName}
              </div>
              <div>
                <strong>Email:</strong> {userProfile.email}
              </div>
              <div>
                <strong>Role:</strong> 
                <Badge variant="secondary" className="ml-2">
                  {userProfile.role}
                </Badge>
              </div>
              <div>
                <strong>User ID:</strong> {userProfile.uid}
              </div>
              <div>
                <strong>Active:</strong> 
                <Badge variant={userProfile.isActive ? 'default' : 'destructive'} className="ml-2">
                  {userProfile.isActive ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <strong>Password Changed:</strong> 
                <Badge variant={userProfile.passwordChanged ? 'default' : 'secondary'} className="ml-2">
                  {userProfile.passwordChanged ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Clerk User Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Clerk User Data</span>
              </CardTitle>
              <CardDescription>
                Raw data from Clerk authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <strong>ID:</strong> {currentUser.id}
              </div>
              <div>
                <strong>First Name:</strong> {currentUser.firstName || 'N/A'}
              </div>
              <div>
                <strong>Last Name:</strong> {currentUser.lastName || 'N/A'}
              </div>
              <div>
                <strong>Full Name:</strong> {currentUser.fullName || 'N/A'}
              </div>
              <div>
                <strong>Email:</strong> {currentUser.primaryEmailAddress?.emailAddress || 'N/A'}
              </div>
              <div>
                <strong>Email Verified:</strong> 
                <Badge variant={currentUser.emailAddresses[0]?.verification?.status === 'verified' ? 'default' : 'destructive'} className="ml-2">
                  {currentUser.emailAddresses[0]?.verification?.status || 'Unknown'}
                </Badge>
              </div>
              <div>
                <strong>Created At:</strong> {new Date(currentUser.createdAt).toLocaleString()}
              </div>
              <div>
                <strong>Last Sign In:</strong> {currentUser.lastSignInAt ? new Date(currentUser.lastSignInAt).toLocaleString() : 'Never'}
              </div>
            </CardContent>
          </Card>

          {/* Sync Status */}
          <div className="lg:col-span-2">
            <UserSyncStatus />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTest;