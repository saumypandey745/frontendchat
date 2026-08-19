import React, { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

const WaveformPlayer = ({ audioUrl, isSender }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 1;
      setProgress((cur / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const toggleSpeed = () => {
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 p-1 min-w-[200px]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
        }}
      />

      <button
        onClick={togglePlay}
        className={`p-2.5 rounded-full shadow-sm transition-transform active:scale-95 ${
          isSender
            ? 'bg-white text-brand-600 hover:bg-brand-50'
            : 'bg-brand-600 text-white hover:bg-brand-500'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-0.5 h-6">
          {[40, 70, 30, 90, 50, 80, 60, 100, 45, 75, 35, 85, 55, 65, 95, 50].map((height, i) => {
            const barProgress = (i / 16) * 100;
            const isPlayed = barProgress <= progress;
            return (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={`w-1 rounded-full transition-colors ${
                  isPlayed
                    ? isSender
                      ? 'bg-white'
                      : 'bg-brand-500'
                    : isSender
                    ? 'bg-brand-300/40'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] opacity-80">
          <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <button
        onClick={toggleSpeed}
        className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg border transition-colors ${
          isSender
            ? 'border-brand-200/40 hover:bg-brand-500/20 text-white'
            : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        {speed}x
      </button>
    </div>
  );
};

export default WaveformPlayer;
