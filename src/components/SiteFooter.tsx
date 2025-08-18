const SiteFooter = () => {
  return (
    <footer className="bg-[#163a8d] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold text-lg">St. Raguel Church</h4>
            <p className="text-sm text-white/80 mt-2">Providing quality spiritual education and nurturing young minds in the Orthodox tradition.</p>
          </div>
          <div>
            <h5 className="font-semibold mb-3">Quick Links</h5>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a className="hover:text-white" href="/about">About Us</a></li>
              <li><a className="hover:text-white" href="/academic">Academic Programs</a></li>
              <li><a className="hover:text-white" href="/admissions">Admissions</a></li>
              <li><a className="hover:text-white" href="/rules">Rules & Regulations</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold mb-3">Resources</h5>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a className="hover:text-white" href="/blog">Latest Updates</a></li>
              <li><a className="hover:text-white" href="/forum">Discussion Forum</a></li>
              <li><a className="hover:text-white" href="/login">Student Portal</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold mb-3">Contact Info</h5>
            <ul className="space-y-2 text-sm text-white/80">
              <li>Addis Ketema Sub city , Merkato St, raguel Church</li>
              <li>+251 112784646</li>
              <li>info@straguelschool.org</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 pt-6 text-xs text-white/70 flex flex-col md:flex-row items-center justify-between">
          <p>© {new Date().getFullYear()} St. Raguel Church Spiritual School. All rights reserved.</p>
          <div className="space-x-4 mt-2 md:mt-0">
            <a className="hover:text-white" href="#">Privacy Policy</a>
            <a className="hover:text-white" href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;

