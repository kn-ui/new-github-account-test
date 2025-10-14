import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { studentDataService, assignmentEditRequestService, assignmentService, courseService, submissionService } from '@/lib/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  BookOpen,
  Upload,
  Grid3X3,
  List,
  ArrowLeft,
  Download,
  Award,
  User,
  XCircle
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';
import { truncateTitle, truncateText } from '@/lib/utils';
import { isHygraphUrl, getFileIcon } from '@/lib/hygraphUpload';

interface SubmissionWithDetails {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'graded';
  grade?: number;
  maxScore: number;
  feedback?: string;
  content: string;
  attachments?: string[];
}

// Helper functions for status styling
const getStatusColor = (status: string) => {
  switch (status) {
    case 'submitted':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'graded':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'submitted':
      return <CheckCircle className="h-4 w-4" />;
    case 'graded':
      return <Award className="h-4 w-4" />;
    case 'draft':
      return <Clock className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

export default function StudentSubmissions() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { assignmentId, action } = useParams();
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  
  // Submission form states
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionAttachments, setSubmissionAttachments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedSubmissionDetail, setSelectedSubmissionDetail] = useState<SubmissionWithDetails | null>(null);
  const [editRequestOpen, setEditRequestOpen] = useState(false);
  const [editReason, setEditReason] = useState('');
  const [selectedSubmissionForEdit, setSelectedSubmissionForEdit] = useState<SubmissionWithDetails | null>(null);
  const [editRequests, setEditRequests] = useState<any[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<SubmissionWithDetails | null>(null);

  const loadSubmissions = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      
      // Load submissions and edit requests in parallel
      const [submissions, requests] = await Promise.all([
        studentDataService.getStudentSubmissionsData(currentUser.uid),
        assignmentEditRequestService.getEditRequestsByStudent(currentUser.uid)
      ]);

      setSubmissions(submissions);
      setEditRequests(requests);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error(t('student.submissions.loadError'));
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, t]);

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'student') {
      loadSubmissions();
    }
  }, [currentUser?.uid, userProfile?.role, loadSubmissions]);

  // Refresh submissions periodically to catch grade updates
  useEffect(() => {
    if (!currentUser?.uid || userProfile?.role !== 'student') return;

    const interval = setInterval(() => {
      loadSubmissions();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [currentUser?.uid, userProfile?.role, loadSubmissions]);

  // Refresh submissions when page becomes visible
  useEffect(() => {
    if (!currentUser?.uid || userProfile?.role !== 'student') return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadSubmissions();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser?.uid, userProfile?.role, loadSubmissions]);

  useEffect(() => {
    if (assignmentId && action) {
      handleSubmissionAction(assignmentId, action);
    }
  }, [assignmentId, action]);

  const handleSubmissionAction = async (assignmentId: string, action: string) => {
    try {
      // Fetch the assignment directly
      const assignments = await assignmentService.getAssignmentsByIds([assignmentId]);
      const assignment = assignments[assignmentId];

      if (!assignment) {
        toast.error(t('student.submissions.assignmentNotFound'));
        return;
      }

      // Fetch course details to get course title and instructor name
      const course = await courseService.getCourseById(assignment.courseId);

      const assignmentWithCourseInfo = {
        ...assignment,
        courseTitle: course?.title || 'Unknown Course',
        instructorName: course?.instructorName || 'Unknown Instructor',
      };

      setSelectedAssignment(assignmentWithCourseInfo);
      setShowSubmissionDialog(true);
    } catch (error) {
      console.error('Error handling submission action:', error);
      toast.error(t('student.submissions.loadAssignmentError'));
    }
  };

  const handleSubmitSubmission = async () => {
    if (!selectedAssignment || !submissionContent.trim()) {
      toast.error(t('student.submissions.missingContent'));
      return;
    }

    // Check if assignment is overdue
    const now = new Date();
    const dueDate = selectedAssignment.dueDate instanceof Date 
      ? selectedAssignment.dueDate 
      : selectedAssignment.dueDate.toDate();
    
    if (now > dueDate) {
      toast.error('Cannot submit assignment after the due date');
      return;
    }


    try {
      // Check if we're editing an existing submission (approved edit request)
      if (selectedSubmissionForEdit && selectedSubmissionForEdit.id) {
        // Update existing submission
        const updateData = {
          content: submissionContent,
          attachments: submissionAttachments,
          status: 'submitted' as const,
          updatedAt: new Date()
        };

        console.log('Updating submission:', selectedSubmissionForEdit.id, updateData);

        await submissionService.updateSubmission(selectedSubmissionForEdit.id, updateData);
        
        // Update edit request status to completed
        const editRequest = getEditRequestForSubmission(selectedSubmissionForEdit.id);
        if (editRequest) {
          await assignmentEditRequestService.updateEditRequest(editRequest.id, { status: 'completed' });
        }
        
        // Reload edit requests to reflect updated status
        await loadSubmissions();
        
        toast.success('Submission updated successfully');
      } else {
        // Create new submission
        const submissionData = {
          assignmentId: selectedAssignment.id,
          assignmentTitle: selectedAssignment.title,
          courseId: selectedAssignment.courseId,
          courseTitle: selectedAssignment.courseTitle,
          instructorName: selectedAssignment.instructorName,
          studentId: currentUser!.uid,
          studentName: userProfile?.displayName || 'Unknown Student',
          studentEmail: userProfile?.email || currentUser?.email || '',
          content: submissionContent,
          attachments: submissionAttachments,
          status: 'submitted' as const,
          submittedAt: new Date(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        console.log('Creating new submission:', submissionData);

        await submissionService.createSubmission(submissionData);
        toast.success(t('student.submissions.submitted'));
      }

      setShowSubmissionDialog(false);
      setSelectedAssignment(null);
      setSelectedSubmissionForEdit(null);
      setSubmissionContent('');
      setSubmissionAttachments([]);
      studentDataService.clearStudentCache(currentUser!.uid);
      loadSubmissions();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error(t('student.submissions.submitError'));
    }
  };

  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = submissions.filter(submission => {
      const matchesSearch = submission.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           submission.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           submission.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
      const matchesCourse = courseFilter === 'all' || submission.courseTitle === courseFilter;
      
      return matchesSearch && matchesStatus && matchesCourse;
    });

    // Sort submissions
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());
        break;
      case 'assignment':
        filtered.sort((a, b) => a.assignmentTitle.localeCompare(b.assignmentTitle));
        break;
      case 'course':
        filtered.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
        break;
    }

    return filtered;
  }, [submissions, searchTerm, statusFilter, courseFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'graded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'graded': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const isAssignmentOverdue = (assignment: any) => {
    const now = new Date();
    const dueDate = assignment.dueDate instanceof Date ? assignment.dueDate : assignment.dueDate.toDate();
    return now > dueDate;
  };

  const getGradeColor = (grade: number, maxScore: number) => {
    const percentage = (grade / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUniqueCourses = () => {
    return Array.from(new Set(submissions.map(submission => submission.courseTitle)));
  };

  const getEditRequestForSubmission = (submissionId: string) => {
    return editRequests.find(req => req.submissionId === submissionId);
  };

  const handleRequestEdit = async (submission: SubmissionWithDetails) => {
    try {
      // Get the assignment to check due date
      const assignment = await assignmentService.getAssignmentsByIds([submission.assignmentId]);
      const assignmentData = assignment[submission.assignmentId];
      
      if (!assignmentData) {
        toast.error('Assignment not found');
        return;
      }

      // Check if assignment is still within due date
      const now = new Date();
      const dueDate = assignmentData.dueDate instanceof Date 
        ? assignmentData.dueDate 
        : assignmentData.dueDate.toDate();
      
      if (now > dueDate) {
        toast.error('Cannot request edit after the assignment due date');
        return;
      }

      setSelectedSubmissionForEdit(submission);
      setEditRequestOpen(true);
    } catch (error) {
      console.error('Error checking assignment due date:', error);
      toast.error('Failed to check assignment details');
    }
  };

  const handleEditApprovedSubmission = async (submission: SubmissionWithDetails) => {
    try {
      // Get the assignment details
      const assignment = await assignmentService.getAssignmentsByIds([submission.assignmentId]);
      const assignmentData = assignment[submission.assignmentId];
      
      if (!assignmentData) {
        toast.error('Assignment not found');
        return;
      }

      // Get course details
      const course = await courseService.getCourseById(assignmentData.courseId);

      const assignmentWithCourseInfo = {
        ...assignmentData,
        courseTitle: course?.title || 'Unknown Course',
        instructorName: course?.instructorName || 'Unknown Instructor',
      };

      // Set the existing submission content for editing
      setSubmissionContent((submission as any).content || '');
      setSubmissionAttachments((submission as any).attachments || []);
      
      // Set the assignment and store pending submission
      setSelectedAssignment(assignmentWithCourseInfo);
      setPendingSubmission(submission);
      
      // Show confirmation dialog instead of directly opening submission dialog
      setShowConfirmDialog(true);
    } catch (error) {
      console.error('Error preparing submission for edit:', error);
      toast.error('Failed to prepare submission for editing');
    }
  };

  const handleConfirmEdit = () => {
    if (pendingSubmission) {
      setSelectedSubmissionForEdit(pendingSubmission);
      setShowSubmissionDialog(true);
    }
    setShowConfirmDialog(false);
    setPendingSubmission(null);
  };

  const handleCancelEdit = () => {
    setShowConfirmDialog(false);
    setPendingSubmission(null);
    setSelectedAssignment(null);
    setSubmissionContent('');
    setSubmissionAttachments([]);
  };

  const submitEditRequest = async () => {
    if (!selectedSubmissionForEdit || !currentUser?.uid || !userProfile || !editReason.trim()) {
      toast.error('Please provide a reason for the edit request');
      return;
    }

    try {
      // Get the assignment to find the teacher ID
      const assignment = await assignmentService.getAssignmentsByIds([selectedSubmissionForEdit.assignmentId]);
      const assignmentData = assignment[selectedSubmissionForEdit.assignmentId];
      
      if (!assignmentData) {
        toast.error('Assignment not found');
        return;
      }

      const editRequestData = {
        submissionId: selectedSubmissionForEdit.id,
        assignmentId: selectedSubmissionForEdit.assignmentId,
        assignmentTitle: selectedSubmissionForEdit.assignmentTitle,
        courseId: selectedSubmissionForEdit.courseId,
        courseTitle: selectedSubmissionForEdit.courseTitle,
        studentId: currentUser.uid,
        studentName: userProfile.displayName || 'Unknown Student',
        studentEmail: userProfile.email || currentUser.email || '',
        teacherId: assignmentData.teacherId,
        reason: editReason.trim(),
        isActive: true
      };

      await assignmentEditRequestService.createEditRequest(editRequestData);
      toast.success('Edit request submitted successfully. Your teacher will review it.');
      
      setEditRequestOpen(false);
      setEditReason('');
      setSelectedSubmissionForEdit(null);
    } catch (error) {
      console.error('Error submitting edit request:', error);
      toast.error('Failed to submit edit request');
    }
  };

  if (selectedSubmissionDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedSubmissionDetail(null)}
              className="p-3 hover:bg-white rounded-xl transition-all duration-200 shadow-sm border border-gray-200 hover:shadow-md"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Submission Details</h1>
              <p className="text-lg text-gray-600">{selectedSubmissionDetail.assignmentTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(selectedSubmissionDetail.status)} px-4 py-2 text-sm font-medium`}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedSubmissionDetail.status)}
                  {selectedSubmissionDetail.status.charAt(0).toUpperCase() + selectedSubmissionDetail.status.slice(1)}
                </div>
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Submitted Content */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Submitted Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSubmissionDetail.content ? (
                    <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                        {selectedSubmissionDetail.content}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No content submitted</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attachments */}
              {selectedSubmissionDetail.attachments && selectedSubmissionDetail.attachments.length > 0 && (
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-green-600" />
                      Attachments ({selectedSubmissionDetail.attachments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedSubmissionDetail.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="text-2xl">
                            {getFileIcon(attachment)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.split('/').pop() || `Attachment ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {isHygraphUrl(attachment) ? 'Hygraph Storage' : 'External File'} • Attachment {index + 1}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="hover:bg-blue-50 hover:border-blue-300" asChild>
                            <a href={attachment} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4 mr-1" />
                              {isHygraphUrl(attachment) ? 'Download' : 'Open'}
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Grade & Feedback */}
              {selectedSubmissionDetail.status === 'graded' && (
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-600" />
                      Grade & Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium text-green-700 mb-1">Final Grade</p>
                          <p className="text-3xl font-bold text-green-900">
                            {selectedSubmissionDetail.grade}/{selectedSubmissionDetail.maxScore}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-600">
                            {Math.round((selectedSubmissionDetail.grade! / selectedSubmissionDetail.maxScore) * 100)}%
                          </p>
                          <p className="text-xs text-green-500">Score</p>
                        </div>
                      </div>
                      {selectedSubmissionDetail.feedback && (
                        <div className="pt-4 border-t border-green-200">
                          <p className="text-sm font-medium text-green-700 mb-2">Instructor Feedback</p>
                          <div className="bg-white rounded-lg p-4 border border-green-100">
                            <p className="text-gray-700">{selectedSubmissionDetail.feedback}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Submission Info */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-600" />
                    Submission Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedSubmissionDetail.courseTitle}</p>
                      <p className="text-xs text-gray-500">Course</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedSubmissionDetail.instructorName}</p>
                      <p className="text-xs text-gray-500">Instructor</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedSubmissionDetail.submittedAt.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">Submitted</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Award className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedSubmissionDetail.maxScore} points
                      </p>
                      <p className="text-xs text-gray-500">Max Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Edit Request Status */}
              {selectedSubmissionDetail.status === 'submitted' && (() => {
                const editRequest = getEditRequestForSubmission(selectedSubmissionDetail.id);
                if (editRequest) {
                  return (
                    <Card className={`border-0 shadow-sm ${
                      editRequest.status === 'approved' ? 'bg-green-50 border-green-200' :
                      editRequest.status === 'denied' ? 'bg-red-50 border-red-200' :
                      editRequest.status === 'completed' ? 'bg-blue-50 border-blue-200' :
                      'bg-yellow-50 border-yellow-200'
                    }`}>
                      <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${
                          editRequest.status === 'approved' ? 'text-green-800' :
                          editRequest.status === 'denied' ? 'text-red-800' :
                          editRequest.status === 'completed' ? 'text-blue-800' :
                          'text-yellow-800'
                        }`}>
                          {editRequest.status === 'approved' && <CheckCircle className="h-5 w-5" />}
                          {editRequest.status === 'denied' && <XCircle className="h-5 w-5" />}
                          {editRequest.status === 'completed' && <CheckCircle className="h-5 w-5" />}
                          {editRequest.status === 'pending' && <Clock className="h-5 w-5" />}
                          Edit Request
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Your Reason</p>
                            <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border">
                              {editRequest.reason}
                            </p>
                          </div>
                          {editRequest.response && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Teacher Response</p>
                              <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border">
                                {editRequest.response}
                              </p>
                            </div>
                          )}
                          <Badge className={`${
                            editRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                            editRequest.status === 'denied' ? 'bg-red-100 text-red-800' :
                            editRequest.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {editRequest.status.charAt(0).toUpperCase() + editRequest.status.slice(1)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                return null;
              })()}

              {/* Action Buttons */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5 text-gray-600" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {selectedSubmissionDetail.status === 'draft' && (
                      <Button 
                        onClick={() => handleSubmissionAction(selectedSubmissionDetail.assignmentId, 'edit')}
                        className="flex items-center gap-2 flex-1"
                      >
                        <Edit className="h-4 w-4" />
                        Continue Working
                      </Button>
                    )}
                    {selectedSubmissionDetail.status === 'submitted' && (() => {
                      const editRequest = getEditRequestForSubmission(selectedSubmissionDetail.id);
                      if (editRequest) {
                        if (editRequest.status === 'approved') {
                          return (
                            <Button 
                              onClick={() => handleEditApprovedSubmission(selectedSubmissionDetail)}
                              className="flex items-center gap-2 flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <Edit className="h-4 w-4" />
                              Edit Assignment (Approved)
                            </Button>
                          );
                        } else if (editRequest.status === 'completed') {
                          return (
                            <div className="flex flex-col gap-3 w-full">
                              <Button variant="outline" disabled className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Edit Completed
                              </Button>
                              <span className="text-sm text-gray-600 bg-green-50 rounded-lg p-3">
                                Your approved edit has been submitted and cannot be changed further.
                              </span>
                            </div>
                          );
                        } else if (editRequest.status === 'denied') {
                          return (
                            <div className="flex flex-col gap-3 w-full">
                              <Button variant="outline" disabled className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Edit Request Denied
                              </Button>
                              {editRequest.response && (
                                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                  <strong>Teacher Response:</strong> {editRequest.response}
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex flex-col gap-3 w-full">
                              <Button variant="outline" disabled className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Edit Request Pending
                              </Button>
                              <span className="text-sm text-gray-600 bg-yellow-50 rounded-lg p-3">
                                Waiting for teacher response
                              </span>
                            </div>
                          );
                        }
                      } else {
                        return (
                          <Button 
                            variant="outline"
                            onClick={() => handleRequestEdit(selectedSubmissionDetail)}
                            className="flex items-center gap-2 flex-1"
                          >
                            <Edit className="h-4 w-4" />
                            Request Edit
                          </Button>
                        );
                      }
                    })()}
                    <Button variant="outline" asChild className="flex items-center gap-2">
                      <Link to={`/dashboard/course/${selectedSubmissionDetail.courseId}`}>
                        <BookOpen className="h-4 w-4" />
                        View Course
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submission Dialog - Inside submission details view */}
          <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedSubmissionForEdit && selectedSubmissionForEdit.id 
                    ? 'Edit Submission' 
                    : t('student.submissions.dialog.title')
                  }
                </DialogTitle>
              </DialogHeader>
              
              {selectedAssignment && (
                <div className="space-y-4">
                  <div>
                    <Label>{t('student.submissions.dialog.assignment')}: {selectedAssignment.title}</Label>
                    <p className="text-sm text-gray-600">{selectedAssignment.description}</p>
                    <p className="text-sm text-gray-600">{t('student.submissions.maxScore')}: {selectedAssignment.maxScore}</p>
                    {isAssignmentOverdue(selectedAssignment) && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600"><strong>⚠️ Assignment Overdue:</strong> This assignment is past its due date and cannot be submitted.</p>
                      </div>
                    )}
                    {selectedAssignment.instructions && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm"><strong>{t('assignments.instructions')}:</strong> {selectedAssignment.instructions}</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="content">{t('student.submissions.dialog.content')}</Label>
                    <Textarea
                      id="content"
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      placeholder={t('student.submissions.dialog.contentPlaceholder')}
                      rows={6}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label>{t('student.submissions.dialog.attachments')}</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">{t('student.submissions.dialog.attachmentNote')}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSubmissionDialog(false)}>
                  {t('common.cancel')}
                </Button>
                <Button 
                  onClick={handleSubmitSubmission} 
                  disabled={!submissionContent.trim() || (selectedAssignment && new Date() > (selectedAssignment.dueDate instanceof Date ? selectedAssignment.dueDate : selectedAssignment.dueDate.toDate()))}
                >
                  {selectedSubmissionForEdit && selectedSubmissionForEdit.id 
                    ? 'Update Submission' 
                    : t('student.submissions.dialog.submit')
                  }
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Request Dialog - Inside submission details view */}
          <Dialog open={editRequestOpen} onOpenChange={setEditRequestOpen}>
            <DialogContent className="max-w-md z-50">
              <DialogHeader>
                <DialogTitle>Request Assignment Edit</DialogTitle>
              </DialogHeader>
              
              {selectedSubmissionForEdit && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p><strong>Assignment:</strong> {selectedSubmissionForEdit.assignmentTitle}</p>
                    <p><strong>Course:</strong> {selectedSubmissionForEdit.courseTitle}</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="editReason">Reason for edit request</Label>
                    <Textarea
                      id="editReason"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      placeholder="Please explain why you need to edit this submission..."
                      className="mt-2"
                    />
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditRequestOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={submitEditRequest}
                  disabled={!editReason.trim()}
                >
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Custom Confirmation Dialog - Inside submission details view */}
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-orange-600" />
                  Confirm Edit Submission
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Edit className="h-4 w-4 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-orange-900 mb-1">Important Notice</h4>
                      <p className="text-sm text-orange-800">
                        You are about to submit your approved edit. Once submitted, you will not be able to make further changes to this submission.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p><strong>Assignment:</strong> {selectedAssignment?.title}</p>
                  <p><strong>Course:</strong> {selectedAssignment?.courseTitle}</p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This is your final opportunity to make changes. After submission, the assignment will be locked for further editing.
                  </p>
                </div>
              </div>
              
              <DialogFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmEdit}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Continue Editing
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'student') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{t('common.accessDenied')}</div>
          <div className="text-gray-600">{t('common.studentOnly')}</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('student.submissions.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero 
        title={t('student.submissions.title')}
        subtitle={t('student.submissions.subtitle')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Graded</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {submissions.filter(s => s.status === 'graded').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {submissions.filter(s => s.status === 'submitted').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Edit className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Draft</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {submissions.filter(s => s.status === 'draft').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="lg:col-span-2">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                  {t('student.submissions.searchLabel')}
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder={t('student.submissions.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mb-2 block">
                  {t('student.submissions.filterByStatus')}
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('student.submissions.allStatuses')}</SelectItem>
                    <SelectItem value="draft">{t('student.submissions.draft')}</SelectItem>
                    <SelectItem value="submitted">{t('student.submissions.submitted')}</SelectItem>
                    <SelectItem value="graded">{t('student.submissions.graded')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="course-filter" className="text-sm font-medium text-gray-700 mb-2 block">
                  {t('student.submissions.filterByCourse')}
                </Label>
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {getUniqueCourses().map(courseTitle => (
                      <SelectItem key={courseTitle} value={courseTitle}>
                        {courseTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <Label htmlFor="sort" className="text-sm font-medium text-gray-700">
                  {t('student.submissions.sortBy')}
                </Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">{t('student.submissions.sortRecent')}</SelectItem>
                    <SelectItem value="oldest">{t('student.submissions.sortOldest')}</SelectItem>
                    <SelectItem value="assignment">{t('student.submissions.sortAssignment')}</SelectItem>
                    <SelectItem value="course">{t('student.submissions.sortCourse')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">{t('common.view')}:</span>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Display */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid gap-4'}>
          {filteredAndSortedSubmissions.map(submission => (
            <Card key={submission.id} className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
              <CardContent className={viewMode === 'grid' ? 'p-6' : 'p-6'}>
                {viewMode === 'grid' ? (
                  // Grid View
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{truncateTitle(submission.assignmentTitle)}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {truncateText(submission.courseTitle)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={`${getStatusColor(submission.status)} px-3 py-1`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(submission.status)}
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </div>
                      </Badge>
                      {submission.status === 'graded' && submission.grade !== undefined && (
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">
                            {submission.grade}/{submission.maxScore}
                          </p>
                          <p className="text-xs text-gray-500">Grade</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Submitted: {submission.submittedAt.toLocaleDateString()}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedSubmissionDetail(submission)} 
                        className="flex-1 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button variant="outline" size="sm" asChild className="hover:bg-gray-50">
                        <Link to={`/dashboard/course/${submission.courseId}`}>
                          <BookOpen className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  // List View
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{truncateTitle(submission.assignmentTitle)}</h3>
                          <Badge className={`${getStatusColor(submission.status)} flex-shrink-0`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(submission.status)}
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </div>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{truncateText(submission.courseTitle)}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {submission.instructorName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t('student.submissions.submittedAt')}: {submission.submittedAt.toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            {t('student.submissions.maxScore')}: {submission.maxScore}
                          </span>
                        </div>
                        
                        {submission.status === 'graded' && submission.grade !== undefined && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{t('student.submissions.grade')}:</span>
                              <span className={`font-bold ${getGradeColor(submission.grade, submission.maxScore)}`}>
                                {submission.grade}/{submission.maxScore}
                              </span>
                            </div>
                            {submission.feedback && (
                              <p className="text-sm text-gray-700">
                                <strong>{t('student.submissions.feedback')}:</strong> {submission.feedback}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedSubmissionDetail(submission)}>
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/course/${submission.courseId}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Course
                        </Link>
                      </Button>
                      {submission.status === 'draft' && (
                        <Button size="sm" onClick={() => handleSubmissionAction(submission.assignmentId, 'edit')}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('student.submissions.continue')}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filteredAndSortedSubmissions.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('student.submissions.none')}</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' || courseFilter !== 'all'
                    ? t('student.submissions.noResultsTipFiltered')
                    : t('student.submissions.noResultsTip')
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && courseFilter === 'all' && (
                  <Button asChild>
                    <Link to="/dashboard/student-assignments">{t('student.submissions.viewAssignments')}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>


    </div>
  );
}