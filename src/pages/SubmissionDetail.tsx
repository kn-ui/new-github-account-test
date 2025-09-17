/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardHero from '@/components/DashboardHero';
import { submissionService, assignmentService, courseService, userService, FirestoreSubmission, FirestoreAssignment, FirestoreCourse } from '@/lib/firestore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function SubmissionDetail() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<FirestoreSubmission | null>(null);
  const [assignment, setAssignment] = useState<FirestoreAssignment | null>(null);
  const [course, setCourse] = useState<FirestoreCourse | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [gradeDialog, setGradeDialog] = useState(false);
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      if (!submissionId) return;
      try {
        setLoading(true);
        const sub = await submissionService.getSubmission(submissionId);
        if (!sub) throw new Error('Submission not found');
        setSubmission(sub);
        const [asg, crs, user] = await Promise.all([
          assignmentService.getAssignmentsByIds([sub.assignmentId]).then((m) => m[sub.assignmentId] as any),
          courseService.getCourseById(sub.courseId),
          userService.getUserById(sub.studentId).catch(() => null),
        ]);
        if (asg) setAssignment(asg);
        if (crs) setCourse(crs);
        if ((user as any)?.displayName) setStudentName((user as any).displayName);
        setGrade(sub.grade ?? 0);
        setFeedback(sub.feedback ?? '');
      } catch (e) {
        console.error(e);
        toast.error('Failed to load submission');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [submissionId]);

  const title = useMemo(() => `Submission${assignment ? `: ${assignment.title}` : ''}`, [assignment]);

  const onSaveGrade = async () => {
    if (!submission) return;
    try {
      await submissionService.updateSubmission(submission.id, { grade, feedback, status: 'graded' });
      toast.success('Grade updated');
      setGradeDialog(false);
      setSubmission({ ...submission, grade, feedback, status: 'graded' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to save grade');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>;
  if (!submission) return <div className="min-h-screen flex items-center justify-center text-gray-600">Submission not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero title={title} subtitle={course?.title || ''} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Submission Details</CardTitle>
            <CardDescription>Review the submission and update grade if needed.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Course:</span><span>{course?.title}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Assignment:</span><span>{assignment?.title}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Student:</span><span>{studentName || submission.studentId}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="capitalize">{submission.status}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Submitted:</span><span>{submission.submittedAt.toDate().toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Max Score:</span><span>{(assignment as any)?.maxScore ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Grade:</span><span>{submission.grade ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Feedback:</span><span>{submission.feedback ?? '—'}</span></div>
              </div>
              <div>
                <div className="font-medium mb-2">Content</div>
                <div className="p-4 border rounded bg-white text-sm prose prose-sm max-w-none whitespace-pre-wrap">{(submission as any).content || '—'}</div>
                {(submission as any).attachments?.length > 0 && (
                  <div className="mt-4">
                    <div className="font-medium mb-2">Attachments</div>
                    <ul className="list-disc list-inside space-y-1">
                      {(submission as any).attachments.map((url: string, idx: number) => (
                        <li key={idx}><a className="text-blue-600 hover:underline" href={url} target="_blank" rel="noopener noreferrer">Attachment {idx + 1}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end">
              <Button onClick={() => setGradeDialog(true)}>Edit Grade</Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <Link to="/dashboard/submissions">
            <Button variant="outline">Back to Submissions</Button>
          </Link>
        </div>
      </div>

      <Dialog open={gradeDialog} onOpenChange={setGradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Input id="grade" type="number" value={grade} onChange={(e) => setGrade(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label htmlFor="feedback">Feedback</Label>
              <Input id="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialog(false)}>Cancel</Button>
            <Button onClick={onSaveGrade}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

