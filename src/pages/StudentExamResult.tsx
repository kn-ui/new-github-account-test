/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardHero from '@/components/DashboardHero';
import { useAuth } from '@/contexts/AuthContext';
import { examService, examAttemptService } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StudentExamResult() {
  const { examId } = useParams<{ examId: string }>();
  const { currentUser } = useAuth();
  const [exam, setExam] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!examId || !currentUser?.uid) return;
      setLoading(true);
      try {
        const exs = await examService.getExamsByCourse('placeholder');
        setExam(exs.find((x: any) => x.id === examId));
        const at = await examAttemptService.getAttemptForStudent(examId, currentUser.uid);
        setAttempt(at);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId, currentUser?.uid]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (!attempt) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Result not found</div>;

  const total = Number(attempt.autoScore || 0) + Number(attempt.manualScore || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero title={exam?.title || 'Exam'} subtitle="Your results" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Exam Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Auto Score:</span><span>{attempt.autoScore ?? 0} / {attempt.totalAutoPoints ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Manual Score:</span><span>{attempt.manualScore ?? 0}</span></div>
              <div className="flex justify-between font-medium"><span>Total:</span><span>{total}</span></div>
              {attempt.feedback && <div className="pt-2"><div className="text-gray-600">Feedback:</div><div>{attempt.feedback}</div></div>}
            </div>
            <div className="mt-4"><Link to="/dashboard/student-exams"><Button variant="outline">Back to Exams</Button></Link></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

