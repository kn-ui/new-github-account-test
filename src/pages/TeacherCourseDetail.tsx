/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  courseService,
  enrollmentService,
  assignmentService,
  submissionService,
  courseMaterialService,
  examService,
  examAttemptService,
  gradeService,
  otherGradeService,
  settingsService,
  FirestoreCourse,
  FirestoreEnrollment,
  FirestoreAssignment,
  FirestoreCourseMaterial,
  FirestoreSubmission,
  FirestoreExam,
  FirestoreGrade,
  FirestoreOtherGrade,
  studentDataService,
} from '@/lib/firestore';
import { calculateLetterGrade } from '@/lib/gradeUtils';
import DashboardHero from '@/components/DashboardHero';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LoadingButton from '@/components/ui/loading-button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import DualDateInput from '@/components/ui/DualDateInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Users,
  FileText,
  BookOpen,
  BarChart3,
  Award,
  Calendar,
  Edit,
  Eye,
  Trash2,
  Download,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { getAuthToken } from '@/lib/api';
import { uploadToHygraph, uploadMultipleToHygraph } from '@/lib/hygraphUpload';

export default function TeacherCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<FirestoreCourse | null>(null);
  const [enrollments, setEnrollments] = useState<FirestoreEnrollment[]>([]);
  const [assignments, setAssignments] = useState<FirestoreAssignment[]>([]);
  const [submissions, setSubmissions] = useState<FirestoreSubmission[]>([]);
  const [materials, setMaterials] = useState<FirestoreCourseMaterial[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<FirestoreCourseMaterial | null>(null);
  const [materialForm, setMaterialForm] = useState<{ title: string; description: string; type: 'document' | 'video' | 'link' | 'other'; fileUrl: string; externalLink: string; }>(
    { title: '', description: '', type: 'document', fileUrl: '', externalLink: '' }
  );
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [deleteMaterialDialogOpen, setDeleteMaterialDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<FirestoreCourseMaterial | null>(null);

  const [savingAssignment, setSavingAssignment] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState(false);
  const [savingExam, setSavingExam] = useState(false);
  const [deletingExam, setDeletingExam] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);
  const [savingOtherGrade, setSavingOtherGrade] = useState(false);

  const [savingGradeRanges, setSavingGradeRanges] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<FirestoreAssignment | null>(null);
  const [assignmentForm, setAssignmentForm] = useState<{ title: string; description: string; dueDate: string; dueTime: string; maxScore: number; instructions: string; linkTitle: string; linkUrl: string }>(
    { title: '', description: '', dueDate: new Date().toISOString().slice(0,10), dueTime: '', maxScore: 100, instructions: '', linkTitle: '', linkUrl: '' }
  );
  const [fileObjs, setFileObjs] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [submissionsForAssignment, setSubmissionsForAssignment] = useState<FirestoreSubmission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<FirestoreAssignment | null>(null);
  const [assignSort, setAssignSort] = useState<'due-asc' | 'due-desc' | 'title-asc' | 'title-desc'>('due-asc');
  const [studentSort, setStudentSort] = useState<'name-asc' | 'name-desc'>('name-asc');
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<FirestoreSubmission | null>(null);
  const [gradeValue, setGradeValue] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [gradeSort, setGradeSort] = useState<'recent' | 'oldest' | 'grade-desc' | 'grade-asc'>('recent');
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<FirestoreExam | null>(null);
  const [examForm, setExamForm] = useState<{ title: string; description: string; date: string; startTime: string; durationMinutes: number; questions: any[] }>(() => {
    const now = new Date();
    now.setHours(now.getHours() + 5); // Add 5 hours
    return { 
      title: '', 
      description: '', 
      date: new Date().toISOString().slice(0,10), 
      startTime: now.toTimeString().slice(0,5), 
      durationMinutes: 60, 
      questions: [] 
    };
  });

  const [examLockStatus, setExamLockStatus] = useState<Record<string, { locked: boolean; reason?: string }>>({});

  // Check exam lock status
  const checkExamLockStatus = async (examId: string) => {
    try {
      const lockStatus = await examService.isExamLocked(examId);
      setExamLockStatus(prev => ({ ...prev, [examId]: lockStatus }));
    } catch (error) {
      console.error('Error checking exam lock status:', error);
    }
  };

  useEffect(() => {
    if (!courseId) return;
    const load = async () => {
      try {
        setLoading(true);
        const [c, ens, asgs, subs, mats, exs, grades] = await Promise.all([
          courseService.getCourseById(courseId),
          enrollmentService.getEnrollmentsByCourse(courseId),
          assignmentService.getAssignmentsByCourse(courseId, 1000),
          submissionService.getSubmissionsByCourse(courseId),
          courseMaterialService.getCourseMaterialsByCourse(courseId, 1000),
          examService.getExamsByCourse(courseId),
          gradeService.getGradesByCourse(courseId),
        ]);
        setCourse(c);
        setEnrollments(ens);
        setAssignments(asgs);
        setSubmissions(subs);
        setMaterials(mats);
        setExams(exs);
        setFinalGrades(grades);
        try {
          const others = await otherGradeService.getByCourse(courseId);
          setOtherGrades(others);
        } catch {}
        // Load grade ranges for consistent letter computation
        try {
          const ranges = await settingsService.getGradeRanges();
          setGradeRanges(ranges);
        } catch {}
        
        // Check lock status for all exams
        exs.forEach(exam => {
          checkExamLockStatus(exam.id);
        });
        
        // resolve student names
        try {
          const ids = Array.from(new Set(ens.map(e => e.studentId)));
          const nameMap: Record<string, string> = {};
          await Promise.all(ids.map(async (id) => {
            try {
              const u = await (await import('@/lib/firestore')).userService.getUserById(id);
              if (u?.displayName) nameMap[id] = u.displayName;
            } catch {}
          }));
          setStudentNames(nameMap);
          
          // Load exam grades for all students after student names are resolved
          const examGradesPromises = exs.map(async (exam) => {
            try {
              const attempts = await examAttemptService.getAttemptsByExam(exam.id);
              const gradedAttempts = attempts.filter(attempt => attempt.status === 'graded' && attempt.isGraded);
              
              return gradedAttempts.map(attempt => {
                // Calculate manual score from manualScores object
                const manualScores = attempt.manualScores || {};
                const manualScore = Object.values(manualScores).reduce((sum: number, score: any) => sum + (Number(score) || 0), 0);
                
                return {
                  id: attempt.id,
                  examId: exam.id,
                  examTitle: exam.title,
                  courseId: courseId,
                  courseTitle: c?.title || 'Unknown Course',
                  instructorName: c?.instructorName || 'Unknown Instructor',
                  studentId: attempt.studentId,
                  studentName: nameMap[attempt.studentId] || attempt.studentId,
                  submittedAt: attempt.submittedAt?.toDate() || new Date(),
                  gradedAt: attempt.submittedAt?.toDate() || new Date(),
                  grade: attempt.score || 0,
                  maxScore: exam.totalPoints,
                  feedback: attempt.manualFeedback || {},
                  status: 'graded',
                  autoScore: attempt.autoScore || 0,
                  manualScore: manualScore
                };
              });
            } catch (error) {
              console.error(`Error loading exam grades for exam ${exam.id}:`, error);
              return [];
            }
          });
          
          const examGradesArrays = await Promise.all(examGradesPromises);
          const allExamGrades = examGradesArrays.flat();
          setExamGrades(allExamGrades);
        } catch {}
      } catch (e) {
        console.error(e);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const studentsCount = enrollments.length;
  const assignmentsCount = assignments.length;
  const [exams, setExams] = useState<FirestoreExam[]>([]);
  const examsCount = exams.length;
  const [finalGrades, setFinalGrades] = useState<FirestoreGrade[]>([]);
  const [examGrades, setExamGrades] = useState<any[]>([]);
  const [otherGrades, setOtherGrades] = useState<FirestoreOtherGrade[]>([]);
  const [gradeViewMode, setGradeViewMode] = useState<'assignments' | 'final' | 'exams' | 'others'>('assignments');
  const [gradeRanges, setGradeRanges] = useState<any>({});
  const [rangesOpen, setRangesOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [otherGradeDialogOpen, setOtherGradeDialogOpen] = useState(false);
  const [otherGradeTargetStudentId, setOtherGradeTargetStudentId] = useState<string | null>(null);
  const [otherGradeEditing, setOtherGradeEditing] = useState<FirestoreOtherGrade | null>(null);
  const [otherGradeForm, setOtherGradeForm] = useState<{ reason: string; points: number }>({ reason: '', points: 0 });
  const averageGrade = useMemo(() => {
    if (finalGrades.length === 0) return 0;
    const sum = finalGrades.reduce((acc, g) => acc + g.finalGrade, 0);
    return Math.round((sum / finalGrades.length) * 10) / 10;
  }, [finalGrades]);

  const confirmMaterialDelete = async () => {
    if (!materialToDelete) return;
    
    try {
      await courseMaterialService.deleteCourseMaterial(materialToDelete.id);
      toast.success('Material deleted');
      const latest = await courseMaterialService.getCourseMaterialsByCourse(course!.id, 1000);
      setMaterials(latest);
      setMaterialToDelete(null);
    } catch (e) {
      toast.error('Failed to delete');
    } finally {
      setDeleteMaterialDialogOpen(false);
    }
  };

  // Final grade calculation and grade ranges are handled by Admins in AdminStudentGrades

  if (!userProfile || (userProfile.role !== 'teacher' && userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Access denied</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
          <Skeleton className="h-12 w-40 mt-6" />
          <Skeleton className="h-64 w-full mt-4" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Course not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero title={course.title} subtitle={course.category} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{studentsCount}</div>
              <p className="text-xs text-gray-500">Enrolled in this course</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{assignmentsCount}</div>
              <p className="text-xs text-gray-500">Total assignments</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{examsCount}</div>
              <p className="text-xs text-gray-500">Exams for this course</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Avg Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{averageGrade}</div>
              <p className="text-xs text-gray-500">Across graded submissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Course Content
            </CardTitle>
            <CardDescription>Overview and resources for this course</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => navigate(`/dashboard/my-courses/${courseId}?tab=${value}`)}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="exams">Exams</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="grades">Grades</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 leading-relaxed">{course.description}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Syllabus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">{course.syllabus}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Resources</div>
                  <Button onClick={() => { setEditingMaterial(null); setMaterialForm({ title: '', description: '', type: 'document', fileUrl: '', externalLink: '' }); setMaterialDialogOpen(true); }}>Add Material</Button>
                </div>
                {materials.length > 0 ? (
                  <div className="space-y-3">
                    {materials.map(m => (
                      <div key={m.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{m.title}</div>
                            <div className="text-sm text-gray-600">{m.description}</div>
                            <div className="text-xs text-gray-500 mt-1">{m.type}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {m.fileUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">View</a>
                              </Button>
                            )}
                            {m.externalLink && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={m.externalLink} target="_blank" rel="noopener noreferrer">Visit Link</a>
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => { setEditingMaterial(m); setMaterialForm({ title: m.title, description: m.description, type: m.type, fileUrl: m.fileUrl || '', externalLink: m.externalLink || '' }); setMaterialDialogOpen(true); }}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => {
                              setMaterialToDelete(m);
                              setDeleteMaterialDialogOpen(true);
                            }}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No resources yet.</div>
                )}
              </TabsContent>

              <TabsContent value="assignments" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Sort:</span>
                    <Select value={assignSort} onValueChange={(v) => setAssignSort(v as any)}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="due-asc">Due Date ↑</SelectItem>
                        <SelectItem value="due-desc">Due Date ↓</SelectItem>
                        <SelectItem value="title-asc">Title A→Z</SelectItem>
                        <SelectItem value="title-desc">Title Z→A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => { 
                    setEditingAssignment(null); 
                    setAssignmentForm({ 
                      title: '', 
                      description: '', 
                      dueDate: new Date().toISOString().slice(0,10), 
                      dueTime: '', 
                      maxScore: 100, 
                      instructions: '', 
                      linkTitle: '', 
                      linkUrl: '' 
                    }); 
                    setFileObjs([]);
                    setAssignmentDialogOpen(true); 
                  }}>Create Assignment</Button>
                </div>
                {(assignments.length > 0 ? (
                  <div className="divide-y">
                    {assignments
                      .slice()
                      .sort((a,b) => {
                        switch (assignSort) {
                          case 'due-asc': return a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime();
                          case 'due-desc': return b.dueDate.toDate().getTime() - a.dueDate.toDate().getTime();
                          case 'title-asc': return a.title.localeCompare(b.title);
                          case 'title-desc': return b.title.localeCompare(a.title);
                        }
                      })
                      .map(a => {
                        const submittedCount = submissions.filter(s => s.assignmentId === a.id).length;
                        const total = enrollments.length;
                        return (
                          <div key={a.id} className="py-3 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{a.title}</div>
                              <div className="text-sm text-gray-600">{a.description}</div>
                              <div className="text-xs text-gray-500 mt-1">{submittedCount}/{total} submitted</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Due {a.dueDate.toDate().toLocaleDateString()}
                              </div>
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/dashboard/submissions/${a.id}/submissions`}>View submissions</Link>
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => { setSelectedAssignment(a); setSubmissionsForAssignment(submissions.filter(s => s.assignmentId === a.id)); setSubmissionsDialogOpen(true); }}>Grade submissions</Button>
                              <Button variant="outline" size="sm" onClick={() => { 
                                setEditingAssignment(a); 
                                setAssignmentForm({ 
                                  title: a.title, 
                                  description: a.description, 
                                  dueDate: a.dueDate.toDate().toISOString().slice(0,10), 
                                  dueTime: a.dueDate.toDate().toTimeString().slice(0,5), // Extract time part
                                  maxScore: (a as any).maxScore ?? 100,
                                  instructions: a.instructions || '',
                                  linkTitle: a.attachments?.find((att: any) => att.type === 'link')?.title || '',
                                  linkUrl: a.attachments?.find((att: any) => att.type === 'link')?.url || '',
                                }); 
                                setFileObjs([]);
                                setAssignmentDialogOpen(true); 
                              }}>Edit</Button>
                              <Button variant="destructive" size="sm" onClick={async () => {
                                try {
                                  await (await import('@/lib/firestore')).assignmentService.deleteAssignment(a.id);
                                  toast.success('Assignment deleted');
                                  const latest = await (await import('@/lib/firestore')).assignmentService.getAssignmentsByCourse(course!.id, 1000);
                                  setAssignments(latest);
                                } catch { toast.error('Failed to delete'); }
                              }}>Delete</Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No assignments yet.</div>
                ))}
              </TabsContent>

              <TabsContent value="exams" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Exams</div>
                  <Button onClick={() => { 
                    const now = new Date();
                    now.setHours(now.getHours() + 5); // Add 5 hours
                    setEditingExam(null); 
                    setExamForm({ 
                      title: '', 
                      description: '', 
                      date: new Date().toISOString().slice(0,10), // Current date
                      startTime: now.toTimeString().slice(0,5), // 5 hours from now
                      durationMinutes: 60, 
                      questions: [] 
                    }); 
                    setExamDialogOpen(true); 
                  }}>Create Exam</Button>
                </div>
                {exams.length > 0 ? (
                  <div className="divide-y">
                    {exams.map(exam => (
                      <div key={exam.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{exam.title}</div>
                          <div className="text-sm text-gray-600">{exam.description}</div>
                          <div className="text-xs text-gray-500 mt-1">{exam.date.toDate().toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/exam-questions/${exam.id}`)}>
                            View Questions
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/exam-results/${exam.id}`)}>
                            View Results
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={examLockStatus[exam.id]?.locked}
                            onClick={() => { 
                              if (examLockStatus[exam.id]?.locked) {
                                toast.error(examLockStatus[exam.id]?.reason || 'Exam is locked');
                                return;
                              }
                              setEditingExam(exam); 
                              setExamForm({ 
                                title: exam.title, 
                                description: exam.description || '', 
                                date: exam.date.toDate().toISOString().slice(0,10), // YYYY-MM-DD
                                startTime: exam.startTime.toDate().toTimeString().slice(0,5), // HH:MM
                                durationMinutes: (exam as any).durationMinutes || 60, 
                                questions: (exam as any).questions || [] 
                              }); 
                              setExamDialogOpen(true); 
                            }}
                            title={examLockStatus[exam.id]?.locked ? examLockStatus[exam.id]?.reason : 'Edit exam'}
                          >
                            Edit
                          </Button>
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                disabled={examLockStatus[exam.id]?.locked}
                                onClick={async () => { 
                                  if (examLockStatus[exam.id]?.locked) {
                                    toast.error(examLockStatus[exam.id]?.reason || 'Exam is locked');
                                    return;
                                  }
                                  try {
                                    await examService.deleteExam(exam.id);
                                    toast.success('Exam deleted');
                                    const latest = await examService.getExamsByCourse(course!.id);
                                    setExams(latest);
                                  } catch { toast.error('Failed to delete exam'); }
                                }}
                                title={examLockStatus[exam.id]?.locked ? examLockStatus[exam.id]?.reason : 'Delete exam'}
                              >
                                Delete
                              </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No exams configured for this course.</div>
                )}
              </TabsContent>

              <TabsContent value="students" className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Sort:</span>
                  <Select value={studentSort} onValueChange={(v) => setStudentSort(v as any)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name A→Z</SelectItem>
                      <SelectItem value="name-desc">Name Z→A</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => {
                    const rows = [['Student','Student ID']];
                    enrollments.forEach(e => rows.push([studentNames[e.studentId] || e.studentId, e.studentId]));
                    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `${course.title}-students.csv`; a.click(); URL.revokeObjectURL(url);
                  }}>
                    <Download className="h-4 w-4 mr-2" /> Export Students
                  </Button>
                </div>
                {enrollments.length > 0 ? (
                  <div className="divide-y">
                    {enrollments
                      .slice()
                      .sort((a,b) => {
                        const an = studentNames[a.studentId] || a.studentId;
                        const bn = studentNames[b.studentId] || b.studentId;
                        return studentSort === 'name-asc' ? an.localeCompare(bn) : bn.localeCompare(an);
                      })
                      .map(e => (
                      <div key={e.id} className="py-2 flex items-center justify-between">
                        <div className="text-sm text-gray-700">{studentNames[e.studentId] || e.studentId}</div>
                        <Badge variant="secondary" className="capitalize">{e.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No students enrolled yet.</div>
                )}
              </TabsContent>

              <TabsContent value="grades" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">View:</span>
                    <Select value={gradeViewMode} onValueChange={(v) => setGradeViewMode(v as any)}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assignments">Assignment Grades</SelectItem>
                        <SelectItem value="exams">Exam Grades</SelectItem>
                        <SelectItem value="final">Final Grades</SelectItem>
                        <SelectItem value="others">Other Grades</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-600">Sort:</span>
                    <Select value={gradeSort} onValueChange={(v) => setGradeSort(v as any)}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="grade-desc">Grade High→Low</SelectItem>
                        <SelectItem value="grade-asc">Grade Low→High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    {(userProfile.role === 'admin' || userProfile.role === 'super_admin') && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setRangesOpen(true)}>
                          Configure Grade Ranges
                        </Button>
                        <LoadingButton
                          variant="outline"
                          size="sm"
                          loading={assignLoading}
                          loadingText="Assigning…"
                          onClick={async () => {
                            if (!course) return;
                            try {
                              setAssignLoading(true);
                              // Build totals per student (assignments, exams, others)
                              const assignmentMap = new Map<string, { total: number; max: number }>();
                              submissions
                                .filter(s => s.status === 'graded' && typeof s.grade === 'number')
                                .forEach(s => {
                                  const prev = assignmentMap.get(s.studentId) || { total: 0, max: 0 };
                                  const asg = assignments.find(a => a.id === s.assignmentId);
                                  assignmentMap.set(s.studentId, {
                                    total: prev.total + (s.grade || 0),
                                    max: prev.max + ((asg as any)?.maxScore || 0),
                                  });
                                });

                              const examMap = new Map<string, { total: number; max: number }>();
                              examGrades.forEach(g => {
                                const prev = examMap.get(g.studentId) || { total: 0, max: 0 };
                                examMap.set(g.studentId, {
                                  total: prev.total + (g.grade || 0),
                                  max: prev.max + (g.maxScore || 0),
                                });
                              });

                              const otherMap = new Map<string, number>();
                              otherGrades.forEach(og => {
                                const prev = otherMap.get(og.studentId) || 0;
                                otherMap.set(og.studentId, prev + (og.points || 0));
                              });

                              // Iterate enrolled students
                              for (const en of enrollments) {
                                const a = assignmentMap.get(en.studentId) || { total: 0, max: 0 };
                                const e = examMap.get(en.studentId) || { total: 0, max: 0 };
                                const o = otherMap.get(en.studentId) || 0;
                                const points = a.total + e.total + o;
                                const cappedPoints = Math.min(points, 100);
                                const comp = calculateLetterGrade(cappedPoints, 100, gradeRanges);
                                const existing = await gradeService.getGradeByStudentAndCourse(course.id, en.studentId);
                                const payload: any = {
                                  finalGrade: Math.round(points),
                                  letterGrade: comp.letter,
                                  gradePoints: comp.points,
                                  calculatedBy: userProfile?.id || (userProfile as any)?.uid || 'unknown',
                                  calculationMethod: 'automatic_sum',
                                  assignmentsTotal: Math.round(a.total),
                                  assignmentsMax: a.max,
                                  examsTotal: Math.round(e.total),
                                  examsMax: e.max,
                                  otherTotal: Math.round(o),
                                  isPublished: existing?.isPublished ?? false,
                                  updatedAt: new Date(),
                                };
                                if (existing) {
                                  await gradeService.updateGrade(existing.id, payload);
                                } else {
                                  await gradeService.createGrade({ courseId: course.id, studentId: en.studentId, ...payload } as any);
                                }
                              }
                              toast.success('Letters assigned for all students');
                              // Refresh final grades
                              try {
                                const grades = await gradeService.getGradesByCourse(course.id);
                                setFinalGrades(grades);
                              } catch {}
                            } catch (err) {
                              toast.error('Failed to assign letters');
                            } finally {
                              setAssignLoading(false);
                            }
                          }}
                        >
                          Assign Letters
                        </LoadingButton>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={() => {
                      if (gradeViewMode === 'final') {
                        // export CSV for final grades
                        const rows = [['Student','Final Grade','Letter Grade','Grade Points','Calculated At']];
                        finalGrades.forEach(g => {
                          const student = studentNames[g.studentId] || g.studentId;
                          rows.push([
                            student, 
                            String(g.finalGrade), 
                            g.letterGrade, 
                            String(g.gradePoints),
                            g.calculatedAt.toDate().toISOString()
                          ]);
                        });
                        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `${course.title}-final-grades.csv`; a.click(); URL.revokeObjectURL(url);
                      } else if (gradeViewMode === 'exams') {
                        // export CSV for exam grades
                        const rows = [['Student','Exam','Grade','Max Score','Auto Score','Manual Score','Submitted At']];
                        examGrades.forEach(g => {
                          rows.push([
                            g.studentName,
                            g.examTitle,
                            String(g.grade),
                            String(g.maxScore),
                            String(g.autoScore),
                            String(g.manualScore),
                            g.gradedAt.toISOString()
                          ]);
                        });
                        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `${course.title}-exam-grades.csv`; a.click(); URL.revokeObjectURL(url);
                      } else {
                        // export CSV for graded submissions
                        const rows = [['Student','Assignment','Grade','Submitted At']];
                        submissions.filter(s => s.status === 'graded').forEach(s => {
                          const student = studentNames[s.studentId] || s.studentId;
                          const asg = assignments.find(a => a.id === s.assignmentId)?.title || s.assignmentId;
                          rows.push([student, asg, String(s.grade ?? ''), s.submittedAt.toDate().toISOString()]);
                        });
                        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `${course.title}-grades.csv`; a.click(); URL.revokeObjectURL(url);
                      }
                    }}>
                      <Download className="h-4 w-4 mr-2" /> Export CSV
                    </Button>
                  </div>
                </div>
                {gradeViewMode === 'final' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500">Class Average</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{averageGrade}</div></CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500">Highest Grade</CardTitle></CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {finalGrades.length > 0 ? Math.max(...finalGrades.map(g => g.finalGrade)) : 0}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500">Lowest Grade</CardTitle></CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {finalGrades.length > 0 ? Math.min(...finalGrades.map(g => g.finalGrade)) : 0}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="bg-white border rounded p-3">
                      <div className="text-sm font-medium mb-2">Grade distribution</div>
                      {(() => {
                        // Use actual letter grades from the students
                        const dist = { A:0, B:0, C:0, D:0, F:0 } as Record<string, number>;
                        
                        // Get unique grades per student (latest only)
                        const uniqueGrades = Object.values(finalGrades.reduce((acc, g) => {
                          if (!acc[g.studentId] || acc[g.studentId].calculatedAt.toDate() < g.calculatedAt.toDate()) {
                            acc[g.studentId] = g;
                          }
                          return acc;
                        }, {} as Record<string, FirestoreGrade>));
                        
                        // Count actual letter grades
                        uniqueGrades.forEach(g => {
                          const letter = g.letterGrade?.[0] || 'F';
                          if (letter in dist) {
                            dist[letter]++;
                          }
                        });
                        
                        const items = Object.entries(dist);
                        const totalStudents = uniqueGrades.length;
                        
                        return (
                          <div className="grid grid-cols-5 gap-2">
                            {items.map(([k,v]) => (
                              <div key={k} className="text-center">
                                <div className="text-xs text-gray-500 mb-1">{k}</div>
                                <div className="h-16 bg-blue-100 rounded flex items-end justify-center">
                                  <div className="w-full bg-blue-500 rounded-b" style={{ height: `${totalStudents? (v/totalStudents)*100 : 0}%` }} />
                                </div>
                                <div className="text-xs mt-1">{v} students</div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
                {gradeViewMode === 'exams' ? (
                  <>
                    {/* Exam Grades Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500">Total Exam Grades</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{examGrades.length}</div></CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500">Average Grade</CardTitle></CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {examGrades.length > 0 ? Math.round(examGrades.reduce((sum, g) => sum + (g.grade / g.maxScore) * 100, 0) / examGrades.length) : 0}%
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500">Highest Grade</CardTitle></CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {examGrades.length > 0 ? Math.round(Math.max(...examGrades.map(g => (g.grade / g.maxScore) * 100))) : 0}%
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {examGrades.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-2">Student</th>
                              <th className="text-left px-4 py-2">Exam</th>
                              <th className="text-left px-4 py-2">Grade</th>
                              <th className="text-left px-4 py-2">Max Score</th>
                              <th className="text-left px-4 py-2">Auto Score</th>
                              <th className="text-left px-4 py-2">Manual Score</th>
                              <th className="text-left px-4 py-2">Submitted</th>
                              <th className="text-left px-4 py-2"></th>
                            </tr>
                          </thead>
                        <tbody className="divide-y">
                          {examGrades
                            .slice()
                            .sort((a,b) => {
                              switch (gradeSort) {
                                case 'recent': return b.gradedAt.getTime() - a.gradedAt.getTime();
                                case 'oldest': return a.gradedAt.getTime() - b.gradedAt.getTime();
                                case 'grade-desc': return b.grade - a.grade;
                                case 'grade-asc': return a.grade - b.grade;
                              }
                            })
                            .map(grade => (
                            <tr key={grade.id}>
                              <td className="px-4 py-2">{grade.studentName}</td>
                              <td className="px-4 py-2">{grade.examTitle}</td>
                              <td className="px-4 py-2 font-semibold">{grade.grade}</td>
                              <td className="px-4 py-2">{grade.maxScore}</td>
                              <td className="px-4 py-2">{grade.autoScore}</td>
                              <td className="px-4 py-2">{grade.manualScore}</td>
                              <td className="px-4 py-2">{grade.gradedAt.toLocaleString()}</td>
                              <td className="px-4 py-2 text-right">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => navigate(`/dashboard/exam-results/${grade.examId}`)}
                                >
                                  View Details
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No Exam Grades Yet</h3>
                        <p className="text-gray-400">Exam grades will appear here once students complete and submit their exams.</p>
                      </div>
                    )}
                  </>
                ) : gradeViewMode === 'final' ? (
                  finalGrades.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-4 py-2">Student</th>
                            <th className="text-left px-4 py-2">Final Grade</th>
                            <th className="text-left px-4 py-2">Letter Grade</th>
                            <th className="text-left px-4 py-2">Method</th>
                            <th className="text-left px-4 py-2">Calculated</th>
                            <th className="text-left px-4 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {Object.values(finalGrades.reduce((acc, g) => {
                            if (!acc[g.studentId] || acc[g.studentId].calculatedAt.toDate() < g.calculatedAt.toDate()) {
                              acc[g.studentId] = g;
                            }
                            return acc;
                          }, {} as Record<string, FirestoreGrade>))
                            .slice()
                            .sort((a,b) => {
                              switch (gradeSort) {
                                case 'recent': return b.calculatedAt.toDate().getTime() - a.calculatedAt.toDate().getTime();
                                case 'oldest': return a.calculatedAt.toDate().getTime() - b.calculatedAt.toDate().getTime();
                                case 'grade-desc': return b.finalGrade - a.finalGrade;
                                case 'grade-asc': return a.finalGrade - b.finalGrade;
                              }
                            })
                            .map(g => {
                              const letterToShow = g.letterGrade || '';
                              return (
                                <tr key={g.id}>
                                  <td className="px-4 py-2">{studentNames[g.studentId] || g.studentId}</td>
                                  <td className="px-4 py-2 font-semibold">{g.finalGrade}</td>
                                  <td className="px-4 py-2">
                                    <Badge variant={letterToShow.startsWith('A') ? 'default' : letterToShow.startsWith('B') ? 'secondary' : letterToShow.startsWith('C') ? 'outline' : 'destructive'}>
                                      {letterToShow}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-2 capitalize text-xs">{g.calculationMethod.replace('_', ' ')}</td>
                                  <td className="px-4 py-2">{g.calculatedAt.toDate().toLocaleString()}</td>
                                  <td className="px-4 py-2 text-right"></td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No final grades calculated yet.</div>
                  )
                ) : gradeViewMode === 'others' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">Add and manage other grades per student.</div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-4 py-2">Student</th>
                            <th className="text-left px-4 py-2">Entries</th>
                            <th className="text-right px-4 py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {Array.from(new Map(enrollments.map(e => [e.studentId, e])).values()).map((en) => {
                            const studentName = studentNames[en.studentId] || en.studentId;
                            const entries = otherGrades.filter(g => g.studentId === en.studentId);
                            return (
                              <tr key={en.id}>
                                <td className="px-4 py-2 font-medium">{studentName}</td>
                                <td className="px-4 py-2">
                                  {entries.length > 0 ? (
                                    <div className="space-y-1">
                                      {entries.map(e => (
                                        <div key={e.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                                          <div className="text-xs text-gray-700 truncate mr-2">{e.reason}</div>
                                          <div className="text-xs font-semibold text-gray-900 mr-2">+{e.points}</div>
                                          <div className="flex items-center gap-1">
                                            <Button size="sm" variant="outline" onClick={()=>{ setOtherGradeEditing(e); setOtherGradeForm({ reason: e.reason, points: e.points }); setOtherGradeDialogOpen(true); }}>Edit</Button>
                                            <Button size="sm" variant="destructive" onClick={async () => {
                                                try {
                                                  await otherGradeService.delete(e.id);
                                                  setOtherGrades(prev => prev.filter(x => x.id !== e.id));
                                                  toast.success('Other grade entry deleted');
                                                } catch (error) {
                                                  console.error('Error deleting other grade entry:', error);
                                                  toast.error('Failed to delete other grade entry');
                                                }
                                              }}>
                                                Delete
                                              </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-500">No entries</div>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <Button size="sm" onClick={()=>{ setOtherGradeTargetStudentId(en.studentId); setOtherGradeEditing(null); setOtherGradeForm({ reason: '', points: 0 }); setOtherGradeDialogOpen(true); }}>Add Grade</Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  submissions.filter(s => s.status === 'graded').length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-4 py-2">Student</th>
                            <th className="text-left px-4 py-2">Assignment</th>
                            <th className="text-left px-4 py-2">Grade</th>
                            <th className="text-left px-4 py-2">Status</th>
                            <th className="text-left px-4 py-2">Submitted</th>
                            <th className="text-left px-4 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {submissions
                            .filter(s => s.status === 'graded')
                            .slice()
                            .sort((a,b) => {
                              switch (gradeSort) {
                                case 'recent': return b.submittedAt.toDate().getTime() - a.submittedAt.toDate().getTime();
                                case 'oldest': return a.submittedAt.toDate().getTime() - b.submittedAt.toDate().getTime();
                                case 'grade-desc': return (b.grade || 0) - (a.grade || 0);
                                case 'grade-asc': return (a.grade || 0) - (b.grade || 0);
                              }
                            })
                            .map(s => (
                            <tr key={s.id}>
                              <td className="px-4 py-2">{studentNames[s.studentId] || s.studentId}</td>
                              <td className="px-4 py-2">{assignments.find(a => a.id === s.assignmentId)?.title || s.assignmentId}</td>
                              <td className="px-4 py-2">{typeof s.grade === 'number' ? s.grade : '-'}</td>
                              <td className="px-4 py-2 capitalize">{s.status}</td>
                              <td className="px-4 py-2">{s.submittedAt.toDate().toLocaleString()}</td>
                              <td className="px-4 py-2 text-right"><Button size="sm" variant="outline" onClick={() => { setSelectedSubmission(s); setGradeValue(s.grade || 0); setGradeFeedback(s.feedback || ''); setGradeDialogOpen(true); }}>Edit Grade</Button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No graded submissions yet.</div>
                  )
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Link to="/dashboard/my-courses">
            <Button variant="outline">Back to My Courses</Button>
          </Link>
        </div>
      </div>



      {/* Submissions Dialog for an Assignment */}
      <Dialog open={submissionsDialogOpen} onOpenChange={setSubmissionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submissions{selectedAssignment ? ` - ${selectedAssignment.title}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            {submissionsForAssignment.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2">Student</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Submitted</th>
                    <th className="text-left px-4 py-2">Grade</th>
                    <th className="text-left px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {submissionsForAssignment.map(s => (
                    <tr key={s.id}>
                      <td className="px-4 py-2">{studentNames[s.studentId] || s.studentId}</td>
                      <td className="px-4 py-2 capitalize">{s.status}</td>
                      <td className="px-4 py-2">{s.submittedAt.toDate().toLocaleString()}</td>
                      <td className="px-4 py-2">{typeof s.grade==='number' ? s.grade : '-'}</td>
                      <td className="px-4 py-2 text-right"><Button size="sm" variant="outline" onClick={() => { setSelectedSubmission(s); setGradeValue(s.grade || 0); setGradeFeedback(s.feedback || ''); setGradeDialogOpen(true); }}>Edit Grade</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-gray-500">No submissions yet.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Material Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={(open) => {
        // Prevent closing if an upload is in progress
        if (isUploadingMaterial) return;
        setMaterialDialogOpen(open);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'Edit Material' : 'Add Material'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="m-title">Title</Label>
              <Input id="m-title" value={materialForm.title} onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="m-desc">Description</Label>
              <Input id="m-desc" value={materialForm.description} onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={materialForm.type} onValueChange={(v) => setMaterialForm({ ...materialForm, type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {materialForm.type === 'document' && (
              <div className="space-y-2">
                <Label htmlFor="m-file-upload">Upload File(s) (PDF/DOC)</Label>
                <Input id="m-file-upload" type="file" accept=".pdf,.doc,.docx" multiple onChange={(e) => setMaterialFiles(Array.from(e.target.files || []))} />
                {materialFiles.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    {materialFiles.length} file(s) selected. 
                    {materialFiles.length > 1 && " Note: Title and description will be ignored, and filenames will be used as titles."}
                  </div>
                )}
                {isUploadingMaterial && (
                  <div className="text-xs text-blue-700 mt-1">Uploading {materialFiles.length} file(s)...</div>
                )}
                <div className="text-xs text-gray-500">Or paste a direct URL (for a single file):</div>
                <Input id="m-file" value={materialForm.fileUrl} onChange={(e) => setMaterialForm({ ...materialForm, fileUrl: e.target.value })} placeholder="https://example.com/file.pdf" />
              </div>
            )}
            {(materialForm.type === 'video' || materialForm.type === 'link') && (
              <div>
                <Label htmlFor="m-link">External Link</Label>
                <Input id="m-link" value={materialForm.externalLink} onChange={(e) => setMaterialForm({ ...materialForm, externalLink: e.target.value })} placeholder="https://example.com/resource" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>Cancel</Button>
            <LoadingButton loading={savingMaterial} loadingText="Saving..." onClick={async () => {
              if (!editingMaterial && materialFiles.length === 0 && !materialForm.fileUrl && materialForm.type === 'document') {
                toast.error('Please select a file or provide a URL for the document.');
                return;
              }
              if (materialFiles.length <= 1 && !materialForm.title.trim()) {
                toast.error('Material title is required.');
                return;
              }
              
              try {
                setSavingMaterial(true);
                setIsUploadingMaterial(true);

                if (materialFiles.length > 1) {
                  // Bulk upload logic
                  const uploadResults = await uploadMultipleToHygraph(materialFiles);
                  const successfulUploads = uploadResults.filter(r => r.success);
                  
                  if (successfulUploads.length === 0) {
                    throw new Error('All file uploads failed.');
                  }

                  const materialPromises = successfulUploads.map(uploadResult => {
                    const payload = {
                      title: uploadResult.filename || 'Untitled Material',
                      description: '',
                      courseId: course.id,
                      type: 'document' as const,
                      fileUrl: uploadResult.url || '',
                      fileAssetId: uploadResult.id || undefined,
                    };
                    return courseMaterialService.createCourseMaterial(payload);
                  });

                  await Promise.all(materialPromises);
                  toast.success(`${successfulUploads.length} material(s) added successfully.`);

                } else {
                  // Single material logic (create or update)
                  const payload: any = { title: materialForm.title, description: materialForm.description, courseId: course.id, type: materialForm.type };
                  
                  if (materialForm.type === 'document') {
                    let url = materialForm.fileUrl || (editingMaterial?.fileUrl || '');
                    let assetId: string | undefined = editingMaterial?.fileAssetId;

                    if (materialFiles.length === 1) {
                      const uploadResult = await uploadToHygraph(materialFiles[0]);
                      if (!uploadResult.success) throw new Error(uploadResult.error || 'Upload failed');
                      url = uploadResult.url || '';
                      assetId = uploadResult.id;
                      if (!url) throw new Error('No URL returned from upload');
                      if (uploadResult.warning) toast.warning(uploadResult.warning);
                    }
                    payload.fileUrl = url;
                    payload.fileAssetId = assetId;
                  }
                  
                  if (materialForm.type === 'video' || materialForm.type === 'link') {
                    payload.externalLink = materialForm.externalLink || '';
                  }

                  if (editingMaterial) {
                    await courseMaterialService.updateCourseMaterial(editingMaterial.id, payload);
                    toast.success('Material updated');
                  } else {
                    await courseMaterialService.createCourseMaterial(payload);
                    toast.success('Material added');
                  }
                }

                const latest = await courseMaterialService.getCourseMaterialsByCourse(course.id, 1000);
                setMaterials(latest);
                setMaterialDialogOpen(false);
                setEditingMaterial(null);
                setMaterialFiles([]);
              } catch (e: any) { 
                toast.error(`Failed to save material: ${e.message}`); 
              } finally { 
                setIsUploadingMaterial(false); 
                setSavingMaterial(false); 
              }
            }}>Save</LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
            <Dialog open={assignmentDialogOpen} onOpenChange={(open) => {
              // Prevent closing if an upload is in progress
              if (isUploading) return;
              setAssignmentDialogOpen(open);
            }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
                  </DialogTitle>
                </DialogHeader>
      
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  
                  if (!assignmentForm.title.trim()) {
                    toast.error('Assignment title is required.');
                    return;
                  }
                  if (!assignmentForm.description.trim()) {
                    toast.error('Assignment description is required.');
                    return;
                  }
                  if (!assignmentForm.dueDate) {
                    toast.error('Assignment due date is required.');
                    return;
                  }
                  if (assignmentForm.maxScore <= 0) {
                    toast.error('Max score must be a positive number.');
                    return;
                  }
      
                  try {
                    setSavingAssignment(true);
                    // Parse due date in local time to avoid UTC off-by-one issues when Ethiopian calendar is used
                    const [yearStr, monthStr, dayStr] = (assignmentForm.dueDate || new Date().toISOString().slice(0,10)).split('-');
                    const year = parseInt(yearStr, 10);
                    const month = parseInt(monthStr, 10) - 1; // JS Date months are 0-based
                    const day = parseInt(dayStr, 10);
                    const dueDate = new Date(year, month, day);
                    if (assignmentForm.dueTime) {
                      const [hh, mm] = assignmentForm.dueTime.split(':');
                      const hours = parseInt(hh, 10);
                      const minutes = parseInt(mm, 10);
                      if (!isNaN(hours) && !isNaN(minutes)) dueDate.setHours(hours, minutes, 0, 0);
                    } else {
                      // Set to end of day local time if no time specified
                      dueDate.setHours(23, 59, 59, 999);
                    }
      
                    const attachments: { type: 'file' | 'link'; url: string; title?: string; assetId?: string }[] = [];
                    if (fileObjs.length > 0) {
                      try {
                        setIsUploading(true);
                        const uploadResults = await uploadMultipleToHygraph(fileObjs);
                        const successfulUploads = uploadResults.filter(r => r.success);

                        if (uploadResults.some(r => !r.success)) {
                          const failedFiles = uploadResults.filter(r => !r.success).map(r => r.filename).join(', ');
                          toast.error(`Failed to upload some files: ${failedFiles}`);
                        }

                        if (successfulUploads.length === 0 && fileObjs.length > 0) {
                            throw new Error('All file uploads failed.');
                        }

                        successfulUploads.forEach(uploadResult => {
                            attachments.push({
                                type: 'file',
                                url: uploadResult.url!,
                                title: uploadResult.filename,
                                assetId: uploadResult.id,
                            });
                        });
                        
                      } catch (err) {
                        console.error('Attachment upload failed', err);
                        toast.error(`Failed to upload attachments: ${err instanceof Error ? err.message : 'Unknown error'}`);
                        // Don't continue if upload failed
                        setIsUploading(false);
                        setSavingAssignment(false);
                        return;
                      }
                    }
                    if (assignmentForm.linkUrl) attachments.push({ type: 'link', url: assignmentForm.linkUrl, title: assignmentForm.linkTitle || undefined });
      
                    const assignmentData = {
                      title: assignmentForm.title,
                      description: assignmentForm.description,
                      courseId: course.id, // courseId is already known
                      dueDate,
                      maxScore: assignmentForm.maxScore,
                      instructions: assignmentForm.instructions,
                      teacherId: course.instructor, // teacherId is already known
                      ...(attachments.length ? { attachments } : {})
                    } as any;
      
                    if (editingAssignment) {
                      await (await import('@/lib/firestore')).assignmentService.updateAssignment(editingAssignment.id, assignmentData);
                      toast.success('Assignment updated successfully');
                    } else {
                      await (await import('@/lib/firestore')).assignmentService.createAssignment(assignmentData);
                      toast.success('Assignment created successfully');
                    }
      
                    setAssignmentDialogOpen(false);
                    setEditingAssignment(null);
                    // resetForm(); // Will implement resetForm later
                    const latest = await (await import('@/lib/firestore')).assignmentService.getAssignmentsByCourse(course.id, 1000);
                    setAssignments(latest);
                  } catch (error) {
                    console.error('Error saving assignment:', error);
                    toast.error('Failed to save assignment');
                  }
                  finally {
                    setIsUploading(false);
                    setSavingAssignment(false);
                  }
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={assignmentForm.title}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Assignment title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="courseId">Course</Label> {/* Course is not editable here */}
                      <Input id="courseName" value={course?.title || ''} disabled />
                    </div>
      
                  </div>
                  
                  <div>
                      <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={assignmentForm.description}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the assignment"
                      required
                    />
                  </div>
      
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dueDate">Due Date *</Label>
                      <DualDateInput
                        value={assignmentForm.dueDate ? new Date(assignmentForm.dueDate) : new Date()}
                        onChange={(d) => {
                          const year = d.getFullYear();
                          const month = (d.getMonth() + 1).toString().padStart(2, '0');
                          const day = d.getDate().toString().padStart(2, '0');
                          const formattedDate = `${year}-${month}-${day}`;
                          setAssignmentForm(prev => ({ ...prev, dueDate: formattedDate }));
                        }}
                        defaultMode="ethiopian"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dueTime">Due Time</Label>
                      <Input id="dueTime" type="time" value={assignmentForm.dueTime} onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueTime: e.target.value }))} />
                    </div>
                  </div>
      
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxScore">Max Score</Label>
                      <Input
                        id="maxScore"
                        type="number"
                        value={assignmentForm.maxScore}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, maxScore: parseInt(e.target.value) }))}
                        min="1"
                        max="1000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="file">Attachments (optional)</Label>
                      <div className="flex items-center gap-2">
                        <Input id="file" type="file" multiple onChange={(e) => setFileObjs(Array.from(e.target.files || []))} className="flex-1" />
                      </div>
                      {fileObjs.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
                          {fileObjs.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-sm text-gray-500">
                              <span>{file.name}</span>
                              <Button variant="ghost" size="sm" onClick={() => setFileObjs(prev => prev.filter((_, i) => i !== index))}>X</Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
      
                  <div>
                      <Label htmlFor="instructions">Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={assignmentForm.instructions}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, instructions: e.target.value }))}
                      placeholder="Detailed instructions for students"
                      rows={4}
                    />
                  </div>
      
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="linkTitle">Resource Title (optional)</Label>
                      <Input id="linkTitle" value={assignmentForm.linkTitle} onChange={(e) => setAssignmentForm(prev => ({ ...prev, linkTitle: e.target.value }))} placeholder="Syllabus link" />
                    </div>
                    <div>
                      <Label htmlFor="linkUrl">Resource URL (optional)</Label>
                      <Input id="linkUrl" value={assignmentForm.linkUrl} onChange={(e) => setAssignmentForm(prev => ({ ...prev, linkUrl: e.target.value }))} placeholder="https://example.com/resource" />
                    </div>
                  </div>
      
                  <div className="flex space-x-3 pt-4">
                    <LoadingButton type="submit" className="flex-1" loading={savingAssignment || isUploading} loadingText={isUploading ? 'Uploading…' : 'Saving…'}>
                      {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                    </LoadingButton>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setAssignmentDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            {/* Exam Dialog */}
      <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingExam ? 'Edit Exam' : 'Create Exam'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="e-title">Title</Label>
              <Input id="e-title" value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="e-desc">Description</Label>
              <Input id="e-desc" value={examForm.description} onChange={(e) => setExamForm({ ...examForm, description: e.target.value })} />
            </div>
              <div className="grid grid-cols-2 gap-3">
              <div>
                <DualDateInput
                  value={examForm.date ? new Date(examForm.date) : null}
                  onChange={(d) => {
                    const year = d.getFullYear();
                    const month = (d.getMonth() + 1).toString().padStart(2, '0');
                    const day = d.getDate().toString().padStart(2, '0');
                    const formattedDate = `${year}-${month}-${day}`;
                    setExamForm(prev => ({ ...prev, date: formattedDate }));
                  }}
                  defaultMode="ethiopian"
                />
              </div>
              <div>
                <Label htmlFor="e-time">Time</Label>
                <Input id="e-time" type="time" value={examForm.startTime} onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="e-dur">Duration (minutes)</Label>
                <Input id="e-dur" type="number" value={examForm.durationMinutes} onChange={(e) => setExamForm({ ...examForm, durationMinutes: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExamDialogOpen(false)}>Cancel</Button>
            <LoadingButton loading={savingExam} loadingText={editingExam ? 'Updating Exam...' : 'Creating Exam...'} onClick={async () => {
              if (!examForm.title.trim()) {
                toast.error('Exam title is required.');
                return;
              }
              if (!examForm.description.trim()) {
                toast.error('Exam description is required.');
                return;
              }
              if (!examForm.date) {
                toast.error('Exam date is required.');
                return;
              }
              if (!examForm.startTime) {
                toast.error('Exam start time is required.');
                return;
              }
              if (examForm.durationMinutes <= 0) {
                toast.error('Exam duration must be a positive number.');
                return;
              }
              try {
                setSavingExam(true);
                const questions = editingExam ? examForm.questions : [];
                
                const payload: any = { 
                  courseId: course!.id, 
                  title: examForm.title, 
                  description: examForm.description, 
                  date: new Date(`${examForm.date}T${examForm.startTime}:00`), 
                  startTime: new Date(`${examForm.date}T${examForm.startTime}:00`), 
                  durationMinutes: examForm.durationMinutes, 
                  questions: questions
                };
                
                if (editingExam) {
                  await examService.updateExam(editingExam.id, payload);
                  toast.success('Exam updated');
                  const latest = await examService.getExamsByCourse(course!.id);
                  setExams(latest);
                  setExamDialogOpen(false);
                  setEditingExam(null);
                } else {
                  const examId = await examService.createExam(payload);
                  toast.success('Exam created successfully');
                  setExamDialogOpen(false);
                  // Redirect to exam questions management page
                  navigate(`/dashboard/exam-questions/${examId}`);
                }
              } catch { toast.error('Failed to save exam'); }
              finally { setSavingExam(false); }
            }}>{editingExam ? 'Update Exam' : 'Create Exam & Add Questions'}</LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="g-grade">
                Grade (Max: {(() => {
                  const assignment = assignments.find(a => a.id === selectedSubmission?.assignmentId);
                  return (assignment as any)?.maxScore || 100;
                })()})
              </Label>
              <Input 
                id="g-grade" 
                type="number" 
                min="0" 
                max={(() => {
                  const assignment = assignments.find(a => a.id === selectedSubmission?.assignmentId);
                  return (assignment as any)?.maxScore || 100;
                })()} 
                value={gradeValue} 
                onChange={(e) => setGradeValue(parseInt(e.target.value) || 0)} 
              />
            </div>
            <div>
              <Label htmlFor="g-feedback">Feedback</Label>
              <Input id="g-feedback" value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
            <LoadingButton loading={savingGrade} loadingText="Saving..." onClick={async () => {
              if (!selectedSubmission) return;
              
              // Find the assignment for this submission to get max score
              const assignment = assignments.find(a => a.id === selectedSubmission.assignmentId);
              const maxScore = (assignment as any)?.maxScore || 100;
              
              if (gradeValue > maxScore) {
                toast.error(`Grade cannot exceed the maximum score of ${maxScore}`);
                return;
              }
              
              if (gradeValue < 0) {
                toast.error('Grade cannot be negative');
                return;
              }
              
              try {
                setSavingGrade(true);
                await (await import('@/lib/firestore')).submissionService.updateSubmission(selectedSubmission.id, { grade: gradeValue, feedback: gradeFeedback, status: 'graded' });
                studentDataService.clearStudentCache(selectedSubmission.studentId);
                toast.success('Grade updated');
                const latest = await (await import('@/lib/firestore')).submissionService.getSubmissionsByCourse(course.id);
                setSubmissions(latest);
                setGradeDialogOpen(false);
              } catch { toast.error('Failed to update grade'); }
              finally { setSavingGrade(false); }
            }}>Save</LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

  {/* Other Grade Dialog */}
  <Dialog open={otherGradeDialogOpen} onOpenChange={setOtherGradeDialogOpen}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{otherGradeEditing ? 'Edit Other Grade' : 'Add Other Grade'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label htmlFor="og-reason">Reason</Label>
          <Input id="og-reason" value={otherGradeForm.reason} onChange={(e)=> setOtherGradeForm(prev => ({ ...prev, reason: e.target.value }))} placeholder="Bonus / Attendance / Discipline / Custom" />
        </div>
        <div>
          <Label htmlFor="og-points">Points</Label>
          <Input
            id="og-points"
            type="text" // Change type to text to allow more control over input
            value={otherGradeForm.points === 0 && otherGradeForm.reason === '' ? '' : otherGradeForm.points.toString()} // Display empty string if points is 0 and reason is empty
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string or a string matching the pattern for numbers with at most one decimal place
              if (value === '' || /^\d*\.?\d{0,1}$/.test(value)) {
                let newPoints;
                if (value === '') {
                  newPoints = 0;
                } else if (value === '.') {
                  newPoints = 0; // Treat '.' as 0 for the state to avoid NaN
                } else {
                  newPoints = Number(value);
                }
                
                if (newPoints > 100) {
                  newPoints = 100;
                }
                setOtherGradeForm(prev => ({ ...prev, points: newPoints }));
              }
            }}
            inputMode="decimal" // Suggest decimal keyboard on mobile
          />
          <div className="text-xs text-gray-500 mt-1">Additive points; final grade will be clamped to 100 in admin view.</div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={()=> setOtherGradeDialogOpen(false)}>Cancel</Button>
        <LoadingButton loading={savingOtherGrade} loadingText={otherGradeEditing ? 'Saving...' : 'Adding...'} onClick={async ()=>{
          if (!course || (!otherGradeTargetStudentId && !otherGradeEditing)) { 
            toast.error('Missing required information');
            setOtherGradeDialogOpen(false); 
            return; 
          }
          if (!otherGradeForm.reason.trim()) {
            toast.error('Reason for other grade is required.');
            return;
          }
          if (typeof otherGradeForm.points !== 'number' || isNaN(otherGradeForm.points)) {
            toast.error('Points must be a valid number.');
            return;
          }
          try {
            setSavingOtherGrade(true);
            if (otherGradeEditing) {
              await otherGradeService.update(otherGradeEditing.id, { reason: otherGradeForm.reason, points: otherGradeForm.points });
              // Refresh list from backend to ensure consistency
              const refreshed = await otherGradeService.getByCourse(course.id);
              setOtherGrades(refreshed);
              toast.success('Other grade updated successfully');
            } else {
              const newId = await otherGradeService.add({ courseId: course.id, studentId: otherGradeTargetStudentId!, teacherId: course.instructor, reason: otherGradeForm.reason, points: otherGradeForm.points });
              // Fetch the created record to get server timestamps and ensure ordering
              const refreshed = await otherGradeService.getByCourse(course.id);
              setOtherGrades(refreshed);
              toast.success('Other grade added successfully');
            }
            setOtherGradeDialogOpen(false);
            setOtherGradeTargetStudentId(null);
            setOtherGradeEditing(null);
            setOtherGradeForm({ reason: '', points: 0 });
          } catch (error) {
            console.error('Error saving other grade:', error);
            toast.error('Failed to save other grade');
          } finally {
            setSavingOtherGrade(false);
          }
        }}>{otherGradeEditing ? 'Save' : 'Add'}</LoadingButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>

      {/* Grade ranges configuration dialog for admins */}
      <Dialog open={rangesOpen} onOpenChange={setRangesOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Letter Grade Ranges</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(gradeRanges || {}).map(([letter, range]) => (
                <div key={letter} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-12 text-center font-semibold">{letter}</div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Min:</Label>
                    <Input type="number" min={0} max={100} value={(range as any).min}
                      onChange={(e) => setGradeRanges((prev: any) => ({ ...prev, [letter]: { ...(prev[letter] as any), min: parseInt(e.target.value) || 0 } }))}
                      className="w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Max:</Label>
                    <Input type="number" min={0} max={100} value={(range as any).max}
                      onChange={(e) => setGradeRanges((prev: any) => ({ ...prev, [letter]: { ...(prev[letter] as any), max: parseInt(e.target.value) || 0 } }))}
                      className="w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Points:</Label>
                    <Input type="number" step={0.1} min={0} max={4} value={(range as any).points}
                      onChange={(e) => setGradeRanges((prev: any) => ({ ...prev, [letter]: { ...(prev[letter] as any), points: parseFloat(e.target.value) || 0 } }))}
                      className="w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRangesOpen(false)}>Cancel</Button>
            <LoadingButton loading={savingGradeRanges} loadingText="Saving..." onClick={async () => {
              try {
                setSavingGradeRanges(true);
                await settingsService.setGradeRanges(gradeRanges);
                toast.success('Grade ranges updated');
              } catch {
                toast.error('Failed to save grade ranges');
              } finally {
                setSavingGradeRanges(false);
                setRangesOpen(false);
              }
            }}>Save Ranges</LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Final grade calculation controls removed; handled by admins */}

      {/* Delete Material Confirmation Dialog */}
      <ConfirmDialog
        open={deleteMaterialDialogOpen}
        onOpenChange={setDeleteMaterialDialogOpen}
        onConfirm={confirmMaterialDelete}
        title={`Delete "${materialToDelete?.title}"?`}
        description="Are you sure you want to delete this course material? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}

