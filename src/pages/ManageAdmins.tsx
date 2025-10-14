import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminActivityService, userService, FirestoreGrade, FirestoreUser } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function ManageAdmins() {
  const { userProfile } = useAuth();
  const [admins, setAdmins] = useState<FirestoreUser[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<FirestoreUser | null>(null);
  const [activity, setActivity] = useState<FirestoreGrade[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ displayName: '', email: '' });

  useEffect(() => {
    if (!userProfile || userProfile.role !== 'super_admin') return;
    (async () => {
      const all = await userService.getAllUsersIncludingInactive(1000);
      setAdmins(all.filter(u => u.role === 'admin'));
    })();
  }, [userProfile]);

  const loadActivity = async (uid: string) => {
    const list = await adminActivityService.getGradesCalculatedByUser(uid, 200);
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
              <Button onClick={() => setAddOpen(true)}>Add Admin</Button>
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
                <div className="font-semibold text-gray-800 mb-2">Activity for {selectedAdmin.displayName}</div>
                <div className="space-y-2">
                  {activity.map(g => (
                    <div key={g.id} className="p-2 border rounded text-sm bg-white">
                      Calculated grade for course {g.courseId} on {g.calculatedAt.toDate().toLocaleString()} (student {g.studentId})
                    </div>
                  ))}
                  {activity.length === 0 && <div className="text-sm text-gray-500">No activity found.</div>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Full name" value={newAdmin.displayName} onChange={(e)=> setNewAdmin({ ...newAdmin, displayName: e.target.value })} />
            <Input placeholder="Email" type="email" value={newAdmin.email} onChange={(e)=> setNewAdmin({ ...newAdmin, email: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setAddOpen(false)}>Cancel</Button>
            <Button onClick={async ()=>{
              // For now, just navigate admins to Users page to create; or create minimal record if needed
              // In this simplified flow, Super Admin should use Users page to create with Admin role
              window.location.href = '/dashboard/users';
            }}>Go to Users to Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
