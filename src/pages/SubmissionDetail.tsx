/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardHero from '@/components/DashboardHero';
import { submissionService, assignmentService, courseService, userService, assignmentEditRequestService, FirestoreSubmission, FirestoreAssignment, FirestoreCourse, FirestoreEditRequest } from '@/lib/firestore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare,
  User,
  Calendar,
  BookOpen,
  Award
} from 'lucide-react';

export default function SubmissionDetail() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<FirestoreSubmission | null>(null);
  const [assignment, setAssignment] = useState<FirestoreAssignment | null>(null);
  const [course, setCourse] = useState<FirestoreCourse | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [gradeDialog, setGradeDialog] = useState(false);
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [editRequest, setEditRequest] = useState<FirestoreEditRequest | null>(null);
  const [editRequestDialog, setEditRequestDialog] = useState(false);
  const [editResponse, setEditResponse] = useState<string>('');
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!submissionId) return;
      try {
        setLoading(true);
        const sub = await submissionService.getSubmission(submissionId);
        if (!sub) throw new Error('Submission not found');
        setSubmission(sub);
        const [asg, crs, user, editReqs] = await Promise.all([
          assignmentService.getAssignmentsByIds([sub.assignmentId]).then((m) => m[sub.assignmentId] as any),
          courseService.getCourseById(sub.courseId),
          userService.getUserById(sub.studentId).catch(() => null),
          assignmentEditRequestService.getEditRequestsByTeacher(currentUser?.uid || '').catch(() => [])
        ]);
        if (asg) setAssignment(asg);
        if (crs) setCourse(crs);
        if ((user as any)?.displayName) setStudentName((user as any).displayName);
        setGrade(sub.grade ?? 0);
        setFeedback(sub.feedback ?? '');
        
        // Find edit request for this submission
        const submissionEditRequest = editReqs.find(req => req.submissionId === submissionId);
        if (submissionEditRequest) {
          setEditRequest(submissionEditRequest);
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load submission');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [submissionId, currentUser?.uid]);

  const title = useMemo(() => `Submission${assignment ? `: ${assignment.title}` : ''}`, [assignment]);

  const onSaveGrade = async () => {
    if (!submission || !assignment) return;
    
    const maxScore = (assignment as any)?.maxScore || 100;
    if (grade > maxScore) {
      toast.error(`Grade cannot exceed the maximum score of ${maxScore}`);
      return;
    }
    
    if (grade < 0) {
      toast.error('Grade cannot be negative');
      return;
    }
    
    try {
      await submissionService.updateSubmission(submission.id, { grade, feedback, status: 'graded' });
      toast.success('Grade updated');
      setGradeDialog(false);
      setSubmission({ ...submission, grade, feedback, status: 'graded' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to save grade');
    }
  };

  const handleEditRequestResponse = async (approve: boolean) => {
    if (!editRequest || !currentUser) return;
    
    if (!editResponse.trim()) {
      toast.error('Please provide a response');
      return;
    }

    try {
      setIsApproving(true);
      if (approve) {
        await assignmentEditRequestService.approveEditRequest(
          editRequest.id, 
          editResponse, 
          currentUser.uid
        );
        toast.success('Edit request approved');
      } else {
        await assignmentEditRequestService.denyEditRequest(
          editRequest.id, 
          editResponse, 
          currentUser.uid
        );
        toast.success('Edit request denied');
      }
      
      setEditRequestDialog(false);
      setEditResponse('');
      
      // Reload the edit request to update status
      const updatedEditRequest = { ...editRequest, status: approve ? 'approved' : 'denied', response: editResponse };
      setEditRequest(updatedEditRequest);
    } catch (e) {
      console.error(e);
      toast.error('Failed to respond to edit request');
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>;
  if (!submission) return <div className="min-h-screen flex items-center justify-center text-gray-600">Submission not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero title={title} subtitle={course?.title || ''} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
        {/* Edit Request Alert */}
        {editRequest && (
          <Card className="border-l-4 border-l-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {editRequest.status === 'pending' && <Clock className="h-5 w-5 text-blue-600" />}
                  {editRequest.status === 'approved' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {editRequest.status === 'denied' && <XCircle className="h-5 w-5 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">Edit Request</h3>
                    <Badge variant={editRequest.status === 'pending' ? 'default' : editRequest.status === 'approved' ? 'secondary' : 'destructive'}>
                      {editRequest.status.charAt(0).toUpperCase() + editRequest.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Student Reason:</strong> {editRequest.reason}
                  </p>
                  {editRequest.response && (
                    <p className="text-sm text-gray-700">
                      <strong>Your Response:</strong> {editRequest.response}
                    </p>
                  )}
                  {editRequest.status === 'pending' && (
                    <Button 
                      size="sm" 
                      onClick={() => setEditRequestDialog(true)}
                      className="mt-2"
                    >
                      Respond to Request
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Submission Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submission Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(submission as any).content ? (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                      {(submission as any).content}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No text content submitted</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachments */}
            {(submission as any).attachments?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Attachments ({((submission as any).attachments || []).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {((submission as any).attachments || []).map((attachment: any, idx: number) => {
                      const link: string | undefined = typeof attachment === 'string' ? attachment : attachment?.url;
                      const displayName = (() => {
                        if (typeof attachment !== 'string') {
                          if (attachment?.title && typeof attachment.title === 'string') {
                            return attachment.title;
                          }
                          if (attachment?.url && typeof attachment.url === 'string') {
                            try {
                              const url = new URL(attachment.url);
                              const path = url.pathname.split('/').filter(Boolean);
                              const last = path[path.length - 1] || '';
                              return decodeURIComponent(last) || `Attachment ${idx + 1}`;
                            } catch {
                              const parts = (attachment.url as string).split('?')[0].split('#')[0].split('/');
                              return decodeURIComponent(parts[parts.length - 1] || '') || `Attachment ${idx + 1}`;
                            }
                          }
                          return `Attachment ${idx + 1}`;
                        }
                        try {
                          const url = new URL(attachment);
                          const path = url.pathname.split('/').filter(Boolean);
                          const last = path[path.length - 1] || '';
                          return decodeURIComponent(last) || `Attachment ${idx + 1}`;
                        } catch {
                          const parts = attachment.split('?')[0].split('#')[0].split('/');
                          return decodeURIComponent(parts[parts.length - 1] || '') || `Attachment ${idx + 1}`;
                        }
                      })();
                      return (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500">Attachment {idx + 1}</p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={link || '#'} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submission Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Submission Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{course?.title}</p>
                    <p className="text-xs text-gray-500">Course</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{assignment?.title}</p>
                    <p className="text-xs text-gray-500">Assignment</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{studentName || submission.studentId}</p>
                    <p className="text-xs text-gray-500">Student</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {submission.submittedAt.toDate().toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">Submitted</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant={submission.status === 'graded' ? 'secondary' : submission.status === 'submitted' ? 'default' : 'outline'}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Grade Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Grade Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Max Score</span>
                  <span className="font-medium">{(assignment as any)?.maxScore ?? '—'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Grade</span>
                  <span className="font-medium text-lg">
                    {submission.grade !== undefined ? `${submission.grade}/${(assignment as any)?.maxScore ?? 100}` : '—'}
                  </span>
                </div>
                
                {submission.feedback && (
                  <div>
                    <span className="text-sm text-gray-600 block mb-2">Feedback</span>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      {submission.feedback}
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={() => setGradeDialog(true)} 
                  className="w-full"
                  variant={submission.grade !== undefined ? "outline" : "default"}
                >
                  {submission.grade !== undefined ? 'Update Grade' : 'Add Grade'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-between">
          <Link to="/dashboard/submissions">
            <Button variant="outline">Back to Submissions</Button>
          </Link>
        </div>
      </div>

      <Dialog open={gradeDialog} onOpenChange={setGradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="grade">Grade (Max: {(assignment as any)?.maxScore || 100})</Label>
              <Input 
                id="grade" 
                type="number" 
                min="0" 
                max={(assignment as any)?.maxScore || 100} 
                value={grade} 
                onChange={(e) => setGrade(parseInt(e.target.value) || 0)} 
              />
            </div>
            <div>
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea 
                id="feedback" 
                value={feedback} 
                onChange={(e) => setFeedback(e.target.value)} 
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialog(false)}>Cancel</Button>
            <Button onClick={onSaveGrade}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Request Response Dialog */}
      <Dialog open={editRequestDialog} onOpenChange={setEditRequestDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Respond to Edit Request
            </DialogTitle>
          </DialogHeader>
          
          {editRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Student's Request</h4>
                <p className="text-sm text-gray-700">{editRequest.reason}</p>
              </div>
              
              <div>
                <Label htmlFor="editResponse">Your Response *</Label>
                <Textarea
                  id="editResponse"
                  value={editResponse}
                  onChange={(e) => setEditResponse(e.target.value)}
                  placeholder="Provide feedback on the edit request..."
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditRequestDialog(false);
                setEditResponse('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleEditRequestResponse(false)}
              disabled={!editResponse.trim() || isApproving}
            >
              {isApproving ? 'Denying...' : 'Deny Request'}
            </Button>
            <Button 
              onClick={() => handleEditRequestResponse(true)}
              disabled={!editResponse.trim() || isApproving}
            >
              {isApproving ? 'Approving...' : 'Approve Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

