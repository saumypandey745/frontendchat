import React, { useEffect, useRef, useState } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Minimize2,
  Maximize,
  WifiOff,
  User,
  AlertCircle,
} from 'lucide-react';
import useCall from '../hooks/useCall';

const CallScreen = () => {
  const {
    callState,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    incomingCamStream,
    isMuted,
    isCamOff,
    remoteMuted,
    remoteCamOff,
    callDuration,
    isMinimized,
    isReconnecting,
    isSpeakerOn,
    callEndReason,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    switchCamera,
    toggleSpeaker,
    minimizeCall,
  } = useCall();

  const localVideoRef = useRef(null);
  const incomingPreviewRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const containerRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  // Attach incoming camera preview stream
  useEffect(() => {
    if (incomingPreviewRef.current && incomingCamStream) {
      incomingPreviewRef.current.srcObject = incomingCamStream;
    }
  }, [incomingCamStream, callState]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  if (callState === 'idle' || isMinimized) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Call End / Busy / No Answer Overlay Banner
  if (callEndReason) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md animate-fade-in p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{remoteUser?.name || 'Call Ended'}</h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              {callEndReason === 'busy'
                ? 'User is currently on another call.'
                : callEndReason === 'no_answer'
                ? 'No answer. Call timed out.'
                : callEndReason === 'disconnected'
                ? 'Call disconnected due to network drop.'
                : 'Call ended.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 1. INCOMING CALL SCREEN OVERLAY
  if (callState === 'incoming') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in p-4 safe-p">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Live Camera Self-Preview Thumbnail (for Incoming Video Call) */}
          {callType === 'video' && incomingCamStream && (
            <div className="absolute top-4 right-4 w-28 h-36 bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-lg">
              <video
                ref={incomingPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
              <span className="absolute bottom-1 left-1 text-[9px] bg-slate-950/70 text-slate-300 px-1.5 py-0.5 rounded-md font-bold">
                Camera Preview
              </span>
            </div>
          )}

          <div className="relative pt-2">
            <img
              src={remoteUser?.avatarUrl}
              alt={remoteUser?.name}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-brand-500/40 animate-pulse shadow-glow-brand"
            />
            <div className="absolute bottom-0 right-0 p-2.5 bg-brand-600 rounded-full text-white ring-4 ring-slate-900">
              {callType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-white">{remoteUser?.name}</h3>
            <p className="text-xs text-brand-400 font-bold mt-1 uppercase tracking-wider">
              Incoming {callType} call...
            </p>
          </div>

          {/* Accept / Decline Action Buttons */}
          <div className="flex items-center justify-center gap-10 pt-4 w-full">
            {/* Decline Button (Red) */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => declineCall('declined')}
                className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg shadow-red-600/40 transition-transform active:scale-95"
                title="Decline Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-xs font-bold text-slate-400">Decline</span>
            </div>

            {/* Accept Button (Green) */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={acceptCall}
                className="p-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-600/40 transition-transform active:scale-95 animate-bounce"
                title="Accept Call"
              >
                <Phone className="w-7 h-7" />
              </button>
              <span className="text-xs font-bold text-emerald-400">Accept</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE / CALLING SCREEN OVERLAY
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-4 sm:p-6 animate-fade-in safe-p"
    >
      {/* Top Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10 px-2 pt-2">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isReconnecting ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-ping'
            }`}
          />
          <div>
            <h3 className="text-sm font-bold text-white">{remoteUser?.name}</h3>
            <p className="text-xs font-mono text-slate-400">
              {isReconnecting ? (
                <span className="text-amber-400 font-bold">Reconnecting...</span>
              ) : callState === 'calling' ? (
                'Calling...'
              ) : (
                formatDuration(callDuration)
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {callType === 'video' && (
            <button
              onClick={toggleFullscreen}
              className="p-2.5 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={minimizeCall}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-colors"
            title="Minimize Call"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Network Reconnecting Overlay Banner */}
      {isReconnecting && (
        <div className="absolute top-20 z-20 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold animate-pulse">
          <WifiOff className="w-4 h-4" />
          <span>Network reconnecting... Please hold on</span>
        </div>
      )}

      {/* Video Streams Display */}
      {callType === 'video' ? (
        <div className="relative w-full flex-1 max-w-4xl rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center my-4">
          {/* Remote Video Stream */}
          {remoteCamOff ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <img
                src={remoteUser?.avatarUrl}
                alt={remoteUser?.name}
                className="w-28 h-28 rounded-full object-cover ring-4 ring-slate-800 shadow-2xl"
              />
              <p className="text-xs text-slate-400 font-semibold">
                {remoteUser?.name}'s camera is off
              </p>
            </div>
          ) : (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}

          {/* Local Self Video Thumbnail Overlay */}
          <div className="absolute bottom-4 right-4 w-32 h-44 bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl group">
            {isCamOff ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-2 text-center">
                <User className="w-8 h-8 text-slate-600 mb-1" />
                <span className="text-[10px] text-slate-500 font-bold">Cam Off</span>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            )}
          </div>
        </div>
      ) : (
        /* Voice Call Interface */
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <img
              src={remoteUser?.avatarUrl}
              alt={remoteUser?.name}
              className="w-36 h-36 rounded-full object-cover ring-4 ring-brand-500/30 shadow-2xl"
            />
            {remoteMuted && (
              <span className="absolute bottom-1 right-1 p-2 bg-red-600 text-white rounded-full ring-2 ring-slate-950">
                <MicOff className="w-4 h-4" />
              </span>
            )}
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold text-white">{remoteUser?.name}</h2>
            <p className="text-sm font-semibold text-brand-400">
              {callState === 'calling' ? 'Calling...' : formatDuration(callDuration)}
            </p>
          </div>

          {/* Hidden Audio element for remote voice stream */}
          <audio ref={remoteVideoRef} autoPlay />
        </div>
      )}

      {/* Bottom In-Call Control Bar */}
      <div className="flex items-center gap-3 sm:gap-4 bg-slate-900/90 backdrop-blur-lg px-6 py-4 rounded-3xl border border-slate-800 shadow-2xl mb-2">
        {/* Mute Mic */}
        <button
          onClick={toggleMute}
          className={`p-3.5 sm:p-4 rounded-2xl transition-all ${
            isMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Call Controls */}
        {callType === 'video' && (
          <>
            {/* Toggle Camera */}
            <button
              onClick={toggleCamera}
              className={`p-3.5 sm:p-4 rounded-2xl transition-all ${
                isCamOff
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
              title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* Switch Camera (Front / Back) */}
            <button
              onClick={switchCamera}
              className="p-3.5 sm:p-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 transition-all"
              title="Flip / Switch Camera"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Speaker Output Toggle */}
        <button
          onClick={() => toggleSpeaker(remoteVideoRef)}
          className={`p-3.5 sm:p-4 rounded-2xl transition-all ${
            isSpeakerOn
              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-sm'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title={isSpeakerOn ? 'Speaker On' : 'Earpiece / Default Output'}
        >
          {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={endCall}
          className="p-4 sm:p-4.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg shadow-red-600/40 transition-transform active:scale-95"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default CallScreen;
