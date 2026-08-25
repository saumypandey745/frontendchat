import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  QrCode,
  Scan,
  Copy,
  Check,
  Share2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Camera,
  UserPlus,
  Zap,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import api from '../lib/axios';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';

export const extractChatwaveId = (qrText) => {
  if (!qrText || typeof qrText !== 'string') return null;
  const str = qrText.trim();

  // Match 10-digit ChatWave ID in URL path (e.g., https://chatwave.app/add/4829173650 or /add/4829173650 or ?id=4829173650)
  const urlMatch = str.match(/(?:add\/|id=)(\d{10})/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // Match pure 10-digit numeric ID string
  const cleanStr = str.replace(/\s+/g, '');
  if (/^\d{10}$/.test(cleanStr)) {
    return cleanStr;
  }

  // Match generic 10-digit number inside any string
  const genericMatch = str.match(/\b\d{10}\b/);
  if (genericMatch) {
    return genericMatch[0];
  }

  return null;
};

const QrCodeModal = ({
  isOpen,
  onClose,
  initialTab = 'my_code',
  onOpenAddContactModal,
}) => {
  const { user } = useAuth();
  const { fetchContacts, selectContact } = useChat();

  const [activeTab, setActiveTab] = useState(initialTab); // 'my_code' | 'scan'
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Scanner state
  const [cameraError, setCameraError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Set tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setScanError('');
      setScanSuccess('');
      setCameraError('');
      setProcessing(false);
      isProcessingRef.current = false;
    }
  }, [isOpen, initialTab]);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  // Handle scanned result
  const handleScannedResult = useCallback(
    async (decodedText) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      setProcessing(true);
      setScanError('');
      setScanSuccess('');

      // Play haptic feedback if available
      if (navigator.vibrate) {
        try {
          navigator.vibrate(100);
        } catch (e) {
          // ignore
        }
      }

      const extractedId = extractChatwaveId(decodedText);

      if (!extractedId) {
        setScanError("This doesn't look like a ChatWave QR code");
        setProcessing(false);
        setTimeout(() => {
          setScanError('');
          isProcessingRef.current = false;
        }, 2500);
        return;
      }

      if (user?.chatwaveId && user.chatwaveId === extractedId) {
        setScanError("You can't add yourself");
        setProcessing(false);
        setTimeout(() => {
          setScanError('');
          isProcessingRef.current = false;
        }, 2500);
        return;
      }

      // Add contact via API
      try {
        const res = await api.post('/users/contacts/add', {
          chatwaveId: extractedId,
        });

        if (res.data.success) {
          const addedName = res.data.contact?.user?.name || 'Contact';
          setScanSuccess(`Added ${addedName} to your contacts!`);
          await fetchContacts();
          if (res.data.contact?.user) {
            selectContact(res.data.contact.user);
          }
          stopCamera();
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } catch (err) {
        const errMsg =
          err.response?.data?.message ||
          'Failed to add contact from QR code';
        setScanError(errMsg);
        setProcessing(false);
        setTimeout(() => {
          setScanError('');
          isProcessingRef.current = false;
        }, 3000);
      }
    },
    [user, fetchContacts, selectContact, stopCamera, onClose]
  );

  // Scan video frame using jsQR
  const tickScan = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      video &&
      canvas &&
      video.readyState === video.HAVE_ENOUGH_DATA &&
      !isProcessingRef.current
    ) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleScannedResult(code.data);
      }
    }

    if (!isProcessingRef.current) {
      animFrameRef.current = requestAnimationFrame(tickScan);
    }
  }, [handleScannedResult]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError('');
    setScanError('');

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        isProcessingRef.current = false;
        animFrameRef.current = requestAnimationFrame(tickScan);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      let msg = 'Camera access denied or camera not available.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied. Please allow camera access in your browser settings to scan QR codes.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device. You can enter the ChatWave ID manually instead.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is currently in use by another application.';
      }
      setCameraError(msg);
      setScanning(false);
    }
  }, [facingMode, stopCamera, tickScan]);

  // Camera lifecycle based on modal open state and active tab
  useEffect(() => {
    if (isOpen && activeTab === 'scan') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  if (!isOpen) return null;

  const appOrigin =
    typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
      ? window.location.origin
      : (import.meta.env.VITE_APP_URL || 'https://frontendchat-pied.vercel.app');
  const qrUrl = user?.chatwaveId
    ? `${appOrigin}/add/${user.chatwaveId}`
    : `${appOrigin}/add/0000000000`;
  const formattedId = user?.chatwaveId
    ? user.chatwaveId.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
    : '--- --- ----';

  const handleCopyId = () => {
    if (user?.chatwaveId) {
      navigator.clipboard.writeText(user.chatwaveId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleShareQr = async () => {
    if (navigator.share && user?.chatwaveId) {
      try {
        await navigator.share({
          title: `Add ${user.name} on ChatWave`,
          text: `Scan my ChatWave QR code or add me with ChatWave ID: ${formattedId}`,
          url: qrUrl,
        });
      } catch (e) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(qrUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-pop-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                ChatWave QR Code
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Connect instantly with contacts
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unified Tab Switcher (My Code vs Scan Code) */}
        <div className="p-2 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('my_code')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'my_code'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>My Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'scan'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>Scan Code</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: MY CODE */}
          {activeTab === 'my_code' && (
            <div className="flex flex-col items-center space-y-5 animate-fade-in">
              {/* User Info Card Header */}
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 w-full">
                <img
                  src={
                    user?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || 'User'
                    )}`
                  }
                  alt={user?.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500/40"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user?.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    ChatWave Contact Card
                  </p>
                </div>
                <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Active
                </div>
              </div>

              {/* QR Code Container */}
              <div className="p-5 bg-white rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 text-center relative group">
                <QRCodeSVG
                  value={qrUrl}
                  size={220}
                  level="H"
                  marginSize={4}
                  fgColor="#0f172a"
                  bgColor="#ffffff"
                  className="mx-auto rounded-xl"
                />
                <p className="mt-3 text-[11px] font-semibold text-slate-500">
                  Scan with any camera or ChatWave scanner
                </p>
              </div>

              {/* Formatted ChatWave ID Display */}
              <div className="w-full bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-900/50 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Your ChatWave ID
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs shadow-sm"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId ? 'Copied!' : 'Copy ID'}</span>
                  </button>
                </div>
                <div className="text-lg font-mono font-black text-brand-600 dark:text-brand-400 tracking-wider">
                  {formattedId}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="w-full flex gap-2">
                <button
                  type="button"
                  onClick={handleShareQr}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Share2 className="w-4 h-4 text-brand-500" />
                  )}
                  <span>{copiedLink ? 'Link Copied!' : 'Share QR Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('scan')}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Scan className="w-4 h-4" />
                  <span>Scan a Code</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SCAN CODE */}
          {activeTab === 'scan' && (
            <div className="flex flex-col items-center space-y-4 animate-fade-in">
              {/* Notifications / Errors */}
              {scanError && (
                <div className="w-full p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              {scanSuccess && (
                <div className="w-full p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-pop-in">
                  <UserCheck className="w-4 h-4 flex-shrink-0" />
                  <span>{scanSuccess}</span>
                </div>
              )}

              {/* Viewfinder / Camera Feed */}
              {cameraError ? (
                <div className="w-full h-64 rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium text-slate-300 max-w-xs">
                    {cameraError}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAddContactModal) {
                        onClose();
                        onOpenAddContactModal();
                      }
                    }}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Enter ID Manually</span>
                  </button>
                </div>
              ) : (
                <div className="relative w-full h-72 rounded-3xl overflow-hidden bg-slate-950 border-2 border-brand-500/40 shadow-2xl flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning Frame Target Overlay */}
                  <div className="relative z-10 w-52 h-52 border-2 border-dashed border-emerald-400/80 rounded-3xl flex flex-col items-center justify-between p-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    {/* Corners */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                    {/* Animated Scanning Laser Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse my-auto" />
                  </div>

                  {/* Top Bar Overlay inside Viewfinder */}
                  <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between px-3 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md text-[11px] font-bold text-white">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Live Camera
                    </span>
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      title="Switch Camera"
                      className="p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Loading spinner when processing scan */}
                  {processing && (
                    <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 text-white">
                      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                      <p className="text-xs font-bold">Verifying ChatWave QR...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Helper text */}
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 font-medium">
                Point your camera at a ChatWave QR code to add them as a contact instantly.
              </p>

              {/* Bottom Actions & Fallback */}
              <div className="w-full pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    if (onOpenAddContactModal) {
                      onClose();
                      onOpenAddContactModal();
                    }
                  }}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-brand-500" />
                  <span>Manual ID Entry</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('my_code')}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>My QR Code</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrCodeModal;
