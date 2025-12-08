import React from 'react';
import { Shield, Users, BookOpen, Clock, Award, AlertTriangle, Download, FileText } from 'lucide-react';


export default function RulesPage() {
  const ruleCategories = [
    {
      icon: Users,
      title: 'Student Conduct',
      color: 'blue',
      rules: [
        'Maintain respectful behavior towards faculty, staff, and fellow students',
        'Dress modestly and appropriately according to institutional guidelines',
        'Attend all scheduled classes and participate actively in discussions',
        'Submit assignments on time and maintain academic honesty',
        'Participate in community worship and spiritual formation activities'
      ]
    },
    {
      icon: BookOpen,
      title: 'Academic Standards',
      color: 'green',
      rules: [
        'Maintain a minimum GPA of 2.5 to remain in good academic standing',
        'Complete all required coursework within the designated timeframe',
        'Cite all sources properly and avoid plagiarism in all academic work',
        'Attend at least 80% of classes for each course to be eligible for examinations',
        'Seek academic support when needed through tutoring and counseling services'
      ]
    },
    {
      icon: Clock,
      title: 'Attendance Policy',
      color: 'yellow',
      rules: [
        'Regular attendance is mandatory for all classes and chapel services',
        'Notify instructors in advance for planned absences when possible',
        'Provide documentation for medical or emergency-related absences',
        'Make up missed work within one week of returning to class',
        'Excessive absences may result in course failure or disciplinary action'
      ]
    },
    {
      icon: Shield,
      title: 'Campus Safety',
      color: 'red',
      rules: [
        'Follow all safety protocols and emergency procedures',
        'Report any safety concerns or incidents to campus security immediately',
        'Maintain clean and organized living and study spaces',
        'Respect campus property and report any damages promptly',
        'Comply with visitor policies and escort guests at all times'
      ]
    },
    {
      icon: Award,
      title: 'Spiritual Formation',
      color: 'purple',
      rules: [
        'Participate actively in daily prayers and weekly chapel services',
        'Engage respectfully in interfaith dialogue and discussions',
        'Complete required spiritual formation activities and retreats',
        'Maintain personal devotional practices as encouraged by faculty',
        'Serve the community through volunteer work and outreach programs'
      ]
    },
    {
      icon: AlertTriangle,
      title: 'Disciplinary Procedures',
      color: 'orange',
      rules: [
        'Minor infractions result in verbal warnings and counseling',
        'Repeated violations may lead to written warnings and probation',
        'Serious misconduct can result in suspension or expulsion',
        'Students have the right to appeal disciplinary decisions',
        'All disciplinary actions are documented in student records'
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const documents = [
    {
      title: 'Complete Student Handbook',
      description: 'Comprehensive guide covering all policies and procedures',
      size: '2.8 MB',
      type: 'PDF'
    },
    {
      title: 'Academic Policies',
      description: 'Detailed academic requirements and grading policies',
      size: '1.2 MB',
      type: 'PDF'
    },
    {
      title: 'Code of Conduct',
      description: 'Student behavior expectations and disciplinary procedures',
      size: '956 KB',
      type: 'PDF'
    },
    {
      title: 'Campus Safety Guidelines',
      description: 'Safety protocols and emergency procedures',
      size: '1.5 MB',
      type: 'PDF'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Rules & Regulations</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
              Guidelines for maintaining a respectful and productive learning environment
            </p>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Community Standards</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These guidelines help create a supportive environment where all members of our community 
              can grow spiritually, academically, and personally. We expect all students to uphold 
              these standards with integrity and respect.
            </p>
          </div>
        </div>
      </section>

      {/* Rules Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {ruleCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg border overflow-hidden">
                <div className={`p-6 border-b ${getColorClasses(category.color)}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-full bg-white`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">{category.title}</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  <ul className="space-y-3">
                    {category.rules.map((rule, ruleIndex) => (
                      <li key={ruleIndex} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 leading-relaxed">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg border-l-4 border-blue-600 p-8">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Important Notice</h3>
                <p className="text-gray-700 mb-4">
                  All students are required to read and acknowledge understanding of these rules and regulations 
                  upon enrollment. Violations of these policies may result in disciplinary action, including 
                  but not limited to warnings, probation, suspension, or expulsion from the institution.
                </p>
                <p className="text-gray-700">
                  If you have questions about any of these policies, please contact the Student Affairs Office 
                  for clarification and guidance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Downloadable Documents */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Download Complete Guidelines</h2>
            <p className="text-xl text-gray-600">
              Access detailed policy documents for comprehensive information
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {documents.map((doc, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
                      <p className="text-gray-600 mb-2">{doc.description}</p>
                      <p className="text-sm text-gray-500">{doc.type} • {doc.size}</p>
                    </div>
                  </div>
                  <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors">
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Questions About Our Policies?</h2>
          <p className="text-xl mb-8 opacity-90">
            Our Student Affairs team is here to help clarify any questions you may have
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-700 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
              Contact Student Affairs
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-700 transition-colors font-semibold">
              Schedule Appointment
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}