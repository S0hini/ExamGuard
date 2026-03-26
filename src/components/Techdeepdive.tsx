import { useState } from "react";

const techFAQ = [
  {
    q: "Why TensorFlow.js over a server-side model?",
    a: "Server-side inference requires video frames to be uploaded continuously — a privacy risk and a latency bottleneck. TensorFlow.js runs the model entirely in the browser's WebGL context, cutting round-trip latency to zero and ensuring no video data ever leaves the device.",
  },
  {
    q: "Why MediaPipe FaceMesh for iris tracking?",
    a: "FaceMesh produces 468 facial landmarks per frame including 5 iris-specific points per eye, running at ~30fps in-browser without GPU requirements. Alternative approaches (dlib, OpenCV) need a Python backend. MediaPipe achieves comparable accuracy with dramatically lower infrastructure complexity.",
  },
  {
    q: "How is the integrity score calculated?",
    a: "Each alert type is weighted by its perceived severity — a multi-face detection carries more weight than a single look-away. The score is computed as: 100 − Σ(alert_count × weight), floored at 0. Weights are currently: look-away 1pt, no-face 2pt, multi-face 3pt, mouth-open 1pt.",
  },
];

export default function TechDeepDive() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="tech" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[#3b82f6] uppercase tracking-widest mb-3">Tech deep dive</p>
          <h2 className="text-4xl font-bold text-white mb-4">Design decisions explained</h2>
          <p className="text-[#c9d1d9] max-w-xl mx-auto">
            The architecture choices aren't arbitrary. Here's the reasoning behind the key technical decisions.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3 mb-16">
          {techFAQ.map((item, i) => (
            <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <span className="font-semibold text-sm text-white">{item.q}</span>
                <span className="text-white/40 font-mono text-xl ml-4 flex-shrink-0">
                  {openFaq === i ? "−" : "+"}
                </span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-sm text-[#c9d1d9] leading-relaxed border-t border-white/10 pt-4 bg-white/5">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tech stack pills */}
        <div className="text-center">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-5">Built with</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "React", "TypeScript", "TailwindCSS", "Vite",
              "TensorFlow.js", "MediaPipe FaceMesh", "BlazeFace", "COCO-SSD",
              "Firebase Auth", "Firestore",
            ].map((tech) => (
              <span key={tech} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-white/70 font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}