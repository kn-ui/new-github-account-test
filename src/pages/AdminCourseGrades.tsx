import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { assignmentService, courseService, enrollmentService, examAttemptService, examService, gradeService, otherGradeService, submissionService, userService, settingsService } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { GraduationCap, ChevronLeft, Users, Award, RefreshCcw } from 'lucide-react';

interface StudentRow {
  studentId: string;
  name: string;
  email: string;
  assignmentsTotal: number;
  assignmentsMax: number;
  examsTotal: number;
  examsMax: number;
  otherTotal: number;
  finalPoints: number; // assignments + exams + other
  percent: number; // (assignments+exams)/ (assignmentsMax+examsMax) * 100
  letterGrade: string;
  gradePoints: number;
  isPublished: boolean;
}

export default function AdminCourseGrades() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [course, setCourse] = useState<any | null>(null);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeRanges, setGradeRanges] = useState<any>({});
  const [rangesOpen, setRangesOpen] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    if (userProfile && (userProfile.role === 'admin' || userProfile.role === 'super_admin')) {
      loadAll();
    }
  }, [courseId, userProfile?.role]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [c, ranges] = await Promise.all([
        courseService.getCourseById(courseId!),
        settingsService.getGradeRanges().catch(() => ({})),
      ]);
      setCourse(c);
      setGradeRanges(ranges);
      await loadRows();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const computeLetter = (points: number, max: number): { letter: string; points: number } => {
    const percent = max > 0 ? Math.round((points / max) * 100) : 0;

    for (const [letter, range] of Object.entries(gradeRanges)) {
      const r = range as any;
      if (percent >= r.min && percent <= r.max) {
        return { letter, points: r.points };
      }
    }

    // If no range is found, check if it's because the percentage is over 100
    if (percent > 100) {
      const sortedRanges = Object.entries(gradeRanges).sort(([, a], [, b]) => (b as any).min - (a as any).min);
      if (sortedRanges.length > 0) {
        const highestGrade = sortedRanges[0];
        return { letter: highestGrade[0], points: (highestGrade[1] as any).points };
      }
    }

    return { letter: 'F', points: 0.0 };
  };

  const loadRows = async () => {
    if (!courseId) return;
    // Get enrolled students
    const enrollments = await enrollmentService.getEnrollmentsByCourse(courseId);
    const studentIds = Array.from(new Set(enrollments.map(e => e.studentId)));

    // Preload users
    const users = await Promise.all(studentIds.map(id => userService.getUserById(id)));
    const studentMap = new Map<string, any>();
    users.forEach(u => { if (u) studentMap.set(u.id, u); });

    // Load assignments and submissions once
    const assignments = await assignmentService.getAssignmentsByCourse(courseId);
    const submissionsByAssignment = await Promise.all(assignments.map(a => submissionService.getSubmissionsByAssignment(a.id)));

    // Build assignment totals per student
    const assignmentTotals = new Map<string, { total: number; max: number }>();
    const assignmentsMaxTotal = assignments.reduce((sum, a: any) => sum + (a.maxScore || 0), 0);
    submissionsByAssignment.flat().forEach(sub => {
      if (sub.status === 'graded' && typeof sub.grade === 'number') {
        const prev = assignmentTotals.get(sub.studentId) || { total: 0, max: 0 };
        assignmentTotals.set(sub.studentId, { total: prev.total + sub.grade, max: prev.max + (assignments.find(a => a.id === sub.assignmentId)?.maxScore || 0) });
      }
    });

    // Load exams for course
    const exams = await examService.getExamsByCourse(courseId);
    // Compute exam totals per student
    const examTotals = new Map<string, { total: number; max: number }>();
    const allAttempts = (await Promise.all(exams.map(ex => examAttemptService.getAttemptsByExam(ex.id)))).flat();

    for (const attempt of allAttempts) {
        if (studentIds.includes(attempt.studentId) && attempt.status === 'graded' && attempt.isGraded) {
            const ex = exams.find(e => e.id === attempt.examId);
            if (ex) {
                const prev = examTotals.get(attempt.studentId) || { total: 0, max: 0 };
                examTotals.set(attempt.studentId, { total: prev.total + (attempt.score || 0), max: prev.max + (ex.totalPoints || 0) });
            }
        }
    }

    // Load other grades by student
    const otherTotals = new Map<string, number>();
    const allOtherGrades = await otherGradeService.getByCourse(courseId);
    for (const og of allOtherGrades) {
      if (studentIds.includes(og.studentId)) {
        const prev = otherTotals.get(og.studentId) || 0;
        otherTotals.set(og.studentId, prev + (og.points || 0));
      }
    }

    // Load final grades docs to determine publication status and letter grade if exists
    const finalDocs = await Promise.all(studentIds.map(sid => gradeService.getGradeByStudentAndCourse(courseId, sid)));
    const finalByStudent = new Map<string, any>();
    finalDocs.forEach(doc => { if (doc) finalByStudent.set(doc.studentId, doc); });

    const newRows: StudentRow[] = studentIds.map(sid => {
      const user = studentMap.get(sid);
      const a = assignmentTotals.get(sid) || { total: 0, max: 0 };
      const e = examTotals.get(sid) || { total: 0, max: 0 };
      const o = otherTotals.get(sid) || 0;

      const points = a.total + e.total + o;
      const max = a.max + e.max;
      const percent = max > 0 ? Math.round(((a.total + e.total + o) / max) * 100) : 0;

      let letter = finalByStudent.get(sid)?.letterGrade || 'F';
      let gradePoints = finalByStudent.get(sid)?.gradePoints ?? 0.0;
      if (!finalByStudent.get(sid)) {
        const comp = computeLetter(points, max);
        letter = comp.letter; gradePoints = comp.points;
      }


      return {
        studentId: sid,
        name: user?.displayName || 'Unknown Student',
        email: user?.email || '',
        assignmentsTotal: Math.round(a.total),
        assignmentsMax: a.max,
        examsTotal: Math.round(e.total),
        examsMax: e.max,
        otherTotal: Math.round(o),
        finalPoints: Math.round(points),
        percent,
        letterGrade: letter,
        gradePoints,
        isPublished: !!finalByStudent.get(sid)?.isPublished,
      };
    });

    setRows(newRows);
  };

  const recalcAll = async () => {
    if (!courseId || rows.length === 0) return;
    setRecalcLoading(true);
    try {
      for (const r of rows) {
        // Recompute letter from percent using ranges
        const comp = computeLetter(r.finalPoints, r.assignmentsMax + r.examsMax);
        const existing = await gradeService.getGradeByStudentAndCourse(courseId, r.studentId);
        const payload: any = {
          finalGrade: r.finalPoints,
          letterGrade: comp.letter,
          gradePoints: comp.points,
          calculatedBy: userProfile?.id || (userProfile as any)?.uid || 'unknown',
          calculationMethod: 'automatic_sum',
          assignmentsTotal: r.assignmentsTotal,
          assignmentsMax: r.assignmentsMax,
          examsTotal: r.examsTotal,
          examsMax: r.examsMax,
          otherTotal: r.otherTotal,
          isPublished: existing?.isPublished ?? false,
          updatedAt: new Date(),
        };
        if (existing) {
          await gradeService.updateGrade(existing.id, payload);
        } else {
          await gradeService.createGrade({ courseId, studentId: r.studentId, ...payload } as any);
        }
      }
      toast.success('Final grades recalculated');
      await loadRows();
    } catch (e) {
      console.error(e);
      toast.error('Failed to recalculate');
    } finally {
      setRecalcLoading(false);
    }
  };

  const publishAll = async () => {
    if (!courseId) return;
    try {
      await gradeService.publishCourseGrades(courseId);
      toast.success('Grades published for this course');
      await loadRows();
    } catch (e) {
      console.error(e);
      toast.error('Failed to publish');
    }
  };

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">Access Denied</div>
          <div className="text-gray-600">Only administrators can access this page.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/admin-grades')} className="p-2 rounded border hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Course Grades</h1>
            <p className="text-gray-600">{course?.title || courseId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setRangesOpen(true)}>Configure Grade Ranges</Button>
          <Button variant="outline" disabled={recalcLoading} onClick={recalcAll}>
            <RefreshCcw className="h-4 w-4 mr-1" /> Recalculate All
          </Button>
          <Button onClick={publishAll}>Publish Final Grades</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-700">Enrolled Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Student</th>
                  <th className="text-center py-2 px-3">Assignments</th>
                  <th className="text-center py-2 px-3">Exams</th>
                  <th className="text-center py-2 px-3">Other</th>
                  <th className="text-center py-2 px-3">Final Points</th>
                  <th className="text-center py-2 px-3">Letter</th>
                  <th className="text-center py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.studentId} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <div className="font-medium text-gray-900">{r.name}</div>
                      <div className="text-xs text-gray-500">{r.email}</div>
                    </td>
                    <td className="py-2 px-3 text-center">{r.assignmentsTotal}/{r.assignmentsMax}</td>
                    <td className="py-2 px-3 text-center">{r.examsTotal}/{r.examsMax}</td>
                    <td className="py-2 px-3 text-center">+{r.otherTotal}</td>
                    <td className="py-2 px-3 text-center">{r.finalPoints}</td>
                    <td className="py-2 px-3 text-center">{r.letterGrade}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${r.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {r.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-gray-500">No enrolled students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={rangesOpen} onOpenChange={setRangesOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Letter Grade Ranges</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(gradeRanges).map(([letter, range]) => (
                <div key={letter} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-12 text-center font-semibold">{letter}</div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Min:</Label>
                    <Input type="number" min={0} max={100} value={(range as any).min} onChange={(e) => setGradeRanges((prev: any) => ({ ...prev, [letter]: { ...(prev[letter] as any), min: parseInt(e.target.value) || 0 } }))} className="w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Max:</Label>
                    <Input type="number" min={0} max={100} value={(range as any).max} onChange={(e) => setGradeRanges((prev: any) => ({ ...prev, [letter]: { ...(prev[letter] as any), max: parseInt(e.target.value) || 0 } }))} className="w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Points:</Label>
                    <Input type="number" step={0.1} min={0} max={4} value={(range as any).points} onChange={(e) => setGradeRanges((prev: any) => ({ ...prev, [letter]: { ...(prev[letter] as any), points: parseFloat(e.target.value) || 0 } }))} className="w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRangesOpen(false)}>Cancel</Button>
            <Button onClick={async () => { try { await settingsService.setGradeRanges(gradeRanges); toast.success('Grade ranges updated'); } catch { toast.error('Failed to save grade ranges'); } finally { setRangesOpen(false); } }}>Save Ranges</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
