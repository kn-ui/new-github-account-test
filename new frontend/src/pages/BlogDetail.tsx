import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Share2 } from 'lucide-react';

const BlogDetail: React.FC = () => {
  return (
    <div>
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Image */}
        <img 
          src="https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg" 
          alt="Classroom with desks and chairs"
          className="w-full h-96 object-cover rounded-lg mb-8"
        />

        {/* Author and Meta */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">DH</span>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">Dr. Tekle Haymanot</div>
            <div className="text-sm text-gray-500">Admissions Office</div>
          </div>
          <div className="flex items-center text-sm text-gray-500 ml-auto">
            <Calendar className="w-4 h-4 mr-1" />
            582 days ago
          </div>
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Article Content */}
        <article className="prose prose-lg max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            The Importance of Spiritual Education in Modern Times
          </h1>

          <p className="text-lg text-gray-700 mb-6">
            Greetings in Christ, fellow students and faculty members.
          </p>

          <p className="text-gray-700 mb-6">
            I've been deeply contemplating the spiritual and theological foundations of fasting periods in our 
            Ethiopian Orthodox tradition, and I believe this would be an excellent topic for our community to 
            discuss together.
          </p>

          <p className="text-gray-700 mb-6">
            As we know, fasting is not merely abstaining from food, but a complete spiritual discipline that 
            involves prayer, contemplation, and acts of charity. In our Orthodox tradition, we observe several 
            major fasting periods throughout the year:
          </p>

          <ol className="list-decimal list-inside space-y-2 mb-6 text-gray-700">
            <li><strong>**The Great Fast (Hudadi/Lent)**</strong> - 55 days before Easter</li>
            <li><strong>**The Fast of the Apostles**</strong> - From the end of Pentecost until June 29</li>
            <li><strong>**The Fast of the Assumption**</strong> - August 1-15</li>
            <li><strong>**The Christmas Fast**</strong> - November 25 to January 6</li>
          </ol>

          <p className="text-gray-700 mb-6">
            Each of these periods has its unique spiritual significance and helps prepare us for major feast days. 
            But I'm particularly interested in understanding:
          </p>

          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700">
            <li>How does fasting transform our relationship with God?</li>
            <li>What role does community support play during fasting periods?</li>
            <li>How can we maintain the spiritual focus of fasting in our modern educational environment?</li>
          </ul>

          <p className="text-gray-700 mb-6">
            I've been reading the writings of the early church fathers on this topic, particularly Saint John 
            Chrysostom's homilies on fasting, and I'm fascinated by how relevant their teachings remain for us 
            today.
          </p>

          <p className="text-gray-700 mb-6">
            What are your thoughts and experiences with Orthodox fasting? How has it shaped your spiritual 
            journey?
          </p>

          <p className="text-gray-700 mb-6">
            Looking forward to a rich discussion!
          </p>

          <p className="text-gray-700 mb-2">
            <strong>**Blessings,**</strong>
          </p>
          <p className="text-gray-700">
            Michael
          </p>
        </article>

        {/* Back to Blog Button */}
        <div className="mt-12 text-center">
          <Link 
            to="/blog" 
            className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;