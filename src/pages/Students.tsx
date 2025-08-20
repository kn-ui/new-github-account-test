/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Users, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { courseService, enrollmentService, userService, FirestoreCourse, FirestoreUser } from '@/lib/firestore';

interface StudentRow {
  id: string;
  name: string;
  email: string;
  courses: string[];
  progressAvg: number;
}

export default function StudentsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
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
        toast.error('Failed to load students');
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading students...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Students</h1>
              <p className="text-gray-600">Students enrolled in your courses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-10" placeholder="Search by name, email, id" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Filter by Course</Label>
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
              <Label>Sort</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="progress-desc">Progress: High to Low</SelectItem>
                  <SelectItem value="progress-asc">Progress: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Progress</th>
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
                    <Button variant="outline" size="sm" onClick={() => toast.info('Profile view only')}>View</Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No students found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

