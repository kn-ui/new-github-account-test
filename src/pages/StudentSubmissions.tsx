import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  BookOpen,
  Eye,
  Download,
  Star,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { submissionService, assignmentService, courseService, FirestoreSubmission } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SubmissionWithDetails extends FirestoreSubmission {
  assignment?: any;
  course?: any;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late' | 'overdue';
}

export default function StudentSubmissions() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'graded' | 'late'>('all');

  useEffect(() => {
    loadSubmissions();
  }, [currentUser?.uid]);

  const loadSubmissions = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      
      // Get student's submissions
      const studentSubmissions = await submissionService.getSubmissionsByStudent(currentUser.uid);
      
      // Get detailed information for each submission
      const submissionsWithDetails = await Promise.all(
        studentSubmissions.map(async (submission: any) => {
          try {
            const assignment = await assignmentService.getAssignmentById(submission.assignmentId);
            const course = await courseService.getCourseById(submission.courseId);
            
            // Determine submission status
            let status: SubmissionWithDetails['status'] = 'submitted';
            if (assignment?.dueDate) {
              const dueDate = assignment.dueDate.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate);
              const submittedDate = submission.submittedAt?.toDate ? submission.submittedAt.toDate() : new Date(submission.submittedAt);
              
              if (submittedDate > dueDate) {
                status = 'late';
              }
            }
            
            if (submission.status === 'graded') {
              status = 'graded';
            }
            
            return {
              ...submission,
              assignment,
              course,
              status,
              grade: submission.grade,
              feedback: submission.feedback
            };
          } catch (error) {
            console.warn(`Failed to load details for submission ${submission.id}:`, error);
            return {
              ...submission,
              assignment: null,
              course: null,
              status: 'submitted' as SubmissionWithDetails['status']
            };
          }
        })
      );
      
      // Sort by submission date (newest first)
      submissionsWithDetails.sort((a, b) => {
        const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt);
        const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setSubmissions(submissionsWithDetails);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const openDetailsDialog = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setShowDetailsDialog(true);
  };

  const getStatusColor = (status: SubmissionWithDetails['status']) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: SubmissionWithDetails['status']) => {
    switch (status) {
      case 'graded':
        return <CheckCircle className="h-4 w-4" />;
      case 'submitted':
        return <Clock className="h-4 w-4" />;
      case 'late':
        return <AlertCircle className="h-4 w-4" />;
      case 'overdue':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    if (grade >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Invalid date';
    }
  };

  const filteredSubmissions = filterStatus === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === filterStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
            <p className="text-gray-600">View all your submitted assignments and grades</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter and Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filter by status:</span>
              {(['all', 'submitted', 'graded', 'late'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} found
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900">{submissions.length}</div>
              <div className="text-gray-500">Total Submissions</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-blue-600">
                {submissions.filter(s => s.status === 'submitted').length}
              </div>
              <div className="text-gray-500">Pending Review</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">
                {submissions.filter(s => s.status === 'graded').length}
              </div>
              <div className="text-gray-500">Graded</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-yellow-600">
                {submissions.filter(s => s.status === 'late').length}
              </div>
              <div className="text-gray-500">Late</div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-600 mb-4">
                {filterStatus === 'all' 
                  ? 'You haven\'t submitted any assignments yet'
                  : `No ${filterStatus} submissions found`
                }
              </p>
              <Button onClick={() => navigate('/dashboard/student-assignments')}>
                <BookOpen className="h-4 w-4 mr-2" />
                View Assignments
              </Button>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <div key={submission.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {submission.assignment?.title || 'Unknown Assignment'}
                      </h3>
                      <Badge className={getStatusColor(submission.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(submission.status)}
                          <span className="capitalize">{submission.status}</span>
                        </div>
                      </Badge>
                      {submission.grade !== undefined && (
                        <Badge variant="outline" className={getGradeColor(submission.grade)}>
                          {submission.grade}%
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">
                      Course: {submission.course?.title || 'Unknown Course'}
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Submitted: {formatDate(submission.submittedAt)}</span>
                      </div>
                      {submission.assignment?.dueDate && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Due: {formatDate(submission.assignment.dueDate)}</span>
                        </div>
                      )}
                      {submission.assignment?.maxPoints && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4" />
                          <span>Max Points: {submission.assignment.maxPoints}</span>
                        </div>
                      )}
                    </div>
                    
                    {submission.feedback && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Feedback:</strong> {submission.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openDetailsDialog(submission)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Submission Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Assignment</h3>
                <p className="text-gray-600">{selectedSubmission.assignment?.title || 'Unknown Assignment'}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900">Course</h3>
                <p className="text-gray-600">{selectedSubmission.course?.title || 'Unknown Course'}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900">Submission Content</h3>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {selectedSubmission.content || 'No content provided'}
                  </p>
                </div>
              </div>
              
              {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900">Attachments</h3>
                  <div className="mt-2 space-y-2">
                    {selectedSubmission.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{attachment}</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Submitted</h3>
                  <p className="text-gray-600">{formatDate(selectedSubmission.submittedAt)}</p>
                </div>
                
                {selectedSubmission.assignment?.dueDate && (
                  <div>
                    <h3 className="font-medium text-gray-900">Due Date</h3>
                    <p className="text-gray-600">{formatDate(selectedSubmission.assignment.dueDate)}</p>
                  </div>
                )}
              </div>
              
              {selectedSubmission.grade !== undefined && (
                <div>
                  <h3 className="font-medium text-gray-900">Grade</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`text-2xl font-bold ${getGradeColor(selectedSubmission.grade)}`}>
                      {selectedSubmission.grade}%
                    </span>
                    {selectedSubmission.assignment?.maxPoints && (
                      <span className="text-gray-500">
                        / {selectedSubmission.assignment.maxPoints} points
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {selectedSubmission.feedback && (
                <div>
                  <h3 className="font-medium text-gray-900">Feedback</h3>
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-800">{selectedSubmission.feedback}</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}