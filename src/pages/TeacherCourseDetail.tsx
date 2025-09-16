/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  courseService,
  enrollmentService,
  assignmentService,
  submissionService,
  courseMaterialService,
  examService,
  FirestoreCourse,
  FirestoreEnrollment,
  FirestoreAssignment,
  FirestoreCourseMaterial,
  FirestoreSubmission,
  FirestoreExam,
} from '@/lib/firestore';
import DashboardHero from '@/components/DashboardHero';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function TeacherCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { userProfile } = useAuth();

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
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<FirestoreAssignment | null>(null);
  const [assignmentForm, setAssignmentForm] = useState<{ title: string; description: string; dueDate: string; maxScore: number }>(
    { title: '', description: '', dueDate: new Date().toISOString().slice(0,10), maxScore: 100 }
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<FirestoreAssignment | null>(null);
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
  const [examForm, setExamForm] = useState<{ title: string; description: string; date: string }>({ title: '', description: '', date: new Date().toISOString().slice(0,16) });
  const [showExamDeleteConfirm, setShowExamDeleteConfirm] = useState(false);
  const [examToDelete, setExamToDelete] = useState<FirestoreExam | null>(null);

  useEffect(() => {
    if (!courseId) return;
    const load = async () => {
      try {
        setLoading(true);
        const [c, ens, asgs, subs, mats, exs] = await Promise.all([
          courseService.getCourseById(courseId),
          enrollmentService.getEnrollmentsByCourse(courseId),
          assignmentService.getAssignmentsByCourse(courseId, 1000),
          submissionService.getSubmissionsByCourse(courseId),
          courseMaterialService.getCourseMaterialsByCourse(courseId, 1000),
          examService.getExamsByCourse(courseId),
        ]);
        setCourse(c);
        setEnrollments(ens);
        setAssignments(asgs);
        setSubmissions(subs);
        setMaterials(mats);
        setExams(exs);
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
  const averageGrade = useMemo(() => {
    const graded = submissions.filter(s => typeof s.grade === 'number');
    if (graded.length === 0) return 0;
    const sum = graded.reduce((acc, s: any) => acc + (s.grade || 0), 0);
    return Math.round((sum / graded.length) * 10) / 10;
  }, [submissions]);

  if (!userProfile || userProfile.role !== 'teacher') {
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
            <Tabs defaultValue="overview">
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
                            <Button variant="destructive" size="sm" onClick={async () => { try { await (await import('@/lib/firestore')).courseMaterialService.deleteCourseMaterial(m.id); toast.success('Material deleted'); const latest = await (await import('@/lib/firestore')).courseMaterialService.getCourseMaterialsByCourse(course.id); setMaterials(latest); } catch (e) { toast.error('Failed to delete'); } }}>Delete</Button>
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
                  <Button onClick={() => { setEditingAssignment(null); setAssignmentForm({ title: '', description: '', dueDate: new Date().toISOString().slice(0,10), maxScore: 100 }); setAssignmentDialogOpen(true); }}>Create Assignment</Button>
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
                              <Button variant="outline" size="sm" onClick={() => { setSelectedAssignment(a); setSubmissionsForAssignment(submissions.filter(s => s.assignmentId === a.id)); setSubmissionsDialogOpen(true); }}>Grade submissions</Button>
                              <Button variant="outline" size="sm" onClick={() => { setEditingAssignment(a); setAssignmentForm({ title: a.title, description: a.description, dueDate: a.dueDate.toDate().toISOString().slice(0,10), maxScore: (a as any).maxScore ?? 100 }); setAssignmentDialogOpen(true); }}>Edit</Button>
                              <Button variant="destructive" size="sm" onClick={() => { setAssignmentToDelete(a); setShowDeleteConfirm(true); }}>Delete</Button>
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
                  <Button onClick={() => setExamDialogOpen(true)}>Create Exam</Button>
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
                          <Button variant="outline" size="sm" onClick={() => { setEditingExam(exam); setExamForm({ title: exam.title, description: exam.description || '', date: exam.date.toDate().toISOString().slice(0,16) }); setExamDialogOpen(true); }}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => { setExamToDelete(exam); setShowExamDeleteConfirm(true); }}>Delete</Button>
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
                <div className="flex items-center gap-3">
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
                  <Button variant="outline" size="sm" onClick={() => {
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
                  }}>
                    <Download className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500">Class Average</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{averageGrade}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500">Highest Grade</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{Math.max(0, ...submissions.filter(s => typeof s.grade==='number').map(s => s.grade as number)) || 0}</div></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500">Lowest Grade</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{(submissions.filter(s => typeof s.grade==='number').map(s => s.grade as number).sort((a,b)=>a-b)[0]) ?? 0}</div></CardContent>
                  </Card>
                </div>
                <div className="bg-white border rounded p-3">
                  <div className="text-sm font-medium mb-2">Grade distribution</div>
                  {(() => {
                    const graded = submissions.filter(s => typeof s.grade==='number').map(s => s.grade as number);
                    const dist = { A:0, B:0, C:0, D:0, F:0 } as Record<string, number>;
                    graded.forEach(g => {
                      if (g>=90) dist.A++; else if (g>=80) dist.B++; else if (g>=70) dist.C++; else if (g>=60) dist.D++; else dist.F++;
                    });
                    const items = Object.entries(dist);
                    return (
                      <div className="grid grid-cols-5 gap-2">
                        {items.map(([k,v]) => (
                          <div key={k} className="text-center">
                            <div className="text-xs text-gray-500 mb-1">{k}</div>
                            <div className="h-16 bg-blue-100 rounded flex items-end justify-center">
                              <div className="w-full bg-blue-500 rounded-b" style={{ height: `${graded.length? (v/graded.length)*100 : 0}%` }} />
                            </div>
                            <div className="text-xs mt-1">{v} students</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                {submissions.filter(s => s.status === 'graded').length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2">Student</th>
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

      {/* Delete Assignment Confirm */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete assignment?"
        description="This action cannot be undone. The assignment and its submissions will remain but unlinking may affect grading workflows."
        confirmText="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!assignmentToDelete) return;
          try {
            await (await import('@/lib/firestore')).assignmentService.deleteAssignment(assignmentToDelete.id);
            toast.success('Assignment deleted');
            const latest = await (await import('@/lib/firestore')).assignmentService.getAssignmentsByCourse(course!.id, 1000);
            setAssignments(latest);
          } catch { toast.error('Failed to delete'); }
        }}
      />

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
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
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
              <div>
                <Label htmlFor="m-file">File URL</Label>
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
            <Button onClick={async () => {
              try {
                const payload: any = { title: materialForm.title, description: materialForm.description, courseId: course.id, type: materialForm.type };
                if (materialForm.type === 'document') payload.fileUrl = materialForm.fileUrl || '';
                if (materialForm.type === 'video' || materialForm.type === 'link') payload.externalLink = materialForm.externalLink || '';
                if (editingMaterial) {
                  await (await import('@/lib/firestore')).courseMaterialService.updateCourseMaterial(editingMaterial.id, payload);
                  toast.success('Material updated');
                } else {
                  await (await import('@/lib/firestore')).courseMaterialService.createCourseMaterial(payload);
                  toast.success('Material added');
                }
                const latest = await (await import('@/lib/firestore')).courseMaterialService.getCourseMaterialsByCourse(course.id, 1000);
                setMaterials(latest);
                setMaterialDialogOpen(false);
                setEditingMaterial(null);
              } catch (e) { toast.error('Failed to save material'); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Create Assignment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="a-title">Title</Label>
              <Input id="a-title" value={assignmentForm.title} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="a-desc">Description</Label>
              <Input id="a-desc" value={assignmentForm.description} onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="a-due">Due Date</Label>
                <Input id="a-due" type="date" value={assignmentForm.dueDate} onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="a-max">Max Score</Label>
                <Input id="a-max" type="number" value={assignmentForm.maxScore} onChange={(e) => setAssignmentForm({ ...assignmentForm, maxScore: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                const payload: any = {
                  title: assignmentForm.title,
                  description: assignmentForm.description,
                  courseId: course.id,
                  dueDate: new Date(assignmentForm.dueDate),
                  maxScore: assignmentForm.maxScore,
                };
                if (editingAssignment) {
                  await (await import('@/lib/firestore')).assignmentService.updateAssignment(editingAssignment.id, payload);
                  toast.success('Assignment updated');
                } else {
                  payload.teacherId = course.instructor;
                  await (await import('@/lib/firestore')).assignmentService.createAssignment(payload);
                  toast.success('Assignment created');
                }
                const latest = await (await import('@/lib/firestore')).assignmentService.getAssignmentsByCourse(course.id, 1000);
                setAssignments(latest);
                setAssignmentDialogOpen(false);
                setEditingAssignment(null);
              } catch (e) { toast.error('Failed to save assignment'); }
            }}>Save</Button>
          </DialogFooter>
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
            <div>
              <Label htmlFor="e-date">Date & Time</Label>
              <Input id="e-date" type="datetime-local" value={examForm.date} onChange={(e) => setExamForm({ ...examForm, date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExamDialogOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                const payload: any = { courseId: course!.id, title: examForm.title, description: examForm.description, date: new Date(examForm.date) };
                if (editingExam) {
                  await examService.updateExam(editingExam.id, payload);
                  toast.success('Exam updated');
                } else {
                  await examService.createExam(payload);
                  toast.success('Exam created');
                }
                const latest = await examService.getExamsByCourse(course!.id);
                setExams(latest);
                setExamDialogOpen(false);
                setEditingExam(null);
              } catch { toast.error('Failed to save exam'); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Exam Confirm */}
      <ConfirmDialog
        open={showExamDeleteConfirm}
        onOpenChange={setShowExamDeleteConfirm}
        title="Delete exam?"
        description="This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!examToDelete) return;
          try {
            await examService.deleteExam(examToDelete.id);
            toast.success('Exam deleted');
            const latest = await examService.getExamsByCourse(course!.id);
            setExams(latest);
          } catch { toast.error('Failed to delete exam'); }
        }}
      />

      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="g-grade">Grade</Label>
              <Input id="g-grade" type="number" value={gradeValue} onChange={(e) => setGradeValue(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label htmlFor="g-feedback">Feedback</Label>
              <Input id="g-feedback" value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!selectedSubmission) return;
              try {
                await (await import('@/lib/firestore')).submissionService.updateSubmission(selectedSubmission.id, { grade: gradeValue, feedback: gradeFeedback, status: 'graded' });
                toast.success('Grade updated');
                const latest = await (await import('@/lib/firestore')).submissionService.getSubmissionsByCourse(course.id);
                setSubmissions(latest);
                setGradeDialogOpen(false);
              } catch { toast.error('Failed to update grade'); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

