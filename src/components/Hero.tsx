import { BookOpen, Users, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import schoolHero from '@/assets/hero-school.jpg';

const Hero = () => {
  return (
    <section className="relative bg-[#0e4fb9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 items-center py-20">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
              Nurturing Faith,
              <span className="block text-yellow-300">Building Character</span>
            </h1>
            <p className="mt-6 text-blue-50 text-lg max-w-xl">
              St. Raguel Church Spiritual School provides comprehensive Orthodox education rooted in Ethiopian traditions and academic excellence.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/signup" className="inline-flex">
                <button className="bg-yellow-400 text-[#0e4fb9] px-6 py-3 rounded-md font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2">
                  <BookOpen className="h-5 w-5" /> Apply Now
                </button>
              </Link>
              <Link to="/courses" className="inline-flex">
                <button className="bg-white/10 border border-white/30 text-white px-6 py-3 rounded-md font-semibold hover:bg-white/20 transition-colors">
                  Explore Programs
                </button>
              </Link>
            </div>
          </div>
          <div className="relative rounded-xl overflow-hidden ring-4 ring-white/20">
            <img src={schoolHero} alt="School" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;