import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { truncateTitle, truncateText } from '@/lib/utils';
import { submissionService, assignmentService, courseService, studentDataService } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import LoadingButton from '@/components/ui/loading-button';
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

interface AssignmentRow { id: string; title: string; courseId: string; courseTitle: string; dueDate: Date; pending: number; graded: number; avg?: number; }

// Define a local type for the grading dialog data
interface SubmissionWithDetails {
  id: string;
  studentId: string;
  assignmentTitle: string;
  studentName: string;
  courseTitle: string;
  maxScore: number;
  grade?: number;
  feedback?: string;
  status?: string;
  content?: string;
}

export default function TeacherGrades() {
  const { t } = useI18n();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
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
  const [isGrading, setIsGrading] = useState(false);

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
      
      if (courseIds.length === 0) { setAssignments([]); return; }

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

      // Get submissions for all assignments in parallel for performance
      const subsArrays = await Promise.all(
        allAssignments.map(a => submissionService.getSubmissionsByAssignment(a.id).then(subs => ({ a, subs })))
      );
      const rows: AssignmentRow[] = subsArrays.map(({ a, subs }) => {
        const pending = subs.filter((s: any) => s.status === 'submitted').length;
        const graded = subs.filter((s: any) => s.status === 'graded');
        const avg = graded.length ? (graded.reduce((acc: number, s: any) => acc + (s.grade || 0), 0) / graded.length) : 0;
        return { id: a.id, title: a.title, courseId: a.courseId, courseTitle: (a as any).courseTitle, dueDate: a.dueDate.toDate(), pending, graded: graded.length, avg: Math.round(avg * 10)/10 };
      });
      setAssignments(rows);
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
      setIsGrading(true);
      await submissionService.updateSubmission(selectedSubmission.id, {
        grade: grade,
        feedback: feedback,
        status: 'graded'
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
    } finally {
      setIsGrading(false);
    }
  };

  const openGradingDialog = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || 0);
    setFeedback(submission.feedback || '');
    setGradingDialogOpen(true);
  };

  const filteredAssignments = useMemo(() => {
    let list = assignments.filter(a => [a.title, a.courseTitle].some(v => v.toLowerCase().includes(searchTerm.toLowerCase())));
    
    // Apply status filter
    if (statusFilter !== 'all') {
      list = list.filter(a => {
        if (statusFilter === 'submitted') {
          return a.pending > 0; // Has pending submissions
        } else if (statusFilter === 'graded') {
          return a.pending === 0 && a.graded > 0; // All submissions are graded
        }
        return true;
      });
    }
    
    // Apply course filter
    if (courseFilter !== 'all') {
      list = list.filter(a => a.courseTitle === courseFilter);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'recent': list = list.sort((a,b) => b.dueDate.getTime() - a.dueDate.getTime()); break;
      case 'oldest': list = list.sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime()); break;
      case 'course': list = list.sort((a,b) => a.courseTitle.localeCompare(b.courseTitle)); break;
      case 'assignment': list = list.sort((a,b) => a.title.localeCompare(b.title)); break;
    }
    return list;
  }, [assignments, searchTerm, sortBy, statusFilter, courseFilter]);

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
    return Array.from(new Set(assignments.map(a => a.courseTitle)));
  };

  const getStats = () => {
    const total = assignments.reduce((acc, a) => acc + a.pending + a.graded, 0);
    const graded = assignments.reduce((acc, a) => acc + a.graded, 0);
    const pending = assignments.reduce((acc, a) => acc + a.pending, 0);
    const averageGrade = assignments.length ? Math.round((assignments.reduce((acc, a) => acc + (a.avg || 0), 0) / assignments.length) * 10) / 10 : 0;
    return { total, graded, pending, averageGrade };
  };

  const stats = getStats();

  if (!userProfile || userProfile.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{t('common.accessDenied')}</div>
          <div className="text-gray-600">{t('common.teacherOnly')}</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('teacher.grades.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title={t('teacher.grades.title')}
        subtitle={t('teacher.grades.subtitle')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">{t('teacher.grades.totalSubmissions')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.graded}</p>
                <p className="text-sm text-gray-600">{t('teacher.grades.graded')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-600">{t('teacher.grades.submitted')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{stats.averageGrade.toFixed(1)}</p>
                <p className="text-sm text-gray-600">{t('teacher.grades.averageGrade')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 hover:shadow-md transition-shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">{t('teacher.grades.searchPlaceholder')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('teacher.grades.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">{t('teacher.grades.filterByStatus')}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('teacher.grades.allStatuses')}</SelectItem>
                  <SelectItem value="submitted">{t('teacher.grades.submitted')}</SelectItem>
                  <SelectItem value="graded">{t('teacher.grades.graded')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="course-filter">{t('teacher.grades.filterByCourse')}</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('teacher.grades.allCourses')}</SelectItem>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Label htmlFor="sort">{t('teacher.courses.sortBy')}</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">{t('teacher.courses.dateDesc')}</SelectItem>
                  <SelectItem value="oldest">{t('teacher.courses.dateAsc')}</SelectItem>
                  <SelectItem value="student">{t('teacher.grades.studentName')}</SelectItem>
                  <SelectItem value="course">{t('teacher.grades.courseTitle')}</SelectItem>
                  <SelectItem value="assignment">{t('teacher.grades.assignmentTitle')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">{t('common.view')}:</span>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>List</Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>Grid</Button>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className={viewMode === 'grid' ? 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid gap-4'}>
          {filteredAssignments.map(a => (
            <div key={a.id} className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">{truncateTitle(a.title)}</h3>
                    <Badge className={`${getStatusColor(a.pending ? 'submitted' : 'graded')} flex-shrink-0`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(a.pending ? 'submitted' : 'graded')}
                        {a.pending ? 'Pending' : 'All Graded'}
                      </div>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{truncateText(a.courseTitle)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t('assignments.dueDate')}: {a.dueDate.toLocaleDateString()}</span>
                    <span className="flex items-center gap-1">{t('teacher.grades.averageGradeShort')}: {typeof a.avg === 'number' ? a.avg : '-'}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">{a.pending + a.graded} submissions, {a.graded} graded</div>
                </div>
              </div>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/dashboard/submissions/${a.id}/submissions`}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('teacher.grades.view')}
                  </Link>
                </Button>
                <div />
              </div>
            </div>
          ))}
          {filteredAssignments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No assignments found</p>
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
            <LoadingButton onClick={handleGradeSubmission} loading={isGrading} loadingText={selectedSubmission?.status === 'graded' ? 'Updating…' : 'Grading…'}>
              {selectedSubmission?.status === 'graded' ? 'Update Grade' : 'Grade Submission'}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}