import React from 'react';
import { Clock, Users, Star, ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FeaturedCourses() {
  const courses = [
    {
      id: 1,
      title: 'Introduction to Biblical Studies',
      description: 'A comprehensive foundation course covering the essential principles of biblical interpretation and study.',
      instructor: 'Rev. Michael Thompson',
      duration: '8 weeks',
      students: 245,
      rating: 4.9,
      level: 'Beginner',
      image: 'https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 2,
      title: 'Christian Ethics and Moral Theology',
      description: 'Explore the foundations of Christian ethics and their application in modern life and decision-making.',
      instructor: 'Dr. Sarah Williams',
      duration: '10 weeks',
      students: 189,
      rating: 4.8,
      level: 'Intermediate',
      image: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 3,
      title: 'Church History and Traditions',
      description: 'Journey through 2000 years of church history, from the apostolic age to contemporary Christianity.',
      instructor: 'Prof. David Chen',
      duration: '12 weeks',
      students: 156,
      rating: 4.7,
      level: 'Advanced',
      image: 'https://images.pexels.com/photos/276267/pexels-photo-276267.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const levelColors: Record<string, string> = {
    'Beginner': 'bg-green-100 text-green-800',
    'Intermediate': 'bg-yellow-100 text-yellow-800',
    'Advanced': 'bg-red-100 text-red-800'
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Academic Departments</h2>
            <p className="text-gray-600 mt-2">Comprehensive programs designed to provide both spiritual formation and academic excellence.</p>
          </div>
          <Link to="/courses" className="hidden md:inline-flex">
            <button className="inline-flex items-center gap-2 bg-[#0e4fb9] text-white px-4 py-2 rounded-md hover:bg-[#0d43a0]">
              Explore All Programs <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
              <div className="relative overflow-hidden">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${levelColors[course.level]}`}>
                    {course.level}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                  {course.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {course.description}
                </p>
                
                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{course.students}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-current text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Instructor: <span className="font-medium text-gray-900">{course.instructor}</span>
                  </p>
                </div>
                
                <Link to="/courses" className="block">
                  <button className="w-full bg-[#0e4fb9] text-white py-3 px-4 rounded-lg hover:bg-[#0d43a0] transition-colors duration-300 flex items-center justify-center space-x-2 font-medium">
                    <BookOpen className="h-4 w-4" />
                    <span>Enroll Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12 md:hidden">
          <Link to="/courses">
            <button className="inline-flex items-center gap-2 bg-[#0e4fb9] text-white px-6 py-3 rounded-md">
              Explore All Programs <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}