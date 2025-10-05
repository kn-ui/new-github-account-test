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
        const examData = await examService.getExamById(examId);
        setExam(examData);
        const at = await examAttemptService.getAttemptForStudent(examId, currentUser.uid);
        setAttempt(at);
        
        // Debug logging
        console.log('Exam data:', examData);
        console.log('Attempt data:', at);
        console.log('Attempt answers:', at?.answers);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId, currentUser?.uid]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (!attempt) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Result not found</div>;
  if (!exam) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Exam not found</div>;

  // Calculate auto-graded score correctly
  const calculateAutoScore = () => {
    if (!exam.questions || !attempt.answers) return 0;
    
    let autoScore = 0;
    exam.questions.forEach((question: any) => {
      if (question.type === 'mcq' || question.type === 'truefalse') {
        const answer = attempt.answers.find((a: any) => a.questionId === question.id);
        if (answer) {
          const isCorrect = question.type === 'mcq' 
            ? Number(answer.response) === Number(question.correct)
            : Boolean(answer.response) === Boolean(question.correct);
          if (isCorrect) {
            autoScore += question.points || 0;
          }
        }
      }
    });
    return autoScore;
  };

  // Use stored autoScore from attempt if available, otherwise calculate it
  const autoScore = attempt.autoScore !== undefined ? attempt.autoScore : calculateAutoScore();
  
  // Calculate manual score from manualScores object
  const manualScores = attempt.manualScores || {};
  const manualScore = Object.values(manualScores).reduce((sum: number, score: any) => sum + (Number(score) || 0), 0);
  
  const total = attempt.score !== undefined ? attempt.score : (autoScore + manualScore);
  const totalPoints = exam.totalPoints || (exam.questions?.reduce((sum: number, q: any) => sum + (q.points || 0), 0) || 0);
  const percentage = totalPoints > 0 ? Math.round((total / totalPoints) * 100) : 0;
  
  // Check if exam is fully graded
  const isFullyGraded = attempt.isGraded || (attempt.status === 'graded');
  const hasManualQuestions = exam.questions?.some((q: any) => q.type === 'short') || false;
  
  // Debug logging
  console.log('Exam attempt data:', {
    attempt,
    autoScore,
    manualScore,
    manualScores,
    total,
    isFullyGraded,
    hasManualQuestions
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero title={exam.title} subtitle="Your exam results" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
        {/* Score Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Exam Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{total}</div>
                <div className="text-sm text-blue-800">Total Score</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{percentage}%</div>
                <div className="text-sm text-green-800">Percentage</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-gray-600">{totalPoints}</div>
                <div className="text-sm text-gray-800">Total Points</div>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Auto-graded Score:</span>
                <span className="font-medium">{autoScore} / {exam.questions?.filter((q: any) => q.type !== 'short').reduce((sum: number, q: any) => sum + (q.points || 0), 0) || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Manual Score:</span>
                <span className="font-medium">
                  {isFullyGraded ? `${manualScore} / ${exam.questions?.filter((q: any) => q.type === 'short').reduce((sum: number, q: any) => sum + (q.points || 0), 0) || 0}` : (hasManualQuestions ? 'Pending' : 'N/A')}
                </span>
              </div>
              <div className="flex justify-between py-2 font-semibold text-lg">
                <span>Final Score:</span>
                <span>
                  {isFullyGraded ? `${total} / ${totalPoints}` : (hasManualQuestions ? 'Pending' : `${autoScore} / ${totalPoints}`)}
                </span>
              </div>
            </div>

            {attempt.feedback && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm font-medium text-yellow-800 mb-2">Instructor Feedback:</div>
                <div className="text-sm text-yellow-700">{attempt.feedback}</div>
              </div>
            )}

            {hasManualQuestions && !isFullyGraded && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-2">Manual Grading in Progress</div>
                <div className="text-sm text-blue-700">
                  Your exam contains short answer questions that require manual grading by your instructor. 
                  Your final score will be updated once the manual grading is complete.
                </div>
              </div>
            )}

            {/* Information about scoring */}
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm font-medium text-gray-800 mb-2">Understanding Your Score</div>
              <div className="text-sm text-gray-700 space-y-1">
                <div><strong>Auto-graded Score:</strong> Points earned from multiple choice and true/false questions that are automatically graded by the system.</div>
                <div><strong>Manual Score:</strong> Points earned from short answer questions that require manual grading by your instructor.</div>
                <div><strong>Total Score:</strong> The sum of your auto-graded score and manual score.</div>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <div>Submitted: {attempt.submittedAt?.toDate?.()?.toLocaleString() || 'Unknown'}</div>
              <div>Status: {attempt.status || 'Unknown'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        {exam.questions && exam.questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Question Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {exam.questions.map((question: any, index: number) => {
                const answerData = attempt.answers?.find((a: any) => a.questionId === question.id);
                const answer = answerData?.response;
                const isCorrect = question.type === 'mcq' 
                  ? Number(answer) === Number(question.correct)
                  : question.type === 'truefalse'
                  ? Boolean(answer) === Boolean(question.correct)
                  : null; // Short answer - manually graded
                
                return (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{question.points} points</span>
                        {question.type !== 'short' && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-3">{question.prompt}</div>
                    
                    {question.type === 'mcq' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option: string, optIndex: number) => {
                          const isSelected = optIndex === Number(answer);
                          const isCorrect = optIndex === Number(question.correct);
                          const isSelectedAndWrong = isSelected && !isCorrect;
                          
                          return (
                            <div key={optIndex} className={`p-2 rounded border ${
                              isSelectedAndWrong
                                ? 'bg-red-50 border-red-200' 
                                : isSelected
                                ? 'bg-blue-50 border-blue-200' 
                                : isCorrect
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  isSelectedAndWrong
                                    ? 'border-red-500 bg-red-50'
                                    : isSelected
                                    ? 'border-blue-500 bg-blue-50' 
                                    : isCorrect
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <div className={`w-2 h-2 rounded-full ${
                                      isSelectedAndWrong ? 'bg-red-500' : 'bg-blue-500'
                                    }`}></div>
                                  )}
                                  {isCorrect && !isSelected && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  )}
                                </div>
                                <span className="text-sm">{option}</span>
                                {isCorrect && !isSelected && (
                                  <span className="text-xs text-green-600 font-medium">(Correct Answer)</span>
                                )}
                                {isSelectedAndWrong && (
                                  <span className="text-xs text-red-600 font-medium">(Your Answer - Incorrect)</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {question.type === 'truefalse' && (
                      <div className="space-y-2">
                        <div className={`p-2 rounded border ${
                          answer === true && question.correct === true
                            ? 'bg-green-50 border-green-200'
                            : answer === true && question.correct === false
                            ? 'bg-red-50 border-red-200'
                            : answer === true
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              answer === true && question.correct === true
                                ? 'border-green-500 bg-green-50'
                                : answer === true && question.correct === false
                                ? 'border-red-500 bg-red-50'
                                : answer === true
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300'
                            }`}>
                              {answer === true && (
                                <div className={`w-2 h-2 rounded-full ${
                                  question.correct === true ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                              )}
                            </div>
                            <span className="text-sm">True</span>
                            {answer === true && question.correct === false && (
                              <span className="text-xs text-red-600 font-medium">(Your Answer - Incorrect)</span>
                            )}
                          </div>
                        </div>
                        <div className={`p-2 rounded border ${
                          answer === false && question.correct === false
                            ? 'bg-green-50 border-green-200'
                            : answer === false && question.correct === true
                            ? 'bg-red-50 border-red-200'
                            : answer === false
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              answer === false && question.correct === false
                                ? 'border-green-500 bg-green-50'
                                : answer === false && question.correct === true
                                ? 'border-red-500 bg-red-50'
                                : answer === false
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300'
                            }`}>
                              {answer === false && (
                                <div className={`w-2 h-2 rounded-full ${
                                  question.correct === false ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                              )}
                            </div>
                            <span className="text-sm">False</span>
                            {answer === false && question.correct === true && (
                              <span className="text-xs text-red-600 font-medium">(Your Answer - Incorrect)</span>
                            )}
                            {question.correct === false && answer !== false && (
                              <span className="text-xs text-green-600 font-medium">(Correct Answer)</span>
                            )}
                          </div>
                        </div>
                        {question.correct === true && answer !== true && (
                          <div className="text-xs text-green-600 font-medium">Correct Answer: True</div>
                        )}
                      </div>
                    )}
                    
                    {question.type === 'short' && (
                      <div className="space-y-2">
                        <div className="p-3 bg-gray-50 border rounded">
                          <div className="text-sm text-gray-600 mb-1">Your Answer:</div>
                          <div className="text-sm">
                            {answer !== undefined && answer !== null && String(answer).trim() !== '' 
                              ? String(answer).trim() 
                              : 'No answer provided'
                            }
                          </div>
                        </div>
                        
                        {/* Show manual grading status and feedback */}
                        {isFullyGraded ? (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500">
                              This question was manually graded by your instructor.
                            </div>
                            {attempt.manualScores && attempt.manualScores[question.id] !== undefined && (
                              <div className="text-xs text-gray-600">
                                Manual Score: {attempt.manualScores[question.id]} / {question.points}
                              </div>
                            )}
                            {attempt.manualFeedback && attempt.manualFeedback[question.id] && (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <div className="text-sm font-medium text-yellow-800 mb-1">Instructor Feedback:</div>
                                <div className="text-sm text-yellow-700">{attempt.manualFeedback[question.id]}</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            This question will be manually graded by your instructor.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Link to="/dashboard/student-exams">
            <Button variant="outline" size="lg">
              Back to Exams
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

