/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { courseService, submissionService, assignmentService } from '@/lib/firestore';
  import DashboardHero from '@/components/DashboardHero';


interface AssignmentRow {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  dueDate: Date;
  pendingCount: number;
  gradedCount: number;
}

export default function SubmissionsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!currentUser?.uid) {
          setSubmissions([]);
          return;
        }
        const myCourses = await courseService.getCoursesByInstructor(currentUser.uid);
        const perCourse = await Promise.all(myCourses.map(async (c) => {
          const asgs = await assignmentService.getAssignmentsByCourse(c.id, 1000);
          return asgs.map(a => ({ ...a, courseTitle: c.title }));
        }));
        const allAsgs = perCourse.flat();
        const counts = await Promise.all(allAsgs.map(async (a: any) => {
          const subs = await submissionService.getSubmissionsByAssignment(a.id);
          const pending = subs.filter((s: any) => s.status === 'submitted').length;
          const graded = subs.filter((s: any) => s.status === 'graded').length;
          return { id: a.id, pending, graded };
        }));
        const countMap = Object.fromEntries(counts.map(c => [c.id, c] as const));
        const rows: AssignmentRow[] = allAsgs.map((a: any) => ({
          id: a.id,
          title: a.title,
          courseId: a.courseId,
          courseTitle: a.courseTitle,
          dueDate: a.dueDate?.toDate ? a.dueDate.toDate() : new Date(),
          pendingCount: countMap[a.id]?.pending || 0,
          gradedCount: countMap[a.id]?.graded || 0,
        }));
        setAssignments(rows);
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
    let list = assignments.filter(a =>
      [a.courseTitle, a.title].some(v => v.toLowerCase().includes(search.toLowerCase()))
    );
    list = list.sort((a, b) => sortBy === 'newest' ? b.dueDate.getTime() - a.dueDate.getTime() : a.dueDate.getTime() - b.dueDate.getTime());
    return list;
  }, [assignments, search, sortBy]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading assignments...</div>;




  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero 
        title="Submissions"
        subtitle="All submissions for your courses"
      />

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
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">{filtered.length} submission{filtered.length !== 1 ? 's' : ''} found</div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">View:</span>
              <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')}>Table</Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>Grid</Button>
            </div>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted / Graded</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{a.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{a.courseTitle}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{a.dueDate.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{a.pendingCount + a.gradedCount} / {a.gradedCount} graded</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/assignments/${a.id}/submissions`}>View submissions</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No assignments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(a => (
              <div key={a.id} className="bg-white border rounded-lg p-4">
                <div className="font-medium text-gray-900 mb-1">{a.title}</div>
                <div className="text-sm text-gray-600 mb-2">Course: {a.courseTitle}</div>
                <div className="text-xs text-gray-500 mb-2">Due: {a.dueDate.toLocaleString()}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs capitalize px-2 py-1 border rounded">{a.pendingCount + a.gradedCount} submissions</span>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/dashboard/assignments/${a.id}/submissions`}>View submissions</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

