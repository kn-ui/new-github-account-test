/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Edit2, Trash2, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { eventService, FirestoreEvent } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const EventsPage = () => {
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FirestoreEvent | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', description: '' });
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const data = await eventService.getEvents(500);
      setEvents(data);
    } catch (e) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', date: '', description: '' });
    setShowDialog(true);
  };

  const openEdit = (ev: FirestoreEvent) => {
    setEditing(ev);
    const d = (ev.date as any)?.toDate ? (ev.date as any).toDate() : (ev.date as unknown as Date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setForm({ title: ev.title, date: `${y}-${m}-${day}`, description: ev.description });
    setShowDialog(true);
  };

  const save = async () => {
    try {
      if (!form.title || !form.date || !form.description) {
        toast.error('Please fill in all required fields');
        return;
      }
      const payload = {
        title: form.title,
        date: new Date(form.date) as any,
        description: form.description,
        createdBy: 'admin'
      };
      if (editing) {
        await eventService.updateEvent(editing.id, payload as any);
        toast.success('Event updated');
      } else {
        await eventService.createEvent(payload as any);
        toast.success('Event created');
      }
      setShowDialog(false);
      await load();
    } catch (e) {
      toast.error('Failed to save event');
    }
  };

  const remove = async (id: string) => {
    try {
      await eventService.deleteEvent(id);
      toast.success('Event deleted');
      await load();
    } catch (e) {
      toast.error('Failed to delete event');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading events...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Events</h1>
              <p className="text-gray-600">Manage all system calendar events</p>
            </div>
            <div className="ml-auto">
              <Button onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" /> New Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(ev => {
            const d = (ev.date as any)?.toDate ? (ev.date as any).toDate() : (ev.date as unknown as Date);
            return (
              <div key={ev.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">{ev.title}</div>
                      <div className="text-xs text-gray-500">{d.toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(ev)}>
                      <Edit2 className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => remove(ev.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-700 mt-3">{ev.description}</div>
              </div>
            );
          })}
          {events.length === 0 && (
            <div className="text-center text-gray-500 col-span-full">No events found</div>
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="evTitle">Title</Label>
              <Input id="evTitle" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="evDate">Date</Label>
              <Input id="evDate" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="evDesc">Description</Label>
              <Textarea id="evDesc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={save}>Save</Button>
              <Button className="flex-1" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsPage;