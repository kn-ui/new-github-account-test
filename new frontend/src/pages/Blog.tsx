import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Tag, ChevronRight } from 'lucide-react';

const Blog: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All Updates');
  
  const tabs = ['All Updates (8)', 'Announcements (3)', 'Blog Posts (2)', 'Events (1)'];
  
  const posts = [
    {
      id: 1,
      type: 'Announcement',
      title: 'New Academic Year Registration Opens',
      excerpt: 'Registration for the 2024-2025 academic year is now open. Students can submit their applications through our online portal. The registration period will continue until March 31st, 2024.',
      image: 'https://images.pexels.com/photos/5905709/pexels-photo-5905709.jpeg',
      author: 'Admissions Office',
      date: '1/19/2024',
      featured: true
    },
    {
      id: 2,
      type: 'Event',
      title: 'Annual Cultural Festival - March 20th',
      excerpt: 'Join us for our annual celebration of Ethiopian Orthodox traditions, music, and arts. The festival will feature student performances, traditional food, and cultural exhibitions.',
      image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg',
      author: 'Cultural Committee',
      date: '1/20/2024',
      featured: true
    },
    {
      id: 3,
      type: 'Blog',
      title: 'The Importance of Spiritual Education in Modern Times',
      excerpt: 'In our increasingly secular world, spiritual education shapes character and provides moral values. This article explores how Orthodox Christian education shapes character and prepares students for life.',
      image: 'https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg',
      author: 'Dr. Tekle Haymanot',
      date: '1/9/2024'
    },
    {
      id: 4,
      type: 'Announcement',
      title: 'New Library Resources Available',
      excerpt: 'Our library has acquired new theological texts and digital resources to support student research and contemporary Orthodox scholarship.',
      image: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg',
      author: 'Library Services',
      date: '1/8/2024'
    },
    {
      id: 5,
      type: 'Blog',
      title: 'Understanding Orthodox Fasting Practices',
      excerpt: 'A comprehensive guide to Orthodox fasting traditions, their spiritual significance, and practical guidance for students observing these sacred periods.',
      image: 'https://images.pexels.com/photos/4397740/pexels-photo-4397740.jpeg',
      author: 'Fr. Michael Tesfaye',
      date: '1/8/2024'
    },
    {
      id: 6,
      type: 'Announcement',
      title: 'Scholarship Opportunities for 2024-2025',
      excerpt: 'Several scholarship opportunities are available for merit-based and need-based applicants. Applications are now being accepted for next academic year.',
      image: 'https://images.pexels.com/photos/8923157/pexels-photo-8923157.jpeg',
      author: 'Financial Aid Office',
      date: '1/2/2024'
    }
  ];

  const featuredPosts = posts.filter(post => post.featured);
  const regularPosts = posts.filter(post => !post.featured);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Announcement':
        return 'bg-orange-100 text-orange-800';
      case 'Event':
        return 'bg-green-100 text-green-800';
      case 'Blog':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Updates & News</h1>
            <p className="text-xl mb-8">
              Stay Informed About School News, Events, and Insights
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Tabs */}
        <div className="flex space-x-1 mb-8 border-b">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.split(' (')[0])}
              className={`px-6 py-3 text-sm font-medium rounded-t-lg ${
                activeTab === tab.split(' (')[0] || (activeTab === 'All Updates' && tab === tabs[0])
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Featured Updates */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Featured <span className="text-yellow-600">Updates</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(post.type)}`}>
                      {post.type}
                    </span>
                    <span className="text-sm text-gray-500">{post.date}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
                  <p className="text-gray-600 mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="w-4 h-4 mr-1" />
                      {post.author}
                    </div>
                    <Link 
                      to={`/blog/${post.id}`} 
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                    >
                      Read More <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regular Posts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {regularPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(post.type)}`}>
                    {post.type}
                  </span>
                  <span className="text-xs text-gray-500">{post.date}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{post.excerpt.substring(0, 120)}...</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-gray-500">
                    <User className="w-3 h-3 mr-1" />
                    {post.author}
                  </div>
                  <Link 
                    to={`/blog/${post.id}`} 
                    className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center"
                  >
                    Read More <ChevronRight className="w-3 h-3 ml-1" />
                  </Link>
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
          <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">3</button>
          <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">4</button>
          <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Next</button>
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated with Our <span className="text-yellow-300">Newsletter</span></h2>
          <p className="text-xl mb-8">
            Subscribe to our newsletter to receive the latest updates, announcements, and<br />
            insights directly in your inbox.
          </p>
          <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-md font-medium transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;