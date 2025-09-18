import React, { useState } from 'react';
import { BookOpen, Users, Clock, Heart, Scroll, Church, User, GraduationCap } from 'lucide-react';

const Academic: React.FC = () => {
  const departments = [
    {
      id: 1,
      name: 'Biblical Studies',
      description: 'Comprehensive study of scripture, hermeneutics, and biblical interpretation',
      icon: BookOpen,
      duration: '4 Years',
      credits: '120 Credits',
      degree: 'Bachelor of Theology',
      courses: [
        'Old Testament Survey',
        'New Testament Theology',
        'Biblical Hermeneutics',
        'Hebrew Language',
        'Greek Language',
        'Biblical Archaeology'
      ]
    },
    {
      id: 2,
      name: 'Systematic Theology',
      description: 'Systematic study of Christian doctrine and theological principles',
      icon: Scroll,
      duration: '4 Years',
      credits: '120 Credits'
    },
    {
      id: 3,
      name: 'Church History',
      description: 'Historical development of Christianity from apostolic times to present',
      icon: Clock,
      duration: '3 Years',
      credits: '90 Credits'
    },
    {
      id: 4,
      name: 'Pastoral Care & Counseling',
      description: 'Training in spiritual guidance, counseling, and pastoral ministry',
      icon: Heart,
      duration: '3 Years',
      credits: '90 Credits'
    },
    {
      id: 5,
      name: 'Christian Ethics',
      description: 'Moral theology and ethical decision-making in Christian context',
      icon: Users,
      duration: '2 Years',
      credits: '60 Credits'
    },
    {
      id: 6,
      name: 'Liturgical Studies',
      description: 'Study of worship, liturgy, and sacramental theology',
      icon: Church,
      duration: '3 Years',
      credits: '90 Credits'
    },
    {
      id: 7,
      name: 'Mission & Evangelism',
      description: 'Training for missionary work and evangelistic ministry',
      icon: User,
      duration: '3 Years',
      credits: '90 Credits'
    },
    {
      id: 8,
      name: 'Youth & Family Ministry',
      description: 'Specialized training for youth and family-focused ministry',
      icon: GraduationCap,
      duration: '2 Years',
      credits: '60 Credits'
    }
  ];


  // instead of a single boolean
  const [openDept, setOpenDept] = useState(null);


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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Academic Programs</h1>
            <p className="text-xl mb-8">
              Comprehensive theological education for spiritual leaders<br />
              and servants
            </p>
          </div>
        </div>
      </div>

      {/* Departments Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Departments</h2>
          <p className="text-lg text-gray-600">
            Explore our comprehensive range of theological and spiritual studies<br />
            programs
          </p>
        </div>

        <div className="space-y-6 cursor-pointer">
          {departments.map((dept) => {
            const Icon = dept.icon;
            return (
              <div key={dept.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow" 
                onClick={() => setOpenDept(openDept === dept.id ? null : dept.id)}

              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>

                    
                    <div className="flex-1 " 

                     >
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{dept.name}</h3>
                      <p className="text-gray-600 mb-4">{dept.description}</p>
                      
                      {openDept === dept.id && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Core Courses</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                              {dept.courses?.map((course, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                                  {course}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Program Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{dept.duration}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Credits:</span>
                                <span className="font-medium">{dept.credits}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Degree Type:</span>
                                <span className="font-medium">{dept.degree}</span>
                              </div>
                            </div>
                            <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                              Learn More & Apply
                            </button>
                          </div>
                        </div>
          )}
                    </div>
                    
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm text-gray-500 mb-1">{dept.duration}</div>
                    <div className="text-sm font-medium text-gray-700">{dept.credits}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Academic Journey?</h2>
          <p className="text-xl mb-8">
            Take the first step towards your calling in spiritual leadership and service.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
              Apply for Admission
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-md font-medium hover:bg-white hover:text-blue-600 transition-colors">
              Download Brochure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Academic;