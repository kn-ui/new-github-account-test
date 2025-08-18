import { BookOpen, Music, Languages, ShieldCheck, HandHeart, Landmark, Paintbrush, Calculator } from 'lucide-react';

const items = [
  { icon: BookOpen, title: "Theology & Scripture", desc: "Deep study of Orthodox theology and biblical texts" },
  { icon: Music, title: "Church Music & Liturgy", desc: "Traditional hymns, chants, and liturgical practices" },
  { icon: Languages, title: "Ancient Languages", desc: "Ge'ez, Amharic, and other liturgical languages" },
  { icon: ShieldCheck, title: "Spiritual Formation", desc: "Personal faith development and spiritual practices" },
  { icon: HandHeart, title: "Community Service", desc: "Outreach programs and community engagement" },
  { icon: Landmark, title: "Church History", desc: "Ethiopian Orthodox Church heritage and traditions" },
  { icon: Paintbrush, title: "Sacred Arts", desc: "Icon painting, manuscript illumination, and crafts" },
  { icon: Calculator, title: "Practical Studies", desc: "Mathematics, sciences, and subjects" },
];

const Departments = () => {
  return (
    <section className="bg-white py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Academic Departments</h2>
          <p className="text-gray-600 mt-2">Comprehensive programs designed to provide both spiritual formation and academic excellence in the Orthodox tradition.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it) => (
            <div key={it.title} className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0e4fb9] flex items-center justify-center mb-3">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-900">{it.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{it.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <a href="/courses" className="inline-flex items-center gap-2 bg-[#0e4fb9] text-white px-5 py-2 rounded-md hover:bg-[#0d43a0]">
            Explore All Programs
          </a>
        </div>
      </div>
    </section>
  );
};

export default Departments;

