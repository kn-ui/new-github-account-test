import React, { useEffect, useState, useMemo } from 'react';
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
  Download
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

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'student') {
      loadSubmissions();
    }
  }, [currentUser?.uid, userProfile?.role]);

  useEffect(() => {
    if (assignmentId && action) {
      handleSubmissionAction(assignmentId, action);
    }
  }, [assignmentId, action]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      
      // Load submissions and edit requests in parallel
      const [submissions, requests] = await Promise.all([
        studentDataService.getStudentSubmissionsData(currentUser!.uid),
        assignmentEditRequestService.getEditRequestsByStudent(currentUser!.uid)
      ]);

      setSubmissions(submissions);
      setEditRequests(requests);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error(t('student.submissions.loadError'));
    } finally {
      setLoading(false);
    }
  };

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
      
      // Set the assignment and open the submission dialog for editing
      setSelectedAssignment(assignmentWithCourseInfo);
      setShowSubmissionDialog(true);
      
      // Store the submission ID for updating instead of creating new
      setSelectedSubmissionForEdit(submission);
    } catch (error) {
      console.error('Error preparing submission for edit:', error);
      toast.error('Failed to prepare submission for editing');
    }
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedSubmissionDetail(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Submission Details</h1>
              <p className="text-gray-600">{selectedSubmissionDetail.assignmentTitle}</p>
            </div>
          </div>

          {/* Submission Detail */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-6">
              {/* Assignment Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignment Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Course:</span>
                    <p>{selectedSubmissionDetail.courseTitle}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Instructor:</span>
                    <p>{selectedSubmissionDetail.instructorName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Submitted:</span>
                    <p>{selectedSubmissionDetail.submittedAt.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <p className="capitalize">{selectedSubmissionDetail.status}</p>
                  </div>
                </div>
              </div>

              {/* Submitted Content */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Submitted Content</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmissionDetail.content}</p>
                </div>
              </div>

              {/* Attachments */}
              {selectedSubmissionDetail.attachments && selectedSubmissionDetail.attachments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Attachments</h3>
                  <div className="space-y-2">
                    {selectedSubmissionDetail.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText size={16} className="text-blue-600" />
                        <span className="text-sm text-gray-700">{attachment}</span>
                        <Download size={14} className="text-gray-400 ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grade & Feedback */}
              {selectedSubmissionDetail.status === 'graded' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Grade & Feedback</h3>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-green-800">Grade:</span>
                      <span className="text-2xl font-bold text-green-900">
                        {selectedSubmissionDetail.grade}/{selectedSubmissionDetail.maxScore}
                      </span>
                    </div>
                    {selectedSubmissionDetail.feedback && (
                      <div>
                        <span className="font-medium text-green-800">Feedback:</span>
                        <p className="text-green-700 mt-2">{selectedSubmissionDetail.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                {selectedSubmissionDetail.status === 'draft' && (
                  <Button 
                    onClick={() => handleSubmissionAction(selectedSubmissionDetail.assignmentId, 'edit')}
                    className="flex items-center gap-2"
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
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Assignment (Approved)
                        </Button>
                      );
                    } else if (editRequest.status === 'denied') {
                      return (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" disabled className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Edit Request Denied
                          </Button>
                          {editRequest.response && (
                            <div className="text-sm text-gray-600">
                              <strong>Teacher Response:</strong> {editRequest.response}
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" disabled className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Edit Request Pending
                          </Button>
                          <span className="text-sm text-gray-600">Waiting for teacher response</span>
                        </div>
                      );
                    }
                  } else {
                    return (
                      <Button 
                        variant="outline"
                        onClick={() => handleRequestEdit(selectedSubmissionDetail)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Request Edit
                      </Button>
                    );
                  }
                })()}
                <Button variant="outline" asChild>
                  <Link to={`/dashboard/course/${selectedSubmissionDetail.courseId}`}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Course
                  </Link>
                </Button>
              </div>
            </div>
          </div>
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

      {/* Submission Dialog */}
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
                  rows={8}
                  required
                />
              </div>
              
              <div>
                <Label>{t('student.submissions.dialog.attachments')}</Label>
                <div className="mt-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">{t('student.submissions.dialog.uploadHint')}</p>
                  <p className="text-xs text-gray-500">{t('student.submissions.dialog.uploadTypes')}</p>
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

      {/* Edit Request Dialog */}
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
                <p><strong>Submitted:</strong> {selectedSubmissionForEdit.submittedAt.toLocaleDateString()}</p>
              </div>
              
              <div>
                <Label htmlFor="editReason">Reason for Edit Request *</Label>
                <Textarea
                  id="editReason"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Please explain why you need to edit this assignment (e.g., technical issues, need clarification, etc.)"
                  rows={4}
                  required
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p><strong>Note:</strong> Your teacher will review this request and may approve or reject it. You will be notified of their decision.</p>
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
    </div>
  );
}