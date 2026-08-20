import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, RefreshCw } from 'lucide-react';
import useCall from '../hooks/useCall';

const CallScreen = () => {
  const {
    callState,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    isMuted,
    isCamOff,
    callDuration,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    switchCamera,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  if (callState === 'idle') return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Incoming Call Screen Overlay
  if (callState === 'incoming') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 shadow-2xl">
          <div className="relative">
            <img
              src={remoteUser?.avatarUrl}
              alt={remoteUser?.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-brand-500/40 animate-pulse"
            />
            <div className="absolute -bottom-1 -right-1 p-2 bg-brand-600 rounded-full text-white">
              {callType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">{remoteUser?.name}</h3>
            <p className="text-xs text-brand-400 font-semibold mt-1 uppercase tracking-wider">
              Incoming {callType} call...
            </p>
          </div>

          {/* Accept / Decline Action Buttons */}
          <div className="flex items-center gap-8 pt-4">
            <button
              onClick={declineCall}
              className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg shadow-red-600/40 transition-transform active:scale-95"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={acceptCall}
              className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-600/40 transition-transform active:scale-95 animate-bounce"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active / Calling Screen Overlay
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-6 animate-fade-in">
      {/* Video Streams Display */}
      {callType === 'video' ? (
        <div className="relative w-full flex-1 max-w-4xl rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
          {/* Remote Video Stream */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Local Self Video Thumbnail Overlay */}
          <div className="absolute top-4 right-4 w-32 h-44 bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      ) : (
        /* Voice Call Interface */
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <img
            src={remoteUser?.avatarUrl}
            alt={remoteUser?.name}
            className="w-32 h-32 rounded-full object-cover ring-4 ring-brand-500/30 shadow-2xl"
          />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">{remoteUser?.name}</h2>
            <p className="text-sm font-semibold text-brand-400 mt-1">
              {callState === 'calling' ? 'Calling...' : formatDuration(callDuration)}
            </p>
          </div>
          {/* Audio element for remote voice stream */}
          <audio ref={remoteVideoRef} autoPlay />
        </div>
      )}

      {/* Call Header info in Video mode */}
      {callType === 'video' && (
        <div className="absolute top-8 left-8 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 flex items-center gap-3 text-white">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-sm font-bold">{remoteUser?.name}</span>
          <span className="text-xs text-slate-400 font-mono">{formatDuration(callDuration)}</span>
        </div>
      )}

      {/* Bottom In-Call Control Bar */}
      <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-lg px-6 py-4 rounded-3xl border border-slate-800 shadow-2xl mt-4">
        {/* Mute Mic */}
        <button
          onClick={toggleMute}
          className={`p-3.5 rounded-2xl transition-all ${
            isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Toggle Camera */}
        {callType === 'video' && (
          <>
            <button
              onClick={toggleCamera}
              className={`p-3.5 rounded-2xl transition-all ${
                isCamOff ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
              title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* Switch Camera Button */}
            <button
              onClick={switchCamera}
              className="p-3.5 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 transition-all"
              title="Flip / Switch Camera"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </>
        )}

        {/* End Call Button */}
        <button
          onClick={endCall}
          className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg shadow-red-600/40 transition-transform active:scale-95"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default CallScreen;
