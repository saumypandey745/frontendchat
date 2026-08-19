import React, { useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import useChat from '../hooks/useChat';

const ToastNotification = () => {
  const { toastNotification, setToastNotification, contacts, selectContact } = useChat();

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification, setToastNotification]);

  if (!toastNotification) return null;

  const handleClick = () => {
    const contact = contacts.find((c) => c.user._id === toastNotification.senderId);
    if (contact) {
      selectContact(contact.user);
    }
    setToastNotification(null);
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-brand-500 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0" onClick={handleClick}>
        <div className="p-2.5 bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-xl">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
            New Message
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {toastNotification.text}
          </p>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setToastNotification(null);
        }}
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastNotification;
