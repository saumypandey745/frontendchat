import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import useChat from '../hooks/useChat';
import useTheme from '../hooks/useTheme';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ReactionPicker = ({ messageId, onClose }) => {
  const { toggleReaction } = useChat();
  const { theme } = useTheme();
  const [showFullPicker, setShowFullPicker] = useState(false);

  const handleSelect = (emoji) => {
    toggleReaction(messageId, emoji);
    onClose();
  };

  return (
    <div className="relative inline-block z-40">
      <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-2xl animate-fade-in">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleSelect(emoji)}
            className="p-1 text-lg hover:scale-125 transition-transform active:scale-95"
          >
            {emoji}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowFullPicker(!showFullPicker)}
          className="p-1 text-slate-400 hover:text-brand-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="More Emojis"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showFullPicker && (
        <div className="absolute top-10 left-0 z-50 shadow-2xl rounded-3xl animate-pop-in">
          <EmojiPicker
            onEmojiClick={(eData) => handleSelect(eData.emoji)}
            theme={theme === 'dark' ? 'dark' : 'light'}
            width={280}
            height={320}
          />
        </div>
      )}
    </div>
  );
};

export default ReactionPicker;
