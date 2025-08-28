/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { courseService, submissionService } from '@/lib/firestore';

interface SubmissionRow {
  id: string;
  courseTitle: string;
  studentId: string;
  status: string;
  submittedAt: Date;
}

export default function SubmissionsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!currentUser?.uid) return;
        const myCourses = await courseService.getCoursesByInstructor(currentUser.uid);
        const lists = await Promise.all(myCourses.map(c => submissionService.getSubmissionsByCourse(c.id)));
        const flat = lists.flat().map((s: any) => ({
          id: s.id,
          courseTitle: myCourses.find(c => c.id === s.courseId)?.title || '—',
          studentId: s.studentId,
          status: s.status,
          submittedAt: s.submittedAt.toDate(),
        }));
        setSubmissions(flat);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.uid]);

  const filtered = useMemo(() => {
    let list = submissions.filter(s =>
      [s.courseTitle, s.studentId].some(v => v.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === 'all' || s.status === statusFilter)
    );
    list = list.sort((a, b) => sortBy === 'newest' ? b.submittedAt.getTime() - a.submittedAt.getTime() : a.submittedAt.getTime() - b.submittedAt.getTime());
    return list;
  }, [submissions, search, statusFilter, sortBy]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading submissions...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section (condensed) */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Submissions</h1>
              <p className="text-sm text-blue-100">All submissions for your courses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-10" placeholder="Search by course or student id" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="graded">Graded</SelectItem>
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
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{s.courseTitle}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.studentId}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 capitalize">{s.status}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.submittedAt.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="outline" size="sm">View</Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No submissions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

