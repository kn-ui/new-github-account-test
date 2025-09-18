import React, { useEffect, useState } from 'react';
import { data, Link } from 'react-router-dom';
import { BookOpen, Music, Languages, Heart, Users, Clock, Target, FileText } from 'lucide-react';
import { QUERY_Update, graphcms } from '/src/Graphql/Queries';


const Home: React.FC = () => {
  const upcomingEvents = [
    {
      title: 'Fall Semester Begins',
      description: 'First day of classes for the fall semester',
      date: 'Monday, January 29, 2024',
      time: '8:00 AM',
      location: 'Main Campus',
      category: 'Academic',
      categoryColor: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Timkat Celebration',
      description: 'Ethiopian Orthodox celebration of Epiphany',
      date: 'Sunday, January 19, 2024',
      time: '6:00 AM',
      location: 'Church Grounds',
      category: 'Religious',
      categoryColor: 'bg-purple-100 text-purple-800'
    },
    {
      title: 'New Student Orientation',
      description: 'Welcome and orientation for new students',
      date: 'Saturday, January 13, 2024',
      time: '9:00 AM',
      location: 'Assembly Hall',
      category: 'Academic',
      categoryColor: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Mid-term Examinations',
      description: 'Mid semester examinations for all courses',
      date: 'Saturday, February 17, 2024',
      time: '8:00 AM',
      location: 'Examination Halls',
      category: 'Examinations',
      categoryColor: 'bg-red-100 text-red-800'
    }
  ];

  const departments = [
    {
      title: 'Theology & Scripture',
      description: 'Deep study of Christian theology and biblical studies',
      icon: BookOpen
    },
    {
      title: 'Church Music & Liturgy',
      description: 'Traditional music, chants, and liturgical practices',
      icon: Music
    },
    {
      title: 'Ancient Languages',
      description: 'Geez, Amharic, and other liturgical languages',
      icon: Languages
    },
    {
      title: 'Spiritual Formation',
      description: 'Personal faith development and spiritual growth',
      icon: Heart
    },
    {
      title: 'Community Service',
      description: 'Outreach programs and community engagement',
      icon: Users
    },
    {
      title: 'Church History',
      description: 'Ethiopian Orthodox heritage and traditions',
      icon: Clock
    },
    {
      title: 'Sacred Arts',
      description: 'Iconography, calligraphy, and crafts',
      icon: Target
    },
    {
      title: 'Practical Studies',
      description: 'Mathematics, science, and general subjects',
      icon: FileText
    }
  ];

  const stats = [
    { number: '500+', label: 'Students', description: 'Enrolled across all programs' },
    { number: '30+', label: 'Years', description: 'Of educational excellence' },
    { number: '50+', label: 'Faculty', description: 'Dedicated Orthodox educators' },
    { number: '1', label: 'Beautiful Campus', description: 'Peaceful learning environment' }
  ];
 const [Update, setUpdate] = useState();
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    graphcms.request(QUERY_Update)
      .then(data => {
        console.log("data: " + JSON.stringify(data, null, 2)); // Log the fetched data to inspect its structure
        setUpdate(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);


  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Nurturing Faith,<br />
                Building <span className="text-yellow-300">Character</span>
              </h1>
              <p className="text-xl mb-8">
                St. Raguel Church Spiritual School provides comprehensive Orthodox education rooted in Ethiopian traditions and academic excellence.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/admission"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition-colors"
                >
                  Apply Now →
                </Link>
                <Link 
                  to="/academic"
                  className="border-2 border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Explore Programs
                </Link>
              </div>
            </div>
            <div>
              <img 
                src="../../asset/hero-img.png"
                alt="Orthodox Church"
                className="w-full h-100 object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Message from School */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <img 
              src="../../asset/message-from-school-img.png"
              alt="School Building"
              className="w-full h-80 object-cover rounded-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Message From The School</h2>
            <p className="text-gray-600 mb-4">
              For generations, we have guided students in both faith and knowledge, rooted in the traditions of the Ethiopian Orthodox Church.
            </p>
            <p className="text-gray-600 mb-6">
              We invite you to discover our community where spiritual growth and academic excellence walk hand in hand, preparing young minds for service, leadership, and lifelong learning.
            </p>
            <Link 
              to="/admission"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              About Our Services
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
            <p className="text-lg text-gray-600">8 Major Upcoming Events Found</p>
          </div>

          <div className="space-y-4 mb-8">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.categoryColor}`}>
                        {event.category}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-2">{event.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 {event.date}</span>
                      <span>🕐 {event.time}</span>
                      <span>📍 {event.location}</span>
                    </div>
                  </div>
                  
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link 
              to="/calendar"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              More Events →
            </Link>
          </div>
        </div>
      </div>

      {/* Academic Departments */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Academic Departments</h2>
          <p className="text-lg text-gray-600">
            Comprehensive programs designed to provide both spiritual formation and<br />
            academic excellence in the Orthodox tradition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {departments.map((dept, index) => {
            const Icon = dept.icon;
            return (
              <div key={index} className="text-center p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{dept.title}</h3>
                <p className="text-sm text-gray-600">{dept.description}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link 
            to="/academic"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
          >
            Explore All Programs →
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-xl font-semibold mb-1">{stat.label}</div>
                <div className="text-sm opacity-90">{stat.description}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link 
              to="/academic"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              Get to Know Us →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;