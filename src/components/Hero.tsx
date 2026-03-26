import { ArrowRight } from 'lucide-react';

export default function Hero() {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center pt-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-8 animate-fadeIn">

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
          AI proctoring,<br />
          <span className="text-[#3b82f6]">entirely in your browser.</span>
        </h1>

        <p className="text-lg sm:text-xl text-[#c9d1d9] max-w-3xl mx-auto leading-relaxed">
          Existing proctoring tools rely on rule-based triggers with high false-positive rates and require server-side video processing.
        </p>

        <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-medium">
          Suspicious behaviour is detected entirely in-browser — no server, no video upload, full privacy.
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 max-w-2xl mx-auto">
          {[
            { num: "5", label: "Behaviours tracked" },
            { num: "<50ms", label: "Inference latency" },
            { num: "0", label: "Video uploads" },
            { num: "468", label: "Facial landmarks" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3">
              <div className="text-2xl font-bold text-white">{s.num}</div>
              <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
         

          <button
            onClick={scrollToHowItWorks}
            className="group text-white px-8 py-4 rounded-full border-2 border-white/20 hover:border-white/40 transition-all duration-300 font-semibold text-lg"
          >
            How it works ↓
          </button>
        </div>

        <div className="pt-8 opacity-40 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full mx-auto flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full"></div>
          </div>
        </div>

      </div>
    </section>
  );
}