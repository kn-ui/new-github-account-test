import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageCircle, Users, Eye, ThumbsUp } from 'lucide-react';
import { QUERY_Form, graphcms } from '/src/Graphql/Queries';


const Forum: React.FC = () => {
  const [form, setForm] = useState();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Topics');


   useEffect(() => {
     graphcms.request(QUERY_Form)
        .then(data => {
          console.log("data: " + JSON.stringify(data, null, 2)); // Log the fetched data to inspect its structure
          setForm(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching data:', err);
          setLoading(false);
        });
    }, []);
  

  const stats = [
    { number: '124', label: 'Total Topics' },
    { number: '89', label: 'Active Members' },
    { number: '456', label: 'Total Posts' },
    { number: '12', label: "Today's Posts" }
  ];

  const categories = [
    { name: 'All Topics', count: 24 },
    { name: 'Theology & Scripture', count: 8 },
    { name: 'Liturgy & Worship', count: 5 },
    { name: 'Spiritual Formation', count: 6 },
    { name: 'Academic Discussion', count: 3 },
    { name: 'General Discussion', count: 2 }
  ];

  const discussions = [
    {
      id: 1,
      category: 'Theology & Scripture',
      categoryColor: 'bg-blue-100 text-blue-800',
      title: 'Understanding the Significance of Fasting in Ethiopian Orthodox Tradition',
      description: "Let's discuss the spiritual and theological foundations of fasting periods in our Orthodox tradition...",
      author: 'Michael Teshome',
      authorAvatar: 'MT',
      replies: 12,
      views: 245,
      likes: 18,
      lastReply: 'Sarah Kidane',
      lastReplyTime: '578 days ago'
    },
    {
      id: 2,
      category: 'Academic Discussion',
      categoryColor: 'bg-green-100 text-green-800',
      title: 'Study Group for Ancient Languages - Geez and Greek',
      description: 'Anyone interested in forming a study group for ancient languages? We could meet weekly...',
      author: 'David Hailu',
      authorAvatar: 'DH',
      replies: 8,
      views: 156,
      likes: 12,
      lastReply: 'Ruth Abraham',
      lastReplyTime: '579 days ago'
    },
    {
      id: 3,
      category: 'Liturgy & Worship',
      categoryColor: 'bg-purple-100 text-purple-800',
      title: 'Proper Conduct During Divine Liturgy - Questions and Discussion',
      description: 'I have some questions about proper liturgical conduct and would love to hear from experienced members...',
      author: 'Anna Gebre',
      authorAvatar: 'AG',
      replies: 15,
      views: 298,
      likes: 25,
      lastReply: 'Father Yohannes',
      lastReplyTime: '581 days ago'
    },
    {
      id: 4,
      category: 'Spiritual Formation',
      categoryColor: 'bg-yellow-100 text-yellow-800',
      title: 'Monthly Prayer Group',
      description: 'Would anyone be interested in joining a monthly prayer group? We could explore different...',
      author: 'Martha Desta',
      authorAvatar: 'MD',
      replies: 6,
      views: 134,
      likes: 9,
      lastReply: 'Tekle Mariam',
      lastReplyTime: '582 days ago'
    },
    {
      id: 5,
      category: 'Theology & Scripture',
      categoryColor: 'bg-blue-100 text-blue-800',
      title: 'Ethiopian Orthodox Icons: Symbolism and Meaning',
      description: 'Researching the rich symbolism in Ethiopian Orthodox iconography and would love to discuss...',
      author: 'Solomon Kebede',
      authorAvatar: 'SK',
      replies: 9,
      views: 187,
      likes: 14,
      lastReply: 'Hanna Tesfaye',
      lastReplyTime: '583 days ago'
    },
    {
      id: 6,
      category: 'General Discussion',
      categoryColor: 'bg-gray-100 text-gray-800',
      title: 'Community Service Projects - Let\'s Get Involved!',
      description: 'Our school has always emphasized community service. What projects are you passionate about?',
      author: 'Yodit Alemayehu',
      authorAvatar: 'YA',
      replies: 11,
      views: 203,
      likes: 16,
      lastReply: 'Bereket Tesfesse',
      lastReplyTime: '583 days ago'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        {/* Background Image */}
        <img
          src="../../asset/background-img.png"
          alt="background"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />

        {/* Overlay for gradient and content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Discussion Forum</h1>
            <p className="text-xl mb-8">
              Engage in Meaningful Conversations with Our<br />
              Community
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Community Discussions</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join conversations about theology, academic life, and spiritual formation.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-lg border border-gray-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Search */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Search Topics</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                      selectedCategory === category.name
                        ? 'bg-blue-100 text-blue-800'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Discussions */}
          <div className="lg:col-span-3">
            <div className="space-y-4 mb-8">
              {discussions.map((discussion) => (
                <div key={discussion.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">{discussion.authorAvatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${discussion.categoryColor}`}>
                          {discussion.category}
                        </span>
                      </div>
                      <Link 
                        to={`/forum/${discussion.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-2 block"
                      >
                        {discussion.title}
                      </Link>
                      <p className="text-gray-600 mb-3">{discussion.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>By {discussion.author}</span>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{discussion.replies} replies</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{discussion.views} views</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{discussion.likes} likes</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div>Last reply by {discussion.lastReply}</div>
                          <div>{discussion.lastReplyTime}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center space-x-2">
              <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Previous</button>
              <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md">1</button>
              <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">2</button>
              <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;