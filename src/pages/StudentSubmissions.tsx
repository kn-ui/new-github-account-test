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
  Upload
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
          const course = await courseService.getCourse(courseId);
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
            content: submission.content,
            attachments: submission.attachments
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
      toast.error(t('student.submissions.loadError') || 'Failed to load submissions');
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
        toast.error(t('student.submissions.assignmentNotFound') || 'Assignment not found');
        return;
      }

      setSelectedAssignment(assignment);
      setShowSubmissionDialog(true);
    } catch (error) {
      console.error('Error handling submission action:', error);
      toast.error(t('student.submissions.loadAssignmentError') || 'Failed to load assignment');
    }
  };

  const handleSubmitSubmission = async () => {
    if (!selectedAssignment || !submissionContent.trim()) {
      toast.error(t('student.submissions.missingContent') || 'Please provide submission content');
      return;
    }

    try {
      const submissionData = {
        assignmentId: selectedAssignment.id,
        studentId: currentUser!.uid,
        content: submissionContent,
        attachments: submissionAttachments,
        status: 'submitted',
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await submissionService.createSubmission(submissionData);
      toast.success(t('student.submissions.submitted') || 'Submission submitted successfully');
      setShowSubmissionDialog(false);
      setSelectedAssignment(null);
      setSubmissionContent('');
      setSubmissionAttachments([]);
      loadSubmissions();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error(t('student.submissions.submitError') || 'Failed to submit assignment');
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

  if (!userProfile || userProfile.role !== 'student') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{t('common.accessDenied')}</div>
          <div className="text-gray-600">{t('common.studentOnly') || 'Only students can access this page.'}</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('student.submissions.loading') || 'Loading submissions...'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title={t('student.submissions.title') || 'My Submissions'}
        subtitle={t('student.submissions.subtitle') || 'View and manage your assignment submissions'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">{t('student.submissions.searchLabel') || 'Search Submissions'}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('student.submissions.searchPlaceholder') || 'Search by assignment, course, or instructor...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">{t('student.submissions.filterByStatus') || 'Filter by Status'}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('student.submissions.allStatuses') || 'All Statuses'}</SelectItem>
                  <SelectItem value="draft">{t('student.submissions.draft') || 'Draft'}</SelectItem>
                  <SelectItem value="submitted">{t('student.submissions.submitted') || 'Submitted'}</SelectItem>
                  <SelectItem value="graded">{t('student.submissions.graded') || 'Graded'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="course-filter">{t('student.submissions.filterByCourse') || 'Filter by Course'}</Label>
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

        {/* Sort Options */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
              <Label htmlFor="sort">{t('student.submissions.sortBy') || 'Sort By'}</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">{t('student.submissions.sortRecent') || 'Most Recent'}</SelectItem>
                <SelectItem value="oldest">{t('student.submissions.sortOldest') || 'Oldest First'}</SelectItem>
                <SelectItem value="assignment">{t('student.submissions.sortAssignment') || 'Assignment'}</SelectItem>
                <SelectItem value="course">{t('student.submissions.sortCourse') || 'Course'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submissions List */}
        <div className="grid gap-4">
          {filteredAndSortedSubmissions.map(submission => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
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
                          {t('student.submissions.submittedAt') || 'Submitted'}: {submission.submittedAt.toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          {t('student.submissions.maxScore') || 'Max Score'}: {submission.maxScore}
                        </span>
                      </div>
                      
                      {submission.status === 'graded' && submission.grade !== undefined && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{t('student.submissions.grade') || 'Grade'}:</span>
                            <span className={`font-bold ${getGradeColor(submission.grade, submission.maxScore)}`}>
                              {submission.grade}/{submission.maxScore}
                            </span>
                          </div>
                          {submission.feedback && (
                            <p className="text-sm text-gray-700">
                              <strong>{t('student.submissions.feedback') || 'Feedback'}:</strong> {submission.feedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/courses/${submission.courseId}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('common.view') || 'View Course'}
                      </Link>
                    </Button>
                    {submission.status === 'draft' && (
                      <Button size="sm" onClick={() => handleSubmissionAction(submission.assignmentId, 'edit')}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('student.submissions.continue') || 'Continue'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredAndSortedSubmissions.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('student.submissions.none') || 'No submissions yet'}</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' || courseFilter !== 'all'
                    ? (t('student.submissions.noResultsTipFiltered') || 'No submissions match your current filters')
                    : (t('student.submissions.noResultsTip') || 'You haven\'t submitted any assignments yet. Start by viewing your assignments.')
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && courseFilter === 'all' && (
                  <Button asChild>
                    <Link to="/dashboard/student-assignments">{t('student.submissions.viewAssignments') || 'View Assignments'}</Link>
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
            <DialogTitle>{t('student.submissions.dialog.title') || 'Submit Assignment'}</DialogTitle>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-4">
              <div>
                <Label>{t('student.submissions.dialog.assignment') || 'Assignment'}: {selectedAssignment.title}</Label>
                <p className="text-sm text-gray-600">{selectedAssignment.description}</p>
                <p className="text-sm text-gray-600">{t('student.submissions.maxScore') || 'Max Score'}: {selectedAssignment.maxScore}</p>
                {selectedAssignment.instructions && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm"><strong>{t('student.submissions.feedback') || 'Instructions'}:</strong> {selectedAssignment.instructions}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="content">{t('student.submissions.dialog.content') || 'Your Submission *'}</Label>
                <Textarea
                  id="content"
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder={t('student.submissions.dialog.contentPlaceholder') || 'Write your assignment submission here...'}
                  rows={8}
                  required
                />
              </div>
              
              <div>
                <Label>{t('student.submissions.dialog.attachments') || 'Attachments (Optional)'}</Label>
                <div className="mt-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">{t('student.submissions.dialog.uploadHint') || 'Click to upload files or drag and drop'}</p>
                  <p className="text-xs text-gray-500">{t('student.submissions.dialog.uploadTypes') || 'PDF, DOC, DOCX, TXT files only'}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmissionDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmitSubmission} disabled={!submissionContent.trim()}>
              {t('student.submissions.dialog.submit') || 'Submit Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}