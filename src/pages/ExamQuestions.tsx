import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { examService, FirestoreExam } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X,
  GripVertical,
  FileText,
  CheckCircle,
  Circle
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/contexts/I18nContext';

interface Question {
  id: string;
  type: 'mcq' | 'truefalse' | 'short';
  prompt: string;
  options?: string[];
  correct: number | boolean;
  points: number;
}

export default function ExamQuestions() {
  const { examId } = useParams<{ examId: string }>();
  const { userProfile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<FirestoreExam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExamLocked, setIsExamLocked] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editingQuestionData, setEditingQuestionData] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: 'mcq',
    prompt: '',
    options: ['', ''],
    correct: 0,
    points: 1
  });

  useEffect(() => {
    if (examId && userProfile?.role === 'teacher') {
      loadExam();
    }
  }, [examId, userProfile?.role]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const examData = await examService.getExamById(examId!);
      if (examData) {
        setExam(examData);
        setQuestions(examData.questions || []);
        
        // Check if exam is locked
        const lockStatus = await examService.isExamLocked(examId!);
        setIsExamLocked(lockStatus.locked);
      } else {
        toast.error('Exam not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading exam:', error);
      toast.error('Failed to load exam');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    if (!newQuestion.prompt?.trim()) {
      toast.error('Please enter a question prompt');
      return;
    }

    const question: Question = {
      id: crypto.randomUUID(),
      type: newQuestion.type as 'mcq' | 'truefalse' | 'short',
      prompt: newQuestion.prompt.trim(),
      options: newQuestion.type === 'mcq' ? (newQuestion.options || ['', '']) : undefined,
      correct: newQuestion.correct !== undefined ? newQuestion.correct : 0,
      points: newQuestion.points || 1
    };

    setQuestions([...questions, question]);
    setNewQuestion({
      type: 'mcq',
      prompt: '',
      options: ['', ''],
      correct: 0,
      points: 1
    });
    toast.success('Question added');
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
    setEditingQuestion(null);
  };

  const startEditingQuestion = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      setEditingQuestion(questionId);
      setEditingQuestionData({ ...question });
    }
  };

  const saveEditingQuestion = () => {
    if (editingQuestion && editingQuestionData) {
      updateQuestion(editingQuestion, editingQuestionData);
      setEditingQuestion(null);
      setEditingQuestionData(null);
    }
  };

  const cancelEditingQuestion = () => {
    setEditingQuestion(null);
    setEditingQuestionData(null);
  };

  const updateEditingQuestion = (updates: Partial<Question>) => {
    if (editingQuestionData) {
      setEditingQuestionData({ ...editingQuestionData, ...updates });
    }
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    toast.success('Question deleted');
  };

  const saveQuestions = async () => {
    try {
      setSaving(true);
      
      // Clean the questions data to remove undefined values
      const cleanedQuestions = questions.map(q => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt || '',
        options: q.options || [],
        correct: q.correct !== undefined ? q.correct : 0,
        points: q.points || 1
      }));
      
      await examService.updateExam(examId!, { questions: cleanedQuestions });
      toast.success('Questions saved successfully');
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error('Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, {
        options: [...question.options, '']
      });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options && question.options.length > 2) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex);
      updateQuestion(questionId, { 
        options: newOptions,
        correct: question.correct >= optionIndex ? Math.max(0, (question.correct as number) - 1) : question.correct
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Exam Not Found</h1>
          <Button onClick={() => navigate('/dashboard')}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
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
              <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
              <p className="text-gray-600 mt-1">{exam.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{questions.length} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>{questions.reduce((sum, q) => sum + q.points, 0)} total points</span>
            </div>
            <Badge variant="outline">
              {exam.date.toDate().toLocaleDateString()}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Questions List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Questions</h2>
              <Button 
                onClick={saveQuestions} 
                disabled={saving || isExamLocked} 
                className="flex items-center gap-2"
                title={isExamLocked ? 'Exam is locked - cannot save changes' : 'Save all questions'}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save All'}
              </Button>
            </div>

            {questions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                  <p className="text-gray-600">Add your first question to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <Card key={question.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <GripVertical className="h-4 w-4" />
                            <span>Q{index + 1}</span>
                          </div>
                          <Badge variant="outline">{question.type.toUpperCase()}</Badge>
                          <Badge variant="secondary">{question.points} pts</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isExamLocked}
                            onClick={() => startEditingQuestion(question.id)}
                            title={isExamLocked ? 'Exam is locked - cannot edit questions' : 'Edit question'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isExamLocked}
                            onClick={() => deleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-700"
                            title={isExamLocked ? 'Exam is locked - cannot delete questions' : 'Delete question'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {editingQuestion === question.id && editingQuestionData ? (
                        <div className="space-y-4">
                          <div>
                            <Label>Question Type</Label>
                            <Select 
                              value={editingQuestionData.type} 
                              onValueChange={(value) => updateEditingQuestion({ type: value as any })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mcq">Multiple Choice</SelectItem>
                                <SelectItem value="truefalse">True/False</SelectItem>
                                <SelectItem value="short">Short Answer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Question Prompt</Label>
                            <Input
                              value={editingQuestionData.prompt}
                              onChange={(e) => updateEditingQuestion({ prompt: e.target.value })}
                              placeholder="Enter your question..."
                            />
                          </div>

                          <div>
                            <Label>Points</Label>
                            <Input
                              type="number"
                              value={editingQuestionData.points}
                              onChange={(e) => updateEditingQuestion({ points: parseInt(e.target.value) || 1 })}
                              min="1"
                            />
                          </div>

                          {editingQuestionData.type === 'mcq' && (
                            <div className="space-y-3">
                              <Label>Options</Label>
                              {editingQuestionData.options?.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                                    optionIndex === editingQuestionData.correct 
                                      ? 'border-blue-500 bg-blue-50' 
                                      : 'border-gray-300'
                                  }`} onClick={() => updateEditingQuestion({ correct: optionIndex })}>
                                    {optionIndex === editingQuestionData.correct && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                  </div>
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...(editingQuestionData.options || [])];
                                      newOptions[optionIndex] = e.target.value;
                                      updateEditingQuestion({ options: newOptions });
                                    }}
                                    placeholder={`Option ${optionIndex + 1}`}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newOptions = editingQuestionData.options?.filter((_, i) => i !== optionIndex) || [];
                                      updateEditingQuestion({ 
                                        options: newOptions,
                                        correct: editingQuestionData.correct >= optionIndex ? Math.max(0, (editingQuestionData.correct as number) - 1) : editingQuestionData.correct
                                      });
                                    }}
                                    disabled={editingQuestionData.options?.length <= 2}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateEditingQuestion({ 
                                  options: [...(editingQuestionData.options || []), ''] 
                                })}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Option
                              </Button>
                            </div>
                          )}

                          {editingQuestionData.type === 'truefalse' && (
                            <div>
                              <Label>Correct Answer</Label>
                              <Select 
                                value={String(editingQuestionData.correct)} 
                                onValueChange={(value) => updateEditingQuestion({ correct: value === 'true' })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">True</SelectItem>
                                  <SelectItem value="false">False</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {editingQuestionData.type === 'short' && (
                            <div className="text-sm text-gray-500 italic">
                              Short answer - manually graded
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button onClick={saveEditingQuestion}>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button variant="outline" onClick={cancelEditingQuestion}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-900 mb-4">{question.prompt}</p>
                          
                          {question.type === 'mcq' && question.options && (
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    optionIndex === question.correct 
                                      ? 'border-green-500 bg-green-50' 
                                      : 'border-gray-300'
                                  }`}>
                                    {optionIndex === question.correct && (
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-700">{option}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {question.type === 'truefalse' && (
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                question.correct === true 
                                  ? 'border-green-500 bg-green-50' 
                                  : 'border-gray-300'
                              }`}>
                                {question.correct === true && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                )}
                              </div>
                              <span className="text-sm text-gray-700">True</span>
                            </div>
                          )}
                          
                          {question.type === 'short' && (
                            <div className="text-sm text-gray-500 italic">
                              Short answer - manually graded
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add Question Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Question
                  {isExamLocked && (
                    <span className="text-sm text-red-600 font-normal">(Exam is locked)</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Question Type</Label>
                  <Select 
                    value={newQuestion.type} 
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">Multiple Choice</SelectItem>
                      <SelectItem value="truefalse">True/False</SelectItem>
                      <SelectItem value="short">Short Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Question Prompt</Label>
                  <Input
                    value={newQuestion.prompt}
                    onChange={(e) => setNewQuestion({ ...newQuestion, prompt: e.target.value })}
                    placeholder="Enter your question..."
                  />
                </div>

                <div>
                  <Label>Points</Label>
                  <Input
                    type="number"
                    value={newQuestion.points}
                    onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>

                {newQuestion.type === 'mcq' && (
                  <div className="space-y-3">
                    <Label>Options</Label>
                    {newQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                          index === newQuestion.correct 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300'
                        }`} onClick={() => setNewQuestion({ ...newQuestion, correct: index })}>
                          {index === newQuestion.correct && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(newQuestion.options || [])];
                            newOptions[index] = e.target.value;
                            setNewQuestion({ ...newQuestion, options: newOptions });
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newOptions = newQuestion.options?.filter((_, i) => i !== index) || [];
                            setNewQuestion({ ...newQuestion, options: newOptions });
                          }}
                          disabled={newQuestion.options?.length <= 2}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewQuestion({ 
                        ...newQuestion, 
                        options: [...(newQuestion.options || []), ''] 
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                )}

                {newQuestion.type === 'truefalse' && (
                  <div>
                    <Label>Correct Answer</Label>
                    <Select 
                      value={String(newQuestion.correct)} 
                      onValueChange={(value) => setNewQuestion({ ...newQuestion, correct: value === 'true' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button 
                  onClick={addQuestion} 
                  className="w-full" 
                  disabled={isExamLocked}
                  title={isExamLocked ? 'Exam is locked - cannot add questions' : 'Add new question'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </CardContent>
            </Card>

            {/* Exam Info */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span>{exam.durationMinutes} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{exam.date.toDate().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Time:</span>
                  <span>{exam.startTime.toDate().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Points:</span>
                  <span className="font-medium">{questions.reduce((sum, q) => sum + q.points, 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}