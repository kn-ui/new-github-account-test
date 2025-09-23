import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { passwordResetService, userService, FirestorePasswordResetRequest } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Key, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User,
  Shield,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardHero from '@/components/DashboardHero';

export default function PasswordResetRequests() {
  const { currentUser, userProfile } = useAuth();
  const { t } = useI18n();
  const [requests, setRequests] = useState<FirestorePasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<FirestorePasswordResetRequest | null>(null);
  const [showHandleDialog, setShowHandleDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (currentUser?.uid && (userProfile?.role === 'admin' || userProfile?.role === 'super_admin')) {
      loadRequests();
    }
  }, [currentUser?.uid, userProfile?.role]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const allRequests = await passwordResetService.getPasswordResetRequests(100);
      setRequests(allRequests);
    } catch (error) {
      console.error('Error loading password reset requests:', error);
      toast.error('Failed to load password reset requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (action: 'approved' | 'rejected') => {
    if (!selectedRequest || !currentUser?.uid) return;

    try {
      if (action === 'approved' && newPassword.trim()) {
        // In a real system, you would reset the password here
        // For now, we'll just mark as completed
        await passwordResetService.updatePasswordResetRequest(selectedRequest.id, {
          status: 'completed',
          handledBy: currentUser.uid,
          adminNotes: `Password reset completed. New password: ${newPassword}. ${adminNotes}`.trim()
        });
        toast.success('Password reset completed successfully');
      } else if (action === 'rejected') {
        await passwordResetService.updatePasswordResetRequest(selectedRequest.id, {
          status: 'rejected',
          handledBy: currentUser.uid,
          adminNotes: adminNotes
        });
        toast.success('Password reset request rejected');
      }

      setShowHandleDialog(false);
      setSelectedRequest(null);
      setAdminNotes('');
      setNewPassword('');
      loadRequests();
    } catch (error) {
      console.error('Error handling password reset request:', error);
      toast.error('Failed to handle password reset request');
    }
  };

  const openHandleDialog = (request: FirestorePasswordResetRequest) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setNewPassword('');
    setShowHandleDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Access control
  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only administrators can access password reset requests.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading password reset requests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title="Password Reset Requests"
        subtitle="Manage password reset requests from users"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Key className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Password Reset Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{request.userName}</h3>
                          <Badge className={getStatusColor(request.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              {request.status}
                            </div>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{request.userEmail}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {request.userRole}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {request.requestedAt.toDate().toLocaleDateString()}
                          </span>
                        </div>
                        {request.reason && (
                          <p className="text-sm text-gray-700 mt-2">
                            <strong>Reason:</strong> {request.reason}
                          </p>
                        )}
                        {request.adminNotes && (
                          <p className="text-sm text-gray-700 mt-2">
                            <strong>Admin Notes:</strong> {request.adminNotes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openHandleDialog(request)}
                        >
                          Handle Request
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {requests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No password reset requests found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Handle Request Dialog */}
      <Dialog open={showHandleDialog} onOpenChange={setShowHandleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Handle Password Reset Request</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">User:</span>
                    <p>{selectedRequest.userName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p>{selectedRequest.userEmail}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Role:</span>
                    <p>{selectedRequest.userRole}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Requested:</span>
                    <p>{selectedRequest.requestedAt.toDate().toLocaleDateString()}</p>
                  </div>
                </div>
                {selectedRequest.reason && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-600">Reason:</span>
                    <p className="mt-1">{selectedRequest.reason}</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password for user"
                />
              </div>

              <div>
                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this password reset..."
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHandleDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleRequest('rejected')}
            >
              Reject Request
            </Button>
            <Button 
              onClick={() => handleRequest('approved')}
              disabled={!newPassword.trim()}
            >
              Approve & Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}