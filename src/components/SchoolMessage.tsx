import schoolHero from '/assets/hero-school.jpg';

const SchoolMessage = () => {
  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 items-center">
        <div className="rounded-xl overflow-hidden shadow-sm">
          <img src={schoolHero} alt="Campus" className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Message From The School</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            For generations, we have guided students in both faith and knowledge, rooted in the traditions of the Ethiopian Orthodox Church. We invite you to discover our community where spiritual growth and academic excellence walk hand in hand, preparing young minds for service, leadership, and lifelong learning.
          </p>
          <div className="mt-6">
            <a href="/about" className="inline-block bg-[#0e4fb9] text-white px-5 py-2 rounded-md hover:bg-[#0d43a0]">About Our Services</a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SchoolMessage;

