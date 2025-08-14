import React, { useState } from 'react';
import { MessageSquare, Users, Clock, ThumbsUp, Reply, Plus, Search, Filter } from 'lucide-react';

export default function ForumPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'All Topics', color: 'gray' },
    { value: 'theology', label: 'Theology', color: 'blue' },
    { value: 'spirituality', label: 'Spirituality', color: 'purple' },
    { value: 'academic', label: 'Academic Help', color: 'green' },
    { value: 'community', label: 'Community', color: 'yellow' },
    { value: 'announcements', label: 'Announcements', color: 'red' }
  ];

  const forumTopics = [
    {
      id: 1,
      title: 'Understanding the Trinity in Ethiopian Orthodox Theology',
      description: 'Let\'s discuss the unique perspectives on the Trinity within Ethiopian Orthodox tradition and how it differs from other Christian denominations.',
      author: 'Student_John',
      authorRole: 'Student',
      category: 'theology',
      createdAt: '2025-01-15T10:30:00Z',
      lastActivity: '2025-01-16T14:20:00Z',
      replies: 23,
      views: 156,
      likes: 12,
      isPinned: true,
      tags: ['Trinity', 'Ethiopian Orthodox', 'Theology']
    },
    {
      id: 2,
      title: 'Study Group for Biblical Hermeneutics Course',
      description: 'Looking to form a study group for the Biblical Hermeneutics course. We can meet weekly to discuss assignments and prepare for exams together.',
      author: 'Mary_S',
      authorRole: 'Student',
      category: 'academic',
      createdAt: '2025-01-14T16:45:00Z',
      lastActivity: '2025-01-16T09:15:00Z',
      replies: 8,
      views: 89,
      likes: 6,
      isPinned: false,
      tags: ['Study Group', 'Hermeneutics', 'Academic']
    },
    {
      id: 3,
      title: 'Prayer and Meditation Practices for Students',
      description: 'Share your favorite prayer and meditation practices that help you maintain spiritual focus during your studies.',
      author: 'Rev_Michael',
      authorRole: 'Teacher',
      category: 'spirituality',
      createdAt: '2025-01-13T08:20:00Z',
      lastActivity: '2025-01-15T18:30:00Z',
      replies: 31,
      views: 234,
      likes: 18,
      isPinned: false,
      tags: ['Prayer', 'Meditation', 'Spiritual Life']
    },
    {
      id: 4,
      title: 'Community Service Opportunities This Semester',
      description: 'Information about various community service opportunities available for students this semester. Get involved and make a difference!',
      author: 'Admin_Sarah',
      authorRole: 'Admin',
      category: 'announcements',
      createdAt: '2025-01-12T12:00:00Z',
      lastActivity: '2025-01-14T16:45:00Z',
      replies: 15,
      views: 198,
      likes: 22,
      isPinned: true,
      tags: ['Community Service', 'Volunteer', 'Announcement']
    },
    {
      id: 5,
      title: 'Balancing Academic Work and Spiritual Growth',
      description: 'How do you balance the demands of academic study with personal spiritual development? Share your tips and experiences.',
      author: 'David_W',
      authorRole: 'Student',
      category: 'community',
      createdAt: '2025-01-11T14:30:00Z',
      lastActivity: '2025-01-13T11:20:00Z',
      replies: 19,
      views: 167,
      likes: 14,
      isPinned: false,
      tags: ['Balance', 'Spiritual Growth', 'Academic Life']
    },
    {
      id: 6,
      title: 'Question about Church History Assignment',
      description: 'I\'m having trouble understanding the requirements for the Church History research paper. Can someone help clarify the expectations?',
      author: 'Student_Lisa',
      authorRole: 'Student',
      category: 'academic',
      createdAt: '2025-01-10T20:15:00Z',
      lastActivity: '2025-01-12T10:30:00Z',
      replies: 7,
      views: 78,
      likes: 3,
      isPinned: false,
      tags: ['Church History', 'Assignment Help', 'Question']
    }
  ];

  const getCategoryColor = (category: string) => {
    const colors = {
      theology: 'bg-blue-100 text-blue-800',
      spirituality: 'bg-purple-100 text-purple-800',
      academic: 'bg-green-100 text-green-800',
      community: 'bg-yellow-100 text-yellow-800',
      announcements: 'bg-red-100 text-red-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'Admin': 'bg-red-100 text-red-800',
      'Teacher': 'bg-blue-100 text-blue-800',
      'Student': 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const filteredTopics = forumTopics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort topics: pinned first, then by last activity
  const sortedTopics = filteredTopics.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Discussion Forum</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
              Connect, discuss, and learn together with our spiritual community
            </p>
          </div>
        </div>
      </div>

      {/* Forum Controls */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
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

            {/* New Topic Button */}
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>New Topic</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forum Topics */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {sortedTopics.length} Topic{sortedTopics.length !== 1 ? 's' : ''}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Sort by: Latest Activity</span>
                </div>
              </div>
            </div>

            {/* Topics List */}
            <div className="divide-y divide-gray-200">
              {sortedTopics.map((topic) => (
                <div key={topic.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    {/* Topic Icon */}
                    <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>

                    {/* Topic Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Title and Badges */}
                          <div className="flex items-center space-x-2 mb-2">
                            {topic.isPinned && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                                Pinned
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(topic.category)}`}>
                              {categories.find(c => c.value === topic.category)?.label}
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-700 transition-colors cursor-pointer mb-2">
                            {topic.title}
                          </h3>

                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {topic.description}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {topic.tags.map((tag, index) => (
                              <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          {/* Author and Time */}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>{topic.author}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(topic.authorRole)}`}>
                                {topic.authorRole}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>Last activity: {formatTimeAgo(topic.lastActivity)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-col items-end space-y-2 text-sm text-gray-500 ml-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Reply className="h-4 w-4" />
                              <span>{topic.replies}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{topic.views}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ThumbsUp className="h-4 w-4" />
                              <span>{topic.likes}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results */}
            {sortedTopics.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No topics found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Start a New Discussion
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Forum Guidelines */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Forum Guidelines</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Standards</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Be respectful and courteous to all community members</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Stay on topic and contribute meaningfully to discussions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Use appropriate language and maintain academic decorum</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Respect diverse viewpoints and engage in constructive dialogue</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Posting Guidelines</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Choose clear, descriptive titles for your topics</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Select the appropriate category for your post</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Search existing topics before creating new ones</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Use tags to help others find relevant discussions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}