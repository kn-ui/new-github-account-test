import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="/src/assets/message-from-school-img.png"
                alt="School Building"
                className="w-full h-80 object-cover rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Message From The School</h2>
              <p className="text-gray-600 mb-4">
                For generations, we have guided students in both faith and knowledge, rooted in the traditions of the Ethiopian Orthodox Church.
              </p>
              <p className="text-gray-600 mb-6">
                We invite you to discover our community where spiritual growth and academic excellence walk hand in hand, preparing young minds for service, leadership, and lifelong learning.
              </p>
              <Link 
                to="/admissions"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                About Our Services
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
              <p className="text-lg text-gray-600">Stay up to date with our calendar</p>
            </div>
            <div className="text-center">
              <Link 
                to="/calendar"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                View Calendar →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
