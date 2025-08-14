import React, { useState } from 'react';
import { Calendar, User, Tag, Search, ChevronRight, Clock } from 'lucide-react';

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'All Posts' },
    { value: 'theology', label: 'Theology' },
    { value: 'spirituality', label: 'Spirituality' },
    { value: 'community', label: 'Community' },
    { value: 'education', label: 'Education' },
    { value: 'events', label: 'Events' }
  ];

  const blogPosts = [
    {
      id: 1,
      title: 'The Role of Prayer in Modern Spiritual Formation',
      excerpt: 'Exploring how traditional prayer practices can be integrated into contemporary spiritual development programs for students and community members.',
      content: 'In our rapidly changing world, the ancient practice of prayer remains a cornerstone of spiritual formation...',
      author: 'Rev. Father Abraham Tekle',
      date: '2025-01-15',
      category: 'spirituality',
      readTime: '5 min read',
      image: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=600',
      tags: ['Prayer', 'Spiritual Formation', 'Modern Christianity']
    },
    {
      id: 2,
      title: 'Understanding Ethiopian Orthodox Theology',
      excerpt: 'A comprehensive look at the unique theological perspectives and traditions that shape Ethiopian Orthodox Christianity.',
      content: 'Ethiopian Orthodox theology offers rich insights into early Christian thought and practice...',
      author: 'Dr. Sarah Mekonnen',
      date: '2025-01-12',
      category: 'theology',
      readTime: '8 min read',
      image: 'https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg?auto=compress&cs=tinysrgb&w=600',
      tags: ['Ethiopian Orthodox', 'Theology', 'Church History']
    },
    {
      id: 3,
      title: 'Community Outreach: Serving Beyond the Classroom',
      excerpt: 'How our students are making a difference in local communities through various service projects and initiatives.',
      content: 'Education extends far beyond the classroom walls. Our students actively engage with local communities...',
      author: 'Deacon Michael Haile',
      date: '2025-01-10',
      category: 'community',
      readTime: '6 min read',
      image: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600',
      tags: ['Community Service', 'Outreach', 'Student Life']
    },
    {
      id: 4,
      title: 'Integrating Technology in Theological Education',
      excerpt: 'Exploring innovative ways to use modern technology while preserving the essence of traditional theological learning.',
      content: 'As we embrace the digital age, we must thoughtfully integrate technology into our educational approach...',
      author: 'Prof. David Chen',
      date: '2025-01-08',
      category: 'education',
      readTime: '7 min read',
      image: 'https://images.pexels.com/photos/276267/pexels-photo-276267.jpeg?auto=compress&cs=tinysrgb&w=600',
      tags: ['Technology', 'Education', 'Innovation']
    },
    {
      id: 5,
      title: 'Celebrating Timkat: A Reflection on Baptism',
      excerpt: 'The spiritual significance of the Ethiopian Orthodox celebration of Epiphany and its connection to Christian baptism.',
      content: 'Timkat, the Ethiopian Orthodox celebration of Epiphany, offers profound insights into the meaning of baptism...',
      author: 'Rev. Father Abraham Tekle',
      date: '2025-01-05',
      category: 'spirituality',
      readTime: '4 min read',
      image: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=600',
      tags: ['Timkat', 'Baptism', 'Ethiopian Orthodox', 'Celebration']
    },
    {
      id: 6,
      title: 'New Academic Year: Welcoming Fresh Perspectives',
      excerpt: 'As we begin a new academic year, we reflect on the opportunities for growth and learning that lie ahead.',
      content: 'Each new academic year brings fresh energy, new students, and exciting opportunities for growth...',
      author: 'Dr. Sarah Mekonnen',
      date: '2025-01-03',
      category: 'events',
      readTime: '3 min read',
      image: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=600',
      tags: ['Academic Year', 'New Students', 'Growth']
    }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      theology: 'bg-blue-100 text-blue-800',
      spirituality: 'bg-purple-100 text-purple-800',
      community: 'bg-green-100 text-green-800',
      education: 'bg-yellow-100 text-yellow-800',
      events: 'bg-red-100 text-red-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Blog & Updates</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
              Insights, reflections, and news from our spiritual community
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Posts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredPosts.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {filteredPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                  <div className="relative overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(post.category)}`}>
                        {categories.find(c => c.value === post.category)?.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(post.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors font-medium">
                      <span>Read More</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Stay Updated</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter to receive the latest blog posts, announcements, and spiritual insights directly in your inbox.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Subscribe
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              We respect your privacy and will never share your email address.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}