import React from 'react';
import { CheckCircle, AlertCircle, FileText, Users, Calendar, Star, Download } from 'lucide-react';

const Admission: React.FC = () => {
  const applicationSteps = [
    {
      icon: CheckCircle,
      title: 'Check Eligibility',
      description: 'Review admission requirements for your desired program',
      details: [
        'Educational background',
        'Language proficiency',
        'Spiritual commitment',
        'Age requirements'
      ]
    },
    {
      icon: FileText,
      title: 'Prepare Documents',
      description: 'Gather all required documentation',
      details: [
        'Academic transcripts',
        'Reference certificate',
        'Personal statement',
        'Identity documents'
      ]
    },
    {
      icon: AlertCircle,
      title: 'Submit Application',
      description: 'Complete and submit your application form',
      details: [
        'Online application form',
        'Application fee payment',
        'Document submission',
        'Application review'
      ]
    },
    {
      icon: Users,
      title: 'Interview Process',
      description: 'Participate in admission interviews',
      details: [
        'Academic assessment',
        'Spiritual maturity evaluation',
        'Program-specific orientation',
        'Final decision'
      ]
    }
  ];

  const requirements = [
    {
      program: 'Theology & Scripture Studies',
      education: 'High school diploma or equivalent',
      age: '18+ years',
      documents: 'Orthodox Christian faith, Basic Biblical knowledge'
    },
    {
      program: 'Church Music & Liturgy',
      education: 'High school diploma',
      age: '17+ years',
      documents: 'Music aptitude, Orthodox liturgy familiarity'
    },
    {
      program: 'Ancient Languages',
      education: 'High school diploma',
      age: '17+ years',
      documents: 'Strong language learning ability'
    },
    {
      program: 'Spiritual Formation',
      education: 'Basic theology completion',
      age: '21+ years',
      documents: 'Demonstrated spiritual maturity'
    },
    {
      program: 'General Studies',
      education: 'Elementary completion',
      age: '14+ years',
      documents: 'Regular church attendance'
    }
  ];

  const timeline = [
    {
      title: 'Application Period Opens',
      description: 'Submit applications and required documents',
      date: 'January 1 - March 31'
    },
    {
      title: 'Document Review',
      description: 'Admissions committee reviews all applications',
      date: 'April 1 - April 30'
    },
    {
      title: 'Interview Process',
      description: 'Selected candidates participate in interviews',
      date: 'May 1 - May 31'
    },
    {
      title: 'Admission Decisions',
      description: 'Acceptance letters sent to successful candidates',
      date: 'June 15'
    },
    {
      title: 'Enrollment Period',
      description: 'Accepted students confirm enrollment and pay fees',
      date: 'July 1 - July 31'
    },
    {
      title: 'Academic Year Begins',
      description: 'Classes commence for the new academic year',
      date: 'September 1'
    }
  ];

  return (
    <div>
    
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Admissions</h1>
            <p className="text-xl mb-8">
              Join Our Orthodox Educational Community
            </p>
          </div>
        </div>
      </div>

      {/* Application Process */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Process</h2>
          <p className="text-lg text-gray-600">
            Our admission process is designed to identify students who are committed to<br />
            Orthodox Christian education and have the potential to succeed in our academic<br />
            programs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {applicationSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full inline-block mb-2">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center justify-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors">
            Start Your Application →
          </button>
        </div>
      </div>

      {/* Registration Requirements - per provided rules */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Requirements</h2>
            <p className="text-lg text-gray-600">
              Please review the exact requirements for each applicant group before registration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Extension, Online and Regular */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Extension, Online and Regular</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span><span>Photo</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span><span>Registration fee</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span><span>Academic Document (more than grade 10)</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span><span>Pre-exam pass point</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span><span>From other Sunday school Equivalent Document and letter of transfer</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span><span>From different religion should bring Certificate of baptism</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span><span>Age more than 18</span></li>
              </ul>
            </div>

            {/* Children and Adolescent */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Children and Adolescent</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5"></span><span>Photo</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5"></span><span>Registration fee</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5"></span><span>Academic Document (more than grade 10)</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5"></span><span>Pre-exam pass point</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5"></span><span>From other Sunday school Equivalent Document and letter of transfer</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5"></span><span>Birth certificate</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5"></span><span>Family Profile</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5"></span><span>Age less than 18</span></li>
              </ul>
            </div>

            {/* Youth */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Youth</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-green-600 rounded-full mt-1.5"></span><span>Certificate of continuum education</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-green-600 rounded-full mt-1.5"></span><span>Member of Sunday school</span></li>
                <li className="flex items-start space-x-2"><span className="w-2 h-2 bg-green-600 rounded-full mt-1.5"></span><span>Age more than 18 years</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Admission Requirements */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Admission Requirements</h2>
            <p className="text-lg text-gray-600">
              Requirements vary by program to ensure students are prepared for their chosen<br />
              field of study.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-blue-600 text-white py-4 px-6">
              <div className="grid grid-cols-4 gap-4 font-semibold">
                <div>Program</div>
                <div>Education Level</div>
                <div>Minimum Age</div>
                <div>Special Requirements</div>
              </div>
            </div>
            {requirements.map((req, index) => (
              <div key={index} className={`py-4 px-6 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="font-medium text-gray-900">{req.program}</div>
                  <div className="text-gray-600">{req.education}</div>
                  <div className="text-gray-600">{req.age}</div>
                  <div className="text-gray-600">{req.documents}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Required Documents</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Academic transcripts</li>
                <li>Certificate of baptism</li>
                <li>Letter of recommendation</li>
                <li>Statement of faith</li>
              </ul>
            </div>
            <div className="text-center">
              <Star className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Selection Criteria</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Academic performance</li>
                <li>Spiritual maturity</li>
                <li>Community involvement</li>
                <li>Program-specific skills</li>
              </ul>
            </div>
            <div className="text-center">
              <Download className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Download Forms</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Application Form</li>
                <li>Recommendation Letter Template</li>
                <li>Statement of Faith Guide</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Application Timeline */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Timeline</h2>
          <p className="text-lg text-gray-600">
            Important dates and deadlines for the upcoming academic year admission<br />
            process.
          </p>
        </div>

        <div className="space-y-8">
          {timeline.map((item, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-4 h-4 bg-blue-600 rounded-full mt-1"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
              <div className="flex-shrink-0 text-sm text-blue-600 font-medium">
                {item.date}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Begin Your Orthodox Education Journey?</h2>
          <p className="text-xl mb-8">
            Join hundreds of students who have discovered their calling through our<br />
            comprehensive Orthodox Christian education programs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white text-orange-600 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
              Apply Now →
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-md font-medium hover:bg-white hover:text-orange-600 transition-colors">
              Contact Admissions Office
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admission;