import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { userService } from '@/lib/firestore';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ManageAdmins() {
  const { userProfile } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '', role: 'admin' as 'admin' | 'super_admin' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const all = await (await import('@/lib/firestore')).userService.getAllUsersIncludingInactive();
    setAdmins(all.filter((u: any) => u.role === 'admin'));
  };

  useEffect(() => { load(); }, []);

  if (!userProfile || userProfile.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <div className="text-gray-600">Super admin only</div>
        </div>
      </div>
    );
  }

  const createAdmin = async () => {
    setSaving(true);
    try {
      await api.createUser({ email: form.email, displayName: form.displayName, role: form.role as any });
      await load();
      setOpen(false);
      setForm({ displayName: '', email: '', role: 'admin' });
    } catch (e) { console.error(e); alert('Failed to create admin'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manage Admins</CardTitle>
            <Button onClick={() => setOpen(true)}>Add Admin</Button>
          </div>
        </CardHeader>
        <CardContent>
          {admins.length > 0 ? (
            <ul className="divide-y">
              {admins.map(a => (
                <li key={a.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{a.displayName}</div>
                    <div className="text-sm text-gray-600">{a.email}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">No admins yet.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm">Name</label>
              <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Role</label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createAdmin} disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
