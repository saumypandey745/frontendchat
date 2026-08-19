import React, { useState } from 'react';
import { X, Image as ImageIcon, Palette, Check } from 'lucide-react';
import useChat from '../hooks/useChat';

const WALLPAPER_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Midnight', value: '#090d16' },
  { name: 'Emerald Teal', value: '#064e3b' },
  { name: 'Royal Indigo', value: '#1e1b4b' },
  { name: 'Warm Amber', value: '#451a03' },
  { name: 'Crimson', value: '#4c0519' },
];

const WallpaperPickerModal = ({ isOpen, onClose, chatId }) => {
  const { updateChatSetting } = useChat();
  const [selectedColor, setSelectedColor] = useState('');
  const [file, setFile] = useState(null);

  if (!isOpen || !chatId) return null;

  const handleSave = async () => {
    await updateChatSetting(chatId, {
      wallpaperColor: selectedColor,
      wallpaperFile: file,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Palette className="w-5 h-5 text-brand-500" /> Custom Chat Wallpaper
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">Choose a solid color background or upload an image wallpaper for this chat.</p>

          <div className="grid grid-cols-3 gap-2">
            {WALLPAPER_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setSelectedColor(c.value);
                  setFile(null);
                }}
                style={{ backgroundColor: c.value || '#0f172a' }}
                className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-transform ${
                  selectedColor === c.value && !file ? 'scale-105 border-brand-500 shadow-md' : 'border-transparent'
                }`}
              >
                {c.name}
                {selectedColor === c.value && !file && <Check className="w-4 h-4 mt-1" />}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow"
            >
              Apply Wallpaper
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WallpaperPickerModal;
