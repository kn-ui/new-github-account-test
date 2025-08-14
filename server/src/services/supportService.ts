import { firestore, isTestMode } from '../config/firebase';
import { SupportTicket } from '../types';

class SupportService {
  private collection = firestore?.collection('support_tickets');

  async create(ticket: Omit<SupportTicket, 'id' | 'status' | 'createdAt' | 'updatedAt'> & { userId?: string }): Promise<SupportTicket> {
    if (isTestMode || !this.collection) {
      return { ...(ticket as any), id: 'test', status: 'open', createdAt: new Date(), updatedAt: new Date() };
    }
    const doc = {
      ...ticket,
      status: 'open' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const ref = await this.collection.add(doc as any);
    return { id: ref.id, ...(doc as any) };
  }

  async listByUser(userId: string, page = 1, limit = 20): Promise<{ tickets: SupportTicket[]; total: number; }> {
    if (isTestMode || !this.collection) return { tickets: [], total: 0 };
    const q = this.collection.where('userId', '==', userId).orderBy('createdAt', 'desc');
    const snapshot = await q.get();
    const total = snapshot.size;
    const docs = snapshot.docs.slice((page - 1) * limit, (page - 1) * limit + limit);
    const tickets = docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    return { tickets, total };
  }
}

export default new SupportService();
