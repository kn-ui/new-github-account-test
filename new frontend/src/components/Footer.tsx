import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center">
                <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center">
                  <img
                    src="asset/main-logo.png"
                    alt="Orthodox Church"
                    className="w-full h-100 object-cover rounded-lg shadow-lg"
                  />
                </div>
              </div>
              <div>
                <div className="text-lg font-bold">St. Raguel Church</div>
                <div className="text-sm text-gray-400">Spiritual School</div>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Providing quality spiritual education and nurturing young minds in the Orthodox tradition.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/about" className="block text-sm text-gray-400 hover:text-white">
                About Us
              </Link>
              <Link to="/academic" className="block text-sm text-gray-400 hover:text-white">
                Academic Programs
              </Link>
              <Link to="/admission" className="block text-sm text-gray-400 hover:text-white">
                Admissions
              </Link>
              <Link to="/calendar" className="block text-sm text-gray-400 hover:text-white">
                Academic Calendar
              </Link>
              <Link to="/rules" className="block text-sm text-gray-400 hover:text-white">
                Rules & Regulations
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <div className="space-y-2">
              <Link to="/blog" className="block text-sm text-gray-400 hover:text-white">
                Latest Updates
              </Link>
              <Link to="/forum" className="block text-sm text-gray-400 hover:text-white">
                Discussion Forum
              </Link>
              <Link to="/portal" className="block text-sm text-gray-400 hover:text-white">
                Student Portal
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>Addis Ketema Sub city, Merkato<br />St. raguel Church</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Phone className="w-4 h-4" />
                <span>+251 112764646</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Mail className="w-4 h-4" />
                <span>info@straguelschool.org</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            © 2025 St. Raguel Church Spiritual School. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link to="/privacy" className="text-sm text-gray-400 hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-gray-400 hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;