import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { courseService } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Search, GraduationCap, ArrowRight } from 'lucide-react';

export default function AdminGrades() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (userProfile && (userProfile.role === 'admin' || userProfile.role === 'super_admin')) {
      loadCourses();
    }
  }, [userProfile?.role]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const all = await courseService.getAllCourses(1000);
      setCourses(all);
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">Access Denied</div>
          <div className="text-gray-600">Only administrators can access this page.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grades</h1>
            <p className="text-gray-600">Browse courses and view all students' grades.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-700">Search Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses
          .filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(course => (
            <Card key={course.id} className="hover:shadow-md transition">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{course.title}</div>
                    <div className="text-xs text-gray-500 truncate">{course.instructorName || 'Unknown Instructor'}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/admin-grades/course/${course.id}`)}>
                    View Grades <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        {courses.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center text-gray-600">No courses found.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
