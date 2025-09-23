import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { assignmentEditRequestService, FirestoreAssignmentEditRequest } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
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
  Edit, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User,
  FileText,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardHero from '@/components/DashboardHero';

export default function AssignmentEditRequests() {
  const { currentUser, userProfile } = useAuth();
  const { t } = useI18n();
  const [requests, setRequests] = useState<FirestoreAssignmentEditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<FirestoreAssignmentEditRequest | null>(null);
  const [showHandleDialog, setShowHandleDialog] = useState(false);
  const [teacherResponse, setTeacherResponse] = useState('');

  useEffect(() => {
    if (currentUser?.uid && (userProfile?.role === 'teacher' || userProfile?.role === 'admin' || userProfile?.role === 'super_admin')) {
      loadRequests();
    }
  }, [currentUser?.uid, userProfile?.role]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      if (userProfile?.role === 'teacher' && currentUser?.uid) {
        const teacherRequests = await assignmentEditRequestService.getEditRequestsByTeacher(currentUser.uid);
        setRequests(teacherRequests);
      } else if (userProfile?.role === 'admin' || userProfile?.role === 'super_admin') {
        // Admins can see all requests - we'd need to add this method to the service
        const teacherRequests = await assignmentEditRequestService.getEditRequestsByTeacher(currentUser?.uid || '');
        setRequests(teacherRequests);
      }
    } catch (error) {
      console.error('Error loading assignment edit requests:', error);
      toast.error('Failed to load assignment edit requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (action: 'approved' | 'rejected') => {
    if (!selectedRequest || !currentUser?.uid) return;

    try {
      await assignmentEditRequestService.updateEditRequest(selectedRequest.id, {
        status: action,
        teacherResponse: teacherResponse.trim() || `Request ${action}`,
      });

      if (action === 'approved') {
        toast.success('Edit request approved. Student can now edit their submission.');
      } else {
        toast.success('Edit request rejected.');
      }

      setShowHandleDialog(false);
      setSelectedRequest(null);
      setTeacherResponse('');
      loadRequests();
    } catch (error) {
      console.error('Error handling edit request:', error);
      toast.error('Failed to handle edit request');
    }
  };

  const openHandleDialog = (request: FirestoreAssignmentEditRequest) => {
    setSelectedRequest(request);
    setTeacherResponse('');
    setShowHandleDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Access control
  if (!userProfile || (userProfile.role !== 'teacher' && userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only teachers and administrators can access assignment edit requests.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading assignment edit requests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title="Assignment Edit Requests"
        subtitle="Review and manage student requests to edit submitted assignments"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'approved').length}
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
        </div>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{request.studentName}</h3>
                          <Badge className={getStatusColor(request.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              {request.status}
                            </div>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{request.studentEmail}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {request.assignmentTitle}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {request.dueDate.toDate().toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Requested: {request.requestedAt.toDate().toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-gray-700">
                            <strong>Course:</strong> {request.courseName}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            <strong>Reason:</strong> {request.reason}
                          </p>
                          {request.teacherResponse && (
                            <p className="text-sm text-gray-700 mt-1">
                              <strong>Teacher Response:</strong> {request.teacherResponse}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openHandleDialog(request)}
                        >
                          Review Request
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {requests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Edit className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No assignment edit requests found</p>
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
            <DialogTitle>Review Edit Request</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Student:</span>
                    <p>{selectedRequest.studentName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p>{selectedRequest.studentEmail}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Assignment:</span>
                    <p>{selectedRequest.assignmentTitle}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Course:</span>
                    <p>{selectedRequest.courseName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Due Date:</span>
                    <p>{selectedRequest.dueDate.toDate().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Requested:</span>
                    <p>{selectedRequest.requestedAt.toDate().toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium text-gray-600">Reason:</span>
                  <p className="mt-1">{selectedRequest.reason}</p>
                </div>
              </div>

              <div>
                <label htmlFor="teacherResponse" className="block text-sm font-medium text-gray-700 mb-2">
                  Response to Student (Optional)
                </label>
                <Textarea
                  id="teacherResponse"
                  value={teacherResponse}
                  onChange={(e) => setTeacherResponse(e.target.value)}
                  placeholder="Add any comments for the student..."
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
            >
              Approve Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}