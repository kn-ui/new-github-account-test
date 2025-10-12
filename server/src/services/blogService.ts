import { hygraphClient } from '../config/hygraph';
import { gql } from 'graphql-request';
import { BlogPost } from '../types';

class BlogService {
  async getPosts(page = 1, limit = 10, search?: string, category?: string): Promise<{ posts: BlogPost[]; total: number; }> {
    try {
      const skip = (page - 1) * limit;
      const whereParts: string[] = [];
      if (search) whereParts.push(`title_contains: $search`);
      if (category) whereParts.push(`category: $category`);
      const where = whereParts.length ? `where: { ${whereParts.join(', ')} }` : '';

      const query = gql`
        query ListBlogPosts($first: Int!, $skip: Int!, $search: String, $category: String) {
          blogPostsConnection(first: $first, skip: $skip, ${where}, orderBy: createdAt_DESC) {
            aggregate { count }
            edges { node { id title content likes author { displayName uid } category } }
          }
        }
      `;

      const data = await hygraphClient.request<{
        blogPostsConnection: { aggregate: { count: number }, edges: { node: any }[] }
      }>(query, { first: limit, skip, search, category });

      const posts: BlogPost[] = data.blogPostsConnection.edges.map(e => ({
        id: e.node.id,
        title: e.node.title,
        excerpt: '',
        content: e.node.content,
        authorId: e.node.author?.uid || '',
        authorName: e.node.author?.displayName || '',
        category: e.node.category || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        readTime: undefined,
        image: undefined,
        tags: [],
      }));
      const total = data.blogPostsConnection.aggregate.count;
      return { posts, total };
    } catch (e) {
      console.error('BlogService.getPosts error:', e);
      return { posts: [], total: 0 };
    }
  }
}

export default new BlogService();
