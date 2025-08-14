import { firestore, isTestMode } from '../config/firebase';
import { ForumThread, ForumThreadPost } from '../types';

class ForumService {
  private threads = firestore?.collection('forum_threads');
  private posts = firestore?.collection('forum_posts');

  async listThreads(page = 1, limit = 20, category?: string): Promise<{ threads: ForumThread[]; total: number; }> {
    if (isTestMode || !this.threads) return { threads: [], total: 0 };

    let query: FirebaseFirestore.Query = this.threads.orderBy('lastActivityAt', 'desc');
    if (category) query = query.where('category', '==', category);

    const snapshot = await query.get();
    const total = snapshot.size;
    const docs = snapshot.docs.slice((page - 1) * limit, (page - 1) * limit + limit);
    const threads: ForumThread[] = docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    return { threads, total };
  }

  async listPosts(threadId: string, page = 1, limit = 50): Promise<{ posts: ForumThreadPost[]; total: number; }> {
    if (isTestMode || !this.posts) return { posts: [], total: 0 };

    let query: FirebaseFirestore.Query = this.posts.where('threadId', '==', threadId).orderBy('createdAt', 'asc');
    const snapshot = await query.get();
    const total = snapshot.size;
    const docs = snapshot.docs.slice((page - 1) * limit, (page - 1) * limit + limit);
    const posts: ForumThreadPost[] = docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    return { posts, total };
  }

  async createThread(params: { title: string; category: string; createdBy: string; createdByName: string; }): Promise<ForumThread> {
    if (isTestMode || !this.threads) {
      return {
        id: 'test',
        title: params.title,
        category: params.category,
        createdBy: params.createdBy,
        createdByName: params.createdByName,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        pinned: false,
      } as ForumThread;
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
    if (isTestMode || !this.posts || !this.threads) {
      return {
        id: 'test',
        threadId: params.threadId,
        body: params.body,
        createdBy: params.createdBy,
        createdByName: params.createdByName,
        createdAt: new Date(),
      } as ForumThreadPost;
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
