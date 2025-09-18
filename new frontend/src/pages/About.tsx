import React from 'react';
import { BookOpen, Users, Heart, Award } from 'lucide-react';

const About: React.FC = () => {
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
            <p className="text-xl mb-8">
              Learn About Our Mission, Vision, and Values
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-6">
              St. Raguel Church Spiritual School is dedicated to providing comprehensive Orthodox Christian education that nurtures both spiritual growth and academic excellence. We prepare students to become faithful servants of God and productive members of society.
            </p>
            <p className="text-gray-600">
              Rooted in the rich traditions of the Ethiopian Orthodox Tewahedo Church, our institution combines rigorous academic study with deep spiritual formation, creating an environment where faith and learning flourish together.
            </p>
          </div>
          <div>
            <img 
              src="https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg"
              alt="Students in classroom"
              className="w-full h-80 object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Academic Excellence</h3>
            <p className="text-sm text-gray-600">Committed to the highest standards of education and scholarship</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Spiritual Growth</h3>
            <p className="text-sm text-gray-600">Fostering deep faith and spiritual maturity in our students</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Service</h3>
            <p className="text-sm text-gray-600">Preparing students to serve their communities with love</p>
          </div>
          <div className="text-center">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Orthodox Tradition</h3>
            <p className="text-sm text-gray-600">Preserving and teaching our rich Orthodox heritage</p>
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our History</h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="mb-4">
              Founded in 1995, St. Raguel Church Spiritual School has been a beacon of Orthodox Christian education in Ethiopia for over three decades. Our institution was established with the vision of creating a learning environment where students could grow in both faith and knowledge.
            </p>
            <p className="mb-4">
              Throughout our history, we have remained committed to the teachings of the Ethiopian Orthodox Tewahedo Church while embracing modern educational methodologies. Our graduates have gone on to serve as priests, deacons, teachers, and community leaders, carrying forward the light of Orthodox faith.
            </p>
            <p>
              Today, we continue to build upon this legacy, preparing the next generation of Orthodox Christians to face the challenges of the modern world while remaining firmly rooted in their faith and traditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;