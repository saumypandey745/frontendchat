import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Palette, Check, RotateCcw, Upload } from 'lucide-react';
import useChat from '../hooks/useChat';

const SOLID_PRESETS = [
  { name: 'Midnight', value: '#090d16' },
  { name: 'Emerald Teal', value: '#064e3b' },
  { name: 'Royal Indigo', value: '#1e1b4b' },
  { name: 'Warm Amber', value: '#451a03' },
  { name: 'Crimson', value: '#4c0519' },
  { name: 'Deep Purple', value: '#2e1065' },
];

const GRADIENT_PRESETS = [
  { name: 'Cosmic Sky', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)' },
  { name: 'Aurora', value: 'linear-gradient(135deg, #064e3b 0%, #022c22 50%, #0f172a 100%)' },
  { name: 'Sunset Glow', value: 'linear-gradient(135deg, #451a03 0%, #7c2d12 50%, #18181b 100%)' },
  { name: 'Neon Dusk', value: 'linear-gradient(135deg, #4c0519 0%, #831843 50%, #0f172a 100%)' },
];

const WallpaperPickerModal = ({ isOpen, onClose, chatId }) => {
  const { chatSettings, updateChatSetting } = useChat();
  const fileInputRef = useRef(null);

  const existingWallpaper = chatSettings[chatId]?.wallpaper || '';

  const [selectedStyle, setSelectedStyle] = useState(existingWallpaper);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !chatId) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        alert('Wallpaper image size should be less than 10MB.');
        return;
      }
      setFile(selected);
      const objectUrl = URL.createObjectURL(selected);
      setFilePreview(objectUrl);
      setSelectedStyle(`url(${objectUrl})`);
    }
  };

  const handleResetDefault = async () => {
    setSaving(true);
    await updateChatSetting(chatId, { wallpaperColor: '' });
    setSelectedStyle('');
    setFile(null);
    setFilePreview('');
    setSaving(false);
    onClose();
  };

  const handleSave = async () => {
    setSaving(true);
    if (file) {
      await updateChatSetting(chatId, { wallpaperFile: file });
    } else {
      await updateChatSetting(chatId, { wallpaperColor: selectedStyle });
    }
    setSaving(false);
    onClose();
  };

  // Preview styling helper
  const getPreviewBackground = () => {
    if (filePreview) return { backgroundImage: `url(${filePreview})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    if (selectedStyle.startsWith('url(')) return { backgroundImage: selectedStyle, backgroundSize: 'cover', backgroundPosition: 'center' };
    if (selectedStyle.startsWith('linear-gradient')) return { backgroundImage: selectedStyle };
    if (selectedStyle) return { backgroundColor: selectedStyle };
    return { backgroundColor: '#0f172a' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Palette className="w-5 h-5 text-brand-500" /> Custom Chat Wallpaper
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Live Chat Preview Box */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Live Preview</p>
            <div
              style={getPreviewBackground()}
              className="h-40 rounded-2xl p-4 flex flex-col justify-end space-y-2 border border-slate-700/50 shadow-inner relative overflow-hidden transition-all duration-300"
            >
              <div className="p-2.5 max-w-[70%] bg-slate-800/90 text-white rounded-2xl rounded-bl-md text-xs shadow-sm self-start">
                Hey! This is a preview of your custom wallpaper 🎨
              </div>
              <div className="p-2.5 max-w-[70%] bg-brand-600 text-white rounded-2xl rounded-br-md text-xs shadow-sm self-end">
                Looks awesome! Legibility is crystal clear ✨
              </div>
            </div>
          </div>

          {/* Solid Color Presets */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Solid Colors</p>
            <div className="grid grid-cols-3 gap-2">
              {SOLID_PRESETS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setSelectedStyle(c.value);
                    setFile(null);
                    setFilePreview('');
                  }}
                  style={{ backgroundColor: c.value }}
                  className={`h-14 rounded-xl border-2 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-all ${
                    selectedStyle === c.value && !file ? 'scale-105 border-brand-500 shadow-md ring-2 ring-brand-500/50' : 'border-transparent hover:scale-102'
                  }`}
                >
                  <span>{c.name}</span>
                  {selectedStyle === c.value && !file && <Check className="w-4 h-4 mt-0.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Gradient Presets */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Gradient Patterns</p>
            <div className="grid grid-cols-2 gap-2">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => {
                    setSelectedStyle(g.value);
                    setFile(null);
                    setFilePreview('');
                  }}
                  style={{ backgroundImage: g.value }}
                  className={`h-14 rounded-xl border-2 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-all ${
                    selectedStyle === g.value && !file ? 'scale-105 border-brand-500 shadow-md ring-2 ring-brand-500/50' : 'border-transparent hover:scale-102'
                  }`}
                >
                  <span>{g.name}</span>
                  {selectedStyle === g.value && !file && <Check className="w-4 h-4 mt-0.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Custom Image */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Custom Image</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-brand-50/30 dark:hover:bg-brand-950/20 transition-all"
            >
              <Upload className="w-4 h-4 text-brand-500" />
              {file ? `Selected: ${file.name}` : 'Upload Custom Image from Computer'}
            </button>
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleResetDefault}
            disabled={saving}
            className="px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow shadow-brand-600/30 transition-transform active:scale-95"
            >
              {saving ? 'Applying...' : 'Apply Wallpaper'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WallpaperPickerModal;
