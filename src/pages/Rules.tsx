import Header from '@/components/Header';

const Rules = () => {
  const items = [
    { title: 'Respect and Conduct', body: 'Students must maintain respectful behavior towards peers, faculty, and staff at all times, reflecting our Orthodox values.' },
    { title: 'Attendance', body: 'Regular attendance is mandatory for all classes, liturgies, and scheduled events unless excused.' },
    { title: 'Dress Code', body: 'Modest attire is required on campus and during services, in accordance with school guidelines.' },
    { title: 'Academic Integrity', body: 'Plagiarism, cheating, and any form of academic dishonesty are strictly prohibited.' },
    { title: 'Use of Facilities', body: 'School facilities should be used responsibly. Any damage or misuse will result in disciplinary action.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative bg-gradient-to-r from-blue-600 to-[#13A0E2] text-white">
        <img src="/src/assets/background-img.png" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Rules & Regulations</h1>
          <p className="text-xl mb-8">Guidelines to ensure a respectful, safe, and faithful community</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-4">
          {items.map((it, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{it.title}</h3>
              <p className="text-gray-600">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Rules;