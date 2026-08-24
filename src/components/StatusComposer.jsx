import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  Type,
  Camera,
  Send,
  Loader2,
  Check,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Shield,
  Video,
  Trash2,
} from 'lucide-react';
import useStatus from '../hooks/useStatus';
import StatusPrivacyModal from './StatusPrivacyModal';

const GRADIENT_SWATCHES = [
  { name: 'Teal Cyan', value: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)' },
  { name: 'Indigo Pink', value: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)' },
  { name: 'Emerald Teal', value: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)' },
  { name: 'Sunset Amber', value: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
  { name: 'Violet Blue', value: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' },
  { name: 'Midnight', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
  { name: 'Crimson', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Cyan', value: '#06b6d4' },
];

const FONTS = [
  { name: 'Sans', family: 'sans-serif' },
  { name: 'Serif', family: 'serif' },
  { name: 'Mono', family: 'monospace' },
  { name: 'Script', family: 'cursive' },
];

const StatusComposer = ({ isOpen, onClose }) => {
  const { postStatus } = useStatus();

  // Mode Selection: 'text' | 'camera' | 'gallery'
  const [mode, setMode] = useState('text');

  // Text Mode State
  const [content, setContent] = useState('');
  const [gradient, setGradient] = useState(GRADIENT_SWATCHES[0].value);
  const [font, setFont] = useState(FONTS[0].family);

  // Gallery Mode State
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');

  // Camera Mode State (Live Stream & Capture)
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState('');
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [cameraError, setCameraError] = useState('');

  // Discard & Feedback State
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [targetNextMode, setTargetNextMode] = useState(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [postedSuccess, setPostedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const galleryInputRef = useRef(null);

  // Start / Stop Camera Stream for Camera Mode
  const startCamera = async (modeSetting = facingMode) => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: modeSetting },
        audio: true,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera stream error:', err);
      setCameraError('Could not access camera/microphone. Check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (isOpen && mode === 'camera' && !capturedPhotoUrl) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, mode, facingMode, capturedPhotoUrl]);

  if (!isOpen) return null;

  // Unsaved content check
  const hasUnsavedContent = () => {
    if (mode === 'text') return content.trim().length > 0;
    if (mode === 'camera') return !!capturedPhotoUrl || !!capturedBlob;
    if (mode === 'gallery') return !!mediaFile;
    return false;
  };

  const handleRequestClose = () => {
    if (hasUnsavedContent()) {
      setShowDiscardConfirm(true);
      setTargetNextMode(null);
    } else {
      resetAndClose();
    }
  };

  const handleSwitchMode = (newMode) => {
    if (newMode === mode) return;
    if (hasUnsavedContent()) {
      setShowDiscardConfirm(true);
      setTargetNextMode(newMode);
    } else {
      setMode(newMode);
    }
  };

  const confirmDiscard = () => {
    setShowDiscardConfirm(false);
    setContent('');
    setMediaFile(null);
    setMediaPreview('');
    setCapturedPhotoUrl('');
    setCapturedBlob(null);
    setErrorMessage('');

    if (targetNextMode) {
      setMode(targetNextMode);
      setTargetNextMode(null);
    } else {
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    stopCamera();
    setContent('');
    setMediaFile(null);
    setMediaPreview('');
    setCapturedPhotoUrl('');
    setCapturedBlob(null);
    setErrorMessage('');
    setMode('text');
    onClose();
  };

  // Camera Actions
  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const handleSnapPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    canvas.toBlob((blob) => {
      const file = new File([blob], 'status_photo.jpg', { type: 'image/jpeg' });
      setCapturedBlob(file);
      setCapturedPhotoUrl(dataUrl);
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleStartRecordVideo = () => {
    if (!cameraStream) return;
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(cameraStream, { mimeType: 'video/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        const file = new File([blob], 'status_video.webm', { type: 'video/webm' });
        setCapturedBlob(file);
        setCapturedPhotoUrl(videoUrl);
        stopCamera();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingVideo(true);
    } catch (err) {
      console.error('MediaRecorder error:', err);
    }
  };

  const handleStopRecordVideo = () => {
    if (mediaRecorderRef.current && isRecordingVideo) {
      mediaRecorderRef.current.stop();
      setIsRecordingVideo(false);
    }
  };

  const handleRetakeCamera = () => {
    setCapturedPhotoUrl('');
    setCapturedBlob(null);
    startCamera(facingMode);
  };

  // Gallery File Picker Handler
  const handleGalleryFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (mode === 'text' && !content.trim()) return;
    if (mode === 'gallery' && !mediaFile) return;
    if (mode === 'camera' && !capturedBlob) return;

    setLoading(true);

    let statusType = 'text';
    let fileToUpload = null;

    if (mode === 'gallery') {
      fileToUpload = mediaFile;
      statusType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
    } else if (mode === 'camera') {
      fileToUpload = capturedBlob;
      statusType = capturedBlob.type.startsWith('video/') ? 'video' : 'image';
    }

    const res = await postStatus({
      type: statusType,
      content: content.trim(),
      file: fileToUpload,
      backgroundColor: gradient,
      font: font,
    });

    setLoading(false);

    if (res?.success) {
      setPostedSuccess(true);
      setTimeout(() => {
        setPostedSuccess(false);
        resetAndClose();
      }, 800);
    } else {
      setErrorMessage(res?.message || 'Failed to post status update. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-lg h-[88vh] bg-slate-950 border border-slate-800/80 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl">
        {/* Ambient Glow Background Accent */}
        <div
          style={{ background: mode === 'text' ? gradient : undefined }}
          className="absolute inset-0 opacity-20 blur-3xl pointer-events-none transition-all duration-500"
        />

        {/* Top Bar: Exit, 3-Tab Mode Switcher, & Privacy Selector */}
        <div className="p-4 z-20 flex items-center justify-between bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent">
          <button
            onClick={handleRequestClose}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 backdrop-blur-md transition-all active:scale-95 shadow-lg"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 3-Tab Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-full backdrop-blur-md shadow-inner">
            <button
              type="button"
              onClick={() => handleSwitchMode('text')}
              className={`px-3 py-1.5 text-xs font-extrabold flex items-center gap-1 rounded-full transition-all ${
                mode === 'text' ? 'bg-brand-600 text-white shadow-glow-brand' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type className="w-3.5 h-3.5" /> Text
            </button>

            <button
              type="button"
              onClick={() => handleSwitchMode('camera')}
              className={`px-3 py-1.5 text-xs font-extrabold flex items-center gap-1 rounded-full transition-all ${
                mode === 'camera' ? 'bg-brand-600 text-white shadow-glow-brand' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Camera
            </button>

            <button
              type="button"
              onClick={() => handleSwitchMode('gallery')}
              className={`px-3 py-1.5 text-xs font-extrabold flex items-center gap-1 rounded-full transition-all ${
                mode === 'gallery' ? 'bg-brand-600 text-white shadow-glow-brand' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Gallery
            </button>
          </div>

          {/* Privacy Selector Button */}
          <button
            type="button"
            onClick={() => setIsPrivacyModalOpen(true)}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-brand-400 border border-slate-800 backdrop-blur-md transition-all"
            title="Status Privacy Settings"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>

        {/* Central Composer Canvas */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-4 text-center z-10 overflow-hidden">
          {/* Error Banner with Retry */}
          {errorMessage && (
            <div className="w-full mb-3 p-3 rounded-2xl bg-red-950/90 border border-red-800 text-red-200 text-xs font-bold flex items-center justify-between gap-2 z-30 animate-fade-in shadow-xl">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                {errorMessage}
              </span>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded-xl text-[11px] font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {/* Mode 1: Text Status */}
          {mode === 'text' && (
            <div
              style={{ background: gradient }}
              className="w-full h-full rounded-3xl p-6 flex items-center justify-center border border-white/10 shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 opacity-30 text-white animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>

              <textarea
                style={{ fontFamily: font }}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={500}
                placeholder="Type a status update..."
                className="w-full bg-transparent text-white font-extrabold text-2xl sm:text-3xl text-center placeholder-white/50 focus:outline-none resize-none leading-relaxed tracking-wide drop-shadow-lg"
                rows={5}
                autoFocus
              />
            </div>
          )}

          {/* Mode 2: Live In-App Camera */}
          {mode === 'camera' && (
            <div className="w-full h-full rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              {capturedPhotoUrl ? (
                /* Post-capture Preview */
                <div className="relative w-full h-full flex items-center justify-center">
                  {capturedBlob?.type?.startsWith('video/') ? (
                    <video src={capturedPhotoUrl} controls autoPlay className="w-full h-full object-contain" />
                  ) : (
                    <img src={capturedPhotoUrl} alt="Captured Status" className="w-full h-full object-contain" />
                  )}

                  <button
                    type="button"
                    onClick={handleRetakeCamera}
                    className="absolute top-4 right-4 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10 backdrop-blur-md shadow-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" /> Retake
                  </button>

                  {/* Frosted Glass Caption Bar */}
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <div className="px-4 py-2 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-2 shadow-2xl">
                      <input
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Add a caption..."
                        className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Live Camera Viewfinder */
                <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                  {cameraError ? (
                    <div className="p-6 text-center text-red-400 text-xs space-y-2">
                      <AlertCircle className="w-8 h-8 mx-auto" />
                      <p>{cameraError}</p>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                    />
                  )}

                  <canvas ref={canvasRef} className="hidden" />

                  {/* Live Camera Controls Overlay */}
                  <div className="absolute bottom-6 inset-x-6 flex items-center justify-around z-20">
                    <button
                      type="button"
                      onClick={handleFlipCamera}
                      className="p-3.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full border border-slate-700 backdrop-blur-md transition-transform active:scale-95"
                      title="Flip Camera"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>

                    {/* Snap Photo Button */}
                    <button
                      type="button"
                      onClick={handleSnapPhoto}
                      disabled={!!cameraError}
                      className="p-5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-2xl shadow-red-600/50 active:scale-95 transition-transform disabled:opacity-50 border-4 border-white/90"
                      title="Take Photo"
                    >
                      <Camera className="w-6 h-6" />
                    </button>

                    {/* Video Record Toggle Button */}
                    <button
                      type="button"
                      onClick={isRecordingVideo ? handleStopRecordVideo : handleStartRecordVideo}
                      disabled={!!cameraError}
                      className={`p-3.5 rounded-full border backdrop-blur-md transition-transform active:scale-95 ${
                        isRecordingVideo
                          ? 'bg-red-600 text-white animate-pulse border-red-400'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-white border-slate-700'
                      }`}
                      title={isRecordingVideo ? 'Stop Video Recording' : 'Record Short Video'}
                    >
                      <Video className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Gallery Upload */}
          {mode === 'gallery' && (
            <div className="w-full h-full rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              {mediaPreview ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  {mediaFile?.type?.startsWith('video/') ? (
                    <video src={mediaPreview} controls autoPlay className="w-full h-full object-contain rounded-3xl" />
                  ) : (
                    <img src={mediaPreview} alt="Gallery Status Preview" className="w-full h-full object-contain rounded-3xl" />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview('');
                    }}
                    className="absolute top-4 right-4 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10 backdrop-blur-md shadow-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" /> Change File
                  </button>

                  {/* Frosted Glass Caption Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <div className="px-4 py-2 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-2 shadow-2xl">
                      <input
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Add a caption..."
                        className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-4 cursor-pointer group p-8 w-full h-full">
                  <div className="relative flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-accent-cyan opacity-80 group-hover:opacity-100 blur-md transition-all group-hover:scale-110" />
                    <div className="relative w-16 h-16 rounded-full bg-slate-900 border-4 border-white/90 flex items-center justify-center text-white shadow-2xl group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-7 h-7 text-brand-400" />
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-300 group-hover:text-white">
                    Select Photo or Video from Device
                  </span>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleGalleryFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Bottom Swatches Bar & Post Button */}
        <div className="p-4 z-20 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent space-y-3">
          {mode === 'text' && (
            <div className="space-y-2">
              {/* Background Gradient / Color Swatches */}
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 custom-scrollbar">
                {GRADIENT_SWATCHES.map((swatch) => {
                  const isSelected = gradient === swatch.value;
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      onClick={() => setGradient(swatch.value)}
                      style={{ background: swatch.value }}
                      className={`w-7 h-7 rounded-full transition-transform flex-shrink-0 border-2 ${
                        isSelected
                          ? 'scale-125 border-white shadow-glow-brand'
                          : 'border-transparent opacity-80 hover:opacity-100 hover:scale-110'
                      }`}
                      title={swatch.name}
                    />
                  );
                })}
              </div>

              {/* Font Style Picker */}
              <div className="flex items-center justify-center gap-2">
                {FONTS.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setFont(f.family)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                      font === f.family
                        ? 'bg-brand-600 border-brand-400 text-white shadow-glow-brand'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer: Send Post Button */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                loading ||
                (mode === 'text' && !content.trim()) ||
                (mode === 'gallery' && !mediaFile) ||
                (mode === 'camera' && !capturedBlob)
              }
              className="relative p-4 bg-gradient-to-tr from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-accent-cyan text-white rounded-full shadow-glow-brand transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none group"
              title="Post Status"
            >
              {postedSuccess ? (
                <Check className="w-6 h-6 animate-pop-in text-white" />
              ) : loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6 transform group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Overlay */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/60 text-red-400 flex items-center justify-center mx-auto border border-red-800">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Discard status update?</h3>
              <p className="text-xs text-slate-400 mt-1">If you leave now, your unsaved content will be lost.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-2.5 text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white rounded-xl"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={confirmDiscard}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-600/30"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings Modal */}
      <StatusPrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
    </div>
  );
};

export default StatusComposer;
