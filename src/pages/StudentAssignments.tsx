
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { assignmentService, enrollmentService, submissionService, courseMaterialService, assignmentEditRequestService, FirestoreAssignment } from '@/lib/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Eye, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowLeft,
  Upload,
  Download,
  Grid3X3,
  List
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
  import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';
import { truncateTitle, truncateText, truncateInstructions } from '@/lib/utils';

interface AssignmentWithStatus extends FirestoreAssignment {
  courseTitle: string;
  instructorName: string;
  status: 'not-started' | 'in-progress' | 'submitted' | 'graded';
  submissionId?: string;
  grade?: number;
  feedback?: string;
}

export default function StudentAssignments() {
  const { currentUser, userProfile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('due-date');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAssignment, setDetailAssignment] = useState<AssignmentWithStatus | null>(null);
  const [editRequestOpen, setEditRequestOpen] = useState(false);
  const [editReason, setEditReason] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithStatus | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [assignmentResources, setAssignmentResources] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'student') {
      loadAssignments();
    }
  }, [currentUser?.uid, userProfile?.role]);

  useEffect(() => {
    // Check for assignmentId in URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const assignmentId = urlParams.get('assignmentId');
    if (assignmentId && assignments.length > 0) {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment) {
        setSelectedAssignment(assignment);
      }
    }
  }, [assignments]);

  useEffect(() => {
    // Load resources when assignment is selected
    if (selectedAssignment) {
      loadAssignmentResources(selectedAssignment.courseId);
    }
  }, [selectedAssignment]);

  const loadAssignmentResources = async (courseId: string) => {
    try {
      // For now, we'll show course materials related to assignments
      // In a real system, you might have assignment-specific resources
      const materials = await courseMaterialService.getCourseMaterialsByCourse(courseId);
      // Filter materials that might be related to assignments (you can customize this logic)
      const assignmentRelated = materials.filter(material => 
        material.title.toLowerCase().includes('assignment') ||
        material.description.toLowerCase().includes('assignment') ||
        material.type === 'document'
      );
      setAssignmentResources(assignmentRelated);
    } catch (error) {
      console.error('Error loading assignment resources:', error);
      setAssignmentResources([]);
    }
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      
      // Get student's enrollments

      const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser!.uid);
      const courseIds = enrollments.map(enrollment => enrollment.courseId);
      
      if (courseIds.length === 0) {
        setAssignments([]);
        return;
      }

      // Get assignments for enrolled courses
      const assignmentsPromises = courseIds.map(async (courseId) => {
        try {
          const courseAssignments = await assignmentService.getAssignmentsByCourse(courseId);
          return courseAssignments.map(assignment => ({
            ...assignment,
            courseTitle: enrollments.find(e => e.courseId === courseId)?.course?.title || 'Unknown Course',
            instructorName: enrollments.find(e => e.courseId === courseId)?.course?.instructorName || 'Unknown Instructor'
          }));
        } catch (error) {
          console.error(`Error loading assignments for course ${courseId}:`, error);
          return [];
        }
      });

      const assignmentsArrays = await Promise.all(assignmentsPromises);
      const allAssignments = assignmentsArrays.flat();

      // Get submission status for each assignment
      const assignmentsWithStatus = await Promise.all(
        allAssignments.map(async (assignment) => {
          try {
            const submissions = await submissionService.getSubmissionsByStudent(currentUser!.uid);
            const submission = submissions.find(s => s.assignmentId === assignment.id);
            
            let status: 'not-started' | 'in-progress' | 'submitted' | 'graded' = 'not-started';
            let submissionId: string | undefined;
            let grade: number | undefined;
            let feedback: string | undefined;

            if (submission) {
              submissionId = submission.id;
              if (submission.status === 'graded') {
                status = 'graded';
                grade = submission.grade;
                feedback = submission.feedback;
              } else if (submission.status === 'submitted') {
                status = 'submitted';
              }
            }

            return {
              ...assignment,
              status,
              submissionId,
              grade,
              feedback
            };
          } catch (error) {
            console.error(`Error loading submission for assignment ${assignment.id}:`, error);
            return {
              ...assignment,
              status: 'not-started' as const
            };
          }
        })
      );

      setAssignments(assignmentsWithStatus);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error(t('student.assignments.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditRequest = async (assignment: AssignmentWithStatus) => {
    setSelectedAssignment(assignment);
    setEditRequestOpen(true);
  };

  const submitEditRequest = async () => {
    if (!selectedAssignment || !currentUser?.uid || !userProfile || !editReason.trim()) {
      toast.error('Please provide a reason for the edit request');
      return;
    }

    try {
      await assignmentEditRequestService.createEditRequest({
        assignmentId: selectedAssignment.id,
        assignmentTitle: selectedAssignment.title,
        courseId: selectedAssignment.courseId,
        courseName: selectedAssignment.courseTitle || 'Unknown Course',
        studentId: currentUser.uid,
        studentName: userProfile.displayName || 'Unknown Student',
        studentEmail: userProfile.email || currentUser.email || '',
        teacherId: selectedAssignment.teacherId || '',
        reason: editReason.trim(),
        dueDate: selectedAssignment.dueDate
      });

      toast.success('Edit request submitted successfully. Your teacher will review it.');
      setEditRequestOpen(false);
      setEditReason('');
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Error submitting edit request:', error);
      toast.error('Failed to submit edit request');
    }
  };

  const filteredAndSortedAssignments = useMemo(() => {
    let filtered = assignments.filter(assignment => {
      const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           assignment.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
      const matchesCourse = courseFilter === 'all' || assignment.courseTitle === courseFilter;
      
      return matchesSearch && matchesStatus && matchesCourse;
    });

    // Sort assignments
    switch (sortBy) {
      case 'due-date':
        filtered.sort((a, b) => {
          const aDate = a.dueDate instanceof Date ? a.dueDate : a.dueDate.toDate();
          const bDate = b.dueDate instanceof Date ? b.dueDate : b.dueDate.toDate();
          return aDate.getTime() - bDate.getTime();
        });
        break;
      case 'due-date-desc':
        filtered.sort((a, b) => {
          const aDate = a.dueDate instanceof Date ? a.dueDate : a.dueDate.toDate();
          const bDate = b.dueDate instanceof Date ? b.dueDate : b.dueDate.toDate();
          return bDate.getTime() - aDate.getTime();
        });
        break;
      case 'title-asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'course':
        filtered.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
        break;
    }

    return filtered;
  }, [assignments, searchTerm, statusFilter, courseFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-started': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'graded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not-started': return <AlertCircle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'submitted': return <FileText className="h-4 w-4" />;
      case 'graded': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getDueDateStatus = (dueDate: any) => {
    const now = new Date();
    const due = dueDate instanceof Date ? dueDate : dueDate.toDate();
    if (due < now) {
      return { text: t('student.assignments.overdue'), color: 'text-red-600' };
    } else if (due.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { text: t('student.assignments.dueSoon'), color: 'text-yellow-600' };
    }
    return { text: t('student.assignments.active'), color: 'text-green-600' };
  };

  const getUniqueCourses = () => {
    return Array.from(new Set(assignments.map(assignment => assignment.courseTitle)));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  if (selectedAssignment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedAssignment(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedAssignment.title}</h1>
              <p className="text-gray-600">{selectedAssignment.courseTitle} • {selectedAssignment.instructorName}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Assignment Description */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Assignment Description</h2>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {selectedAssignment.description}
                </p>

                {selectedAssignment.instructions && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Instructions:</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedAssignment.instructions}</p>
                  </div>
                )}
              </div>

              {/* Submit Assignment */}
              {selectedAssignment.status === 'not-started' && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Submit Assignment</h2>
                  
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Drop your file here or click to browse</p>
                    
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Choose File
                    </label>
                    
                    {selectedFile && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Selected: {selectedFile.name}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <button className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Submit Assignment
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Due Date */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={20} className="text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Due Date</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{
                  selectedAssignment.dueDate instanceof Date 
                    ? selectedAssignment.dueDate.toLocaleDateString()
                    : selectedAssignment.dueDate.toDate().toLocaleDateString()
                }</p>
                <p className={`text-sm font-medium ${getDueDateStatus(selectedAssignment.dueDate).color}`}>
                  {getDueDateStatus(selectedAssignment.dueDate).text}
                </p>
              </div>

              {/* Assignment Info */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Assignment Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points</span>
                    <span className="font-medium">{selectedAssignment.maxScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium ${selectedAssignment.status === 'graded' ? 'text-green-600' : selectedAssignment.status === 'submitted' ? 'text-blue-600' : 'text-orange-600'}`}>
                      {selectedAssignment.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  {selectedAssignment.grade !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grade</span>
                      <span className="font-medium text-green-600">{selectedAssignment.grade}/{selectedAssignment.maxScore}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Resources */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Resources</h3>
                <div className="space-y-3">
                  {selectedAssignment.instructions && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText size={16} className="text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Assignment Instructions</p>
                        <p className="text-xs text-gray-500">{selectedAssignment.instructions}</p>
                      </div>
                    </div>
                  )}
                  
                  {assignmentResources.length > 0 ? (
                    assignmentResources.map((resource) => (
                      <div key={resource.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <FileText size={16} className="text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{resource.title}</p>
                          <p className="text-xs text-gray-500">{resource.description}</p>
                        </div>
                        {resource.fileUrl && (
                          <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download size={14} className="text-gray-400 hover:text-blue-600" />
                          </a>
                        )}
                        {resource.externalLink && (
                          <a href={resource.externalLink} target="_blank" rel="noopener noreferrer">
                            <Download size={14} className="text-gray-400 hover:text-blue-600" />
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    !selectedAssignment.instructions && (
                      <div className="text-center py-4 text-gray-500">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No resources available for this assignment</p>
                      </div>
                    )
                  )}
                </div>
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
        <div className="text-gray-600">{t('student.assignments.loading')}</div>
      </div>
    );
  }




  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHero 
        title={t('student.assignments.title')}
        subtitle={t('student.assignments.subtitle')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">{t('student.assignments.searchLabel')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('student.assignments.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">{t('student.assignments.filterByStatus')}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('student.assignments.allStatuses')}</SelectItem>
                  <SelectItem value="not-started">{t('student.assignments.notStarted')}</SelectItem>
                  <SelectItem value="in-progress">{t('student.assignments.inProgress')}</SelectItem>
                  <SelectItem value="submitted">{t('student.assignments.submitted')}</SelectItem>
                  <SelectItem value="graded">{t('student.assignments.graded')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="course-filter">{t('student.assignments.filterByCourse')}</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('student.assignments.allCourses')}</SelectItem>
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
              <Label htmlFor="sort">{t('student.assignments.sortBy')}</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due-date">{t('student.assignments.sortDueAsc')}</SelectItem>
                  <SelectItem value="due-date-desc">{t('student.assignments.sortDueDesc')}</SelectItem>
                  <SelectItem value="title-asc">{t('student.assignments.sortTitleAsc')}</SelectItem>
                  <SelectItem value="title-desc">{t('student.assignments.sortTitleDesc')}</SelectItem>
                  <SelectItem value="course">{t('student.assignments.sortCourse')}</SelectItem>
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

        {/* Assignments Display */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid gap-4'}>
          {filteredAndSortedAssignments.map(assignment => {
            const dueDateStatus = getDueDateStatus(assignment.dueDate);
            return (
              <div key={assignment.id} className={`bg-white border rounded-lg ${viewMode === 'grid' ? 'p-4' : 'p-4'}`}>
                {viewMode === 'grid' ? (
                  // Grid View
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{truncateTitle(assignment.title)}</h3>
                        <p className="text-sm text-gray-600">{truncateText(assignment.courseTitle)}</p>
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(assignment.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(assignment.status)}
                        {assignment.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </Badge>
                    
                    <div className="text-xs text-gray-500">
                      <p className={dueDateStatus.color}>Due: {
                        assignment.dueDate instanceof Date 
                          ? assignment.dueDate.toLocaleDateString()
                          : assignment.dueDate.toDate().toLocaleDateString()
                      }</p>
                      <p>Max Score: {assignment.maxScore}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedAssignment(assignment)} className="flex-1">
                        Details
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/course/${assignment.courseId}`}>
                          View Course
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  // List View
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{truncateTitle(assignment.title)}</h3>
                          <Badge className={`${getStatusColor(assignment.status)} flex-shrink-0`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(assignment.status)}
                              {assignment.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{truncateText(assignment.description)}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {truncateText(assignment.courseTitle)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t('assignments.dueDate')}: {
                              assignment.dueDate instanceof Date 
                                ? assignment.dueDate.toLocaleDateString()
                                : assignment.dueDate.toDate().toLocaleDateString()
                            }
                          </span>
                          <span className={`flex items-center gap-1 ${dueDateStatus.color}`}>
                            <Clock className="h-3 w-3" />
                            {dueDateStatus.text}
                          </span>
                          <span className="flex items-center gap-1">
                            {t('assignments.maxScore')}: {assignment.maxScore}
                          </span>
                        </div>
                        {assignment.instructions && (
                          <p className="text-xs text-gray-500 mb-2">
                            <strong>{t('assignments.instructions')}:</strong> {truncateInstructions(assignment.instructions)}
                          </p>
                        )}
                        {assignment.status === 'graded' && assignment.grade !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-green-600">
                              {t('assignments.grade')}: {assignment.grade}/{assignment.maxScore}
                            </span>
                            {assignment.feedback && (
                                <span className="text-gray-600">
                                {t('assignments.feedback')}: {assignment.feedback}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedAssignment(assignment)}>{t('assignments.viewDetails')}</Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/course/${assignment.courseId}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Course
                        </Link>
                      </Button>
                      {assignment.status === 'not-started' && (
                        <Button size="sm" asChild>
                          <Link to={`/dashboard/student-submissions/${assignment.id}/submit`}>
                            {t('assignments.start')}
                          </Link>
                        </Button>
                      )}
                      {assignment.status === 'in-progress' && (
                        <Button size="sm" asChild>
                          <Link to={`/dashboard/student-submissions/${assignment.id}/edit`}>
                            {t('assignments.continue')}
                          </Link>
                        </Button>
                      )}
                      {assignment.status === 'submitted' && (
                        <Button variant="outline" size="sm" onClick={() => handleEditRequest(assignment)}>
                          Request Edit
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredAndSortedAssignments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('assignments.none')}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Request Dialog */}
      <Dialog open={editRequestOpen} onOpenChange={setEditRequestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Assignment Edit</DialogTitle>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p><strong>Assignment:</strong> {selectedAssignment.title}</p>
                <p><strong>Course:</strong> {selectedAssignment.courseTitle}</p>
                <p><strong>Due Date:</strong> {selectedAssignment.dueDate.toDate().toLocaleDateString()}</p>
              </div>
              
              <div>
                <Label htmlFor="editReason">Reason for Edit Request *</Label>
                <textarea
                  id="editReason"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Please explain why you need to edit this assignment (e.g., technical issues, need clarification, etc.)"
                  rows={4}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

// Detail and edit request dialogs
// Place at end of component render (monolithic here for brevity)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _Dialogs() { return null; }