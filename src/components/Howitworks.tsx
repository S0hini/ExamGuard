const pipelineSteps = [
  { id: 1, label: "Webcam feed", sub: "Live browser capture", color: "bg-slate-800 border-slate-600 text-slate-200" },
  { id: 2, label: "MediaPipe FaceMesh", sub: "468 facial landmarks at 30fps", color: "bg-blue-900/60 border-blue-500 text-blue-200" },
  { id: 3, label: "Iris tracking", sub: "Left/right gaze vector", color: "bg-violet-900/60 border-violet-500 text-violet-200" },
  { id: 4, label: "Behaviour classifier", sub: "Look-away, mouth open, multi-face", color: "bg-amber-900/60 border-amber-500 text-amber-200" },
  { id: 5, label: "Alert engine", sub: "Threshold logic + debounce", color: "bg-orange-900/60 border-orange-500 text-orange-200" },
  { id: 6, label: "Firebase log", sub: "Timestamped alert events", color: "bg-rose-900/60 border-rose-500 text-rose-200" },
  { id: 7, label: "Analytics dashboard", sub: "Integrity score + alert breakdown", color: "bg-teal-900/60 border-teal-500 text-teal-200" },
];

const behaviors = [
  { icon: "👁", label: "Look-away detection", detail: "Detection is based on joint head pose deviation and iris vector displacement beyond threshold." },
  { icon: "👥", label: "Multiple faces", detail: "BlazeFace detects >1 bounding box in frame" },
  { icon: "🫤", label: "No face detected", detail: "Zero bounding boxes for >2 consecutive seconds" },
  { icon: "💬", label: "Voice detection", detail: "Detects loud human voice" },
  { icon: "📱", label: "Mobile detection", detail: "COCO-SSD object model" },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[#3b82f6] uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-4xl font-bold text-white mb-4">The AI pipeline</h2>
          <p className="text-[#c9d1d9] max-w-xl mx-auto">
            Every webcam frame passes through a 7-stage pipeline running entirely client-side in WebAssembly and WebGL.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Pipeline steps */}
          <div className="space-y-3">
            {pipelineSteps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl border-2 flex items-center justify-center font-bold text-sm ${step.color}`}>
                  {step.id}
                </div>
                <div className={`flex-1 rounded-xl border px-4 py-3 ${step.color}`}>
                  <div className="font-semibold text-sm">{step.label}</div>
                  <div className="text-xs mt-0.5 opacity-60">{step.sub}</div>
                </div>
                {i < pipelineSteps.length - 1 && (
                  <span className="text-white/20 text-lg w-5 text-center flex-shrink-0">↓</span>
                )}
              </div>
            ))}
          </div>

          {/* Behaviours tracked */}
          <div>
            <p className="text-xs font-semibold text-[#3b82f6] uppercase tracking-widest mb-4">Behaviours tracked</p>
            <p className="text-[#c9d1d9] text-sm mb-6">
              Each behaviour maps to a specific model output. All inference runs locally with no data leaving the browser.
            </p>
            <div className="space-y-3">
              {behaviors.map((b) => (
                <div key={b.label} className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl">{b.icon}</div>
                  <div>
                    <div className="font-semibold text-sm text-white">{b.label}</div>
                    <div className="text-xs text-white/50 mt-0.5">{b.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}