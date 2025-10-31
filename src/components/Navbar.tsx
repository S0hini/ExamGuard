import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a1736]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <Shield className="w-8 h-8 text-[#3b82f6]" />
            <span className="text-xl font-bold text-white">ExamGuard</span>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => scrollToSection('hero')}
              className="text-white/80 hover:text-white transition-colors px-3 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="bg-[#3b82f6] text-white px-6 py-2 rounded-full hover:bg-[#2563eb] transition-all duration-300 transform hover:scale-105 font-medium"
            >
              Get Started
            </button>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 animate-fadeIn">
            <button
              onClick={() => scrollToSection('hero')}
              className="block w-full text-left text-white/80 hover:text-white transition-colors px-3 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="block w-full bg-[#3b82f6] text-white px-6 py-2 rounded-full hover:bg-[#2563eb] transition-colors font-medium"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
