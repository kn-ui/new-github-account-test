import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Database, Users } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserMapping {
  email: string;
  firebaseUID: string;
  firestoreID: string;
  displayName: string;
  role: string;
}

export default function CorrectUIDFixer() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userMappings, setUserMappings] = useState<UserMapping[]>([]);
  const [isFixing, setIsFixing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  // Load all users and their Firebase Auth UIDs
  const loadUserMappings = async () => {
    try {
      console.log('🔄 Loading user mappings...');
      
      // Get all users from Firestore
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const mappings: UserMapping[] = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Find the corresponding Firebase Auth user by email
        // For now, we'll use the known mappings from your data
        let firebaseUID = '';
        
        switch (userData.email) {
          case 'admin@straguel.edu':
            firebaseUID = 'xFmODm96AHgaa7ZkfUB9tnyN3G43';
            break;
          case 'sarah.wilson@straguel.edu':
            firebaseUID = 'HNSFVjZzngUyJvcrn7N8nrqCHNM2';
            break;
          case 'michael.thompson@straguel.edu':
            firebaseUID = '7E4dj9z3tzgKtRwURyfRi1dz0YG3';
            break;
          case 'david.chen@straguel.edu':
            firebaseUID = 'vVz08cRZMedJsACARMvU4ApCH8z1';
            break;
          case 'john.smith@student.straguel.edu':
            firebaseUID = 'HhrOtnXV7BfZhKrUqJJ0Q09tKZD3';
            break;
          case 'mary.johnson@student.straguel.edu':
            firebaseUID = 'mQtPrxzkIAT7hNf4cGf880DnsAE3';
            break;
          case 'david.wilson@student.straguel.edu':
            firebaseUID = 'N5DSrzHPDuOOJ4XM3MZmdWYflgZ2';
            break;
          case 'lisa.chen@student.straguel.edu':
            firebaseUID = '0u4LUlMp9scCoMPqp31ZR7CGlyO2';
            break;
          case 'robert.brown@student.straguel.edu':
            firebaseUID = 'wIkOmy8folUFj8iAOnw0cnXRbol2';
            break;
          default:
            firebaseUID = 'UNKNOWN';
        }
        
        mappings.push({
          email: userData.email,
          firebaseUID,
          firestoreID: userDoc.id,
          displayName: userData.displayName,
          role: userData.role
        });
      }
      
      setUserMappings(mappings);
      console.log('📊 User mappings loaded:', mappings);
      
    } catch (error: any) {
      console.error('❌ Error loading user mappings:', error);
      toast.error('Failed to load user mappings');
    }
  };

  // Fix all user UIDs
  const fixAllUserUIDs = async () => {
    setIsFixing(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log('🔧 Fixing all user UIDs...');
      
      let updatedCount = 0;
      let errorCount = 0;
      
      for (const mapping of userMappings) {
        if (mapping.firebaseUID !== 'UNKNOWN') {
          try {
            // Update the user document with the correct Firebase Auth UID
            const userDocRef = doc(db, 'users', mapping.firestoreID);
            await updateDoc(userDocRef, {
              uid: mapping.firebaseUID
            });
            
            console.log(`✅ Updated ${mapping.email} with UID: ${mapping.firebaseUID}`);
            updatedCount++;
          } catch (error: any) {
            console.error(`❌ Failed to update ${mapping.email}:`, error);
            errorCount++;
          }
        }
      }
      
      setStatus('success');
      setMessage(`✅ Successfully updated ${updatedCount} users! ${errorCount} errors.`);
      toast.success(`Updated ${updatedCount} users successfully!`);
      
      // Reload mappings to show updated data
      await loadUserMappings();
      
    } catch (error: any) {
      console.error('❌ Error fixing UIDs:', error);
      setStatus('error');
      setMessage(`❌ Failed to fix UIDs: ${error.message}`);
      toast.error('Failed to fix UIDs');
    } finally {
      setIsFixing(false);
    }
  };

  // Fix current user UID
  const fixCurrentUserUID = async () => {
    if (!currentUser) {
      toast.error('No user logged in');
      return;
    }

    setIsFixing(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log('🔧 Fixing current user UID...');
      
      // Find the current user in our mappings
      const currentUserMapping = userMappings.find(m => m.email === currentUser.email);
      
      if (currentUserMapping) {
        // Update the user document with the correct UID
        const userDocRef = doc(db, 'users', currentUserMapping.firestoreID);
        await updateDoc(userDocRef, {
          uid: currentUser.uid
        });
        
        setStatus('success');
        setMessage(`✅ Successfully updated ${currentUser.email} with UID: ${currentUser.uid}`);
        toast.success('Current user UID updated successfully!');
        
        // Reload mappings
        await loadUserMappings();
        
        // Test dashboard access
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
        
      } else {
        setStatus('error');
        setMessage(`❌ Could not find mapping for ${currentUser.email}`);
        toast.error('User mapping not found');
      }
      
    } catch (error: any) {
      console.error('❌ Error fixing current user UID:', error);
      setStatus('error');
      setMessage(`❌ Failed to fix current user UID: ${error.message}`);
      toast.error('Failed to fix current user UID');
    } finally {
      setIsFixing(false);
    }
  };

  useEffect(() => {
    loadUserMappings();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Correct UID Fixer
          </CardTitle>
          <CardDescription>
            Fix all users with their correct Firebase Auth UIDs based on your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current User Info */}
          {currentUser && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Current User:</h3>
              <div className="text-sm space-y-1">
                <div><strong>Firebase Auth UID:</strong> {currentUser.uid}</div>
                <div><strong>Email:</strong> {currentUser.email}</div>
              </div>
            </div>
          )}

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

          {/* User Mappings Table */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">User Mappings:</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Display Name</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Firestore ID</th>
                    <th className="text-left p-2">Firebase Auth UID</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userMappings.map((mapping, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{mapping.email}</td>
                      <td className="p-2">{mapping.displayName}</td>
                      <td className="p-2">{mapping.role}</td>
                      <td className="p-2 font-mono text-xs">{mapping.firestoreID}</td>
                      <td className="p-2 font-mono text-xs">{mapping.firebaseUID}</td>
                      <td className="p-2">
                        {mapping.firebaseUID !== 'UNKNOWN' ? (
                          <span className="text-green-600">✅ Ready</span>
                        ) : (
                          <span className="text-red-600">❌ Unknown</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={fixCurrentUserUID}
              disabled={isFixing || !currentUser}
              className="w-full"
              size="lg"
            >
              {isFixing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing Current User UID...
                </>
              ) : (
                <>
                  🔧 Fix Current User UID
                </>
              )}
            </Button>

            <Button
              onClick={fixAllUserUIDs}
              disabled={isFixing}
              variant="outline"
              className="w-full"
            >
              🔄 Fix All Users UIDs
            </Button>

            <Button
              onClick={loadUserMappings}
              disabled={isFixing}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Mappings
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">What This Does:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li><strong>Loads User Mappings:</strong> Shows all users and their correct Firebase Auth UIDs</li>
              <li><strong>Fix Current User:</strong> Updates your user document with the correct UID</li>
              <li><strong>Fix All Users:</strong> Updates all users with their correct UIDs</li>
              <li><strong>Test Dashboard:</strong> After fixing, try accessing your dashboard</li>
            </ol>
            <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
              <strong>Note:</strong> This uses the exact UIDs from your Firebase Authentication data.
            </div>
          </div>

          {/* Quick Test */}
          {status === 'success' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">✅ UIDs Fixed Successfully!</h3>
              <p className="text-sm mb-3">Now try accessing your dashboard:</p>
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
                size="lg"
              >
                🚀 Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}