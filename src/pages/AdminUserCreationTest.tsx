import React, { useState } from 'react';
import { useImprovedClerkAuth } from '@/contexts/ImprovedClerkAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface TestUser {
  displayName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
}

const AdminUserCreationTest = () => {
  const { userProfile } = useImprovedClerkAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [testUser, setTestUser] = useState<TestUser>({
    displayName: '',
    email: '',
    role: 'student'
  });
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    user?: any;
  } | null>(null);

  // Check if user is admin
  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>Only administrators can access this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleCreateUser = async () => {
    if (!testUser.displayName || !testUser.email || !testUser.role) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testUser.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsCreating(true);
    setLastResult(null);

    try {
      const response = await api.post('/users', {
        email: testUser.email,
        displayName: testUser.displayName,
        role: testUser.role
      });

      if (response.data.success) {
        setLastResult({
          success: true,
          message: `User "${testUser.displayName}" created successfully!`,
          user: response.data.data
        });
        toast.success('User created successfully!');
        
        // Reset form
        setTestUser({
          displayName: '',
          email: '',
          role: 'student'
        });
      } else {
        throw new Error(response.data.message || 'Failed to create user');
      }
    } catch (error: any) {
      let errorMessage = 'An error occurred while creating the user.';
      
      if (error.response?.data?.message?.includes('already in use') || 
          error.response?.data?.message?.includes('email_address_taken')) {
        errorMessage = `The email "${testUser.email}" is already registered.`;
      } else if (error.response?.data?.message?.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setLastResult({
        success: false,
        message: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin User Creation Test</h1>
          <p className="text-gray-600 mt-2">
            Test the user creation functionality with Clerk and Firebase integration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Creation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Create Test User</span>
              </CardTitle>
              <CardDescription>
                Create a new user to test the integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={testUser.displayName}
                  onChange={(e) => setTestUser({...testUser, displayName: e.target.value})}
                  placeholder="Enter full name"
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={testUser.email}
                  onChange={(e) => setTestUser({...testUser, email: e.target.value})}
                  placeholder="Enter email address"
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={testUser.role} 
                  onValueChange={(value) => setTestUser({...testUser, role: value as any})}
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleCreateUser}
                disabled={isCreating || !testUser.displayName || !testUser.email}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Results from the last user creation attempt
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lastResult ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    {lastResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <Badge variant={lastResult.success ? 'default' : 'destructive'}>
                      {lastResult.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-700">{lastResult.message}</p>
                  
                  {lastResult.success && lastResult.user && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Created User Details:</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div><strong>ID:</strong> {lastResult.user.uid || lastResult.user.id}</div>
                        <div><strong>Name:</strong> {lastResult.user.displayName}</div>
                        <div><strong>Email:</strong> {lastResult.user.email}</div>
                        <div><strong>Role:</strong> {lastResult.user.role}</div>
                        <div><strong>Active:</strong> {lastResult.user.isActive ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No test results yet. Create a user to see the results here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-700">
              <p>1. Fill in the user creation form with test data</p>
              <p>2. Click "Create User" to test the integration</p>
              <p>3. Check the results panel for success/failure status</p>
              <p>4. Verify the user was created in both Clerk and Firebase</p>
              <p>5. Check the UserManager page to see the new user in the list</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserCreationTest;