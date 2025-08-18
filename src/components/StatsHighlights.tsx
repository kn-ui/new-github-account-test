import { Users, Clock3, UserCheck, Trees } from 'lucide-react';

const items = [
  { icon: Users, value: '500+ Students', desc: 'Enrolled across all programs' },
  { icon: Clock3, value: '50+ Years', desc: 'Of educational excellence' },
  { icon: UserCheck, value: '30+ Faculty', desc: 'Dedicated Orthodox educators' },
  { icon: Trees, value: 'Beautiful Campus', desc: 'Peaceful learning environment' },
];

const StatsHighlights = () => {
  return (
    <section className="bg-[#163a8d] text-white py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((it) => (
            <div key={it.value} className="text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <it.icon className="h-6 w-6" />
              </div>
              <div className="font-semibold">{it.value}</div>
              <div className="text-white/80 text-sm">{it.desc}</div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <a href="/contact" className="inline-flex items-center gap-2 bg-white text-[#163a8d] px-5 py-2 rounded-md font-semibold">Get In Touch</a>
        </div>
      </div>
    </section>
  );
};

export default StatsHighlights;

