export default function Research() {
  return (
    <section id="research" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0a1736]/60 border-y border-white/10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[#3b82f6] uppercase tracking-widest mb-3">Research considerations</p>
          <h2 className="text-4xl font-bold text-white mb-4">Limitations &amp; future work</h2>
          <p className="text-[#c9d1d9] max-w-xl mx-auto">
            A strong system isn’t just about strengths—it’s about understanding its limits. Here’s what ExamGuard gets right, where it needs work, and what comes next.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: "Privacy-first design",
              icon: "🔒",
              body: "All model inference runs in the browser via WebGL. No video frames are transmitted to any server. Firebase only receives structured alert events (timestamp + alert type) — never raw video or image data.",
            },
            {
              title: "Known bias risks",
              icon: "⚠️",
              body: "MediaPipe's iris tracking accuracy degrades in low-light conditions and with certain glasses. Detection rates may vary across skin tones with the BlazeFace model. These are active areas of research in fair ML.",
            },
            {
              title: "Future directions",
              icon: "🔬",
              body: "Roadmap includes audio classification for noise detection, head pose estimation via MediaPipe Face Landmarker, and a multi-student teacher dashboard. Evaluation on a labelled dataset is the next research milestone.",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-xl bg-white/5 p-6 border border-white/10 hover:border-white/20 transition-colors">
              <div className="text-2xl mb-3">{c.icon}</div>
              <div className="font-semibold text-white mb-2">{c.title}</div>
              <p className="text-[#c9d1d9] text-sm leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        {/* Contributions */}
        <div className="rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/5 p-6">
          <div className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Individual contributions</div>
          <ul className="text-[#c9d1d9] text-sm space-y-2">
            <li className="flex gap-2"><span className="text-[#3b82f6]">→</span> Designed and implemented the TensorFlow.js + MediaPipe inference pipeline</li>
            <li className="flex gap-2"><span className="text-[#3b82f6]">→</span> Built the real-time alert engine with configurable thresholds and debouncing</li>
            <li className="flex gap-2"><span className="text-[#3b82f6]">→</span> Implemented the integrity score formula and per-student analytics dashboard</li>
            <li className="flex gap-2"><span className="text-[#3b82f6]">→</span> Set up Firebase Firestore data model with per-admin account segregation</li>
          </ul>
        </div>

      </div>
    </section>
  );
}