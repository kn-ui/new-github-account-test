import { firestore } from '../config/firebase';
import { EventItem } from '../types';

class EventService {
  private collection = firestore?.collection('events');

  async getEvents(page = 1, limit = 50, type?: string, month?: string): Promise<{ events: EventItem[]; total: number; }> {
    if (!this.collection) {
      return { events: [], total: 0 };
    }

    let query: FirebaseFirestore.Query = this.collection.orderBy('date', 'asc');

    if (type) {
      query = query.where('type', '==', type);
    }

    // Filter by month (YYYY-MM)
    if (month) {
      query = query.where('date', '>=', month + '-01').where('date', '<=', month + '-31');
    }

    const snapshot = await query.get();
    const total = snapshot.size;
    const offset = (page - 1) * limit;
    const docs = snapshot.docs.slice(offset, offset + limit);

    const events: EventItem[] = docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    return { events, total };
  }
}

export default new EventService();
