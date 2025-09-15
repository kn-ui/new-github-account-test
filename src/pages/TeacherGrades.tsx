import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { submissionService, assignmentService, courseService, enrollmentService } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Search, 
  Edit, 
  Eye, 
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  BookOpen,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import DashboardHero from '@/components/DashboardHero';

interface SubmissionWithDetails {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  assignmentTitle: string;
  submittedAt: Date;
  status: 'submitted' | 'graded';
  grade?: number;
  maxScore: number;
  feedback?: string;
  content: string;
  attachments?: string[];
}

export default function TeacherGrades() {
  const { t } = useI18n();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'teacher') {
      loadSubmissions();
    }
  }, [currentUser?.uid, userProfile?.role]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      
      // Get teacher's courses
      const teacherCourses = await courseService.getCoursesByInstructor(currentUser!.uid);
      const courseIds = teacherCourses.map(course => course.id);
      
      if (courseIds.length === 0) {
        setSubmissions([]);
        return;
      }

      // Get all assignments for teacher's courses
      const assignmentsPromises = courseIds.map(async (courseId) => {
        try {
          const courseAssignments = await assignmentService.getAssignmentsByCourse(courseId);
          return courseAssignments.map(assignment => ({
            ...assignment,
            courseTitle: teacherCourses.find(c => c.id === courseId)?.title || 'Unknown Course'
          }));
        } catch (error) {
          console.error(`Error loading assignments for course ${courseId}:`, error);
          return [];
        }
      });

      const assignmentsArrays = await Promise.all(assignmentsPromises);
      const allAssignments = assignmentsArrays.flat();

      // Get submissions for all assignments
      const submissionsPromises = allAssignments.map(async (assignment) => {
        try {
          const assignmentSubmissions = await submissionService.getSubmissionsByAssignment(assignment.id);
          return assignmentSubmissions.map(submission => ({
            ...submission,
            assignmentTitle: assignment.title,
            courseTitle: assignment.courseTitle,
            courseId: assignment.courseId,
            maxScore: assignment.maxScore,
            studentName: submission.studentId // In a real app, you'd fetch student names
          }));
        } catch (error) {
          console.error(`Error loading submissions for assignment ${assignment.id}:`, error);
          return [];
        }
      });

      const submissionsArrays = await Promise.all(submissionsPromises);
      const allSubmissions = submissionsArrays.flat();

      // Convert to our interface
      const submissionsWithDetails: SubmissionWithDetails[] = allSubmissions.map(submission => ({
        id: submission.id,
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        studentName: submission.studentName,
        courseId: submission.courseId,
        courseTitle: submission.courseTitle,
        assignmentTitle: submission.assignmentTitle,
        submittedAt: submission.submittedAt.toDate(),
        status: submission.status,
        grade: submission.grade,
        maxScore: submission.maxScore,
        feedback: submission.feedback,
        content: submission.content,
        attachments: submission.attachments
      }));

      setSubmissions(submissionsWithDetails);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || grade < 0 || grade > selectedSubmission.maxScore) {
      toast.error('Please enter a valid grade');
      return;
    }

    try {
      await submissionService.updateSubmission(selectedSubmission.id, {
        grade: grade,
        feedback: feedback,
        status: 'graded',
        gradedAt: new Date()
      });

      toast.success('Submission graded successfully');
      setGradingDialogOpen(false);
      setSelectedSubmission(null);
      setGrade(0);
      setFeedback('');
      loadSubmissions();
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error('Failed to grade submission');
    }
  };

  const openGradingDialog = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || 0);
    setFeedback(submission.feedback || '');
    setGradingDialogOpen(true);
  };

  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = submissions.filter(submission => {
      const matchesSearch = submission.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           submission.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           submission.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
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
      case 'student':
        filtered.sort((a, b) => a.studentName.localeCompare(b.studentName));
        break;
      case 'course':
        filtered.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
        break;
      case 'assignment':
        filtered.sort((a, b) => a.assignmentTitle.localeCompare(b.assignmentTitle));
        break;
    }

    return filtered;
  }, [submissions, searchTerm, statusFilter, courseFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'graded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
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

  const getStats = () => {
    const total = submissions.length;
    const graded = submissions.filter(s => s.status === 'graded').length;
    const pending = submissions.filter(s => s.status === 'submitted').length;
    const averageGrade = graded > 0 
      ? submissions
          .filter(s => s.status === 'graded' && s.grade !== undefined)
          .reduce((sum, s) => sum + (s.grade || 0), 0) / graded
      : 0;

    return { total, graded, pending, averageGrade };
  };

  const stats = getStats();

  if (!userProfile || userProfile.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only teachers can access this page.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title="Grade Submissions"
        subtitle="Review and grade student assignments"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Submissions</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.graded}</p>
                <p className="text-sm text-gray-600">Graded</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.averageGrade.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Average Grade</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search Submissions</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by student, assignment, or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Pending Review</SelectItem>
                  <SelectItem value="graded">Graded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="course-filter">Filter by Course</Label>
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

        {/* Sort & View */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Label htmlFor="sort">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="student">Student Name</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">View:</span>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>List</Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>Grid</Button>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className={viewMode === 'grid' ? 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid gap-4'}>
          {filteredAndSortedSubmissions.map(submission => (
            <div key={submission.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">{submission.assignmentTitle}</h3>
                      <Badge className={getStatusColor(submission.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(submission.status)}
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </div>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Student: {submission.studentName}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {submission.courseTitle}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Submitted: {submission.submittedAt.toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        Max Score: {submission.maxScore}
                      </span>
                    </div>
                    {submission.status === 'graded' && submission.grade !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`font-medium ${getGradeColor(submission.grade, submission.maxScore)}`}>
                          Grade: {submission.grade}/{submission.maxScore}
                        </span>
                        {submission.feedback && (
                          <span className="text-gray-600">
                            Feedback: {submission.feedback}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/courses/${submission.courseId}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Course
                    </Link>
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => openGradingDialog(submission)}
                    variant={submission.status === 'graded' ? 'outline' : 'default'}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {submission.status === 'graded' ? 'Update Grade' : 'Grade'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filteredAndSortedSubmissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No submissions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Grading Dialog */}
      <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <Label>Assignment: {selectedSubmission.assignmentTitle}</Label>
                <p className="text-sm text-gray-600">Student: {selectedSubmission.studentName}</p>
                <p className="text-sm text-gray-600">Course: {selectedSubmission.courseTitle}</p>
              </div>
              
              <div>
                <Label>Submission Content</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{selectedSubmission.content}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grade">Grade (0 - {selectedSubmission.maxScore})</Label>
                  <Input
                    id="grade"
                    type="number"
                    min="0"
                    max={selectedSubmission.maxScore}
                    value={grade}
                    onChange={(e) => setGrade(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Max Score</Label>
                  <Input value={selectedSubmission.maxScore} disabled />
                </div>
              </div>
              
              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback to the student..."
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGradeSubmission}>
              {selectedSubmission?.status === 'graded' ? 'Update Grade' : 'Grade Submission'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}