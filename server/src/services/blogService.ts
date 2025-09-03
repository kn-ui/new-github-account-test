import { firestore } from '../config/firebase';
import { BlogPost } from '../types';

class BlogService {
  private collection = firestore?.collection('blog_posts');

  async getPosts(page = 1, limit = 10, search?: string, category?: string): Promise<{ posts: BlogPost[]; total: number; }> {
    if (!this.collection) {
      return { posts: [], total: 0 };
    }

    let query: FirebaseFirestore.Query = this.collection.orderBy('createdAt', 'desc');

    if (category) {
      query = query.where('category', '==', category);
    }

    // Firestore doesn't support OR text search; do simple title prefix search if provided
    if (search) {
      query = query.where('title', '>=', search).where('title', '<=', search + '\uf8ff');
    }

    const snapshot = await query.get();
    const total = snapshot.size;
    const offset = (page - 1) * limit;
    const docs = snapshot.docs.slice(offset, offset + limit);

    const posts: BlogPost[] = docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    return { posts, total };
  }
}

export default new BlogService();
