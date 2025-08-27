import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { userService, courseService, eventService, FirestoreUser, FirestoreCourse, FirestoreEvent } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Users, BookOpen, Calendar } from 'lucide-react';

type Role = 'admin' | 'teacher' | 'student';

export default function SearchResults() {
  const { userProfile, currentUser } = useAuth();
  const role = (userProfile?.role as Role) || 'student';
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [courses, setCourses] = useState<FirestoreCourse[]>([]);
  const [events, setEvents] = useState<FirestoreEvent[]>([]);

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  useEffect(() => {
    const run = async () => {
      if (!normalizedQuery) {
        setUsers([]); setCourses([]); setEvents([]);
        return;
      }
      try {
        setLoading(true);
        // Admin: search all; Teacher: own courses + active courses; Student: active courses only
        const promises: Array<Promise<any>> = [];
        if (role === 'admin') {
          promises.push(userService.getUsers(1000));
          promises.push(courseService.getCourses(1000));
          promises.push(courseService.getPendingCourses(1000));
          promises.push(eventService.getEvents(1000));
        } else if (role === 'teacher') {
          if (currentUser?.uid) {
            promises.push(courseService.getCoursesByInstructor(currentUser.uid));
          } else {
            promises.push(Promise.resolve([]));
          }
          promises.push(courseService.getCourses(1000));
          promises.push(eventService.getEvents(1000));
        } else {
          promises.push(courseService.getCourses(1000));
          promises.push(eventService.getEvents(1000));
        }
        const results = await Promise.all(promises);
        if (role === 'admin') {
          const [allUsers, activeCourses, pendingCourses, allEvents] = results as [FirestoreUser[], FirestoreCourse[], FirestoreCourse[], FirestoreEvent[]];
          setUsers(allUsers.filter(u => (
            (u.displayName || '').toLowerCase().includes(normalizedQuery) ||
            (u.email || '').toLowerCase().includes(normalizedQuery) ||
            (u.role || '').toLowerCase().includes(normalizedQuery)
          )));
          const mergedCourses = [...activeCourses, ...pendingCourses];
          setCourses(mergedCourses.filter(c => (
            (c.title || '').toLowerCase().includes(normalizedQuery) ||
            (c.instructorName || '').toLowerCase().includes(normalizedQuery) ||
            (c.category || '').toLowerCase().includes(normalizedQuery)
          )));
          setEvents(allEvents.filter(e => (
            (e.title || '').toLowerCase().includes(normalizedQuery) ||
            (e.description || '').toLowerCase().includes(normalizedQuery) ||
            (e.type || '').toLowerCase().includes(normalizedQuery)
          )));
        } else if (role === 'teacher') {
          const [myCourses, activeCourses, allEvents] = results as [FirestoreCourse[], FirestoreCourse[], FirestoreEvent[]];
          const mergedCourses: FirestoreCourse[] = Array.from(new Map([...myCourses, ...activeCourses].map(c => [c.id, c])).values());
          setCourses(mergedCourses.filter(c => (
            (c.title || '').toLowerCase().includes(normalizedQuery) ||
            (c.instructorName || '').toLowerCase().includes(normalizedQuery) ||
            (c.category || '').toLowerCase().includes(normalizedQuery)
          )));
          setEvents(allEvents.filter(e => (
            (e.title || '').toLowerCase().includes(normalizedQuery) ||
            (e.description || '').toLowerCase().includes(normalizedQuery) ||
            (e.type || '').toLowerCase().includes(normalizedQuery)
          )));
          setUsers([]);
        } else {
          const [activeCourses, allEvents] = results as [FirestoreCourse[], FirestoreEvent[]];
          setCourses(activeCourses.filter(c => (
            (c.title || '').toLowerCase().includes(normalizedQuery) ||
            (c.instructorName || '').toLowerCase().includes(normalizedQuery) ||
            (c.category || '').toLowerCase().includes(normalizedQuery)
          )));
          setEvents(allEvents.filter(e => (
            (e.title || '').toLowerCase().includes(normalizedQuery) ||
            (e.description || '').toLowerCase().includes(normalizedQuery) ||
            (e.type || '').toLowerCase().includes(normalizedQuery)
          )));
          setUsers([]);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [normalizedQuery, role, currentUser?.uid]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setParams(prev => {
      const p = new URLSearchParams(prev);
      if (q) p.set('q', q); else p.delete('q');
      return p;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Search</h1>
          <p className="text-gray-600">Role-based results for "{initialQ}"</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="pl-10" />
            </div>
            <Button type="submit" disabled={loading}>Search</Button>
          </form>
        </CardContent>
      </Card>

      {(role === 'admin' && users.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Users ({users.length})</CardTitle>
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
                <Link to="/dashboard/users">View all users</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Courses ({courses.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {courses.slice(0, 10).map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-sm text-gray-600">{c.instructorName} • {c.category}</div>
              </div>
              <Button variant="outline" asChild>
                <Link to={`/courses/${c.id}`}>Open</Link>
              </Button>
            </div>
          ))}
          {courses.length > 10 && (
            <Button variant="outline" asChild>
              <Link to="/dashboard/courses">View all courses</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Events ({events.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.slice(0, 10).map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{e.title}</div>
                <div className="text-sm text-gray-600">{(e.type || 'event')}</div>
              </div>
              <Button variant="outline" asChild>
                <Link to="/dashboard/events">Open</Link>
              </Button>
            </div>
          ))}
          {events.length > 10 && (
            <Button variant="outline" asChild>
              <Link to="/dashboard/events">View all events</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

