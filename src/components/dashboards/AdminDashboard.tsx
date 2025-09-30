/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { courseService, FirestoreCourse } from '@/lib/firestore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [pendingCourses, setPendingCourses] = useState<FirestoreCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPending = async () => {
    try {
      setLoading(true);
      const list = await courseService.getPendingCourses(5);
      setPendingCourses(list);
    } catch (e) {
      toast.error('Failed to load pending courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const approveCourse = async (id: string) => {
    try {
      await courseService.updateCourse(id, { isActive: true });
      toast.success('Course approved');
      loadPending();
    } catch {
      toast.error('Failed to approve course');
    }
  };

  const rejectCourse = async (id: string) => {
    try {
      await courseService.updateCourse(id, { isActive: false });
      toast.success('Course rejected');
      loadPending();
    } catch {
      toast.error('Failed to reject course');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Overview and approvals</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/course-manager')}>Manage Courses</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Courses</h2>
            </div>
            <p className="text-gray-600 text-sm mt-1">Recently submitted courses requiring approval</p>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            {loading ? (
              <div className="p-6 text-gray-600">Loading pending courses...</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingCourses.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.instructorName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approveCourse(c.id)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => rejectCourse(c.id)}>
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingCourses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No pending courses for approval</p>
                        <p className="text-sm">Courses submitted by teachers will appear here</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Removed duplicate legacy placeholder component

