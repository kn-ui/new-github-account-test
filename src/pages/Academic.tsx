import Header from '@/components/Header';

const Academic = () => {
  const departments = [
    { id: 1, name: 'Biblical Studies', description: 'Comprehensive study of scripture, hermeneutics, and biblical interpretation', duration: '4 Years', credits: '120 Credits', degree: 'Bachelor of Theology', courses: ['Old Testament Survey','New Testament Theology','Biblical Hermeneutics','Hebrew Language','Greek Language','Biblical Archaeology'] },
    { id: 2, name: 'Systematic Theology', description: 'Systematic study of Christian doctrine and theological principles', duration: '4 Years', credits: '120 Credits' },
    { id: 3, name: 'Church History', description: 'Historical development of Christianity from apostolic times to present', duration: '3 Years', credits: '90 Credits' },
    { id: 4, name: 'Pastoral Care & Counseling', description: 'Training in spiritual guidance, counseling, and pastoral ministry', duration: '3 Years', credits: '90 Credits' },
    { id: 5, name: 'Christian Ethics', description: 'Moral theology and ethical decision-making in Christian context', duration: '2 Years', credits: '60 Credits' },
    { id: 6, name: 'Liturgical Studies', description: 'Study of worship, liturgy, and sacramental theology', duration: '3 Years', credits: '90 Credits' },
    { id: 7, name: 'Mission & Evangelism', description: 'Training for missionary work and evangelistic ministry', duration: '3 Years', credits: '90 Credits' },
    { id: 8, name: 'Youth & Family Ministry', description: 'Specialized training for youth and family-focused ministry', duration: '2 Years', credits: '60 Credits' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/src/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Academic Programs</h1>
          <p className="text-xl mb-8">Comprehensive theological education for spiritual leaders and servants</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Departments</h2>
          <p className="text-lg text-gray-600">Explore our comprehensive range of theological and spiritual studies programs</p>
        </div>

        <div className="space-y-6 cursor-pointer">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{dept.name}</h3>
                  <p className="text-gray-600 mb-4">{dept.description}</p>
                  {dept.courses && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Core Courses</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {dept.courses.map((course, idx) => (
                            <li key={idx} className="flex items-center"><span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>{course}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Program Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-600">Duration:</span><span className="font-medium">{dept.duration}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Total Credits:</span><span className="font-medium">{dept.credits}</span></div>
                          {dept.degree && <div className="flex justify-between"><span className="text-gray-600">Degree Type:</span><span className="font-medium">{dept.degree}</span></div>}
                        </div>
                        <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">Learn More & Apply</button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm text-gray-500 mb-1">{dept.duration}</div>
                  <div className="text-sm font-medium text-gray-700">{dept.credits}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Academic Journey?</h2>
          <p className="text-xl mb-8">Take the first step towards your calling in spiritual leadership and service.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">Apply for Admission</button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-md font-medium hover:bg-white hover:text-blue-600 transition-colors">Download Brochure</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Academic;