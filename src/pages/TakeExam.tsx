/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { examService, examAttemptService } from '@/lib/firestore';
import DashboardHero from '@/components/DashboardHero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function TakeExam() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    const load = async () => {
      if (!examId || !currentUser?.uid) return;
      try {
        setLoading(true);
        const found = await examService.getExamById(examId);
        if (found) setExam(found);
        let attempt = await examAttemptService.getAttemptForStudent(examId, currentUser.uid);
        if (!attempt) {
          const id = await examAttemptService.createAttempt(examId, currentUser.uid);
          attempt = await examAttemptService.getAttemptById(id);
        }
        setAttemptId(attempt!.id);
        const initial: Record<string, any> = {};
        (found as any)?.questions?.forEach((q: any) => {
          const saved = attempt?.answers?.find((a: any) => a.questionId === q.id)?.response;
          initial[q.id] = saved ?? (q.type === 'mcq' ? 0 : (q.type === 'truefalse' ? true : ''));
        });
        setAnswers(initial);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load exam');
      } finally {
        setLoading(false);
      }
    };
    if (userProfile?.role === 'student') load();
  }, [examId, currentUser?.uid, userProfile?.role]);

  const questions = useMemo(() => (exam as any)?.questions || [], [exam]);

  const saveProgress = async () => {
    if (!attemptId) return;
    const payload = Object.entries(answers).map(([questionId, response]) => ({ questionId, response }));
    await examAttemptService.saveProgress(attemptId, payload);
    toast.success('Progress saved');
  };

  const submit = async () => {
    if (!attemptId) return;
    // auto-grade mcq and true/false
    let autoScore = 0;
    let totalAutoPoints = 0;
    questions.forEach((q: any) => {
      if (q.type === 'mcq') {
        totalAutoPoints += q.points ?? 1;
        if (Number(answers[q.id]) === Number(q.correct)) autoScore += q.points ?? 1;
      } else if (q.type === 'truefalse') {
        totalAutoPoints += q.points ?? 1;
        if (Boolean(answers[q.id]) === Boolean(q.correct)) autoScore += q.points ?? 1;
      }
    });
    await examAttemptService.submitAttempt(attemptId, { autoScore, totalAutoPoints });
    toast.success('Exam submitted');
    navigate('/dashboard/student-exams');
  };

  if (!userProfile || userProfile.role !== 'student') return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Access denied</div>;
  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (!exam) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Exam not found</div>;

  const now = new Date();
  const start = (exam as any).startTime?.toDate ? (exam as any).startTime.toDate() : null;
  const end = start && (exam as any).durationMinutes ? new Date(start.getTime() + (exam as any).durationMinutes * 60000) : null;
  const beforeStart = start ? now < start : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero title={exam.title} subtitle="Answer all questions and submit" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-4">
        {beforeStart && (
          <Card>
            <CardContent className="p-6 text-sm text-gray-700">
              <div><strong>Start Time:</strong> {start?.toLocaleString() || '-'}</div>
              <div><strong>Duration:</strong> {(exam as any).durationMinutes || 0} minutes</div>
              <div className="mt-2">Questions will appear when the exam starts.</div>
            </CardContent>
          </Card>
        )}
        {!beforeStart && questions.map((q: any, idx: number) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-sm">Q{idx+1}. {q.prompt}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {q.type === 'mcq' && (
                <div className="space-y-2">
                  {(q.options || []).map((opt: string, oi: number) => (
                    <label key={oi} className="flex items-center gap-2 text-sm">
                      <input type="radio" name={`q_${q.id}`} checked={Number(answers[q.id]) === oi} onChange={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'truefalse' && (
                <div className="space-x-4">
                  <label className="text-sm"><input type="radio" name={`q_${q.id}`} checked={Boolean(answers[q.id]) === true} onChange={() => setAnswers(prev => ({ ...prev, [q.id]: true }))} /> True</label>
                  <label className="text-sm"><input type="radio" name={`q_${q.id}`} checked={Boolean(answers[q.id]) === false} onChange={() => setAnswers(prev => ({ ...prev, [q.id]: false }))} /> False</label>
                </div>
              )}
              {q.type === 'short' && (
                <div>
                  <Label>Answer</Label>
                  <Textarea rows={4} value={answers[q.id] || ''} onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {!beforeStart && (
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={saveProgress}>Save progress</Button>
            <div className="space-x-2">
              <Link to="/dashboard/student-exams"><Button variant="outline">Cancel</Button></Link>
              <Button onClick={submit} disabled={end ? now > end : false}>Submit exam</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

