/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { assignmentService, courseService, submissionService } from '@/lib/firestore';
import { FileText, BookOpen, Clock, Edit, ArrowLeft } from 'lucide-react';
import DashboardHero from '@/components/DashboardHero';

export default function AssignmentSubmissions() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<any>(null);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string,string>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded'>('all');
  const [grading, setGrading] = useState<{ id: string; grade: number; feedback: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!assignmentId || !currentUser?.uid || userProfile?.role !== 'teacher') return;
        const a = await assignmentService.getAssignmentsByIds([assignmentId]);
        const asg = a[assignmentId] as any;
        if (!asg) { toast.error('Assignment not found'); return; }
        setAssignment(asg);
        const course = await courseService.getCourseById(asg.courseId);
        setCourseTitle(course?.title || 'Course');
        const subs = await submissionService.getSubmissionsByAssignment(assignmentId);
        const ids = Array.from(new Set(subs.map((s: any) => s.studentId)));
        const usersMap = await (await import('@/lib/firestore')).userService.getUsersByIds(ids);
        const names: Record<string,string> = {};
        Object.entries(usersMap).forEach(([id, u]: any) => { if (u?.displayName) names[id] = u.displayName; });
        setStudentMap(names);
        setSubmissions(subs);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [assignmentId, currentUser?.uid, userProfile?.role]);

  const filtered = useMemo(() => {
    return submissions
      .filter((s: any) => [assignment?.title || '', courseTitle, studentMap[s.studentId] || s.studentId].some(v => v.toLowerCase().includes(search.toLowerCase())))
      .filter((s: any) => statusFilter === 'all' || s.status === statusFilter)
      .sort((a: any, b: any) => b.submittedAt.toDate().getTime() - a.submittedAt.toDate().getTime());
  }, [submissions, search, statusFilter, assignment?.title, courseTitle, studentMap]);

  if (!userProfile || userProfile.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">Access denied</div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero title="Assignment Submissions" subtitle="Grade and manage submissions for this assignment" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-semibold text-gray-900">{assignment?.title}</div>
            <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{courseTitle}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Due: {assignment?.dueDate?.toDate ? assignment.dueDate.toDate().toLocaleString() : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard/assignments"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Input className="pl-3" placeholder="Search by student or course" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="graded">Graded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {filtered.map((s: any) => (
            <div key={s.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{assignment?.title}</h3>
                    <Badge variant={s.status === 'submitted' ? 'secondary' : 'default'} className="capitalize">{s.status}</Badge>
                  </div>
                  <div className="text-sm text-gray-600">Student: {studentMap[s.studentId] || s.studentId}</div>
                  <div className="text-xs text-gray-500">Submitted: {s.submittedAt?.toDate ? s.submittedAt.toDate().toLocaleString() : ''}</div>
                  {grading?.id === s.id ? (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <Label>Grade (0 - {assignment?.maxScore ?? 100})</Label>
                        <Input type="number" value={grading.grade} onChange={(e) => setGrading({ ...grading, grade: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label>Feedback</Label>
                        <Textarea rows={3} value={grading.feedback} onChange={(e) => setGrading({ ...grading, feedback: e.target.value })} />
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <Button variant="outline" onClick={() => setGrading(null)}>Cancel</Button>
                        <Button onClick={async () => {
                          try {
                            await submissionService.updateSubmission(s.id, { grade: grading.grade, feedback: grading.feedback, status: 'graded' });
                            toast.success('Grade saved');
                            const fresh = await submissionService.getSubmissionsByAssignment(assignmentId!);
                            setSubmissions(fresh);
                            setGrading(null);
                          } catch { toast.error('Failed to save grade'); }
                        }}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-gray-600">Grade: {typeof s.grade === 'number' ? s.grade : '-'}{assignment?.maxScore ? `/${assignment.maxScore}` : ''}</div>
                      <div>
                        <Button size="sm" variant={s.status === 'graded' ? 'outline' : 'default'} onClick={() => setGrading({ id: s.id, grade: s.grade || 0, feedback: s.feedback || '' })}>
                          <Edit className="h-4 w-4 mr-1" />{s.status === 'graded' ? 'Update Grade' : 'Grade'}
                        </Button>
                        <Link to={`/dashboard/submissions/${s.id}`} className="ml-2">
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">No submissions</div>
          )}
        </div>
      </div>
    </div>
  );
}

