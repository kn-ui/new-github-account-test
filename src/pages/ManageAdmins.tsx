import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminActivityService, adminActionService, userService, FirestoreGrade, FirestoreUser, FirestoreAdminAction } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function ManageAdmins() {
  const { userProfile } = useAuth();
  const [admins, setAdmins] = useState<FirestoreUser[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<FirestoreUser | null>(null);
  const [activity, setActivity] = useState<FirestoreAdminAction[]>([]);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!userProfile || userProfile.role !== 'super_admin') return;
    (async () => {
      const all = await userService.getAllUsersIncludingInactive(1000);
      setAdmins(all.filter(u => u.role === 'admin'));
    })();
  }, [userProfile]);

  const loadActivity = async (uid: string) => {
    const list = await adminActionService.getActions({ userId: uid, limitCount: 300 });
    setActivity(list);
  };

  if (!userProfile || userProfile.role !== 'super_admin') {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <div className="text-sm text-gray-600">Total Admins: {admins.length}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {admins.map(a => (
                <div key={a.id} className="p-3 border rounded bg-white">
                  <div className="font-semibold text-gray-800">{a.displayName}</div>
                  <div className="text-sm text-gray-600">{a.email}</div>
                  <div className="text-xs text-gray-500">{a.id}</div>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => { setSelectedAdmin(a); loadActivity(a.id!); }}>View Activity</Button>
                  </div>
                </div>
              ))}
            </div>

            {selectedAdmin && (
              <div className="mt-6">
                <div className="font-semibold text-gray-800 mb-3">Activity for {selectedAdmin.displayName}</div>
                <div className="flex items-center gap-3 mb-3">
                  <input className="border rounded px-2 py-1 text-sm" placeholder="Search details..." value={searchTerm} onChange={(e)=> setSearchTerm(e.target.value)} />
                  <select className="border rounded px-2 py-1 text-sm" value={actionFilter} onChange={(e)=> setActionFilter(e.target.value)}>
                    <option value="all">All actions</option>
                    <option value="user.">User</option>
                    <option value="course.">Course</option>
                    <option value="event.">Event</option>
                    <option value="announcement.">Announcement</option>
                    <option value="grade.">Grade</option>
                  </select>
                </div>
                <div className="space-y-2">
                  {activity
                    .filter(a => actionFilter==='all' || a.action.startsWith(actionFilter))
                    .filter(a => !searchTerm || JSON.stringify(a.details || {}).toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(a => (
                    <div key={a.id} className="p-2 border rounded text-sm bg-white">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-800">{a.action}</div>
                        <div className="text-xs text-gray-500">{a.createdAt.toDate().toLocaleString()}</div>
                      </div>
                      <div className="text-xs text-gray-600">Target: {a.targetType}{a.targetId ? ` (${a.targetId})` : ''}</div>
                      {a.details && <pre className="text-[11px] text-gray-600 mt-1 overflow-x-auto">{JSON.stringify(a.details, null, 2)}</pre>}
                    </div>
                  ))}
                  {activity.length === 0 && <div className="text-sm text-gray-500">No activity found.</div>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
