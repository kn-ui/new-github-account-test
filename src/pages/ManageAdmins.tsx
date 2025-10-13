import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { userService } from '@/lib/firestore';
import { api } from '@/lib/api';

export default function ManageAdmins() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const all = await (await import('@/lib/firestore')).userService.getAllUsersIncludingInactive();
    setAdmins(all.filter((u: any) => u.role === 'admin'));
  };

  useEffect(() => { load(); }, []);

  const createAdmin = async () => {
    setSaving(true);
    try {
      await api.createUser({ email: form.email, displayName: form.displayName, role: 'admin' as any });
      await load();
      setOpen(false);
      setForm({ displayName: '', email: '' });
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
