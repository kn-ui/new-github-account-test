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
import { Calendar, FileText, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentExams() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<(FirestoreExam & { courseTitle?: string; status: 'not_started' | 'in_progress' | 'completed'; score?: number })[]>([]);
  const [filter, setFilter] = useState<'all'|'not_started'|'in_progress'|'completed'>('all');
  const [search, setSearch] = useState('');

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
        const now = new Date();
        const normalized = examsList.map((e: any) => {
          const at = attemptMap.get(e.id);
          const start = e.startTime?.toDate ? e.startTime.toDate() : null;
          const end = start && e.durationMinutes ? new Date(start.getTime() + e.durationMinutes * 60000) : null;
          let status: 'not_started' | 'in_progress' | 'completed' = !at ? 'not_started' : (at.status === 'in_progress' ? 'in_progress' : 'completed');
          if (!at && start) {
            if (now < start) status = 'not_started';
            else if (end && now > end) status = 'completed';
            else status = 'not_started';
          }
          const score = typeof at?.autoScore === 'number' || typeof at?.manualScore === 'number' ? (Number(at?.autoScore || 0) + Number(at?.manualScore || 0)) : undefined;
          return { ...e, courseTitle: courseTitleMap.get(e.courseId), status, score };
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
                  <SelectItem value="not_started">{t('student.exams.notStarted') || 'Not started'}</SelectItem>
                  <SelectItem value="in_progress">{t('student.exams.inProgress') || 'In progress'}</SelectItem>
                  <SelectItem value="completed">{t('student.exams.completed') || 'Completed'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {list.map(e => (
            <div key={e.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center"><FileText className="h-5 w-5 text-blue-600" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{e.title}</div>
                  <div className="text-sm text-gray-600 truncate">{e.courseTitle}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Calendar className="h-3 w-3" /> {e.date.toDate().toLocaleString()}</div>
                  {e.status === 'completed' && (
                    <div className="text-xs text-green-700 flex items-center gap-1 mt-1"><CheckCircle className="h-3 w-3" /> Score: {typeof e.score === 'number' ? e.score : '-'} </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs px-2 py-1 border rounded capitalize">{e.status.replace('_',' ')}</span>
                <Button size="sm" asChild>
                  <Link to={`/dashboard/student-exams/${e.id}`}>{e.status === 'not_started' ? (t('student.exams.start') || 'Start') : (e.status === 'in_progress' ? (t('student.exams.continue') || 'Continue') : (t('common.view') || 'View'))}</Link>
                </Button>
              </div>
            </div>
          ))}
          {list.length === 0 && <div className="text-center text-gray-500 col-span-full py-12">{t('student.exams.none') || 'No exams'}</div>}
        </div>
      </div>
    </div>
  );
}

