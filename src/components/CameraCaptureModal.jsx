import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, RefreshCw, Check, AlertCircle } from 'lucide-react';

const CameraCaptureModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [error, setError] = useState('');

  const startCamera = async (mode = facingMode) => {
    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      setError('');
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Camera capture error:', err);
      setError('Could not access camera device. Please grant camera permissions.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  const handleFlipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    // Flip horizontally if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    // Stop video tracks
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }

    onCapture(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-brand-500" />
            In-App Camera
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Viewport */}
        <div className="relative w-full h-80 sm:h-96 bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-red-400 text-xs space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p>{error}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />
          )}

          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-around p-4 bg-slate-900 border-t border-slate-800">
          <button
            onClick={handleFlipCamera}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all"
            title="Flip Camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Shutter Button */}
          <button
            onClick={handleSnap}
            disabled={!!error}
            className="p-5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg shadow-red-600/40 active:scale-95 transition-transform disabled:opacity-50"
            title="Take Photo"
          >
            <div className="w-6 h-6 rounded-full border-2 border-white" />
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCaptureModal;
