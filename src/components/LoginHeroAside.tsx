import { ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

import logo from '@/assets/logo.jpg';

const LoginHeroAside = () => {
  return (
    <aside className="hidden lg:block w-1/2 bg-gradient-to-br from-blue-600 to-[#13A0E2] relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img src="/src/assets/hero-school.jpg" alt="Campus" className="w-full h-full object-cover" />
      </div>
      <div className="relative z-10 h-full flex flex-col justify-center p-16 text-white">
        <div className="flex items-center gap-3">
          <img src={logo} alt="St. Raguel Church Logo" className="h-16 w-auto rounded-lg" />
          <div>
            <h3 className="text-2xl font-bold">St. Raguel Church</h3>
            <p className="text-sm text-white/80">Spiritual School</p>
          </div>
        </div>
        <h2 className="mt-8 text-4xl font-extrabold leading-tight">Grow in Faith and Wisdom</h2>
        <p className="mt-3 text-white/90 max-w-lg">Discover our programs designed to nurture character and academic excellence in the Orthodox tradition.</p>
        <div className="mt-8">
          <Link to="/courses" className="inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-md font-semibold">
            Explore Programs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default LoginHeroAside;

