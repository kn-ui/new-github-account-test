/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { examService, examAttemptService, enrollmentService, courseService, FirestoreExam, FirestoreExamAttempt } from '@/lib/firestore';
import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Clock, CheckCircle, AlertCircle, Play, Eye, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentExams() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<(FirestoreExam & { 
    courseTitle?: string; 
    status: 'not_started' | 'in_progress' | 'completed' | 'upcoming' | 'countdown' | 'missed'; 
    score?: number;
    timeUntilStart?: number;
    timeUntilEnd?: number;
  })[]>([]);
  const [filter, setFilter] = useState<'all'|'not_started'|'in_progress'|'completed'|'upcoming'|'missed'>('all');
  const [search, setSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load exams data (only when user changes)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!currentUser?.uid) return;
        const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser.uid);
        const courseIds = enrollments.map(e => e.courseId);
        const courses = await Promise.all(courseIds.map(cid => courseService.getCourseById(cid)));
        const examsList = (await Promise.all(courseIds.map(cid => examService.getExamsByCourse(cid)))).flat();
        const attempts = await examAttemptService.getAttemptsByStudent(currentUser.uid);
        const attemptMap = new Map<string, FirestoreExamAttempt>(attempts.map(a => [a.examId, a]));
        const courseTitleMap = new Map<string, string>(courses.filter(Boolean).map((c: any) => [c.id, c.title]));
        
        const normalized = examsList.map((e: any) => {
          const at = attemptMap.get(e.id);
          const start = e.date?.toDate ? e.date.toDate() : null;
          const end = start && e.durationMinutes ? new Date(start.getTime() + e.durationMinutes * 60000) : null;
          
          let status: 'not_started' | 'in_progress' | 'completed' | 'upcoming' | 'countdown' | 'missed' = 'not_started';
          let timeUntilStart = 0;
          let timeUntilEnd = 0;
          
          if (at) {
            // Student has attempted this exam
            if (at.status === 'in_progress') {
              status = 'in_progress';
            } else if (at.status === 'submitted' || at.status === 'graded') {
              status = 'completed';
            }
          } else if (start) {
            // No attempt yet, check timing
            const now = currentTime;
            if (now < start) {
              const timeDiff = start.getTime() - now.getTime();
              timeUntilStart = timeDiff;
              if (timeDiff <= 30 * 60 * 1000) { // 30 minutes
                status = 'countdown';
              } else {
                status = 'upcoming';
              }
            } else if (end && now > end) {
              status = 'missed';
            } else {
              status = 'not_started';
            }
          }
          
          if (end) {
            timeUntilEnd = end.getTime() - currentTime.getTime();
          }
          
          const score = typeof at?.autoScore === 'number' || typeof at?.manualScore === 'number' ? 
            (Number(at?.autoScore || 0) + Number(at?.manualScore || 0)) : undefined;
          
          return { 
            ...e, 
            courseTitle: courseTitleMap.get(e.courseId), 
            status, 
            score,
            timeUntilStart,
            timeUntilEnd
          };
        });
        setExams(normalized);
      } catch (e) {
        console.error(e);
        toast.error(t('student.exams.loadError') || 'Failed to load exams');
      } finally {
        setLoading(false);
      }
    };
    if (userProfile?.role === 'student') load();
  }, [currentUser?.uid, userProfile?.role]);

  // Timer effect for countdown (separate from data loading)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update exam statuses based on current time (without reloading data)
  useEffect(() => {
    if (exams.length === 0) return;
    
    setExams(prevExams => prevExams.map(e => {
      const start = e.date?.toDate ? e.date.toDate() : null;
      const end = start && e.durationMinutes ? new Date(start.getTime() + e.durationMinutes * 60000) : null;
      
      let status: 'not_started' | 'in_progress' | 'completed' | 'upcoming' | 'countdown' | 'missed' = e.status;
      let timeUntilStart = e.timeUntilStart || 0;
      let timeUntilEnd = e.timeUntilEnd || 0;
      
      // Only update status for exams that haven't been attempted
      if (!e.status || e.status === 'upcoming' || e.status === 'countdown' || e.status === 'not_started') {
        if (start) {
          const now = currentTime;
          if (now < start) {
            const timeDiff = start.getTime() - now.getTime();
            timeUntilStart = timeDiff;
            if (timeDiff <= 30 * 60 * 1000) { // 30 minutes
              status = 'countdown';
            } else {
              status = 'upcoming';
            }
          } else if (end && now > end) {
            status = 'missed';
          } else {
            status = 'not_started';
          }
        }
        
        if (end) {
          timeUntilEnd = end.getTime() - currentTime.getTime();
        }
      }
      
      return { 
        ...e, 
        status, 
        timeUntilStart,
        timeUntilEnd
      };
    }));
  }, [currentTime, exams.length]);

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'countdown': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'not_started': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'missed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'countdown': return <AlertCircle className="h-4 w-4" />;
      case 'upcoming': return <Calendar className="h-4 w-4" />;
      case 'not_started': return <Play className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'missed': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getActionButton = (exam: any) => {
    switch (exam.status) {
      case 'countdown':
        return (
          <Button size="sm" disabled className="bg-orange-100 text-orange-800 border-orange-200">
            <Clock className="h-4 w-4 mr-1" />
            Starts in {formatTimeRemaining(exam.timeUntilStart)}
          </Button>
        );
      case 'upcoming':
        return (
          <Button size="sm" disabled className="bg-blue-100 text-blue-800 border-blue-200">
            <Calendar className="h-4 w-4 mr-1" />
            Upcoming
          </Button>
        );
      case 'not_started':
        return (
          <Button size="sm" asChild>
            <Link to={`/dashboard/student-exams/${exam.id}`}>
              <Play className="h-4 w-4 mr-1" />
              Start Exam
            </Link>
          </Button>
        );
      case 'in_progress':
        return (
          <Button size="sm" asChild>
            <Link to={`/dashboard/student-exams/${exam.id}`}>
              <Clock className="h-4 w-4 mr-1" />
              Continue
            </Link>
          </Button>
        );
      case 'completed':
        return (
          <Button size="sm" asChild>
            <Link to={`/dashboard/student-exams/${exam.id}/result`}>
              <Eye className="h-4 w-4 mr-1" />
              View Results
            </Link>
          </Button>
        );
      case 'missed':
        return (
          <Button size="sm" disabled className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-4 w-4 mr-1" />
            Missed
          </Button>
        );
      default:
        return null;
    }
  };

  const list = useMemo(() => {
    return exams.filter(e => (filter === 'all' || e.status === filter) && ([e.title, e.courseTitle || ''].some(v => (v || '').toLowerCase().includes(search.toLowerCase()))))
      .sort((a,b) => a.date.toDate().getTime() - b.date.toDate().getTime());
  }, [exams, filter, search]);

  if (!userProfile || userProfile.role !== 'student') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">{t('common.accessDenied')}</div>;
  }
  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">{t('student.exams.loading') || 'Loading exams...'}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero title={t('student.exams.title') || 'Exams'} subtitle={t('student.exams.subtitle') || 'Upcoming and past exams'} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
        <Card>
            <CardHeader>
            <CardTitle>{t('student.exams.filters') || 'Filters'}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>{t('searchResults.title') || 'Search'}</Label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('student.exams.searchPlaceholder') || 'Search by title or course'} />
            </div>
            <div>
              <Label>{t('student.exams.status') || 'Status'}</Label>
              <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('student.exams.all') || 'All'}</SelectItem>
                  <SelectItem value="countdown">{t('student.exams.countdown') || 'Starting Soon'}</SelectItem>
                  <SelectItem value="upcoming">{t('student.exams.upcoming') || 'Upcoming'}</SelectItem>
                  <SelectItem value="not_started">{t('student.exams.notStarted') || 'Not started'}</SelectItem>
                  <SelectItem value="in_progress">{t('student.exams.inProgress') || 'In progress'}</SelectItem>
                  <SelectItem value="completed">{t('student.exams.completed') || 'Completed'}</SelectItem>
                  <SelectItem value="missed">{t('student.exams.missed') || 'Missed'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {list.map(e => (
            <Card key={e.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    {getStatusIcon(e.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg truncate">{e.title}</h3>
                    <p className="text-sm text-gray-600 truncate">{e.courseTitle}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{e.date.toDate().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Status and Score */}
                <div className="flex items-center justify-between mb-4">
                  <Badge className={`${getStatusColor(e.status)} text-xs font-medium`}>
                    {e.status === 'countdown' ? 'Starting Soon' : 
                     e.status === 'upcoming' ? 'Upcoming' :
                     e.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  {e.status === 'completed' && (
                    <div className="flex items-center gap-1 text-sm font-medium text-green-700">
                      <Award className="h-4 w-4" />
                      <span>Score: {typeof e.score === 'number' ? e.score : '-'}</span>
                    </div>
                  )}
                </div>

                {/* Countdown Timer */}
                {e.status === 'countdown' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        Exam starts in {formatTimeRemaining(e.timeUntilStart)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Duration Info */}
                {e.durationMinutes && (
                  <div className="text-xs text-gray-500 mb-4">
                    Duration: {e.durationMinutes} minutes
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end">
                  {getActionButton(e)}
                </div>
              </CardContent>
            </Card>
          ))}
          {list.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900">No exams found</p>
                  <p className="text-sm text-gray-500">
                    {filter === 'all' ? 'No exams available' : `No ${filter.replace('_', ' ')} exams`}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

