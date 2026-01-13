
import React, { useRef, useState, useEffect } from 'react';

interface CameraModalProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' }, 
          audio: false 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Camera access denied. Check your permissions.");
      }
    }
    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/png');
        onCapture(base64);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 md:p-4">
      <div className="w-full h-full md:h-auto md:max-w-lg md:rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col bg-slate-950">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-camera text-blue-400"></i>
            Take Photo
          </h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="text-center p-8 text-red-400 max-w-xs">
              <i className="fa-solid fa-triangle-exclamation text-4xl mb-4 opacity-50"></i>
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          )}
          {/* Facial Frame Overlay */}
          {!error && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-80 border-2 border-dashed border-white/20 rounded-[30%]"></div>
            </div>
          )}
        </div>

        <div className="p-8 md:p-10 flex justify-center bg-slate-900/50">
          {!error && (
            <button
              onClick={handleCapture}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-2xl active:scale-90 transition-transform"
            >
              <div className="w-16 h-16 border-4 border-slate-900/10 rounded-full flex items-center justify-center">
                 <i className="fa-solid fa-camera text-3xl"></i>
              </div>
            </button>
          )}
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraModal;
