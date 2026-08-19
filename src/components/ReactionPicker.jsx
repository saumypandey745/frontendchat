import React from 'react';
import useChat from '../hooks/useChat';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ReactionPicker = ({ messageId, onClose }) => {
  const { toggleReaction } = useChat();

  const handleSelect = (emoji) => {
    toggleReaction(messageId, emoji);
    onClose();
  };

  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-xl animate-fade-in z-30">
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleSelect(emoji)}
          className="p-1.5 text-lg hover:scale-125 transition-transform"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default ReactionPicker;
