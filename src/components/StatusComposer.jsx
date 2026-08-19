import React, { useState } from 'react';
import { X, Image as ImageIcon, Type, Send, Loader2, Check, Sparkles } from 'lucide-react';
import useStatus from '../hooks/useStatus';

const GRADIENT_SWATCHES = [
  { name: 'Teal Cyan', value: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)' },
  { name: 'Indigo Pink', value: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)' },
  { name: 'Emerald Teal', value: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)' },
  { name: 'Sunset Amber', value: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
  { name: 'Violet Blue', value: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' },
  { name: 'Midnight', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
];

const FONTS = [
  { name: 'Sans', family: 'sans-serif' },
  { name: 'Serif', family: 'serif' },
  { name: 'Mono', family: 'monospace' },
  { name: 'Cursive', family: 'cursive' },
];

const StatusComposer = ({ isOpen, onClose }) => {
  const { postStatus } = useStatus();

  const [mode, setMode] = useState('text'); // 'text' | 'media'
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [gradient, setGradient] = useState(GRADIENT_SWATCHES[0].value);
  const [font, setFont] = useState(FONTS[0].family);
  const [loading, setLoading] = useState(false);
  const [postedSuccess, setPostedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setMode('media');
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (mode === 'text' && !content.trim()) return;
    if (mode === 'media' && !mediaFile) return;

    setLoading(true);
    const res = await postStatus({
      type: mode,
      content,
      file: mediaFile,
      backgroundColor: gradient,
    });
    setLoading(false);

    if (res.success) {
      setPostedSuccess(true);
      setTimeout(() => {
        setContent('');
        setMediaFile(null);
        setMediaPreview('');
        setPostedSuccess(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-lg h-[85vh] bg-slate-950 border border-slate-800/80 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl">
        {/* Ambient Sci-Fi Glow Background Accent */}
        <div
          style={{ background: mode === 'text' ? gradient : undefined }}
          className="absolute inset-0 opacity-20 blur-3xl pointer-events-none transition-all duration-500"
        />

        {/* Top Header: Exit Button & Sliding Mode Switcher */}
        <div className="p-4 z-20 flex items-center justify-between bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 backdrop-blur-md transition-all active:scale-95 shadow-lg"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Futuristic Sliding Segmented Switcher */}
          <div className="relative flex items-center p-1 bg-slate-900/80 border border-slate-800 rounded-full backdrop-blur-md shadow-inner">
            <div
              className={`absolute inset-y-1 w-1/2 bg-gradient-to-tr from-brand-600 to-accent-cyan rounded-full transition-transform duration-300 ease-out shadow-glow-brand ${
                mode === 'media' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`relative z-10 px-5 py-1.5 text-xs font-extrabold flex items-center gap-1.5 transition-colors ${
                mode === 'text' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type className="w-3.5 h-3.5" /> Text
            </button>
            <button
              type="button"
              onClick={() => setMode('media')}
              className={`relative z-10 px-5 py-1.5 text-xs font-extrabold flex items-center gap-1.5 transition-colors ${
                mode === 'media' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Photo
            </button>
          </div>

          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* Central Composer Canvas */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-6 text-center z-10 overflow-hidden">
          {mode === 'text' ? (
            <div
              style={{ background: gradient }}
              className="w-full h-full rounded-3xl p-6 flex items-center justify-center border border-white/10 shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              {/* Particle Sparkle Accent */}
              <div className="absolute top-4 right-4 opacity-30 text-white animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>

              <textarea
                style={{ fontFamily: font }}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={300}
                placeholder="What's on your mind? Type a status update..."
                className="w-full bg-transparent text-white font-extrabold text-xl sm:text-2xl text-center placeholder-white/50 focus:outline-none resize-none leading-relaxed tracking-wide drop-shadow"
                rows={5}
                autoFocus
              />
            </div>
          ) : (
            <div className="w-full h-full rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
              {mediaPreview ? (
                <img
                  src={mediaPreview}
                  alt="Status Preview"
                  className="w-full h-full object-contain rounded-3xl"
                />
              ) : (
                <label className="flex flex-col items-center justify-center gap-3 cursor-pointer group p-8">
                  {/* Glowing Circular Shutter Button */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-accent-cyan opacity-80 group-hover:opacity-100 blur-md transition-all group-hover:scale-110" />
                    <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-white/40 group-hover:border-white animate-pulse" />
                    <div className="relative w-16 h-16 rounded-full bg-slate-900 border-4 border-white/90 flex items-center justify-center text-white shadow-2xl group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-7 h-7 text-brand-400" />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                    Tap to Select Photo / Video
                  </span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                </label>
              )}

              {/* Frosted Glass Caption Overlay in Media Mode */}
              {mediaPreview && (
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <div className="px-4 py-2 bg-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-2 shadow-2xl">
                    <input
                      type="text"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Add a caption..."
                      className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Controls: Swatches / Font Pickers & Glowing Post Button */}
        <div className="p-5 z-20 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent space-y-4">
          {mode === 'text' && (
            <div className="space-y-3">
              {/* Gradient Swatches Row */}
              <div className="flex items-center justify-center gap-2.5 overflow-x-auto py-1">
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

              {/* Font Selector Row */}
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

          {/* Action Footer Button */}
          <div className="flex items-center justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading || (mode === 'text' && !content.trim()) || (mode === 'media' && !mediaFile)}
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
    </div>
  );
};

export default StatusComposer;
