import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Send } from 'lucide-react';

const VoiceRecorder = ({ onCancel, onSendAudio }) => {
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setRecording(true);
      setTimer(0);

      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Could not access microphone.');
    }
  };

  const stopAndSend = () => {
    if (!mediaRecorderRef.current || !recording) return;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      onSendAudio(audioFile);
    };

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    cleanup();
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    cleanup();
    onCancel();
  };

  const cleanup = () => {
    setRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimer(0);
  };

  useEffect(() => {
    startRecording();
    return () => cleanup();
  }, []);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex items-center justify-between bg-red-500/10 border border-red-500/30 px-5 py-2.5 rounded-3xl animate-slide-up">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
        <span className="text-xs font-mono font-extrabold text-red-500">
          {formatTimer(timer)}
        </span>
        {/* Animated Waveform Bars */}
        <div className="flex items-center gap-1">
          <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce [animation-delay:0.1s]" />
          <span className="w-1 h-5 bg-red-500 rounded-full animate-bounce [animation-delay:0.3s]" />
          <span className="w-1 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]" />
          <span className="w-1 h-6 bg-red-500 rounded-full animate-bounce [animation-delay:0.4s]" />
          <span className="w-1 h-4 bg-red-500 rounded-full animate-bounce [animation-delay:0.15s]" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={cancelRecording}
          className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-colors"
          title="Cancel"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={stopAndSend}
          className="p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl shadow-md shadow-brand-600/30 transition-transform active:scale-95"
          title="Send Voice Note"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default VoiceRecorder;
