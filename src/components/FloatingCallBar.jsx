import React from 'react';
import {
  Maximize2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  WifiOff,
} from 'lucide-react';
import useCall from '../hooks/useCall';

const FloatingCallBar = () => {
  const {
    callState,
    callType,
    remoteUser,
    isMuted,
    isCamOff,
    callDuration,
    isMinimized,
    isReconnecting,
    toggleMute,
    toggleCamera,
    endCall,
    maximizeCall,
  } = useCall();

  if (!isMinimized || callState === 'idle') return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-slide-down border-l-4 border-l-brand-500">
      {/* Avatar & User Info */}
      <div
        onClick={maximizeCall}
        className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
      >
        <div className="relative">
          <img
            src={remoteUser?.avatarUrl}
            alt={remoteUser?.name}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-500/30"
          />
          {isReconnecting && (
            <span className="absolute -top-1 -right-1 p-0.5 bg-amber-500 rounded-full text-slate-900">
              <WifiOff className="w-3 h-3" />
            </span>
          )}
        </div>
        <div>
          <h4 className="text-xs font-bold truncate max-w-[100px] sm:max-w-[140px]">
            {remoteUser?.name}
          </h4>
          <p className="text-[10px] text-brand-400 font-semibold font-mono">
            {isReconnecting ? (
              <span className="text-amber-400 animate-pulse">Reconnecting...</span>
            ) : callState === 'calling' ? (
              'Calling...'
            ) : (
              formatDuration(callDuration)
            )}
          </p>
        </div>
      </div>

      <div className="h-6 border-r border-slate-700/80" />

      {/* Control Quick Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleMute}
          className={`p-2 rounded-xl transition-all ${
            isMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>

        {callType === 'video' && (
          <button
            onClick={toggleCamera}
            className={`p-2 rounded-xl transition-all ${
              isCamOff
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isCamOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
          </button>
        )}

        <button
          onClick={endCall}
          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow transition-transform active:scale-95"
          title="End Call"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={maximizeCall}
          className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow transition-transform active:scale-95"
          title="Expand Call Screen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default FloatingCallBar;
