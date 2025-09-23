import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { userService, courseService, eventService, courseMaterialService, announcementService, assignmentService, enrollmentService, FirestoreUser, FirestoreCourse, FirestoreEvent, FirestoreCourseMaterial, FirestoreAnnouncement, FirestoreAssignment } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Calendar, FileText, Bell, FolderOpen } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

type Role = 'admin' | 'teacher' | 'student';

export default function SearchResults() {
  const { t } = useI18n();
  const { userProfile, currentUser } = useAuth();
  const role = (userProfile?.role as Role) || 'student';
  const [params] = useSearchParams();
  const initialQ = params.get('q') || '';
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [courses, setCourses] = useState<FirestoreCourse[]>([]);
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [materials, setMaterials] = useState<FirestoreCourseMaterial[]>([]);
  const [anns, setAnns] = useState<FirestoreAnnouncement[]>([]);
  const [assignments, setAssignments] = useState<FirestoreAssignment[]>([]);
  const [students, setStudents] = useState<FirestoreUser[]>([]);

  const normalizedQuery = useMemo(() => initialQ.trim().toLowerCase(), [initialQ]);

  useEffect(() => {
    const run = async () => {
      if (!normalizedQuery) {
        setUsers([]); setCourses([]); setEvents([]);
        return;
      }
      try {
        setLoading(true);
        const promises: Array<Promise<any>> = [];
        if (role === 'admin') {
          promises.push(userService.getUsers(1000));
          promises.push(courseService.getAllCourses(1000));
          promises.push(eventService.getEvents(1000));
          promises.push(announcementService.getAllAnnouncements(1000));
          promises.push(assignmentService.getAssignmentsByTeacher(currentUser?.uid || 'none'));
          promises.push(courseMaterialService.getMaterialsByTeacher(currentUser?.uid || 'none'));
        } else if (role === 'teacher') {
          // Teachers can search their own content and their students
          if (currentUser?.uid) {
            promises.push(courseService.getCoursesByInstructor(currentUser.uid));
            promises.push(assignmentService.getAssignmentsByTeacher(currentUser.uid));
            promises.push(courseMaterialService.getMaterialsByTeacher(currentUser.uid));
            promises.push(announcementService.getAnnouncementsByTeacher(currentUser.uid));
            
            // Get students enrolled in teacher's courses only
            const teacherCourses = await courseService.getCoursesByInstructor(currentUser.uid);
            const allEnrollments = await enrollmentService.getAllEnrollments();
            const enrolledStudentIds = allEnrollments
              .filter((enrollment: any) => teacherCourses.some(course => course.id === enrollment.courseId))
              .map((enrollment: any) => enrollment.studentId);
            const teacherStudents = await Promise.all(enrolledStudentIds.map(id => userService.getUserById(id)));
            setStudents(teacherStudents.filter(Boolean));
          }
          // Teachers should not see all events or all users
          setEvents([]);
          setUsers([]);
          return; // Skip the Promise.all below
        } else { // student - only see their own enrolled content
          if (currentUser?.uid) {
            // Get student's enrolled courses only
            const enrollments = await enrollmentService.getEnrollmentsByStudent(currentUser.uid);
            const enrolledCourseIds = enrollments.map((e: any) => e.courseId);
            const enrolledCourses = await Promise.all(enrolledCourseIds.map(id => courseService.getCourseById(id)));
            setCourses(enrolledCourses.filter(Boolean));
            
            // Get announcements for enrolled courses only
            const studentAnns = await announcementService.getAnnouncementsForStudent(currentUser.uid, enrolledCourseIds, 100);
            setAnns(studentAnns);
            
            // Get assignments from enrolled courses only
            const studentAssignments = [];
            for (const courseId of enrolledCourseIds) {
              try {
                const assignments = await assignmentService.getAssignmentsByCourse(courseId);
                studentAssignments.push(...assignments);
              } catch (error) {
                console.error(`Error loading assignments for course ${courseId}:`, error);
              }
            }
            setAssignments(studentAssignments);
            
            // Get materials from enrolled courses only
            const studentMaterials = [];
            for (const courseId of enrolledCourseIds) {
              try {
                const materials = await courseMaterialService.getCourseMaterialsByCourse(courseId);
                studentMaterials.push(...materials);
              } catch (error) {
                console.error(`Error loading materials for course ${courseId}:`, error);
              }
            }
            setMaterials(studentMaterials);
          }
          // Students should not see all events or all users
          setEvents([]);
          setUsers([]);
          return; // Skip the Promise.all below
        }

        const results = await Promise.all(promises);

        if (role === 'admin') {
          const [allUsers, allCourses, allEvents, allAnns, asgs, mats] = results as [FirestoreUser[], FirestoreCourse[], FirestoreEvent[], FirestoreAnnouncement[], FirestoreAssignment[], FirestoreCourseMaterial[]];
          setUsers(allUsers.filter(u => 
            (u.displayName || '').toLowerCase().includes(normalizedQuery) ||
            (u.email || '').toLowerCase().includes(normalizedQuery) ||
            (u.role || '').toLowerCase().includes(normalizedQuery)
          ));
          setCourses(allCourses.filter(c => 
            (c.title || '').toLowerCase().includes(normalizedQuery) ||
            (c.instructorName || '').toLowerCase().includes(normalizedQuery) ||
            (c.category || '').toLowerCase().includes(normalizedQuery)
          ));
          setEvents(allEvents.filter(e => 
            (e.title || '').toLowerCase().includes(normalizedQuery) ||
            (e.description || '').toLowerCase().includes(normalizedQuery) ||
            (e.type || '').toLowerCase().includes(normalizedQuery)
          ));
          setAnns(allAnns.filter(a => (a.title || '').toLowerCase().includes(normalizedQuery) || (a.body || '').toLowerCase().includes(normalizedQuery)));
          setAssignments(asgs.filter(a => (a.title || '').toLowerCase().includes(normalizedQuery) || (a.description || '').toLowerCase().includes(normalizedQuery)));
          setMaterials(mats.filter(m => (m.title || '').toLowerCase().includes(normalizedQuery) || (m.description || '').toLowerCase().includes(normalizedQuery)));
        } else if (role === 'teacher') {
          const [myCourses, asgs, mats, myAnns, activeCourses, allEvents] = results as [FirestoreCourse[], FirestoreAssignment[], FirestoreCourseMaterial[], FirestoreAnnouncement[], FirestoreCourse[], FirestoreEvent[]];
          const mergedCourses: FirestoreCourse[] = Array.from(new Map([...myCourses, ...activeCourses].map(c => [c.id, c])).values());
          setCourses(mergedCourses.filter(c => 
            (c.title || '').toLowerCase().includes(normalizedQuery) ||
            (c.instructorName || '').toLowerCase().includes(normalizedQuery) ||
            (c.category || '').toLowerCase().includes(normalizedQuery)
          ));
          setEvents(allEvents.filter(e => 
            (e.title || '').toLowerCase().includes(normalizedQuery) ||
            (e.description || '').toLowerCase().includes(normalizedQuery) ||
            (e.type || '').toLowerCase().includes(normalizedQuery)
          ));
          setUsers([]);
          setAssignments(asgs.filter(a => (a.title || '').toLowerCase().includes(normalizedQuery) || (a.description || '').toLowerCase().includes(normalizedQuery)));
          setMaterials(mats.filter(m => (m.title || '').toLowerCase().includes(normalizedQuery) || (m.description || '').toLowerCase().includes(normalizedQuery)));
          setAnns(myAnns.filter(a => (a.title || '').toLowerCase().includes(normalizedQuery) || (a.body || '').toLowerCase().includes(normalizedQuery)));
        } else { // student
          const [activeCourses, allEvents] = results as [FirestoreCourse[], FirestoreEvent[]];
          setCourses(activeCourses.filter(c => 
            (c.title || '').toLowerCase().includes(normalizedQuery) ||
            (c.instructorName || '').toLowerCase().includes(normalizedQuery) ||
            (c.category || '').toLowerCase().includes(normalizedQuery)
          ));
          setEvents(allEvents.filter(e => 
            (e.title || '').toLowerCase().includes(normalizedQuery) ||
            (e.description || '').toLowerCase().includes(normalizedQuery) ||
            (e.type || '').toLowerCase().includes(normalizedQuery)
          ));
          setUsers([]);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [normalizedQuery, role, currentUser?.uid]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('searchResults.title')}</h1>
          <p className="text-gray-600">{t('searchResults.showingFor', { q: initialQ })}</p>
        </div>
      </div>

      {role === 'admin' && users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> {t('searchResults.users')} ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.slice(0, 10).map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{u.displayName || 'Unnamed'}</div>
                  <div className="text-sm text-gray-600">{u.email}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-gray-100 capitalize">{u.role}</span>
              </div>
            ))}
            {users.length > 10 && (
              <Button variant="outline" asChild>
                <Link to="/dashboard/users">{t('searchResults.viewAllUsers')}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> {t('searchResults.courses')} ({courses.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {courses.slice(0, 10).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-sm text-gray-600">{c.instructorName} • {c.category}</div>
                </div>
                <Button variant="outline" asChild>
                  <Link to={`/courses/${c.id}`}>{t('searchResults.open')}</Link>
                </Button>
              </div>
            ))}
            {courses.length > 10 && (
              <Button variant="outline" asChild>
                <Link to="/courses">{t('searchResults.viewAllCourses')}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {events.length > 0 && (
        <Card>
      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> {t('searchResults.assignments')} ({assignments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignments.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-gray-600">{t('searchResults.due')} {a.dueDate?.toDate ? a.dueDate.toDate().toLocaleDateString() : ''}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {materials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FolderOpen className="h-5 w-5" /> {t('searchResults.materials')} ({materials.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {materials.slice(0, 10).map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{m.title}</div>
                  <div className="text-sm text-gray-600">{m.type}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {anns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> {t('searchResults.announcements')} ({anns.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {anns.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-gray-600 line-clamp-1">{a.body}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> {t('searchResults.events')} ({events.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.slice(0, 10).map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-sm text-gray-600">{(e.type || 'event')}</div>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/dashboard/events">{t('searchResults.open')}</Link>
                </Button>
              </div>
            ))}
            {events.length > 10 && (
              <Button variant="outline" asChild>
                <Link to="/dashboard/events">{t('searchResults.viewAllEvents')}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && normalizedQuery && users.length === 0 && courses.length === 0 && events.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          <h3 className="text-lg font-medium">{t('common.noResults') || 'No results found'}</h3>
          <p className="text-sm">{t('searchResults.showingFor', { q: initialQ })}</p>
        </div>
      )}
    </div>
  );
}