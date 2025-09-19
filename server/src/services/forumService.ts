import { firestore } from '../config/firebase';
import { ForumThread, ForumThreadPost } from '../types';

class ForumService {
  private threads = firestore?.collection('forum_threads');
  private posts = firestore?.collection('forum_posts');

  async listThreads(page = 1, limit = 20, category?: string): Promise<{ threads: ForumThread[]; total: number; }> {
    try {
      if (!this.threads) {
        console.warn('ForumService.listThreads: firestore not initialized');
        return { threads: [], total: 0 };
      }

      let query: FirebaseFirestore.Query = this.threads.orderBy('lastActivityAt', 'desc');
      if (category) query = query.where('category', '==', category);

      const snapshot = await query.get();
      const total = snapshot.size;
      const docs = snapshot.docs.slice((page - 1) * limit, (page - 1) * limit + limit);
      const threads: ForumThread[] = docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      return { threads, total };
    } catch (e) {
      console.error('ForumService.listThreads error:', e);
      return { threads: [], total: 0 };
    }
  }

  async listPosts(threadId: string, page = 1, limit = 50): Promise<{ posts: ForumThreadPost[]; total: number; }> {
    try {
      if (!this.posts) {
        console.warn('ForumService.listPosts: firestore not initialized');
        return { posts: [], total: 0 };
      }

      let query: FirebaseFirestore.Query = this.posts.where('threadId', '==', threadId).orderBy('createdAt', 'asc');
      const snapshot = await query.get();
      const total = snapshot.size;
      const docs = snapshot.docs.slice((page - 1) * limit, (page - 1) * limit + limit);
      const posts: ForumThreadPost[] = docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      return { posts, total };
    } catch (e) {
      console.error('ForumService.listPosts error:', e);
      return { posts: [], total: 0 };
    }
  }

  async createThread(params: { title: string; category: string; createdBy: string; createdByName: string; }): Promise<ForumThread> {
    if (!this.threads) {
      throw new Error('Forum threads collection not initialized');
    }
    const doc = {
      title: params.title,
      category: params.category,
      createdBy: params.createdBy,
      createdByName: params.createdByName,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      pinned: false,
    };
    const ref = await this.threads.add(doc as any);
    return { id: ref.id, ...(doc as any) };
  }

  async createPost(params: { threadId: string; body: string; createdBy: string; createdByName: string; }): Promise<ForumThreadPost> {
    if (!this.posts || !this.threads) {
      throw new Error('Forum posts or threads collection not initialized');
    }
    const doc = {
      threadId: params.threadId,
      body: params.body,
      createdBy: params.createdBy,
      createdByName: params.createdByName,
      createdAt: new Date(),
    };
    const ref = await this.posts.add(doc as any);
    await this.threads.doc(params.threadId).update({ lastActivityAt: new Date() });
    return { id: ref.id, ...(doc as any) };
  }
}

export default new ForumService();
