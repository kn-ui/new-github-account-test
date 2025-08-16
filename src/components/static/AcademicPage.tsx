import React, { useState } from 'react';
import { BookOpen, Users, Award, Heart, Calendar, FileText, ChevronDown, ChevronRight } from 'lucide-react';

export default function AcademicPage() {
  const [expandedDepartment, setExpandedDepartment] = useState<number | null>(null);

  const departments = [
    {
      id: 1,
      name: 'Biblical Studies',
      icon: BookOpen,
      color: 'blue',
      shortDescription: 'Comprehensive study of scripture, hermeneutics, and biblical interpretation',
      fullDescription: 'Our Biblical Studies program offers an in-depth exploration of the Old and New Testaments, focusing on historical context, literary analysis, and theological interpretation. Students learn various hermeneutical approaches and develop skills in exegesis, preparing them for effective biblical teaching and preaching. The curriculum includes courses in Hebrew and Greek languages, biblical archaeology, and comparative religious studies.',
      courses: ['Old Testament Survey', 'New Testament Theology', 'Biblical Hermeneutics', 'Hebrew Language', 'Greek Language', 'Biblical Archaeology'],
      duration: '4 Years',
      credits: '120 Credits'
    },
    {
      id: 2,
      name: 'Systematic Theology',
      icon: Award,
      color: 'purple',
      shortDescription: 'Systematic study of Christian doctrine and theological principles',
      fullDescription: 'The Systematic Theology program provides a comprehensive study of Christian doctrine, covering fundamental theological topics such as the nature of God, Christology, pneumatology, soteriology, and eschatology. Students engage with historical and contemporary theological debates, developing critical thinking skills and a deep understanding of Orthodox Christian beliefs. The program emphasizes both academic rigor and practical application for ministry.',
      courses: ['Doctrine of God', 'Christology', 'Pneumatology', 'Soteriology', 'Ecclesiology', 'Eschatology'],
      duration: '4 Years',
      credits: '120 Credits'
    },
    {
      id: 3,
      name: 'Church History',
      icon: Users,
      color: 'teal',
      shortDescription: 'Historical development of Christianity from apostolic times to present',
      fullDescription: 'Our Church History program traces the development of Christianity from the apostolic era to the present day. Students study major historical periods, influential figures, theological controversies, and the evolution of church practices. Special attention is given to the Ethiopian Orthodox Church history and its unique contributions to world Christianity. The program helps students understand how historical context shapes contemporary church life.',
      courses: ['Early Church History', 'Medieval Christianity', 'Reformation Studies', 'Ethiopian Church History', 'Modern Church History', 'Patristics'],
      duration: '3 Years',
      credits: '90 Credits'
    },
    {
      id: 4,
      name: 'Pastoral Care & Counseling',
      icon: Heart,
      color: 'green',
      shortDescription: 'Training in spiritual guidance, counseling, and pastoral ministry',
      fullDescription: 'The Pastoral Care program equips students with essential skills for effective ministry and spiritual guidance. The curriculum combines theological foundations with practical counseling techniques, crisis intervention, and pastoral psychology. Students learn to provide compassionate care in various life situations, including grief, family conflicts, addiction, and spiritual struggles. Field experience and supervised practice are integral components of the program.',
      courses: ['Pastoral Psychology', 'Crisis Counseling', 'Family Ministry', 'Grief and Loss', 'Addiction Counseling', 'Spiritual Direction'],
      duration: '3 Years',
      credits: '90 Credits'
    },
    {
      id: 5,
      name: 'Christian Ethics',
      icon: FileText,
      color: 'amber',
      shortDescription: 'Moral theology and ethical decision-making in Christian context',
      fullDescription: 'The Christian Ethics program explores moral theology and ethical decision-making from a Christian perspective. Students examine contemporary ethical issues including bioethics, social justice, environmental stewardship, and business ethics. The program emphasizes the integration of biblical principles with practical ethical reasoning, preparing students to address complex moral questions in their communities and ministries.',
      courses: ['Moral Theology', 'Bioethics', 'Social Justice', 'Environmental Ethics', 'Business Ethics', 'Medical Ethics'],
      duration: '2 Years',
      credits: '60 Credits'
    },
    {
      id: 6,
      name: 'Liturgical Studies',
      icon: Calendar,
      color: 'indigo',
      shortDescription: 'Study of worship, liturgy, and sacramental theology',
      fullDescription: 'The Liturgical Studies program focuses on the theology and practice of Christian worship. Students study the historical development of liturgy, sacramental theology, and the role of music and art in worship. Special emphasis is placed on Ethiopian Orthodox liturgical traditions, including the study of Ge\'ez language and traditional chants. The program prepares students for leadership in worship and liturgical ministry.',
      courses: ['Liturgical Theology', 'Sacramental Studies', 'Ge\'ez Language', 'Sacred Music', 'Liturgical History', 'Worship Leadership'],
      duration: '3 Years',
      credits: '90 Credits'
    },
    {
      id: 7,
      name: 'Mission & Evangelism',
      icon: Users,
      color: 'red',
      shortDescription: 'Training for missionary work and evangelistic ministry',
      fullDescription: 'The Mission and Evangelism program prepares students for cross-cultural ministry and evangelistic work. The curriculum covers missiology, cultural anthropology, communication strategies, and church planting principles. Students learn to share the Gospel effectively across cultural boundaries while respecting local customs and traditions. Practical training includes field experience and internships with established mission organizations.',
      courses: ['Missiology', 'Cultural Anthropology', 'Church Planting', 'Cross-Cultural Communication', 'World Religions', 'Evangelism Methods'],
      duration: '3 Years',
      credits: '90 Credits'
    },
    {
      id: 8,
      name: 'Youth & Family Ministry',
      icon: Heart,
      color: 'pink',
      shortDescription: 'Specialized training for youth and family-focused ministry',
      fullDescription: 'The Youth and Family Ministry program equips students with specialized skills for working with young people and families. The curriculum covers developmental psychology, youth culture, family dynamics, and age-appropriate ministry methods. Students learn to design and implement effective programs for children, teenagers, and families, addressing contemporary challenges while building strong spiritual foundations.',
      courses: ['Youth Psychology', 'Family Dynamics', 'Children\'s Ministry', 'Adolescent Development', 'Family Counseling', 'Youth Programming'],
      duration: '2 Years',
      credits: '60 Credits'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      teal: 'bg-teal-100 text-teal-700 border-teal-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      amber: 'bg-amber-100 text-amber-700 border-amber-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const toggleDepartment = (id: number) => {
    setExpandedDepartment(expandedDepartment === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Academic Programs</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
              Comprehensive theological education for spiritual leaders and servants
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#admissions" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Admissions
            </a>
            <a href="#calendar" className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium">
              Academic Calendar
            </a>
            <a href="#rules" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
              Rules & Regulations
            </a>
          </div>
        </div>
      </div>

      {/* Academic Departments */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Departments</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our comprehensive range of theological and spiritual studies programs
            </p>
          </div>

          <div className="space-y-6">
            {departments.map((dept) => (
              <div key={dept.id} className="bg-white rounded-xl shadow-lg border overflow-hidden">
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleDepartment(dept.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${getColorClasses(dept.color)}`}>
                        <dept.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{dept.name}</h3>
                        <p className="text-gray-600 mt-1">{dept.shortDescription}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right text-sm text-gray-500">
                        <div>{dept.duration}</div>
                        <div>{dept.credits}</div>
                      </div>
                      {expandedDepartment === dept.id ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedDepartment === dept.id && (
                  <div className="px-6 pb-6 border-t bg-gray-50">
                    <div className="pt-6">
                      <p className="text-gray-700 mb-6 leading-relaxed">{dept.fullDescription}</p>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Core Courses</h4>
                          <ul className="space-y-2">
                            {dept.courses.map((course, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <span className="text-gray-700">{course}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Program Details</h4>
                          <div className="space-y-3">
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
                              <span className="font-medium">Bachelor of Theology</span>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                              Learn More & Apply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Academic Journey?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Take the first step towards your calling in spiritual leadership and service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-700 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg">
              Apply for Admission
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-700 transition-colors font-semibold text-lg">
              Download Brochure
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}