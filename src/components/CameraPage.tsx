import { useEffect, useRef } from "react";

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Unable to access camera. Please allow permissions.");
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a1736] text-white">
      <h1 className="text-3xl font-bold mb-6">Camera Preview</h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full max-w-4xl h-[80vh] rounded-2xl border-4 border-[#3b82f6] shadow-2xl object-cover"
      />
    </div>
  );
}
