import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Bug, User, Database, Key } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { userService } from '@/lib/firestore';

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  error?: string;
}

export default function AuthDebugger() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('admin@straguel.edu');
  const [testPassword, setTestPassword] = useState('admin123');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  const runAuthTest = async () => {
    setIsTesting(true);
    setTestResults([]);

    try {
      console.log('🧪 Starting comprehensive authentication test...');

      // Step 1: Test Firebase Auth Login
      addTestResult({
        step: 'Firebase Auth Login',
        status: 'pending',
        message: 'Attempting to login with test credentials...'
      });

      try {
        const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
        const user = userCredential.user;
        
        addTestResult({
          step: 'Firebase Auth Login',
          status: 'success',
          message: `✅ Login successful! UID: ${user.uid}`,
          data: { uid: user.uid, email: user.email }
        });

        // Step 2: Test Direct Firestore Lookup by UID
        addTestResult({
          step: 'Direct Firestore Lookup by UID',
          status: 'pending',
          message: `Looking for user document with uid field = ${user.uid}...`
        });

        try {
          const q = query(
            collection(db, 'users'),
            where('uid', '==', user.uid),
            limit(1)
          );
          const snapshot = await getDocs(q);
          
          if (snapshot.docs.length > 0) {
            const userDoc = snapshot.docs[0];
            addTestResult({
              step: 'Direct Firestore Lookup by UID',
              status: 'success',
              message: `✅ User found by UID! Document ID: ${userDoc.id}`,
              data: { id: userDoc.id, ...userDoc.data() }
            });
          } else {
            addTestResult({
              step: 'Direct Firestore Lookup by UID',
              status: 'error',
              message: `❌ No user found with uid field = ${user.uid}`,
              error: 'UID field mismatch'
            });
          }
        } catch (error: any) {
          addTestResult({
            step: 'Direct Firestore Lookup by UID',
            status: 'error',
            message: `❌ Error in direct Firestore lookup: ${error.message}`,
            error: error.message
          });
        }

        // Step 3: Test Direct Firestore Lookup by Document ID
        addTestResult({
          step: 'Direct Firestore Lookup by Document ID',
          status: 'pending',
          message: `Looking for user document with document ID = ${user.uid}...`
        });

        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            addTestResult({
              step: 'Direct Firestore Lookup by Document ID',
              status: 'success',
              message: `✅ User found by document ID!`,
              data: { id: docSnap.id, ...docSnap.data() }
            });
          } else {
            addTestResult({
              step: 'Direct Firestore Lookup by Document ID',
              status: 'warning',
              message: `⚠️ No user document with ID = ${user.uid}`,
              error: 'Document ID mismatch'
            });
          }
        } catch (error: any) {
          addTestResult({
            step: 'Direct Firestore Lookup by Document ID',
            status: 'error',
            message: `❌ Error in document ID lookup: ${error.message}`,
            error: error.message
          });
        }

        // Step 4: Test userService.getUserById
        addTestResult({
          step: 'userService.getUserById',
          status: 'pending',
          message: `Testing userService.getUserById(${user.uid})...`
        });

        try {
          const profile = await userService.getUserById(user.uid);
          
          if (profile) {
            addTestResult({
              step: 'userService.getUserById',
              status: 'success',
              message: `✅ userService.getUserById successful!`,
              data: profile
            });
          } else {
            addTestResult({
              step: 'userService.getUserById',
              status: 'error',
              message: `❌ userService.getUserById returned null`,
              error: 'Service method failed'
            });
          }
        } catch (error: any) {
          addTestResult({
            step: 'userService.getUserById',
            status: 'error',
            message: `❌ Error in userService.getUserById: ${error.message}`,
            error: error.message
          });
        }

        // Step 5: Test userService.getUserByEmail
        addTestResult({
          step: 'userService.getUserByEmail',
          status: 'pending',
          message: `Testing userService.getUserByEmail(${user.email})...`
        });

        try {
          const profile = await userService.getUserByEmail(user.email!);
          
          if (profile) {
            addTestResult({
              step: 'userService.getUserByEmail',
              status: 'success',
              message: `✅ userService.getUserByEmail successful!`,
              data: profile
            });
          } else {
            addTestResult({
              step: 'userService.getUserByEmail',
              status: 'error',
              message: `❌ userService.getUserByEmail returned null`,
              error: 'Service method failed'
            });
          }
        } catch (error: any) {
          addTestResult({
            step: 'userService.getUserByEmail',
            status: 'error',
            message: `❌ Error in userService.getUserByEmail: ${error.message}`,
            error: error.message
          });
        }

        // Step 6: Check all users in collection
        addTestResult({
          step: 'All Users in Collection',
          status: 'pending',
          message: 'Checking all users in the collection...'
        });

        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          addTestResult({
            step: 'All Users in Collection',
            status: 'success',
            message: `✅ Found ${users.length} users in collection`,
            data: users
          });
        } catch (error: any) {
          addTestResult({
            step: 'All Users in Collection',
            status: 'error',
            message: `❌ Error getting all users: ${error.message}`,
            error: error.message
          });
        }

      } catch (error: any) {
        addTestResult({
          step: 'Firebase Auth Login',
          status: 'error',
          message: `❌ Login failed: ${error.message}`,
          error: error.message
        });
      }

      toast.success('Authentication test completed! Check results below.');
    } catch (error: any) {
      console.error('❌ Test error:', error);
      toast.error('Tests failed');
    } finally {
      setIsTesting(false);
    }
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
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

  const logout = async () => {
    try {
      await auth.signOut();
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error('Logout failed: ' + error.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Authentication Debugger
          </CardTitle>
          <CardDescription>
            Comprehensive testing of the authentication flow step by step
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
              <Button onClick={logout} variant="outline" size="sm" className="mt-2">
                Logout
              </Button>
            </div>
          )}

          {/* Test Credentials */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Test Credentials:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email:</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="admin@straguel.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password:</label>
                <input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="admin123"
                />
              </div>
            </div>
          </div>

          {/* Test Button */}
          <Button
            onClick={runAuthTest}
            disabled={isTesting}
            className="w-full"
            size="lg"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Authentication Test...
              </>
            ) : (
              <>
                🧪 Run Authentication Test
              </>
            )}
          </Button>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              
              {testResults.map((result, index) => (
                <Alert key={index} className={getStatusColor(result.status)}>
                  {getStatusIcon(result.status)}
                  <AlertDescription>
                    <div className="font-semibold">{result.step}:</div>
                    <div>{result.message}</div>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm">View Data</summary>
                        <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                    {result.error && (
                      <div className="mt-2 text-sm text-red-600">
                        <strong>Error:</strong> {result.error}
                      </div>
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
              <li><strong>Firebase Auth Login:</strong> Tests if credentials work</li>
              <li><strong>Direct Firestore Lookup by UID:</strong> Checks if user document has correct uid field</li>
              <li><strong>Direct Firestore Lookup by Document ID:</strong> Checks if document ID matches UID</li>
              <li><strong>userService.getUserById:</strong> Tests the service method</li>
              <li><strong>userService.getUserByEmail:</strong> Tests email fallback</li>
              <li><strong>All Users:</strong> Shows complete user collection</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}