import Header from '@/components/Header';

const Admissions = () => {
  const requirements = [
    { program: 'Theology & Scripture Studies', education: 'High school diploma or equivalent', age: '18+ years', documents: 'Orthodox Christian faith, Basic Biblical knowledge' },
    { program: 'Church Music & Liturgy', education: 'High school diploma', age: '17+ years', documents: 'Music aptitude, Orthodox liturgy familiarity' },
    { program: 'Ancient Languages', education: 'High school diploma', age: '17+ years', documents: 'Strong language learning ability' },
    { program: 'Spiritual Formation', education: 'Basic theology completion', age: '21+ years', documents: 'Demonstrated spiritual maturity' },
    { program: 'General Studies', education: 'Elementary completion', age: '14+ years', documents: 'Regular church attendance' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/src/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Admissions</h1>
          <p className="text-xl mb-8">Join Our Orthodox Educational Community</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Process</h2>
          <p className="text-lg text-gray-600">Our admission process is designed to identify students who are committed to Orthodox Christian education and have the potential to succeed in our academic programs.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {[
            { step: 1, title: 'Check Eligibility', desc: 'Review admission requirements for your desired program' },
            { step: 2, title: 'Prepare Documents', desc: 'Gather all required documentation' },
            { step: 3, title: 'Submit Application', desc: 'Complete and submit your application form' },
            { step: 4, title: 'Interview Process', desc: 'Participate in admission interviews' },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 text-2xl font-bold">{s.step}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 py-12 rounded-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Admission Requirements</h2>
              <p className="text-lg text-gray-600">Requirements vary by program to ensure students are prepared for their chosen field of study.</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-blue-600 text-white py-4 px-6 grid grid-cols-4 gap-4 font-semibold">
                <div>Program</div>
                <div>Education Level</div>
                <div>Minimum Age</div>
                <div>Special Requirements</div>
              </div>
              {requirements.map((req, idx) => (
                <div key={idx} className={`py-4 px-6 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="font-medium text-gray-900">{req.program}</div>
                    <div className="text-gray-600">{req.education}</div>
                    <div className="text-gray-600">{req.age}</div>
                    <div className="text-gray-600">{req.documents}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Begin Your Orthodox Education Journey?</h2>
          <p className="text-xl mb-8">Join hundreds of students who have discovered their calling through our comprehensive Orthodox Christian education programs.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white text-orange-600 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">Apply Now →</button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-md font-medium hover:bg-white hover:text-orange-600 transition-colors">Contact Admissions Office</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admissions;