/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { courseService, enrollmentService, userService, FirestoreCourse, FirestoreUser } from '@/lib/firestore';
  import DashboardHero from '@/components/DashboardHero';
import { useI18n } from '@/contexts/I18nContext';

  
interface StudentRow {
  id: string;
  name: string;
  email: string;
  courses: string[];
  progressAvg: number;
}

export default function StudentsPage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [courses, setCourses] = useState<FirestoreCourse[]>([]);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress-desc' | 'progress-asc'>('name');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!currentUser?.uid) return;
        const myCourses = await courseService.getCoursesByInstructor(currentUser.uid);
        setCourses(myCourses);
        // Build student set
        const enrollmentLists = await Promise.all(
          myCourses.map(c => enrollmentService.getEnrollmentsByCourse(c.id))
        );
        const idToCourses: Record<string, string[]> = {};
        const idToProgressSum: Record<string, number> = {};
        const idToCount: Record<string, number> = {};
        myCourses.forEach((c, idx) => {
          for (const en of enrollmentLists[idx]) {
            idToCourses[en.studentId] = Array.from(new Set([...(idToCourses[en.studentId] || []), c.title]));
            idToProgressSum[en.studentId] = (idToProgressSum[en.studentId] || 0) + (en.progress || 0);
            idToCount[en.studentId] = (idToCount[en.studentId] || 0) + 1;
          }
        });
        const uniqueStudentIds = Object.keys(idToCourses);
        const profiles = await Promise.all(uniqueStudentIds.map(uid => userService.getUserById(uid)));
        const rows: StudentRow[] = uniqueStudentIds.map((uid, i) => {
          const profile = profiles[i] as FirestoreUser | null;
          const name = profile?.displayName || uid;
          const email = profile?.email || '—';
          const avg = idToCount[uid] ? Math.round(idToProgressSum[uid] / idToCount[uid]) : 0;
          return { id: uid, name, email, courses: idToCourses[uid], progressAvg: avg };
        });
        setStudents(rows);
      } catch (e) {
        console.error(e);
        toast.error(t('teacher.students.loadError') || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.uid]);

  const filtered = useMemo(() => {
    let list = students.filter(s =>
      [s.name, s.email, s.id].some(v => v.toLowerCase().includes(search.toLowerCase())) &&
      (courseFilter === 'all' || s.courses.includes(courseFilter))
    );
    if (sortBy === 'name') list = list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'progress-desc') list = list.sort((a, b) => b.progressAvg - a.progressAvg);
    if (sortBy === 'progress-asc') list = list.sort((a, b) => a.progressAvg - b.progressAvg);
    return list;
  }, [students, search, courseFilter, sortBy]);

  // Access control - only teachers and admins can access
  if (!userProfile || (userProfile.role !== 'teacher' && userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Only teachers and administrators can access this page.</div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">{t('teacher.students.loading')}</div>;






  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero 
        title={t('teacher.students.title') || 'Students'}
        subtitle={t('teacher.students.subtitle') || 'Students enrolled in your courses'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>{t('searchResults.title') || 'Search'}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-10" placeholder={t('teacher.students.searchPlaceholder') || 'Search by name, email, id'} value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>{t('teacher.students.filterByCourse') || 'Filter by Course'}</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.title}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('common.sortBy') || 'Sort'}</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t('teacher.students.sortName') || 'Name'}</SelectItem>
                  <SelectItem value="progress-desc">{t('teacher.students.sortProgressDesc') || 'Progress: High to Low'}</SelectItem>
                  <SelectItem value="progress-asc">{t('teacher.students.sortProgressAsc') || 'Progress: Low to High'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('teacher.students.table.student') || 'Student'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('teacher.students.table.email') || 'Email'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('teacher.students.table.courses') || 'Courses'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('teacher.students.table.progress') || 'Avg Progress'}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{s.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.courses.join(', ')}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{s.progressAvg}%</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="outline" size="sm" onClick={() => toast.info(t('teacher.students.profileOnly') || 'Profile view only')}>{t('common.view') || 'View'}</Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">{t('teacher.students.none') || 'No students found'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

