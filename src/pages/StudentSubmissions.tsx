import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { submissionService, assignmentService, enrollmentService, courseService } from '@/lib/firestore';
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
      
      // Get student's enrollments
      const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser!.uid);
      const courseIds = enrollments.map(enrollment => enrollment.courseId);
      
      if (courseIds.length === 0) {
        setSubmissions([]);
        return;
      }

      // Get all assignments for enrolled courses
      const assignmentsPromises = courseIds.map(async (courseId) => {
        try {
          const courseAssignments = await assignmentService.getAssignmentsByCourse(courseId);
          const course = await courseService.getCourseById(courseId);
          return courseAssignments.map(assignment => ({
            ...assignment,
            courseTitle: course?.title || 'Unknown Course',
            instructorName: course?.instructorName || 'Unknown Instructor'
          }));
        } catch (error) {
          console.error(`Error loading assignments for course ${courseId}:`, error);
          return [];
        }
      });

      const assignmentsArrays = await Promise.all(assignmentsPromises);
      const allAssignments = assignmentsArrays.flat();

      // Get student's submissions for all assignments
      const submissionsPromises = allAssignments.map(async (assignment) => {
        try {
          const submissions = await submissionService.getSubmissionsByAssignment(assignment.id);
          const studentSubmissions = submissions.filter(s => s.studentId === currentUser!.uid);
          
          return studentSubmissions.map(submission => ({
            id: submission.id,
            assignmentId: submission.assignmentId,
            assignmentTitle: assignment.title,
            courseId: assignment.courseId,
            courseTitle: assignment.courseTitle,
            instructorName: assignment.instructorName,
            submittedAt: submission.submittedAt.toDate(),
            status: submission.status,
            grade: submission.grade,
            maxScore: assignment.maxScore,
            feedback: submission.feedback,
            content: (submission as any).content || '',
            attachments: (submission as any).attachments || []
          }));
        } catch (error) {
          console.error(`Error loading submissions for assignment ${assignment.id}:`, error);
          return [];
        }
      });

      const submissionsArrays = await Promise.all(submissionsPromises);
      const allSubmissions = submissionsArrays.flat();
      setSubmissions(allSubmissions);

    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error(t('student.submissions.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionAction = async (assignmentId: string, action: string) => {
    try {
      // Find the assignment
      const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser!.uid);
      const courseIds = enrollments.map(enrollment => enrollment.courseId);
      
      let assignment = null;
      for (const courseId of courseIds) {
        try {
          const assignments = await assignmentService.getAssignmentsByCourse(courseId);
          assignment = assignments.find(a => a.id === assignmentId);
          if (assignment) break;
        } catch (error) {
          continue;
        }
      }

      if (!assignment) {
        toast.error(t('student.submissions.assignmentNotFound'));
        return;
      }

      setSelectedAssignment(assignment);
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
      const submissionData = {
        assignmentId: selectedAssignment.id,
        courseId: selectedAssignment.courseId,
        studentId: currentUser!.uid,
        content: submissionContent,
        attachments: submissionAttachments,
        status: 'submitted' as const,
        submittedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await submissionService.createSubmission(submissionData);
      toast.success(t('student.submissions.submitted'));
      setShowSubmissionDialog(false);
      setSelectedAssignment(null);
      setSubmissionContent('');
      setSubmissionAttachments([]);
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
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title={t('student.submissions.title')}
        subtitle={t('student.submissions.subtitle')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">{t('student.submissions.searchLabel')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('student.submissions.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">{t('student.submissions.filterByStatus')}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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
              <Label htmlFor="course-filter">{t('student.submissions.filterByCourse')}</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
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
        </div>

        {/* Sort Options & View Mode */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label htmlFor="sort">{t('student.submissions.sortBy')}</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
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
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">{t('common.view')}:</span>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Submissions Display */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid gap-4'}>
          {filteredAndSortedSubmissions.map(submission => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-6'}>
                {viewMode === 'grid' ? (
                  // Grid View
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{submission.assignmentTitle}</h3>
                        <p className="text-sm text-gray-600">{submission.courseTitle}</p>
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(submission.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(submission.status)}
                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </div>
                    </Badge>
                    
                    <div className="text-xs text-gray-500">
                      <p>Submitted: {submission.submittedAt.toLocaleDateString()}</p>
                      {submission.status === 'graded' && submission.grade !== undefined && (
                        <p className="text-green-600 font-medium">Grade: {submission.grade}/{submission.maxScore}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedSubmissionDetail(submission)} className="flex-1">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/course/${submission.courseId}`}>
                          View Course
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{submission.assignmentTitle}</h3>
                          <Badge className={getStatusColor(submission.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(submission.status)}
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </div>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{submission.courseTitle}</p>
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
            <DialogTitle>{t('student.submissions.dialog.title')}</DialogTitle>
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
              {t('student.submissions.dialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}