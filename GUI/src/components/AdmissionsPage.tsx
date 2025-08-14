import React, { useState } from 'react';
import { FileText, CheckCircle, Clock, User, Mail, Phone, Upload, Download } from 'lucide-react';

export default function AdmissionsPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const admissionSteps = [
    {
      step: 1,
      title: 'Check Eligibility',
      description: 'Review admission requirements and ensure you meet the criteria',
      icon: CheckCircle,
      status: 'completed'
    },
    {
      step: 2,
      title: 'Prepare Documents',
      description: 'Gather all required documents and certificates',
      icon: FileText,
      status: 'current'
    },
    {
      step: 3,
      title: 'Submit Application',
      description: 'Complete and submit your online application form',
      icon: Upload,
      status: 'upcoming'
    },
    {
      step: 4,
      title: 'Interview Process',
      description: 'Attend the admission interview and assessment',
      icon: User,
      status: 'upcoming'
    },
    {
      step: 5,
      title: 'Final Decision',
      description: 'Receive admission decision and enrollment instructions',
      icon: Mail,
      status: 'upcoming'
    }
  ];

  const requirements = [
    'High School Diploma or equivalent certificate',
    'Official transcripts from previous educational institutions',
    'Two letters of recommendation (one from a religious leader)',
    'Personal statement of faith and calling (500-1000 words)',
    'Completed application form with application fee',
    'Recent passport-size photographs (2 copies)',
    'Medical certificate of good health',
    'Police clearance certificate (for international students)'
  ];

  const documents = [
    { name: 'Application Form', type: 'PDF', size: '2.3 MB', required: true },
    { name: 'Recommendation Letter Template', type: 'DOC', size: '1.1 MB', required: true },
    { name: 'Personal Statement Guidelines', type: 'PDF', size: '856 KB', required: true },
    { name: 'International Student Guide', type: 'PDF', size: '3.2 MB', required: false },
    { name: 'Financial Aid Information', type: 'PDF', size: '1.8 MB', required: false }
  ];

  const getStepStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'current':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'upcoming':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600 text-white';
      case 'current':
        return 'bg-blue-600 text-white';
      case 'upcoming':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Admissions</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
              Begin your journey in theological education and spiritual formation
            </p>
          </div>
        </div>
      </div>

      {/* Admission Process Timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Admission Process</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Follow these simple steps to complete your application
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 hidden md:block"></div>
            
            <div className="space-y-8">
              {admissionSteps.map((step, index) => (
                <div key={step.step} className="relative flex items-start">
                  {/* Step Icon */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${getStepIcon(step.status)} relative z-10`}>
                    <step.icon className="h-8 w-8" />
                  </div>
                  
                  {/* Step Content */}
                  <div className="ml-6 flex-1">
                    <div className={`bg-white p-6 rounded-lg shadow-lg border-2 ${getStepStatus(step.status)}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold">Step {step.step}: {step.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStepStatus(step.status)}`}>
                          {step.status}
                        </span>
                      </div>
                      <p className="text-gray-600">{step.description}</p>
                      
                      {step.status === 'current' && (
                        <div className="mt-4">
                          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Start This Step
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility Requirements */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Eligibility Requirements</h2>
              <p className="text-lg text-gray-600 mb-8">
                To be considered for admission, applicants must meet the following requirements:
              </p>
              
              <div className="space-y-4">
                {requirements.map((requirement, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{requirement}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Important Dates</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Application Deadline:</span>
                    <span className="font-medium">March 31, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interview Period:</span>
                    <span className="font-medium">April 15-30, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Decision Notification:</span>
                    <span className="font-medium">May 15, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enrollment Deadline:</span>
                    <span className="font-medium">June 30, 2025</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Required Documents</h2>
              <p className="text-lg text-gray-600 mb-8">
                Download the necessary forms and review the guidelines before applying:
              </p>
              
              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{doc.name}</h3>
                          <p className="text-sm text-gray-500">{doc.type} • {doc.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {doc.required && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            Required
                          </span>
                        )}
                        <button className="text-blue-600 hover:text-blue-800 transition-colors">
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <button className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg flex items-center justify-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Start Online Application</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Help with Your Application?</h2>
            <p className="text-xl text-gray-600">
              Our admissions team is here to assist you throughout the process
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600">+251-11-123-4567</p>
              <p className="text-sm text-gray-500">Mon-Fri, 9AM-5PM</p>
            </div>
            
            <div className="text-center">
              <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">admissions@straguel.edu.et</p>
              <p className="text-sm text-gray-500">Response within 24 hours</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">In Person</h3>
              <p className="text-gray-600">Admissions Office</p>
              <p className="text-sm text-gray-500">Schedule an appointment</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}