import React from 'react';
import { Users, BookOpen, Clock, AlertTriangle, Heart, FileText, Download } from 'lucide-react';

const Rules: React.FC = () => {
  const ruleCategories = [
    {
      title: 'Student Conduct',
      icon: Users,
      color: 'bg-blue-100 text-blue-800',
      rules: [
        'Maintain respectful behavior towards faculty, staff, and fellow students',
        'Dress modestly and appropriately according to institutional guidelines',
        'Attend all scheduled classes and participate actively in discussions',
        'Submit assignments on time and maintain academic honesty',
        'Participate in community worship and spiritual formation activities'
      ]
    },
    {
      title: 'Academic Standards',
      icon: BookOpen,
      color: 'bg-green-100 text-green-800',
      rules: [
        'Maintain a minimum GPA of 3.5 to remain in good academic standing',
        'Complete all required coursework within the designated timeframe',
        'Cite all sources properly and avoid plagiarism in all academic work',
        'Attend at least 80% of classes for each course to be eligible for examinations',
        'Seek academic support when needed through tutoring and counseling services'
      ]
    },
    {
      title: 'Attendance Policy',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      rules: [
        'Regular attendance is mandatory for all classes and chapel services',
        'Notify instructors in advance for any planned absences when possible',
        'Provide documentation for medical or emergency-related absences',
        'Make up missed work within one week of returning to class',
        'Excessive absences may result in course failure or disciplinary action'
      ]
    },
    {
      title: 'Campus Safety',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800',
      rules: [
        'Follow all safety protocols and emergency procedures',
        'Report any safety concerns or incidents to campus security immediately',
        'Maintain clean and organized living and study spaces',
        'Respect campus property and report any damages promptly',
        'Comply with visitor policies and escort guests at all times'
      ]
    },
    {
      title: 'Spiritual Formation',
      icon: Heart,
      color: 'bg-purple-100 text-purple-800',
      rules: [
        'Participate actively in daily prayers and weekly chapel services',
        'Engage respectfully in interfaith dialogue and discussions',
        'Complete required spiritual formation activities and retreats',
        'Maintain personal devotional practices as encouraged by faculty',
        'Serve the community through volunteer work and outreach programs'
      ]
    },
    {
      title: 'Disciplinary Procedures',
      icon: FileText,
      color: 'bg-orange-100 text-orange-800',
      rules: [
        'Minor infractions result in verbal warnings and counseling',
        'Repeated violations may lead to written warnings and probation',
        'Serious misconduct can result in suspension or expulsion',
        'Students have the right to appeal disciplinary decisions',
        'All disciplinary actions are documented in student records'
      ]
    }
  ];

  const downloadableDocuments = [
    {
      title: 'Complete Student Handbook',
      description: 'Comprehensive guide covering all policies and procedures',
      size: 'PDF • 2.8 MB',
      icon: FileText
    },
    {
      title: 'Academic Policies',
      description: 'Detailed academic requirements and grading policies',
      size: 'PDF • 1.2 MB',
      icon: BookOpen
    },
    {
      title: 'Code of Conduct',
      description: 'Student behavior expectations and disciplinary procedures',
      size: 'PDF • 890 KB',
      icon: Users
    },
    {
      title: 'Campus Safety Guidelines',
      description: 'Safety protocols and emergency procedures',
      size: 'PDF • 1.5 MB',
      icon: AlertTriangle
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Rules & Regulations</h1>
            <p className="text-xl mb-8">
              Guidelines for maintaining a respectful and productive<br />
              learning environment
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Community Standards</h2>
          <p className="text-lg text-gray-600">
            These guidelines help create a supportive environment where all members of our<br />
            community can grow spiritually, academically, and personally. We expect all students<br />
            to uphold these standards with <strong>integrity</strong> and <strong>respect</strong>.
          </p>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {ruleCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <Icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{category.title}</h3>
                </div>
                <ul className="space-y-3">
                  {category.rules.map((rule, ruleIndex) => (
                    <li key={ruleIndex} className="flex items-start space-x-2 text-sm text-gray-700">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Important Notice</h3>
              <p className="text-blue-800 mb-2">
                All students are expected to read and acknowledge understanding of these rules and regulations upon enrollment. Violations of these policies may result in disciplinary action, including but not limited to warnings, probation, suspension, or expulsion from the institution.
              </p>
              <p className="text-blue-700 text-sm">
                If you have questions about any of these policies, please contact the Student Affairs Office for clarification and guidance.
              </p>
            </div>
          </div>
        </div>

        {/* Download Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Download Complete Guidelines</h2>
          <p className="text-lg text-gray-600 mb-8">
            Access detailed policy documents for comprehensive information
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {downloadableDocuments.map((doc, index) => {
              const Icon = doc.icon;
              return (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                      <p className="text-xs text-gray-500">{doc.size}</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Questions About Our Policies?</h2>
          <p className="text-xl mb-8">
            Our Student Affairs team is here to help clarify any questions you may have
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
              Contact Student Affairs
            </button>
            <button className="border-2 border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white hover:text-blue-600 transition-colors">
              Schedule Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rules;