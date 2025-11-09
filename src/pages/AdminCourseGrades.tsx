import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { assignmentService, courseService, enrollmentService, examAttemptService, examService, gradeService, otherGradeService, submissionService, userService, settingsService } from '@/lib/firestore';
import { calculateLetterGrade } from '@/lib/gradeUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingButton from '@/components/ui/loading-button';
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


const defaultGradeRanges = {
          'A+': { min: 95, max: 100, points: 4.0 },
          'A': { min: 85, max: 94.9, points: 4.0 },
          'A-': { min: 80, max: 84.9, points: 3.75 },
          'B+': { min: 75, max: 79.9, points: 3.5 },
          'B': { min: 70, max: 74.9, points: 3.0 },
          'B-': { min: 60, max: 69.9, points: 2.75 },
          'C+': { min: 55, max: 59.9, points: 2 },
          'C': { min: 50, max: 54.9, points: 1.5 },
          'D': { min: 40, max: 49.9, points: 1.0 },
          'F': { min: 0, max: 39.9, points: 0.0 },
};

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
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    if (userProfile && (userProfile.role === 'admin' || userProfile.role === 'super_admin')) {
      loadAll();
    }
  }, [courseId, userProfile?.role]);

  const loadAll = async () => {
    try {
      setLoading(true);
      // Load course and grade ranges in parallel
      const [c, ranges] = await Promise.all([
        courseService.getCourseById(courseId!),
        settingsService.getGradeRanges().catch(() => (defaultGradeRanges)),
      ]);
      setCourse(c);
      setGradeRanges(ranges);
      // Load rows after setting course and ranges
      await loadRows(ranges);
    } catch (e) {
      console.error('Error loading course data:', e);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const loadRows = async () => {
    if (!courseId) return;
    
    try {
      // Get enrolled students
      const enrollments = await enrollmentService.getEnrollmentsByCourse(courseId);
      const studentIds = Array.from(new Set(enrollments.map(e => e.studentId)));

      if (studentIds.length === 0) {
        setRows([]);
        return;
      }

      // Load all data in parallel for better performance
      const [users, assignments, exams, allOtherGrades, finalDocs] = await Promise.all([
        Promise.all(studentIds.map(id => userService.getUserById(id))),
        assignmentService.getAssignmentsByCourse(courseId),
        examService.getExamsByCourse(courseId),
        otherGradeService.getByCourse(courseId),
        Promise.all(studentIds.map(sid => gradeService.getGradeByStudentAndCourse(courseId, sid)))
      ]);

      // Create user map
      const studentMap = new Map<string, any>();
      users.forEach(u => { if (u) studentMap.set(u.id, u); });

      // Load submissions and exam attempts in parallel
      const [submissionsByAssignment, allAttempts] = await Promise.all([
        Promise.all(assignments.map(a => submissionService.getSubmissionsByAssignment(a.id))),
        Promise.all(exams.map(ex => examAttemptService.getAttemptsByExam(ex.id)))
      ]);

      // Build assignment totals per student
      const assignmentTotals = new Map<string, { total: number; max: number }>();
      submissionsByAssignment.flat().forEach(sub => {
        if (sub.status === 'graded' && typeof sub.grade === 'number') {
          const prev = assignmentTotals.get(sub.studentId) || { total: 0, max: 0 };
          const assignment = assignments.find(a => a.id === sub.assignmentId);
          assignmentTotals.set(sub.studentId, { 
            total: prev.total + sub.grade, 
            max: prev.max + (assignment?.maxScore || 0) 
          });
        }
      });

      // Compute exam totals per student
      const examTotals = new Map<string, { total: number; max: number }>();
      allAttempts.flat().forEach(attempt => {
        if (studentIds.includes(attempt.studentId) && attempt.status === 'graded' && attempt.isGraded) {
          const ex = exams.find(e => e.id === attempt.examId);
          if (ex) {
            const prev = examTotals.get(attempt.studentId) || { total: 0, max: 0 };
            examTotals.set(attempt.studentId, { 
              total: prev.total + (attempt.score || 0), 
              max: prev.max + (ex.totalPoints || 0) 
            });
          }
        }
      });

      // Load other grades by student
      const otherTotals = new Map<string, number>();
      allOtherGrades.forEach(og => {
        if (studentIds.includes(og.studentId)) {
          const prev = otherTotals.get(og.studentId) || 0;
          otherTotals.set(og.studentId, prev + (og.points || 0));
        }
      });

      // Create final grades map
      const finalByStudent = new Map<string, any>();
      finalDocs.forEach(doc => { if (doc) finalByStudent.set(doc.studentId, doc); });

      const newRows: StudentRow[] = studentIds.map(sid => {
        const user = studentMap.get(sid);
        const a = assignmentTotals.get(sid) || { total: 0, max: 0 };
        const e = examTotals.get(sid) || { total: 0, max: 0 };
        const o = otherTotals.get(sid) || 0;

        const points = a.total + e.total + o;
        const max = a.max + e.max;
        // Percent should be calculated without 'other' points since they're bonus
        const percent = max > 0 ? Math.round(((a.total + e.total) / max) * 100) : 0;

        const letter = finalByStudent.get(sid)?.letterGrade || '';
        const gradePoints = finalByStudent.get(sid)?.gradePoints ?? 0.0;

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
    } catch (error) {
      // Avoid spamming console; show empty state only
      setRows([]);
    }
  };

  const recalcAll = async () => {
    if (!courseId || rows.length === 0) return;
    setRecalcLoading(true);
    try {
      for (const r of rows) {
        // Recompute letter from percent using ranges
        // Use default max of 100 if no assignments/exams to avoid division by zero
        const points = Math.min(r.finalPoints, 100);
        const comp = calculateLetterGrade(points, 100, gradeRanges);
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
      toast.error('Failed to recalculate');
    } finally {
      setRecalcLoading(false);
    }
  };

  const assignLetters = async () => {
    if (!courseId || rows.length === 0) return;
    setAssignLoading(true);
    try {
      for (const r of rows) {
        const points = Math.min(r.finalPoints, 100);
        const comp = calculateLetterGrade(points, 100, gradeRanges);
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
      toast.success('Letters assigned based on configured ranges');
      await loadRows();
    } catch (e) {
      toast.error('Failed to assign letters');
    } finally {
      setAssignLoading(false);
    }
  };

  const publishAll = async () => {
    if (!courseId) return;
    try {
      // Ensure letters are assigned based on current ranges before publishing
      for (const r of rows) {
        const points = Math.min(r.finalPoints, 100);
        const comp = calculateLetterGrade(points, 100, gradeRanges);
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
          updatedAt: new Date(),
          isPublished: existing?.isPublished ?? false,
        };
        if (existing) {
          await gradeService.updateGrade(existing.id, payload);
        } else {
          await gradeService.createGrade({ courseId, studentId: r.studentId, ...payload } as any);
        }
      }
      await gradeService.publishCourseGrades(courseId);
      toast.success('Letters assigned and grades published');
      await loadRows();
    } catch (e) {
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
          <LoadingButton variant="outline" loading={recalcLoading} onClick={recalcAll} loadingText="Recalculating…">
            <RefreshCcw className="h-4 w-4 mr-1" /> Recalculate All
          </LoadingButton>
          <LoadingButton variant="outline" loading={assignLoading} onClick={assignLetters} loadingText="Assigning…">
            Assign Letters
          </LoadingButton>
          <LoadingButton onClick={publishAll} loading={false} loadingText="Publishing…">Publish Final Grades</LoadingButton>
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
              <tbody>{loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="text-gray-500">Loading student grades...</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">No enrolled students found.</td>
                </tr>
              ) : (
                rows.map(r => (
                  <tr key={r.studentId} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <div className="font-medium text-gray-900">{r.name}</div>
                      <div className="text-xs text-gray-500">{r.email}</div>
                    </td>
                    <td className="py-2 px-3 text-center">{r.assignmentsTotal}/{r.assignmentsMax}</td>
                    <td className="py-2 px-3 text-center">{r.examsTotal}/{r.examsMax}</td>
                    <td className="py-2 px-3 text-center">+{r.otherTotal}</td>
                    <td className="py-2 px-3 text-center">{r.finalPoints}</td>
                    <td className="py-2 px-3 text-center font-semibold">{r.letterGrade}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${r.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {r.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))
              )}</tbody>
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
            <Button variant="outline" onClick={() => setGradeRanges(defaultGradeRanges)}>Reset to Default</Button>
            <Button variant="outline" onClick={() => setRangesOpen(false)}>Cancel</Button>
            <Button onClick={async () => { try { await settingsService.setGradeRanges(gradeRanges); toast.success('Grade ranges updated'); } catch { toast.error('Failed to save grade ranges'); } finally { setRangesOpen(false); } }}>Save Ranges</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
