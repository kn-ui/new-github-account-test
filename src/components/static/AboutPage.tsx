import React from 'react';
import { Users, Award, BookOpen, Heart, ArrowRight, MapPin, Phone, Mail } from 'lucide-react';
import SiteFooter from '../SiteFooter';

export default function AboutPage() {
  const leadership = [
    {
      name: 'Rev. Father Abraham Tekle',
      position: 'School Director',
      image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Leading the school with over 20 years of spiritual and educational experience.'
    },
    {
      name: 'Dr. Sarah Mekonnen',
      position: 'Academic Dean',
      image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'PhD in Theology, overseeing curriculum development and academic excellence.'
    },
    {
      name: 'Deacon Michael Haile',
      position: 'Student Affairs Director',
      image: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Dedicated to student welfare and spiritual guidance.'
    }
  ];

  const departments = [
    { name: 'Biblical Studies', icon: BookOpen, description: 'Comprehensive study of scripture and interpretation' },
    { name: 'Theology', icon: Award, description: 'Systematic theology and doctrinal studies' },
    { name: 'Church History', icon: Users, description: 'Historical development of Christianity' },
    { name: 'Pastoral Care', icon: Heart, description: 'Counseling and spiritual guidance training' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">About Our School</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
              Nurturing spiritual growth and academic excellence since 1985
            </p>
          </div>
        </div>
      </div>

      {/* History & Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our History & Mission</h2>
              <div className="space-y-6 text-lg text-gray-700">
                <p>
                  Founded in 1985, St. Raguel Church Spiritual School has been a beacon of spiritual education 
                  and community service for nearly four decades. Our institution was established with the vision 
                  of providing comprehensive theological education rooted in Orthodox Christian traditions.
                </p>
                <p>
                  Our mission is to equip students with deep spiritual knowledge, practical ministry skills, 
                  and a heart for service. We believe in nurturing both intellectual growth and spiritual 
                  maturity, preparing our graduates to serve their communities with wisdom and compassion.
                </p>
                <p>
                  Through rigorous academic programs, spiritual formation, and community engagement, 
                  we strive to develop leaders who will make a positive impact in their churches and society.
                </p>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=600" 
                alt="School History" 
                className="rounded-lg shadow-xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-blue-700 text-white p-6 rounded-lg shadow-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold">38+</div>
                  <div className="text-sm">Years of Excellence</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Leadership Team</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Meet the dedicated leaders who guide our institution with wisdom and vision
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {leadership.map((leader, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="aspect-w-3 aspect-h-4">
                  <img 
                    src={leader.image} 
                    alt={leader.name}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{leader.name}</h3>
                  <p className="text-blue-600 font-medium mb-3">{leader.position}</p>
                  <p className="text-gray-600">{leader.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Academic Departments</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our comprehensive range of theological and spiritual studies programs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {departments.map((dept, index) => (
              <div key={index} className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <dept.icon className="h-10 w-10 text-blue-700" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{dept.name}</h3>
                <p className="text-gray-600">{dept.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community & Outreach */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600" 
                alt="Community Outreach" 
                className="rounded-lg shadow-xl"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Community & Outreach</h2>
              <div className="space-y-6 text-lg text-gray-700">
                <p>
                  Our commitment extends beyond the classroom. We actively engage with local communities 
                  through various outreach programs, charitable initiatives, and educational workshops.
                </p>
                <p>
                  Students participate in community service projects, literacy programs, and spiritual 
                  counseling services, putting their learning into practice while serving those in need.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-700">500+</div>
                    <div className="text-sm text-gray-600">Families Served</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-700">25+</div>
                    <div className="text-sm text-gray-600">Community Programs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Begin Your Journey?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join our community of learners and discover your calling in spiritual service and leadership.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-700 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg flex items-center justify-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Explore Academics</span>
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-700 transition-colors font-semibold text-lg flex items-center justify-center space-x-2">
              <ArrowRight className="h-5 w-5" />
              <span>Apply Now</span>
            </button>
          </div>
        </div>
      </section>
      <SiteFooter />

    </div>
  );
}