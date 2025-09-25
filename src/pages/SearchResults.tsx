import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { userService, courseService, eventService, courseMaterialService, announcementService, assignmentService, enrollmentService, submissionService, FirestoreUser, FirestoreCourse, FirestoreEvent, FirestoreCourseMaterial, FirestoreAnnouncement, FirestoreAssignment } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Calendar, FileText, Bell, FolderOpen } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

type Role = 'admin' | 'teacher' | 'student' | 'super_admin';

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

  const normalizedQuery = useMemo(() => initialQ.trim().toLowerCase(), [initialQ]);

  useEffect(() => {
    const searchData = async () => {
      if (!normalizedQuery) {
        setUsers([]); setCourses([]); setEvents([]); setAnns([]); setAssignments([]); setMaterials([]);
        return;
      }
      
      try {
        setLoading(true);
        
        if (role === 'admin' || role === 'super_admin') {
          // 1. SuperAdmin and Admin: search all users, all courses, all events
          const [allUsers, allCourses, allEvents] = await Promise.all([
            userService.getUsers(1000),
            courseService.getAllCourses(1000),
            eventService.getEvents(1000)
          ]);
          
          // Filter by search query
          setUsers(allUsers.filter(u => 
            (u.displayName || '').toLowerCase().includes(normalizedQuery) ||
            (u.email || '').toLowerCase().includes(normalizedQuery) ||
            (u.role || '').toLowerCase().includes(normalizedQuery)
          ));
          
          setCourses(allCourses.filter(c => 
            (c.title || '').toLowerCase().includes(normalizedQuery) ||
            (c.instructorName || '').toLowerCase().includes(normalizedQuery) ||
            (c.category || '').toLowerCase().includes(normalizedQuery) ||
            (c.description || '').toLowerCase().includes(normalizedQuery)
          ));
          
          setEvents(allEvents.filter(e => 
            (e.title || '').toLowerCase().includes(normalizedQuery) ||
            (e.description || '').toLowerCase().includes(normalizedQuery) ||
            (e.type || '').toLowerCase().includes(normalizedQuery)
          ));
          
          // Clear other data for admins
          setAnns([]);
          setAssignments([]);
          setMaterials([]);
          
        } else if (role === 'teacher') {
          // 2. Teacher: own courses, own students, own assignments, own submissions, events, own course materials
          if (currentUser?.uid) {
            const [teacherCourses, teacherAssignments, teacherMaterials, allEvents] = await Promise.all([
              courseService.getCoursesByInstructor(currentUser.uid),
              assignmentService.getAssignmentsByTeacher(currentUser.uid),
              courseMaterialService.getMaterialsByTeacher(currentUser.uid),
              eventService.getEvents(1000)
            ]);
            
            // Filter teacher's own courses
            setCourses(teacherCourses.filter(c => 
              (c.title || '').toLowerCase().includes(normalizedQuery) ||
              (c.instructorName || '').toLowerCase().includes(normalizedQuery) ||
              (c.category || '').toLowerCase().includes(normalizedQuery) ||
              (c.description || '').toLowerCase().includes(normalizedQuery)
            ));
            
            // Filter teacher's own assignments
            setAssignments(teacherAssignments.filter(a => 
              (a.title || '').toLowerCase().includes(normalizedQuery) ||
              (a.description || '').toLowerCase().includes(normalizedQuery)
            ));
            
            // Filter teacher's own course materials
            setMaterials(teacherMaterials.filter(m => 
              (m.title || '').toLowerCase().includes(normalizedQuery) ||
              (m.description || '').toLowerCase().includes(normalizedQuery)
            ));
            
            // Get students enrolled in teacher's courses only
            const allEnrollments = await enrollmentService.getAllEnrollments();
            const enrolledStudentIds = allEnrollments
              .filter((enrollment: any) => teacherCourses.some(course => course.id === enrollment.courseId))
              .map((enrollment: any) => enrollment.studentId);
            
            const teacherStudents = await Promise.all(
              enrolledStudentIds.map(async (id) => {
                try {
                  return await userService.getUserById(id);
                } catch (error) {
                  return null;
                }
              })
            );
            
            // Filter teacher's own students
            setUsers(teacherStudents.filter(Boolean).filter(u => 
              (u.displayName || '').toLowerCase().includes(normalizedQuery) ||
              (u.email || '').toLowerCase().includes(normalizedQuery)
            ));
            
            // Filter events
            setEvents(allEvents.filter(e => 
              (e.title || '').toLowerCase().includes(normalizedQuery) ||
              (e.description || '').toLowerCase().includes(normalizedQuery) ||
              (e.type || '').toLowerCase().includes(normalizedQuery)
            ));
            
            // Clear announcements for teachers
            setAnns([]);
          } else {
            // No current user - clear all data
            setUsers([]); setCourses([]); setEvents([]); setAnns([]); setAssignments([]); setMaterials([]);
          }
          
        } else if (role === 'student') {
          // 3. Student: taking courses, own assignments, events (optimized for performance)
          if (currentUser?.uid) {
            try {
              // Get basic data first
              const [enrollments, allEvents] = await Promise.all([
                enrollmentService.getEnrollmentsByStudent(currentUser.uid),
                eventService.getEvents(100) // Reduced from 1000 to 100 for performance
              ]);
              
              // Get enrolled course IDs
              const enrolledCourseIds = enrollments.map((e: any) => e.courseId);
              
              if (enrolledCourseIds.length > 0) {
                // Parallel fetch for courses and assignments
                const [enrolledCoursesResults, assignmentResults] = await Promise.all([
                  // Get all enrolled courses in parallel
                  Promise.all(
                    enrolledCourseIds.map(async (id) => {
                      try {
                        return await courseService.getCourseById(id);
                      } catch (error) {
                        return null;
                      }
                    })
                  ),
                  // Get all assignments in parallel
                  Promise.all(
                    enrolledCourseIds.map(async (courseId) => {
                      try {
                        return await assignmentService.getAssignmentsByCourse(courseId);
                      } catch (error) {
                        return [];
                      }
                    })
                  )
                ]);
                
                // Process courses
                const validCourses = enrolledCoursesResults.filter(Boolean);
                setCourses(validCourses.filter(c => 
                  (c.title || '').toLowerCase().includes(normalizedQuery) ||
                  (c.instructorName || '').toLowerCase().includes(normalizedQuery) ||
                  (c.category || '').toLowerCase().includes(normalizedQuery) ||
                  (c.description || '').toLowerCase().includes(normalizedQuery)
                ));
                
                // Process assignments (flatten the array)
                const allStudentAssignments = assignmentResults.flat();
                setAssignments(allStudentAssignments.filter(a => 
                  (a.title || '').toLowerCase().includes(normalizedQuery) ||
                  (a.description || '').toLowerCase().includes(normalizedQuery)
                ));
              } else {
                setCourses([]);
                setAssignments([]);
              }
              
              // Filter events
              setEvents(allEvents.filter(e => 
                (e.title || '').toLowerCase().includes(normalizedQuery) ||
                (e.description || '').toLowerCase().includes(normalizedQuery) ||
                (e.type || '').toLowerCase().includes(normalizedQuery)
              ));
              
              // Clear data students shouldn't see
              setUsers([]);
              setAnns([]);
              setMaterials([]);
              
            } catch (error) {
              console.error('Error in student search:', error);
              // Clear all data on error
              setUsers([]); setCourses([]); setEvents([]); setAnns([]); setAssignments([]); setMaterials([]);
            }
          } else {
            // No current user - clear all data
            setUsers([]); setCourses([]); setEvents([]); setAnns([]); setAssignments([]); setMaterials([]);
          }
        }
        
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    searchData();
  }, [normalizedQuery, role, currentUser?.uid]);

  const hasResults = users.length > 0 || courses.length > 0 || events.length > 0 || anns.length > 0 || assignments.length > 0 || materials.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('searchResults.title')} "{initialQ}"
          </h1>
          <p className="text-gray-600">
            {loading ? 'Searching...' : hasResults ? `Found results in ${[users.length > 0 && 'users', courses.length > 0 && 'courses', events.length > 0 && 'events', assignments.length > 0 && 'assignments', materials.length > 0 && 'materials'].filter(Boolean).join(', ')}` : 'No results found'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Users Results (Admin/SuperAdmin/Teacher only) */}
            {users.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {role === 'teacher' ? 'Your Students' : 'Users'} ({users.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {users.slice(0, 5).map(user => (
                      <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-sm text-gray-600">{user.email} • {user.role}</div>
                        </div>
                      </div>
                    ))}
                    {users.length > 5 && (
                      <div className="text-sm text-gray-500 text-center py-2">
                        And {users.length - 5} more users...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Courses Results */}
            {courses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {role === 'teacher' ? 'Your Courses' : role === 'student' ? 'Your Enrolled Courses' : 'Courses'} ({courses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {courses.slice(0, 5).map(course => (
                      <div key={course.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{course.title}</div>
                          <div className="text-sm text-gray-600">by {course.instructorName} • {course.category}</div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          {role === 'admin' ? (
                            <Link to="/dashboard/courses">Go to Course Manager</Link>
                          ) : role === 'super_admin' ? (
                            <Link to="/dashboard/courses">View All Courses</Link>
                          ) : role === 'teacher' ? (
                            <Link to={`/dashboard/my-courses/${course.id}`}>View Course</Link>
                          ) : (
                            <Link to={`/course/${course.id}`}>View Course</Link>
                          )}
                        </Button>
                      </div>
                    ))}
                    {courses.length > 5 && (
                      <div className="text-sm text-gray-500 text-center py-2">
                        And {courses.length - 5} more courses...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Events Results */}
            {events.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Events ({events.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {events.slice(0, 5).map(event => (
                      <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-600">{event.description} • {event.type}</div>
                        </div>
                        {(role === 'admin' || role === 'super_admin') ? (
                          <Button variant="outline" size="sm" asChild>
                            {role === 'admin' ? (
                              <Link to="/dashboard/events">Go to Events</Link>
                            ) : (
                              <Link to="/dashboard/events">View All Events</Link>
                            )}
                          </Button>
                        ) : null}
                      </div>
                    ))}
                    {events.length > 5 && (
                      <div className="text-sm text-gray-500 text-center py-2">
                        And {events.length - 5} more events...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assignments Results (Teacher/Student only) */}
            {assignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {role === 'teacher' ? 'Your Assignments' : 'Your Assignments'} ({assignments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {assignments.slice(0, 5).map(assignment => (
                      <div key={assignment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{assignment.title}</div>
                          <div className="text-sm text-gray-600">{assignment.description}</div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          {role === 'student' ? (
                            <Link to={`/dashboard/student-assignments?assignmentId=${assignment.id}`}>View Details</Link>
                          ) : (
                            <Link to="/dashboard/assignments">View Assignments</Link>
                          )}
                        </Button>
                      </div>
                    ))}
                    {assignments.length > 5 && (
                      <div className="text-sm text-gray-500 text-center py-2">
                        And {assignments.length - 5} more assignments...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Materials Results (Teacher only) */}
            {materials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Your Course Materials ({materials.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {materials.slice(0, 5).map(material => (
                      <div key={material.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <FolderOpen className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{material.title}</div>
                          <div className="text-sm text-gray-600">{material.description}</div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/dashboard/materials">View Materials</Link>
                        </Button>
                      </div>
                    ))}
                    {materials.length > 5 && (
                      <div className="text-sm text-gray-500 text-center py-2">
                        And {materials.length - 5} more materials...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Results */}
            {!hasResults && !loading && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600 mb-4">
                      We couldn't find anything matching "{initialQ}"
                    </p>
                    <div className="text-sm text-gray-500">
                      {role === 'student' && "You can search for your enrolled courses, assignments, and events."}
                      {role === 'teacher' && "You can search for your courses, students, assignments, materials, and events."}
                      {(role === 'admin' || role === 'super_admin') && "You can search for users, courses, and events."}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}