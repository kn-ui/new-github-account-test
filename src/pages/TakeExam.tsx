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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function TakeExam() {
  console.log('TakeExam component rendered');
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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
        setAttempt(attempt);
        const initial: Record<string, any> = {};
        (found as any)?.questions?.forEach((q: any) => {
          const saved = attempt?.answers?.find((a: any) => a.questionId === q.id)?.response;
          initial[q.id] = saved ?? (q.type === 'mcq' ? 0 : (q.type === 'truefalse' ? true : ''));
        });
        setAnswers(initial);
      } catch (e) {
        console.error('Error in load function:', e);
        toast.error('Failed to load exam');
      } finally {
        setLoading(false);
      }
    };
    if (userProfile?.role === 'student') load();
  }, [examId, currentUser?.uid, userProfile?.role]);

  const questions = useMemo(() => (exam as any)?.questions || [], [exam]);

  // Timer and auto-save logic
  useEffect(() => {
    if (!exam || !attemptId) return;

    const startTime = (exam as any).date?.toDate ? (exam as any).date.toDate() : null;
    const durationMinutes = (exam as any).durationMinutes || 0;
    
    if (startTime && durationMinutes) {
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      
      const updateTimer = () => {
        const now = new Date();
        const remaining = Math.max(0, endTime.getTime() - now.getTime());
        setTimeRemaining(remaining);
        
        // Auto-submit when time runs out
        if (remaining === 0) {
          handleSubmit();
        }
      };

      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [exam, attemptId]);

  // Auto-save every 60 seconds
  useEffect(() => {
    if (!attemptId || !exam) return;

    const autoSaveInterval = setInterval(() => {
      saveProgress();
    }, 60000);

    return () => clearInterval(autoSaveInterval);
  }, [attemptId, exam, answers]);

  const saveProgress = async () => {
    if (!attemptId) return;
    const payload = Object.entries(answers).map(([questionId, response]) => ({ questionId, response }));
    await examAttemptService.saveProgress(attemptId, payload);
    toast.success('Progress saved');
  };

  const handleSubmitClick = () => {
    setShowSubmitModal(true);
  };

  const handleSubmit = async () => {
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    if (!attemptId) return;
    setShowSubmitModal(false);
    
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
    
    // Convert answers to the format expected by the backend
    const answersArray = Object.entries(answers).map(([questionId, response]) => ({ questionId, response }));
    
    await examAttemptService.submitAttempt(attemptId, { 
      answers: answersArray, 
      autoScore, 
      totalAutoPoints 
    });
    toast.success('Exam submitted');
    navigate('/dashboard/student-exams');
  };

  // Get unanswered questions
  const getUnansweredQuestions = () => {
    return questions.filter((q: any) => {
      const answer = answers[q.id];
      return answer === undefined || answer === null || answer === '' || 
             (q.type === 'mcq' && answer === 0 && !q.options?.[0]) ||
             (q.type === 'truefalse' && answer === null);
    });
  };

  const unansweredQuestions = getUnansweredQuestions();
  const hasUnanswered = unansweredQuestions.length > 0;

  if (!userProfile || userProfile.role !== 'student') return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Access denied</div>;
  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (!exam) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Exam not found</div>;

  const now = new Date();
  const start = (exam as any).date?.toDate ? (exam as any).date.toDate() : null;
  const end = start && (exam as any).durationMinutes ? new Date(start.getTime() + (exam as any).durationMinutes * 60000) : null;
  console.log('now:', now);
  console.log('start:', start);
  console.log('end:', end);
  const beforeStart = start ? now < start : false;
  const afterEnd = end ? now > end : false;
  const isSubmitted = attempt && (attempt.status === 'submitted' || attempt.status === 'graded');

  // Format time remaining
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if question is answered
  const isQuestionAnswered = (questionId: string) => {
    const answer = answers[questionId];
    return answer !== undefined && answer !== null && answer !== '' && 
           !(answer === 0 && questions.find(q => q.id === questionId)?.type === 'mcq' && !questions.find(q => q.id === questionId)?.options?.[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero title={exam.title} subtitle="Answer all questions and submit" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          {!beforeStart && (
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {timeRemaining !== null && (
                      <span className={`text-sm font-mono ${timeRemaining < 300000 ? 'text-red-600' : 'text-gray-600'}`}>
                        {formatTime(timeRemaining)}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-600 mb-3">Questions ({questions.length})</div>
                  {questions.map((q: any, idx: number) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 ${
                        currentQuestionIndex === idx 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {isQuestionAnswered(q.id) ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span>Q{idx + 1}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <div className={`${!beforeStart ? 'lg:col-span-3' : 'max-w-3xl mx-auto'} space-y-4`}>
        {beforeStart && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <Clock className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Exam Not Started Yet</h3>
                <p className="text-gray-600 mb-4">The exam will begin at the scheduled time.</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                <div><strong>Start Time:</strong> {start?.toLocaleString() || '-'}</div>
                <div><strong>Duration:</strong> {(exam as any).durationMinutes || 0} minutes</div>
                <div className="mt-2 text-blue-800">
                  Questions will appear when the exam starts.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {afterEnd && !isSubmitted && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Exam Time Expired</h3>
                <p className="text-gray-600">The exam time has ended and no submission was made.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isSubmitted && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Exam Submitted</h3>
                <p className="text-gray-600 mb-4">Your exam has been successfully submitted.</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-gray-700">
                  <div><strong>Submitted At:</strong> {attempt?.submittedAt?.toDate?.()?.toLocaleString() || 'Unknown'}</div>
                  <div><strong>Score:</strong> {attempt?.score || 0} points</div>
                </div>
              </div>
              <Button onClick={() => navigate('/dashboard/student-exams')} className="mt-4">
                Back to Exams
              </Button>
            </CardContent>
          </Card>
        )}
        {!beforeStart && !afterEnd && !isSubmitted && questions.length > 0 && (
          <>
            {/* Current Question */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </CardTitle>
                <div className="text-sm text-gray-600">{questions[currentQuestionIndex]?.prompt}</div>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions[currentQuestionIndex]?.type === 'mcq' && (
                  <div className="space-y-3">
                    {(questions[currentQuestionIndex].options || []).map((opt: string, oi: number) => (
                      <label key={oi} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input 
                          type="radio" 
                          name={`q_${questions[currentQuestionIndex].id}`} 
                          checked={Number(answers[questions[currentQuestionIndex].id]) === oi} 
                          onChange={() => setAnswers(prev => ({ ...prev, [questions[currentQuestionIndex].id]: oi }))} 
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {questions[currentQuestionIndex]?.type === 'truefalse' && (
                  <div className="space-x-6">
                    <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input 
                        type="radio" 
                        name={`q_${questions[currentQuestionIndex].id}`} 
                        checked={Boolean(answers[questions[currentQuestionIndex].id]) === true} 
                        onChange={() => setAnswers(prev => ({ ...prev, [questions[currentQuestionIndex].id]: true }))} 
                        className="h-4 w-4"
                      />
                      <span className="text-sm">True</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input 
                        type="radio" 
                        name={`q_${questions[currentQuestionIndex].id}`} 
                        checked={Boolean(answers[questions[currentQuestionIndex].id]) === false} 
                        onChange={() => setAnswers(prev => ({ ...prev, [questions[currentQuestionIndex].id]: false }))} 
                        className="h-4 w-4"
                      />
                      <span className="text-sm">False</span>
                    </label>
                  </div>
                )}
                {questions[currentQuestionIndex]?.type === 'short' && (
                  <div>
                    <Label>Your Answer</Label>
                    <Textarea 
                      rows={6} 
                      value={answers[questions[currentQuestionIndex].id] || ''} 
                      onChange={(e) => setAnswers(prev => ({ ...prev, [questions[currentQuestionIndex].id]: e.target.value }))}
                      placeholder="Type your answer here..."
                      className="mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <div className="text-sm text-gray-600">
                {currentQuestionIndex + 1} of {questions.length}
              </div>
              <Button 
                variant="outline" 
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
              </Button>
            </div>
          </>
        )}
        {!beforeStart && !afterEnd && !isSubmitted && (
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={saveProgress}>Save progress</Button>
            <div className="space-x-2">
              <Link to="/dashboard/student-exams"><Button variant="outline">Cancel</Button></Link>
              <Button onClick={handleSubmitClick} disabled={end ? now > end : false}>
                Submit exam
              </Button>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Pre-submission Review Modal */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Review Before Submission
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Time Remaining */}
            {timeRemaining !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Time Remaining: {formatTime(timeRemaining)}</span>
                </div>
              </div>
            )}

            {/* Unanswered Questions Warning */}
            {hasUnanswered && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-orange-800 mb-2">
                      You have {unansweredQuestions.length} unanswered question{unansweredQuestions.length > 1 ? 's' : ''}:
                    </div>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {unansweredQuestions.map((q: any, idx: number) => (
                        <li key={q.id} className="flex items-center gap-2">
                          <span className="font-medium">Q{questions.findIndex(qu => qu.id === q.id) + 1}:</span>
                          <span className="truncate">{q.prompt.substring(0, 50)}...</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* All Questions Answered */}
            {!hasUnanswered && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">All questions answered! Ready to submit.</span>
                </div>
              </div>
            )}

            {/* Exam Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-700">
                <div><strong>Total Questions:</strong> {questions.length}</div>
                <div><strong>Answered:</strong> {questions.length - unansweredQuestions.length}</div>
                <div><strong>Unanswered:</strong> {unansweredQuestions.length}</div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
              Go Back to Exam
            </Button>
            <Button 
              onClick={handleSubmit}
              className={hasUnanswered ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {hasUnanswered ? 'Submit Anyway' : 'Submit Exam'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

