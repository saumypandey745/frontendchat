import React, { useState } from 'react';
import { Lock, Unlock, X, ShieldAlert, KeyRound } from 'lucide-react';
import useChat from '../hooks/useChat';

const ChatLockModal = ({ chatId, isCurrentlyLocked, onClose, onLockStateChanged }) => {
  const { toggleChatLock, verifyChatPin } = useChat();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAction = async (e) => {
    e.preventDefault();
    setError('');

    if (pin.length < 4 || !/^\d+$/.test(pin)) {
      setError('Please enter a 4-digit numeric PIN');
      return;
    }

    if (!isCurrentlyLocked && pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);

    if (isCurrentlyLocked) {
      // Unlocking chat
      const res = await toggleChatLock(chatId, false, pin);
      setLoading(false);
      if (res.success) {
        if (onLockStateChanged) onLockStateChanged(false);
        onClose();
      } else {
        setError(res.message || 'Failed to unlock chat');
      }
    } else {
      // Locking chat
      const res = await toggleChatLock(chatId, true, pin);
      setLoading(false);
      if (res.success) {
        if (onLockStateChanged) onLockStateChanged(true);
        onClose();
      } else {
        setError(res.message || 'Failed to lock chat');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-pop-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            {isCurrentlyLocked ? (
              <Unlock className="w-5 h-5 text-emerald-500" />
            ) : (
              <Lock className="w-5 h-5 text-brand-500" />
            )}
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              {isCurrentlyLocked ? 'Unlock Chat' : 'Lock Chat'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAction} className="p-5 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isCurrentlyLocked
              ? 'Enter your 4-digit PIN to unlock this chat and move it back to your primary chat list.'
              : 'Set a 4-digit PIN for this chat. Locked chats are hidden from the primary chat list and require PIN verification to view.'}
          </p>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isCurrentlyLocked ? 'Enter 4-Digit PIN' : 'Create 4-Digit PIN'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-center text-lg font-bold tracking-widest text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {!isCurrentlyLocked && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-center text-lg font-bold tracking-widest text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-2xl shadow-md transition-all flex items-center gap-1.5"
            >
              {loading ? (
                'Processing...'
              ) : isCurrentlyLocked ? (
                <>
                  <Unlock className="w-4 h-4" /> Unlock Chat
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Lock Chat
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatLockModal;
