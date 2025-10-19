/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { examService, examAttemptService, userService } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingButton from '@/components/ui/loading-button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { ArrowLeft, Users, Clock, CheckCircle, XCircle, Edit, FileText, Award, ChevronDown } from 'lucide-react';

interface ExamAttemptWithStudent extends any {
  studentName?: string;
  studentEmail?: string;
}

export default function ExamResults() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [attempts, setAttempts] = useState<ExamAttemptWithStudent[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttemptWithStudent | null>(null);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [gradingData, setGradingData] = useState<{
    questionId: string;
    question: any;
    answer: string;
    currentScore: number;
    maxScore: number;
  } | null>(null);
  const [manualScore, setManualScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [savingGrading, setSavingGrading] = useState(false);

  useEffect(() => {
    if (examId && userProfile?.role === 'teacher') {
      loadExamResults();
    } else if (userProfile && userProfile.role !== 'teacher') {
      navigate('/dashboard');
    }
  }, [examId, userProfile?.role, navigate]);

  const loadExamResults = async () => {
    try {
      setLoading(true);
      
      // Load exam details
      const examData = await examService.getExamById(examId!);
      if (!examData) {
        toast.error('Exam not found');
        navigate('/dashboard/my-courses');
        return;
      }
      setExam(examData);

      // Load all attempts for this exam
      const allAttempts = await examAttemptService.getAttemptsByExam(examId!);
      
      // Get student details for each attempt
      const attemptsWithStudents = await Promise.all(
        allAttempts.map(async (attempt: any) => {
          try {
            const student = await userService.getUserById(attempt.studentId);
            return {
              ...attempt,
              studentName: student?.displayName || 'Unknown Student',
              studentEmail: student?.email || 'Unknown Email'
            };
          } catch (error) {
            console.error('Error loading student:', error);
            return {
              ...attempt,
              studentName: 'Unknown Student',
              studentEmail: 'Unknown Email'
            };
          }
        })
      );

      setAttempts(attemptsWithStudents);
    } catch (error) {
      console.error('Error loading exam results:', error);
      toast.error('Failed to load exam results');
    } finally {
      setLoading(false);
    }
  };

  const getQuestionById = (questionId: string) => {
    return exam?.questions?.find((q: any) => q.id === questionId);
  };

  const getAnswerForQuestion = (attempt: any, questionId: string) => {
    const answer = attempt.answers?.find((a: any) => a.questionId === questionId);
    return answer?.response || '';
  };

  const getQuestionScore = (attempt: any, questionId: string) => {
    const question = getQuestionById(questionId);
    if (!question) return 0;

    if (question.type === 'mcq' || question.type === 'truefalse') {
      const answer = getAnswerForQuestion(attempt, questionId);
      const isCorrect = question.type === 'mcq' 
        ? Number(answer) === Number(question.correct)
        : Boolean(answer) === Boolean(question.correct);
      return isCorrect ? question.points : 0;
    }
    
    // For short answer, return manual score if available
    return attempt.manualScores?.[questionId] || 0;
  };

  const getTotalScore = (attempt: any) => {
    if (attempt.score !== undefined) return attempt.score;
    
    let total = 0;
    exam?.questions?.forEach((question: any) => {
      total += getQuestionScore(attempt, question.id);
    });
    return total;
  };

  const getMaxScore = () => {
    return exam?.totalPoints || 0;
  };

  const getShortAnswerQuestions = () => {
    return exam?.questions?.filter((q: any) => q.type === 'short') || [];
  };

  const openGradingDialog = (attempt: any, question: any) => {
    const answer = getAnswerForQuestion(attempt, question.id);
    const currentScore = attempt.manualScores?.[question.id] || 0;
    
    setSelectedAttempt(attempt);
    setGradingData({
      questionId: question.id,
      question,
      answer,
      currentScore,
      maxScore: question.points || 1
    });
    setManualScore(currentScore);
    setFeedback(attempt.manualFeedback?.[question.id] || '');
    setGradingDialogOpen(true);
  };

  const saveGrading = async () => {
    if (!selectedAttempt || !gradingData) return;

    try {
      setSavingGrading(true);
      const newManualScores = {
        ...selectedAttempt.manualScores,
        [gradingData.questionId]: manualScore
      };
      
      const newManualFeedback = {
        ...selectedAttempt.manualFeedback,
        [gradingData.questionId]: feedback
      };

      // Calculate new total score
      const autoScore = selectedAttempt.autoScore || 0;
      const totalManualScore = Object.values(newManualScores).reduce((sum: number, score: any) => sum + (score || 0), 0);
      const newTotalScore = autoScore + totalManualScore;

      // Check if all short answer questions are now graded
      const shortAnswerQuestions = getShortAnswerQuestions();
      const allShortAnswersGraded = shortAnswerQuestions.every(question => {
        const score = newManualScores[question.id];
        return score !== undefined && score !== null;
      });

      // Update status to 'graded' if all short answer questions are graded
      const newStatus = allShortAnswersGraded ? 'graded' : selectedAttempt.status;

      await examAttemptService.updateAttempt(selectedAttempt.id, {
        manualScores: newManualScores,
        manualFeedback: newManualFeedback,
        score: newTotalScore,
        isGraded: allShortAnswersGraded,
        status: newStatus
      });

      toast.success('Grading saved successfully');
      setGradingDialogOpen(false);
      await loadExamResults(); // Reload to show updated scores
    } catch (error) {
      console.error('Error saving grading:', error);
      toast.error('Failed to save grading');
    } finally { setSavingGrading(false); }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'graded': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading exam results...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Exam not found or you do not have permission to view it.</p>
      </div>
    );
  }

  const shortAnswerQuestions = getShortAnswerQuestions();
  const maxScore = getMaxScore();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard/my-courses/${exam.courseId}?tab=exams`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Exams
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{exam.title} - Results</h1>
              <p className="text-gray-600 mt-1">{exam.description}</p>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{attempts.length}</div>
                    <div className="text-sm text-gray-600">Total Attempts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {attempts.filter(a => a.status === 'graded').length}
                    </div>
                    <div className="text-sm text-gray-600">Graded</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {attempts.filter(a => a.status === 'submitted').length}
                    </div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">{maxScore}</div>
                    <div className="text-sm text-gray-600">Max Points</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Attempts List */}
        <div className="space-y-4">
          {attempts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900">No exam attempts yet</p>
                <p className="text-sm text-gray-500">Students haven't submitted this exam yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {attempts.map((attempt) => (
                <AccordionItem key={attempt.id} value={attempt.id} className="border rounded-lg">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium text-lg text-left">{attempt.studentName}</div>
                          <div className="text-sm text-gray-600 text-left">{attempt.studentEmail}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(attempt.status)}>
                          {attempt.status}
                        </Badge>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {getTotalScore(attempt)}/{maxScore}
                          </div>
                          <div className="text-sm text-gray-600">Score</div>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Started</div>
                          <div className="font-medium">{formatTime(attempt.startedAt)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Submitted</div>
                          <div className="font-medium">{formatTime(attempt.submittedAt)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Auto Score</div>
                          <div className="font-medium">{attempt.autoScore || 0}</div>
                        </div>
                      </div>

                      {/* Short Answer Questions */}
                      {shortAnswerQuestions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Manual Grading Required</h4>
                          <div className="space-y-3">
                            {shortAnswerQuestions.map((question) => {
                              const answer = getAnswerForQuestion(attempt, question.id);
                              const currentScore = attempt.manualScores?.[question.id] || 0;
                              const isGraded = currentScore > 0 || attempt.manualFeedback?.[question.id];

                              return (
                                <div key={question.id} className="border rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm text-gray-900">
                                        {question.prompt}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        Max Points: {question.points}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm font-medium ${
                                        isGraded ? 'text-green-600' : 'text-orange-600'
                                      }`}>
                                        {currentScore}/{question.points}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openGradingDialog(attempt, question)}
                                      >
                                        <Edit className="h-4 w-4 mr-1" />
                                        {isGraded ? 'Edit' : 'Grade'}
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="bg-gray-50 rounded p-3">
                                    <div className="text-sm text-gray-700">
                                      <strong>Student Answer:</strong>
                                    </div>
                                    <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                      {answer !== undefined && answer !== null ? answer : 'No answer provided'}
                                    </div>
                                  </div>
                                  {attempt.manualFeedback?.[question.id] && (
                                    <div className="mt-2 bg-blue-50 rounded p-3">
                                      <div className="text-sm text-gray-700">
                                        <strong>Feedback:</strong>
                                      </div>
                                      <div className="mt-1 text-sm text-gray-900">
                                        {attempt.manualFeedback[question.id]}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Grading Dialog */}
        <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Grade Short Answer Question</DialogTitle>
            </DialogHeader>
            
            {gradingData && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Question</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded text-sm">
                    {gradingData.question.prompt}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Student Answer</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                    {gradingData.answer !== undefined && gradingData.answer !== null ? gradingData.answer : 'No answer provided'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manual-score">Score (0 - {gradingData.maxScore})</Label>
                    <Input
                      id="manual-score"
                      type="number"
                      min="0"
                      max={gradingData.maxScore}
                      value={manualScore}
                      onChange={(e) => setManualScore(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Max Points</Label>
                    <div className="mt-1 text-sm font-medium">{gradingData.maxScore}</div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="feedback">Feedback (Optional)</Label>
                  <Textarea
                    id="feedback"
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback to the student..."
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setGradingDialogOpen(false)}>
                Cancel
              </Button>
              <LoadingButton onClick={saveGrading} loading={savingGrading} loadingText="Saving…">
                Save Grade
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}