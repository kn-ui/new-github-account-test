import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function QuickUIDFix() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  // Load user profile when currentUser changes
  useEffect(() => {
    const loadUserProfile = async () => {
      if (currentUser?.email) {
        try {
          // Try to find user by email
          const usersRef = collection(db, 'users');
          const usersSnapshot = await getDocs(usersRef);
          const userByEmail = usersSnapshot.docs.find(doc => 
            doc.data().email === currentUser.email
          );
          
          if (userByEmail) {
            setUserProfile({ id: userByEmail.id, ...userByEmail.data() });
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
    };

    loadUserProfile();
  }, [currentUser]);

  const fixCurrentUserUID = async () => {
    if (!currentUser || !userProfile) {
      toast.error('No user profile found');
      return;
    }

    setIsFixing(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log('🔧 Fixing UID for user:', userProfile.id);
      console.log('Current Firebase Auth UID:', currentUser.uid);
      
                // Update the user document with the correct UID
          const userDocRef = doc(db, 'users', userProfile.id);
          await updateDoc(userDocRef, {
            uid: currentUser.uid // This should be the actual Firebase Auth UID
          });

      setStatus('success');
      setMessage(`✅ Successfully updated user ${userProfile.displayName} with UID: ${currentUser.uid}`);
      toast.success('UID updated successfully!');
      
      // Refresh the page to test the fix
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error fixing UID:', error);
      setStatus('error');
      setMessage(`❌ Failed to update UID: ${error.message}`);
      toast.error('Failed to update UID');
    } finally {
      setIsFixing(false);
    }
  };

  const fixAllUsersUIDs = async () => {
    setIsFixing(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log('🔧 Fixing UIDs for all users...');
      
      // Get all users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      let updatedCount = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // If user doesn't have a UID, we need to create a Firebase Auth user first
        // For now, we'll just update the existing users with placeholder UIDs
        if (!userData.uid) {
          try {
            await updateDoc(doc(db, 'users', userDoc.id), {
              uid: userDoc.id // Use document ID as UID for now
            });
            updatedCount++;
          } catch (error) {
            console.error(`Failed to update user ${userDoc.id}:`, error);
          }
        }
      }

      setStatus('success');
      setMessage(`✅ Updated ${updatedCount} users with UIDs`);
      toast.success(`Updated ${updatedCount} users!`);
      
    } catch (error: any) {
      console.error('❌ Error fixing all UIDs:', error);
      setStatus('error');
      setMessage(`❌ Failed to update UIDs: ${error.message}`);
      toast.error('Failed to update UIDs');
    } finally {
      setIsFixing(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick UID Fix</CardTitle>
            <CardDescription>Please log in to fix UID issues</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔧 Quick UID Fix
          </CardTitle>
          <CardDescription>
            Fix UID mismatch for current user and test dashboard access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current User Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Current User:</h3>
            <div className="text-sm space-y-1">
              <div><strong>Firebase Auth UID:</strong> {currentUser.uid}</div>
              <div><strong>Email:</strong> {currentUser.email}</div>
            </div>
          </div>

          {/* User Profile Info */}
          {userProfile && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">User Profile Found:</h3>
              <div className="text-sm space-y-1">
                <div><strong>Document ID:</strong> {userProfile.id}</div>
                <div><strong>Display Name:</strong> {userProfile.displayName}</div>
                <div><strong>Role:</strong> {userProfile.role}</div>
                <div><strong>Current UID:</strong> {userProfile.uid || 'Not set'}</div>
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

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={fixCurrentUserUID}
              disabled={isFixing || !userProfile}
              className="w-full"
              size="lg"
            >
              {isFixing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing UID...
                </>
              ) : (
                <>
                  🔧 Fix Current User UID
                </>
              )}
            </Button>

            <Button
              onClick={fixAllUsersUIDs}
              disabled={isFixing}
              variant="outline"
              className="w-full"
            >
              🔄 Fix All Users UIDs
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">What This Does:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li><strong>Fix Current User UID:</strong> Updates your user document with the correct Firebase Auth UID</li>
              <li><strong>Fix All Users UIDs:</strong> Updates all users with placeholder UIDs (for testing)</li>
              <li><strong>Test Dashboard:</strong> After fixing, try accessing your dashboard</li>
            </ol>
            <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
              <strong>Note:</strong> After fixing the UID, the page will reload automatically to test the fix.
            </div>
          </div>

          {/* Quick Test */}
          {status === 'success' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">✅ UID Fixed Successfully!</h3>
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