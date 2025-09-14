/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  courseService,
  enrollmentService,
  assignmentService,
  submissionService,
  courseMaterialService,
  FirestoreCourse,
  FirestoreEnrollment,
  FirestoreAssignment,
  FirestoreCourseMaterial,
  FirestoreSubmission,
} from '@/lib/firestore';
import DashboardHero from '@/components/DashboardHero';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Users,
  FileText,
  BookOpen,
  BarChart3,
  Award,
  Calendar,
} from 'lucide-react';

export default function TeacherCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<FirestoreCourse | null>(null);
  const [enrollments, setEnrollments] = useState<FirestoreEnrollment[]>([]);
  const [assignments, setAssignments] = useState<FirestoreAssignment[]>([]);
  const [submissions, setSubmissions] = useState<FirestoreSubmission[]>([]);
  const [materials, setMaterials] = useState<FirestoreCourseMaterial[]>([]);

  useEffect(() => {
    if (!courseId) return;
    if (!userProfile || userProfile.role !== 'teacher') return;
    const load = async () => {
      try {
        setLoading(true);
        const [c, ens, asgs, subs, mats] = await Promise.all([
          courseService.getCourseById(courseId),
          enrollmentService.getEnrollmentsByCourse(courseId),
          assignmentService.getAssignmentsByCourse(courseId, 1000),
          submissionService.getSubmissionsByCourse(courseId),
          courseMaterialService.getCourseMaterialsByCourse(courseId, 1000),
        ]);
        setCourse(c);
        setEnrollments(ens);
        setAssignments(asgs);
        setSubmissions(subs);
        setMaterials(mats);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, userProfile?.role]);

  const studentsCount = enrollments.length;
  const assignmentsCount = assignments.length;
  const examsCount = 0; // No exam entity available yet
  const averageGrade = useMemo(() => {
    const graded = submissions.filter(s => typeof s.grade === 'number');
    if (graded.length === 0) return 0;
    const sum = graded.reduce((acc, s: any) => acc + (s.grade || 0), 0);
    return Math.round((sum / graded.length) * 10) / 10;
  }, [submissions]);

  if (!userProfile || userProfile.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Access denied</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
          <Skeleton className="h-12 w-40 mt-6" />
          <Skeleton className="h-64 w-full mt-4" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Course not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardHero title={course.title} subtitle={course.category} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{studentsCount}</div>
              <p className="text-xs text-gray-500">Enrolled in this course</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{assignmentsCount}</div>
              <p className="text-xs text-gray-500">Total assignments</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{examsCount}</div>
              <p className="text-xs text-gray-500">Exams for this course</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Avg Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{averageGrade}</div>
              <p className="text-xs text-gray-500">Across graded submissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Course Content
            </CardTitle>
            <CardDescription>Overview and resources for this course</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="exams">Exams</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="grades">Grades</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 leading-relaxed">{course.description}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Syllabus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">{course.syllabus}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources" className="mt-4">
                {materials.length > 0 ? (
                  <div className="space-y-3">
                    {materials.map(m => (
                      <div key={m.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{m.title}</div>
                          <div className="text-sm text-gray-600">{m.description}</div>
                          <div className="text-xs text-gray-500 mt-1">{m.type}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {m.fileUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={m.fileUrl} target="_blank" rel="noopener noreferrer">View</a>
                            </Button>
                          )}
                          {m.externalLink && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={m.externalLink} target="_blank" rel="noopener noreferrer">Visit Link</a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No resources yet.</div>
                )}
              </TabsContent>

              <TabsContent value="assignments" className="mt-4">
                {assignments.length > 0 ? (
                  <div className="divide-y">
                    {assignments.map(a => (
                      <div key={a.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{a.title}</div>
                          <div className="text-sm text-gray-600">{a.description}</div>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Due {a.dueDate.toDate().toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No assignments yet.</div>
                )}
              </TabsContent>

              <TabsContent value="exams" className="mt-4">
                <div className="text-gray-500 text-sm">No exams configured for this course.</div>
              </TabsContent>

              <TabsContent value="students" className="mt-4">
                {enrollments.length > 0 ? (
                  <div className="divide-y">
                    {enrollments.map(e => (
                      <div key={e.id} className="py-2 flex items-center justify-between">
                        <div className="text-sm text-gray-700">{e.studentId}</div>
                        <Badge variant="secondary" className="capitalize">{e.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No students enrolled yet.</div>
                )}
              </TabsContent>

              <TabsContent value="grades" className="mt-4">
                {submissions.filter(s => s.status === 'graded').length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2">Student</th>
                          <th className="text-left px-4 py-2">Grade</th>
                          <th className="text-left px-4 py-2">Status</th>
                          <th className="text-left px-4 py-2">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {submissions.filter(s => s.status === 'graded').map(s => (
                          <tr key={s.id}>
                            <td className="px-4 py-2">{s.studentId}</td>
                            <td className="px-4 py-2">{typeof s.grade === 'number' ? s.grade : '-'}</td>
                            <td className="px-4 py-2 capitalize">{s.status}</td>
                            <td className="px-4 py-2">{s.submittedAt.toDate().toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No graded submissions yet.</div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Link to="/dashboard/my-courses">
            <Button variant="outline">Back to My Courses</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

