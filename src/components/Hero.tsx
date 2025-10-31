import { ArrowRight, Play } from 'lucide-react';

export default function Hero() {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center pt-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-8 animate-fadeIn">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
          AI-Powered Exam Proctoring
        </h1>

        <p className="text-lg sm:text-xl text-[#c9d1d9] max-w-3xl mx-auto leading-relaxed">
          Detect cheating through advanced body movement analysis. Ensure exam integrity with real-time monitoring, automated alerts, and comprehensive reporting.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={scrollToContact}
            className="group bg-[#3b82f6] text-white px-8 py-4 rounded-full hover:bg-[#2563eb] transition-all duration-300 transform hover:scale-105 font-semibold text-lg flex items-center space-x-2 shadow-lg shadow-blue-500/50"
          >
            <span>Request Demo</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button className="group text-white px-8 py-4 rounded-full border-2 border-white/20 hover:border-white/40 transition-all duration-300 font-semibold text-lg flex items-center space-x-2">
            <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Watch Demo</span>
          </button>
        </div>

        <div className="pt-12 opacity-50 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full mx-auto flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
