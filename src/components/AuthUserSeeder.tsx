import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Test users with passwords for Firebase Auth
const testUsers = [
  {
    email: 'admin@straguel.edu',
    password: 'admin123',
    displayName: 'Admin User'
  },
  {
    email: 'sarah.wilson@straguel.edu',
    password: 'teacher123',
    displayName: 'Dr. Sarah Wilson'
  },
  {
    email: 'michael.thompson@straguel.edu',
    password: 'teacher123',
    displayName: 'Rev. Michael Thompson'
  },
  {
    email: 'david.chen@straguel.edu',
    password: 'teacher123',
    displayName: 'Prof. David Chen'
  },
  {
    email: 'john.smith@student.straguel.edu',
    password: 'student123',
    displayName: 'John Smith'
  },
  {
    email: 'mary.johnson@student.straguel.edu',
    password: 'student123',
    displayName: 'Mary Johnson'
  },
  {
    email: 'david.wilson@student.straguel.edu',
    password: 'student123',
    displayName: 'David Wilson'
  },
  {
    email: 'lisa.chen@student.straguel.edu',
    password: 'student123',
    displayName: 'Lisa Chen'
  },
  {
    email: 'robert.brown@student.straguel.edu',
    password: 'student123',
    displayName: 'Robert Brown'
  }
];

export default function AuthUserSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<Array<{ email: string; success: boolean; error?: string }>>([]);

  // Function to create Firebase Auth users
  const seedAuthUsers = async () => {
    setIsSeeding(true);
    setStatus('idle');
    setMessage('');
    setResults([]);

    const newResults: Array<{ email: string; success: boolean; error?: string }> = [];

    try {
      console.log('🔐 Starting Firebase Auth user seeding...');

      for (const user of testUsers) {
        try {
          await createUserWithEmailAndPassword(auth, user.email, user.password);
          console.log(`✅ Created auth user: ${user.email}`);
          newResults.push({ email: user.email, success: true });
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            console.log(`ℹ️ User already exists: ${user.email}`);
            newResults.push({ email: user.email, success: true, error: 'Already exists' });
          } else {
            console.error(`❌ Failed to create user ${user.email}:`, error.message);
            newResults.push({ email: user.email, success: false, error: error.message });
          }
        }
      }

      setResults(newResults);
      const successCount = newResults.filter(r => r.success).length;
      const totalCount = newResults.length;

      if (successCount === totalCount) {
        setStatus('success');
        setMessage(`Successfully created ${successCount} Firebase Auth users!`);
        toast.success('Firebase Auth users created successfully!');
      } else {
        setStatus('error');
        setMessage(`Created ${successCount}/${totalCount} users. Some failed.`);
        toast.warning(`Created ${successCount}/${totalCount} users. Check results for details.`);
      }

    } catch (error: any) {
      console.error('❌ Error seeding auth users:', error);
      setStatus('error');
      setMessage(`Error seeding auth users: ${error.message}`);
      toast.error('Failed to seed auth users');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Firebase Auth User Seeder
          </CardTitle>
          <CardDescription>
            Create Firebase Authentication users for the seeded Firestore data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Display */}
          {status !== 'idle' && (
            <Alert className={status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {status === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={status === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Test Users Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="font-semibold text-blue-900">1</div>
              <div className="text-blue-600">Admin</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="font-semibold text-green-900">3</div>
              <div className="text-green-600">Teachers</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="font-semibold text-purple-900">5</div>
              <div className="text-purple-600">Students</div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={seedAuthUsers}
            disabled={isSeeding}
            className="w-full"
            size="lg"
          >
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Auth Users...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Firebase Auth Users
              </>
            )}
          </Button>

          {/* Results Display */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Results:</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      result.success
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.email}</span>
                      <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                        {result.success ? '✅ Success' : '❌ Failed'}
                      </span>
                    </div>
                    {result.error && (
                      <div className="text-xs text-gray-600 mt-1">
                        {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Login Credentials */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Login Credentials:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Admin:</strong> admin@straguel.edu / admin123
              </div>
              <div>
                <strong>Teacher:</strong> sarah.wilson@straguel.edu / teacher123
              </div>
              <div>
                <strong>Student:</strong> john.smith@student.straguel.edu / student123
              </div>
              <div>
                <strong>All passwords:</strong> admin123, teacher123, student123
              </div>
            </div>
          </div>

          {/* Warning */}
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Note:</strong> This will create Firebase Authentication users. 
              If users already exist, they will be skipped. Use these credentials to test the system.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}