import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { assignmentService, enrollmentService, submissionService, FirestoreAssignment } from '@/lib/firestore';
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
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

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
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('due-date');

  useEffect(() => {
    if (currentUser?.uid && userProfile?.role === 'student') {
      loadAssignments();
    }
  }, [currentUser?.uid, userProfile?.role]);

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
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
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
        filtered.sort((a, b) => a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime());
        break;
      case 'due-date-desc':
        filtered.sort((a, b) => b.dueDate.toDate().getTime() - a.dueDate.toDate().getTime());
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

  const getDueDateStatus = (dueDate: Date) => {
    const now = new Date();
    const due = dueDate.toDate();
    if (due < now) {
      return { text: 'Overdue', color: 'text-red-600' };
    } else if (due.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { text: 'Due Soon', color: 'text-yellow-600' };
    }
    return { text: 'Active', color: 'text-green-600' };
  };

  const getUniqueCourses = () => {
    return Array.from(new Set(assignments.map(assignment => assignment.courseTitle)));
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
        <div className="text-gray-600">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
              <p className="text-gray-600">View and manage your course assignments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search Assignments</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title, description, or course..."
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
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
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

        {/* Sort Options */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="sort">Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due-date">Due Date: Earliest</SelectItem>
                <SelectItem value="due-date-desc">Due Date: Latest</SelectItem>
                <SelectItem value="title-asc">Title: A → Z</SelectItem>
                <SelectItem value="title-desc">Title: Z → A</SelectItem>
                <SelectItem value="course">Course</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Assignments List */}
        <div className="grid gap-4">
          {filteredAndSortedAssignments.map(assignment => {
            const dueDateStatus = getDueDateStatus(assignment.dueDate);
            return (
              <div key={assignment.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                        <Badge className={getStatusColor(assignment.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(assignment.status)}
                            {assignment.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {assignment.courseTitle}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {assignment.dueDate.toDate().toLocaleDateString()}
                        </span>
                        <span className={`flex items-center gap-1 ${dueDateStatus.color}`}>
                          <Clock className="h-3 w-3" />
                          {dueDateStatus.text}
                        </span>
                        <span className="flex items-center gap-1">
                          Max Score: {assignment.maxScore}
                        </span>
                      </div>
                      {assignment.instructions && (
                        <p className="text-xs text-gray-500 mb-2">
                          <strong>Instructions:</strong> {assignment.instructions}
                        </p>
                      )}
                      {assignment.status === 'graded' && assignment.grade !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-green-600">
                            Grade: {assignment.grade}/{assignment.maxScore}
                          </span>
                          {assignment.feedback && (
                            <span className="text-gray-600">
                              Feedback: {assignment.feedback}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/courses/${assignment.courseId}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Course
                      </Link>
                    </Button>
                    {assignment.status === 'not-started' && (
                      <Button size="sm" asChild>
                        <Link to={`/dashboard/student-submissions/${assignment.id}/submit`}>
                          Start Assignment
                        </Link>
                      </Button>
                    )}
                    {assignment.status === 'in-progress' && (
                      <Button size="sm" asChild>
                        <Link to={`/dashboard/student-submissions/${assignment.id}/edit`}>
                          Continue
                        </Link>
                      </Button>
                    )}
                    {assignment.status === 'submitted' && (
                      <Button variant="outline" size="sm" disabled>
                        Submitted
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredAndSortedAssignments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No assignments found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}