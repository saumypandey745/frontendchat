import React from 'react';
import { X, Reply } from 'lucide-react';
import useChat from '../hooks/useChat';

const ReplyPreview = () => {
  const { replyingToMessage, setReplyingToMessage } = useChat();

  if (!replyingToMessage) return null;

  return (
    <div className="px-4 py-2 bg-brand-50/80 dark:bg-brand-950/40 border-t border-b border-brand-200 dark:border-brand-900/50 flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-3 min-w-0">
        <Reply className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
        <div className="flex-1 min-w-0 text-xs">
          <p className="font-bold text-brand-700 dark:text-brand-300">
            Replying to {replyingToMessage.senderId?.name || 'User'}
          </p>
          <p className="text-slate-600 dark:text-slate-400 truncate">
            {replyingToMessage.text || '📷 Attachment'}
          </p>
        </div>
      </div>
      <button
        onClick={() => setReplyingToMessage(null)}
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ReplyPreview;
