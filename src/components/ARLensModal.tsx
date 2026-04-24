import React from 'react';
import { AlertCircle, ArrowLeft, Camera, QrCode, ShieldCheck, Zap } from 'lucide-react';
import { Product } from '../types';

interface ARLensModalProps {
  product: Product;
  onClose: () => void;
}

export const ARLensModal: React.FC<ARLensModalProps> = ({ product, onClose }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [isScanning, setIsScanning] = React.useState(true);
  const [isLensReady, setIsLensReady] = React.useState(false);

  const stopStream = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = React.useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera is not supported on this browser.');
        return;
      }

      stopStream();
      // Request video-only first. Mic permissions often fail and unnecessarily block camera.
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch {
        // Fallback for browsers/devices that reject facingMode constraints.
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraError(null);
      setIsLensReady(true);
      setIsScanning(true);
    } catch (error) {
      setIsLensReady(false);
      const mediaError = error as DOMException;
      if (mediaError?.name === 'NotReadableError') {
        setCameraError('Camera is busy in another app/tab. Close other camera apps and retry.');
      } else if (mediaError?.name === 'NotFoundError') {
        setCameraError('No camera device found on this system.');
      } else if (mediaError?.name === 'NotAllowedError' || mediaError?.name === 'SecurityError') {
        setCameraError('Camera permission denied. Allow camera access for this site and retry.');
      } else {
        setCameraError('Unable to start camera. Please retry or refresh the page.');
      }
    }
  }, [stopStream]);

  React.useEffect(() => {
    startCamera();
    return () => stopStream();
  }, [startCamera, stopStream]);

  return (
    <div className="fixed inset-0 z-[180] bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-20 p-5 sm:p-6 flex justify-between items-start bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        <button
          onClick={onClose}
          className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all border border-white/10"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl px-4 py-2.5 rounded-full border border-white/20 shadow-2xl">
            <div className={`w-2.5 h-2.5 rounded-full ${isLensReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-white text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">
              {isLensReady ? 'AI Lens Active' : 'Connecting Lens...'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/40 text-[9px] font-black uppercase tracking-widest px-2">
            <Zap className="w-3 h-3 text-yellow-400" />
            {product.name}
          </div>
        </div>
      </div>

      <div className="relative flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="max-w-sm w-full bg-black/80 border border-red-500/40 rounded-3xl p-8 text-center text-white backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="font-black uppercase tracking-[0.25em] text-[11px] mb-3">Camera Access Blocked</p>
              <p className="text-xs text-white/60 font-semibold leading-relaxed mb-6">
                {cameraError}
              </p>
              <button
                onClick={startCamera}
                className="w-full bg-white text-black py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] hover:scale-105 active:scale-95 transition-transform shadow-2xl flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Retry Camera Access
              </button>
            </div>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}

        <div className="absolute inset-0 border-[24px] sm:border-[30px] border-black/20 pointer-events-none" />

        {isScanning && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-60 h-60 sm:w-72 sm:h-72 border-2 border-white/20 relative shadow-[0_0_100px_rgba(255,255,255,0.05)]">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white" />
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/40 shadow-[0_0_20px_white] animate-pulse" />
            </div>
            <div className="mt-10 bg-black/60 px-6 py-3 rounded-full backdrop-blur-2xl border border-white/10 flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <p className="text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.35em]">
                Scanning For Activation Signature
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10 bg-gradient-to-t from-black via-black/60 to-transparent flex flex-col items-center gap-6">
        <button
          type="button"
          className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)] active:scale-90 transition-all"
        >
          <QrCode className="w-10 h-10 text-black" />
        </button>
        <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em] flex items-center gap-3">
          <ShieldCheck className="w-3 h-3" />
          Encrypted AR Activation Layer
        </p>
      </div>
    </div>
  );
};

