import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { assignmentService, submissionService, FirestoreAssignment, FirestoreSubmission } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Save, 
  Upload, 
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface SubmissionFormData {
  content: string;
  attachments: File[];
  notes: string;
}

export default function StudentSubmissions() {
  const { assignmentId, action } = useParams<{ assignmentId: string; action: string }>();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<FirestoreAssignment | null>(null);
  const [submission, setSubmission] = useState<FirestoreSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SubmissionFormData>({
    content: '',
    attachments: [],
    notes: ''
  });

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'student' && assignmentId) {
      loadAssignmentAndSubmission();
    }
  }, [currentUser?.uid, userProfile?.role, assignmentId]);

  const loadAssignmentAndSubmission = async () => {
    try {
      setLoading(true);
      
      // Load assignment
      const assignmentData = await assignmentService.getAssignmentById(assignmentId!);
      if (!assignmentData) {
        toast.error('Assignment not found');
        navigate('/dashboard/student-assignments');
        return;
      }
      setAssignment(assignmentData);

      // Load existing submission if editing
      if (action === 'edit') {
        const submissions = await submissionService.getSubmissionsByStudent(currentUser!.uid);
        const existingSubmission = submissions.find(s => s.assignmentId === assignmentId);
        if (existingSubmission) {
          setSubmission(existingSubmission);
          setFormData({
            content: existingSubmission.content || '',
            attachments: [],
            notes: existingSubmission.notes || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
      toast.error('Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SubmissionFormData, value: string | File[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.content.trim()) {
      toast.error('Please provide assignment content');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      const submissionData: Partial<FirestoreSubmission> = {
        assignmentId: assignmentId!,
        studentId: currentUser!.uid,
        content: formData.content,
        notes: formData.notes,
        status: 'draft',
        submittedAt: new Date(),
        updatedAt: new Date()
      };

      if (submission) {
        // Update existing submission
        await submissionService.updateSubmission(submission.id, submissionData);
        toast.success('Draft saved successfully');
      } else {
        // Create new submission
        await submissionService.createSubmission(submissionData);
        toast.success('Draft saved successfully');
      }
      
      // Reload submission data
      await loadAssignmentAndSubmission();
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      const submissionData: Partial<FirestoreSubmission> = {
        assignmentId: assignmentId!,
        studentId: currentUser!.uid,
        content: formData.content,
        notes: formData.notes,
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date()
      };

      if (submission) {
        // Update existing submission
        await submissionService.updateSubmission(submission.id, submissionData);
        toast.success('Assignment submitted successfully');
      } else {
        // Create new submission
        await submissionService.createSubmission(submissionData);
        toast.success('Assignment submitted successfully');
      }
      
      // Navigate back to assignments
      navigate('/dashboard/student-assignments');
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    } finally {
      setSaving(false);
    }
  };

  const getDueDateStatus = (dueDate: Date) => {
    const now = new Date();
    const due = dueDate.toDate();
    if (due < now) {
      return { text: 'Overdue', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (due.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { text: 'Due Soon', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    }
    return { text: 'Active', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  if (!userProfile || userProfile.role !== 'student') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only students can access this page.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading assignment...</div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Assignment Not Found</div>
          <div className="text-gray-600">The assignment you're looking for doesn't exist.</div>
        </div>
      </div>
    );
  }

  const dueDateStatus = getDueDateStatus(assignment.dueDate);
  const isOverdue = assignment.dueDate.toDate() < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/student-assignments">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Assignments
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {action === 'edit' ? 'Edit Submission' : 'Submit Assignment'}
                </h1>
                <p className="text-gray-600">
                  {action === 'edit' ? 'Update your assignment submission' : 'Complete and submit your assignment'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {/* Assignment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                {assignment.title}
              </CardTitle>
              <CardDescription>{assignment.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {assignment.dueDate.toDate().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Max Score: {assignment.maxScore}</span>
                </div>
              </div>
              
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${dueDateStatus.bgColor} ${dueDateStatus.color}`}>
                {dueDateStatus.text === 'Overdue' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {dueDateStatus.text}
              </div>

              {assignment.instructions && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
                  <p className="text-blue-800 text-sm">{assignment.instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submission Form */}
          <Card>
            <CardHeader>
              <CardTitle>Your Submission</CardTitle>
              <CardDescription>
                {action === 'edit' 
                  ? 'Update your assignment submission below'
                  : 'Complete your assignment and submit it below'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content */}
              <div>
                <Label htmlFor="content" className="text-base font-medium">
                  Assignment Content *
                </Label>
                <Textarea
                  id="content"
                  placeholder="Write your assignment content here..."
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  className="min-h-[200px] mt-2"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  This is the main content of your assignment submission.
                </p>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-base font-medium">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes or comments..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Include any additional context or notes for your instructor.
                </p>
              </div>

              {/* File Attachments */}
              <div>
                <Label htmlFor="attachments" className="text-base font-medium">
                  File Attachments (Optional)
                </Label>
                <div className="mt-2">
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                </div>
                {formData.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  You can attach supporting files to your submission.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={saving || isOverdue}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {action === 'edit' ? 'Update Submission' : 'Submit Assignment'}
                </Button>

                {isOverdue && (
                  <div className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Assignment is overdue
                  </div>
                )}
              </div>

              {submission && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Submission Status</h4>
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <Badge variant="outline" className="text-blue-700">
                      {submission.status === 'draft' ? 'Draft' : 'Submitted'}
                    </Badge>
                    <span>
                      Last updated: {submission.updatedAt.toDate().toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}