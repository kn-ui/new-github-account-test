/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supportTicketService, FirestoreSupportTicket } from '@/lib/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const SupportTicketsPage = () => {
  const [tickets, setTickets] = useState<FirestoreSupportTicket[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await supportTicketService.getAllTickets();
        setTickets(data);
      } catch (e) {
        toast.error('Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateStatus = async (id: string, status: FirestoreSupportTicket['status']) => {
    try {
      await supportTicketService.updateTicketStatus(id, status);
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      toast.success('Ticket status updated');
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const filtered = tickets.filter(t =>
    [t.subject, t.message, t.email, t.name].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading tickets...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
              <p className="text-gray-600">View and manage all support tickets</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3">
            <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4">
          {filtered.map(ticket => (
            <div key={ticket.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div className="text-xs">
                    <div className="font-medium">{ticket.subject}</div>
                    <div className="text-gray-600">{ticket.name} ({ticket.email})</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={ticket.status} onValueChange={(v) => updateStatus(ticket.id, v as any)}>
                    <SelectTrigger className="h-8 w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-sm text-gray-700 mt-3">{ticket.message}</div>
              <div className="text-xs text-gray-500 mt-2">{ticket.createdAt.toDate().toLocaleString()}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-gray-500">No tickets found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTicketsPage;