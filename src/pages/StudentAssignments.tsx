import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  BookOpen,
  Upload,
  Eye,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { assignmentService, enrollmentService, submissionService, FirestoreAssignment } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface AssignmentWithSubmission extends FirestoreAssignment {
  submission?: any;
  courseTitle?: string;
}

export default function StudentAssignments() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithSubmission | null>(null);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    content: '',
    attachments: [] as string[]
  });

  useEffect(() => {
    loadAssignments();
  }, [currentUser?.uid]);

  const loadAssignments = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      
      // Get student's enrollments
      const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser.uid);
      const courseIds = enrollments.map((e: any) => e.courseId);
      
      // Get assignments for enrolled courses
      const allAssignments = await Promise.all(
        courseIds.map(async (courseId) => {
          try {
            const courseAssignments = await assignmentService.getAssignmentsByCourse(courseId);
            return courseAssignments.map((assignment: any) => ({
              ...assignment,
              courseTitle: enrollments.find((e: any) => e.courseId === courseId)?.course?.title || 'Unknown Course'
            }));
          } catch (error) {
            console.warn(`Failed to load assignments for course ${courseId}:`, error);
            return [];
          }
        })
      );
      
      const flatAssignments = allAssignments.flat();
      
      // Get submissions for each assignment
      const assignmentsWithSubmissions = await Promise.all(
        flatAssignments.map(async (assignment) => {
          try {
            const submissions = await submissionService.getSubmissionsByAssignment(assignment.id);
            const studentSubmission = submissions.find((s: any) => s.studentId === currentUser.uid);
            return {
              ...assignment,
              submission: studentSubmission
            };
          } catch (error) {
            return { ...assignment, submission: undefined };
          }
        })
      );
      
      setAssignments(assignmentsWithSubmissions);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const openSubmissionDialog = (assignment: AssignmentWithSubmission) => {
    setSelectedAssignment(assignment);
    setSubmissionForm({
      content: '',
      attachments: []
    });
    setShowSubmissionDialog(true);
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAssignment || !submissionForm.content.trim()) {
      toast.error('Please provide submission content');
      return;
    }

    try {
      const submissionData = {
        assignmentId: selectedAssignment.id,
        courseId: selectedAssignment.courseId,
        studentId: currentUser?.uid || '',
        content: submissionForm.content,
        attachments: submissionForm.attachments,
        status: 'submitted',
        submittedAt: new Date() as any
      };

      if (selectedAssignment.submission) {
        // Update existing submission
        await submissionService.updateSubmission(selectedAssignment.submission.id, submissionData as any);
        toast.success('Submission updated successfully');
      } else {
        // Create new submission
        await submissionService.createSubmission(submissionData as any);
        toast.success('Assignment submitted successfully');
      }

      setShowSubmissionDialog(false);
      await loadAssignments();
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      toast.error('Failed to submit assignment');
    }
  };

  const getStatusColor = (assignment: AssignmentWithSubmission) => {
    if (assignment.submission) {
      return assignment.submission.status === 'graded' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
    }
    
    const dueDate = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate as any);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-red-100 text-red-800';
    if (diffDays <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (assignment: AssignmentWithSubmission) => {
    if (assignment.submission) {
      return assignment.submission.status === 'graded' ? 'Submitted & Graded' : 'Submitted';
    }
    
    const dueDate = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate as any);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 3) return `Due in ${diffDays} days`;
    return `Due in ${diffDays} days`;
  };

  const formatDate = (date: any) => {
    if (!date) return 'No due date';
    
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
            <p className="text-gray-600">View and submit assignments for your enrolled courses</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
            <p className="text-gray-600 mb-4">You don't have any assignments yet, or you're not enrolled in any courses</p>
            <Button onClick={() => navigate('/courses')}>
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Courses
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{assignment.title}</h3>
                      <Badge variant={assignment.maxPoints >= 100 ? 'default' : 'secondary'}>
                        {assignment.maxPoints} points
                      </Badge>
                      <Badge className={getStatusColor(assignment)}>
                        {getStatusText(assignment)}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{assignment.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{assignment.courseTitle || 'Unknown Course'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {formatDate(assignment.dueDate)}</span>
                      </div>
                      {assignment.instructions && (
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4" />
                          <span>Has instructions</span>
                        </div>
                      )}
                    </div>

                    {assignment.instructions && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm text-gray-900 mb-1">Instructions:</h4>
                        <p className="text-sm text-gray-700">{assignment.instructions}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {assignment.submission ? (
                      <>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Submission
                        </Button>
                        {assignment.submission.status !== 'graded' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openSubmissionDialog(assignment)}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Update
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button 
                        onClick={() => openSubmissionDialog(assignment)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Submit Assignment
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Dialog */}
      <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAssignment?.submission ? 'Update Submission' : 'Submit Assignment'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitAssignment} className="space-y-4">
            <div>
              <Label htmlFor="content">Submission Content *</Label>
              <Textarea
                id="content"
                value={submissionForm.content}
                onChange={(e) => setSubmissionForm({ ...submissionForm, content: e.target.value })}
                placeholder="Enter your assignment submission..."
                rows={6}
                required
              />
            </div>

            <div>
              <Label htmlFor="attachments">Attachments (Optional)</Label>
              <Input
                id="attachments"
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const fileNames = files.map(f => f.name);
                  setSubmissionForm({ ...submissionForm, attachments: fileNames });
                }}
              />
              <p className="text-sm text-gray-500 mt-1">
                You can attach multiple files to your submission
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowSubmissionDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedAssignment?.submission ? 'Update Submission' : 'Submit Assignment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}