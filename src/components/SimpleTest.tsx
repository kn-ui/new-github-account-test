import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Database, Users, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SimpleTest() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [testResults, setTestResults] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  const runTests = async () => {
    setIsTesting(true);
    const results: any = {};

    try {
      console.log('🧪 Starting comprehensive tests...');

      // Test 1: Check if user is authenticated
      results.auth = {
        status: 'running',
        message: 'Testing authentication...'
      };
      setTestResults({ ...results });

      if (currentUser) {
        results.auth = {
          status: 'success',
          message: `✅ User authenticated: ${currentUser.email} (UID: ${currentUser.uid})`
        };
      } else {
        results.auth = {
          status: 'error',
          message: '❌ No user authenticated'
        };
      }
      setTestResults({ ...results });

      // Test 2: Check users collection
      results.users = {
        status: 'running',
        message: 'Testing users collection...'
      };
      setTestResults({ ...results });

      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        results.users = {
          status: 'success',
          message: `✅ Users collection: ${users.length} users found`,
          data: users
        };
      } catch (error: any) {
        results.users = {
          status: 'error',
          message: `❌ Users collection error: ${error.message}`
        };
      }
      setTestResults({ ...results });

      // Test 3: Check courses collection
      results.courses = {
        status: 'running',
        message: 'Testing courses collection...'
      };
      setTestResults({ ...results });

      try {
        const coursesRef = collection(db, 'courses');
        const coursesSnapshot = await getDocs(coursesRef);
        const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        results.courses = {
          status: 'success',
          message: `✅ Courses collection: ${courses.length} courses found`,
          data: courses
        };
      } catch (error: any) {
        results.courses = {
          status: 'error',
          message: `❌ Courses collection error: ${error.message}`
        };
      }
      setTestResults({ ...results });

      // Test 4: Check enrollments collection
      results.enrollments = {
        status: 'running',
        message: 'Testing enrollments collection...'
      };
      setTestResults({ ...results });

      try {
        const enrollmentsRef = collection(db, 'enrollments');
        const enrollmentsSnapshot = await getDocs(enrollmentsRef);
        const enrollments = enrollmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        results.enrollments = {
          status: 'success',
          message: `✅ Enrollments collection: ${enrollments.length} enrollments found`,
          data: enrollments
        };
      } catch (error: any) {
        results.enrollments = {
          status: 'error',
          message: `❌ Enrollments collection error: ${error.message}`
        };
      }
      setTestResults({ ...results });

      // Test 5: Check blogs collection
      results.blogs = {
        status: 'running',
        message: 'Testing blogs collection...'
      };
      setTestResults({ ...results });

      try {
        const blogsRef = collection(db, 'blogs');
        const blogsSnapshot = await getDocs(blogsRef);
        const blogs = blogsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        results.blogs = {
          status: 'success',
          message: `✅ Blogs collection: ${blogs.length} blogs found`,
          data: blogs
        };
      } catch (error: any) {
        results.blogs = {
          status: 'error',
          message: `❌ Blogs collection error: ${error.message}`
        };
      }
      setTestResults({ ...results });

      // Test 6: Check specific user profile
      if (currentUser) {
        results.userProfile = {
          status: 'running',
          message: 'Testing user profile lookup...'
        };
        setTestResults({ ...results });

        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            results.userProfile = {
              status: 'success',
              message: `✅ User profile found by UID: ${currentUser.uid}`,
              data: userDoc.data()
            };
          } else {
            // Try to find by email
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);
            const userByEmail = usersSnapshot.docs.find(doc => 
              doc.data().email === currentUser.email
            );
            
            if (userByEmail) {
              results.userProfile = {
                status: 'warning',
                message: `⚠️ User profile found by email but not by UID. Document ID: ${userByEmail.id}`,
                data: userByEmail.data()
              };
            } else {
              results.userProfile = {
                status: 'error',
                message: `❌ User profile not found by UID or email`
              };
            }
          }
        } catch (error: any) {
          results.userProfile = {
            status: 'error',
            message: `❌ User profile lookup error: ${error.message}`
          };
        }
        setTestResults({ ...results });
      }

      toast.success('All tests completed! Check results below.');
    } catch (error: any) {
      console.error('❌ Test error:', error);
      toast.error('Tests failed');
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Loader2 className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Simple Test Suite
          </CardTitle>
          <CardDescription>
            Test basic functionality and data access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current User Info */}
          {currentUser && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Current User:</h3>
              <div className="text-sm space-y-1">
                <div><strong>UID:</strong> {currentUser.uid}</div>
                <div><strong>Email:</strong> {currentUser.email}</div>
              </div>
            </div>
          )}

          {/* Test Button */}
          <Button
            onClick={runTests}
            disabled={isTesting}
            className="w-full"
            size="lg"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
              ) : (
              <>
                🧪 Run All Tests
              </>
            )}
          </Button>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              
              {Object.entries(testResults).map(([testName, result]: [string, any]) => (
                <Alert key={testName} className={getStatusColor(result.status)}>
                  {getStatusIcon(result.status)}
                  <AlertDescription>
                    <div className="font-semibold capitalize">{testName}:</div>
                    <div>{result.message}</div>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm">View Data</summary>
                        <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">What This Tests:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Authentication:</strong> Verifies user is logged in</li>
              <li><strong>Users Collection:</strong> Checks if user data exists</li>
              <li><strong>Courses Collection:</strong> Verifies course data</li>
              <li><strong>Enrollments Collection:</strong> Checks enrollment data</li>
              <li><strong>Blogs Collection:</strong> Verifies blog posts</li>
              <li><strong>User Profile:</strong> Tests profile lookup by UID and email</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}