import React, { useState, useEffect } from 'react';
import { useImprovedClerkAuth } from '@/contexts/ImprovedClerkAuthContext';
import { userService } from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SyncStatus {
  clerkUserId: string;
  firebaseUser: any;
  isSynced: boolean;
  lastSync?: Date;
  issues?: string[];
}

export const UserSyncStatus: React.FC = () => {
  const { currentUser, userProfile, syncUserWithFirebase } = useImprovedClerkAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkSyncStatus = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      // Check if user exists in Firebase
      const firebaseUser = await userService.getUserById(currentUser.id);
      
      const issues: string[] = [];
      let isSynced = true;

      if (!firebaseUser) {
        issues.push('User not found in Firebase');
        isSynced = false;
      } else {
        // Check for data inconsistencies
        if (firebaseUser.email !== currentUser.primaryEmailAddress?.emailAddress) {
          issues.push('Email mismatch between Clerk and Firebase');
          isSynced = false;
        }
        
        if (firebaseUser.displayName !== (currentUser.fullName || currentUser.firstName)) {
          issues.push('Display name mismatch between Clerk and Firebase');
          isSynced = false;
        }
      }

      setSyncStatus({
        clerkUserId: currentUser.id,
        firebaseUser,
        isSynced,
        lastSync: new Date(),
        issues
      });
    } catch (error) {
      console.error('Error checking sync status:', error);
      toast.error('Failed to check sync status');
    } finally {
      setIsLoading(false);
    }
  };

  const forceSync = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const syncedUser = await syncUserWithFirebase(currentUser);
      if (syncedUser) {
        toast.success('User synced successfully!');
        await checkSyncStatus(); // Refresh status
      } else {
        toast.error('Failed to sync user');
      }
    } catch (error) {
      console.error('Error syncing user:', error);
      toast.error('Failed to sync user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      checkSyncStatus();
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Sync Status</CardTitle>
          <CardDescription>No user logged in</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Sync Status</CardTitle>
            <CardDescription>
              Clerk and Firebase synchronization status
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkSyncStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncStatus ? (
          <>
            <div className="flex items-center space-x-2">
              {syncStatus.isSynced ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <Badge variant={syncStatus.isSynced ? 'default' : 'destructive'}>
                {syncStatus.isSynced ? 'Synced' : 'Not Synced'}
              </Badge>
            </div>

            <div className="space-y-2">
              <div>
                <strong>Clerk User ID:</strong> {syncStatus.clerkUserId}
              </div>
              <div>
                <strong>Firebase User:</strong> {syncStatus.firebaseUser ? 'Found' : 'Not Found'}
              </div>
              {syncStatus.lastSync && (
                <div>
                  <strong>Last Checked:</strong> {syncStatus.lastSync.toLocaleString()}
                </div>
              )}
            </div>

            {syncStatus.issues && syncStatus.issues.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <strong>Issues Found:</strong>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {syncStatus.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {!syncStatus.isSynced && (
              <Button onClick={forceSync} disabled={isLoading} className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Force Sync Now
              </Button>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            Click refresh to check sync status
          </div>
        )}
      </CardContent>
    </Card>
  );
};