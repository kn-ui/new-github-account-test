import { firestore } from '../config/firebase';
import { BlogPost } from '../types';

class BlogService {
  // Use collection name 'blogs' to match existing data
  private collection = firestore?.collection('blogs');

  async getPosts(page = 1, limit = 10, search?: string, category?: string): Promise<{ posts: BlogPost[]; total: number; }> {
    try {
      if (!this.collection) {
        return { posts: [], total: 0 };
      }

      let query: FirebaseFirestore.Query = this.collection.orderBy('createdAt', 'desc');

      if (category) {
        query = query.where('category', '==', category);
      }

      // Simple title prefix search if provided
      if (search) {
        query = query.where('title', '>=', search).where('title', '<=', search + '\uf8ff');
      }

      const snapshot = await query.get();
      const total = snapshot.size;
      const offset = (page - 1) * limit;
      const docs = snapshot.docs.slice(offset, offset + limit);

      const posts: BlogPost[] = docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      return { posts, total };
    } catch (e) {
      console.error('BlogService.getPosts error:', e);
      return { posts: [], total: 0 };
    }
  }
}

export default new BlogService();
