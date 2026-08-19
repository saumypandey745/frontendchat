import React, { useState, useEffect } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import api from '../lib/axios';

const StarredMessagesModal = ({ isOpen, onClose }) => {
  const [starred, setStarred] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStarred = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messages/starred');
      if (res.data.success) {
        setStarred(res.data.starredMessages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchStarred();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Starred Messages
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : starred.length === 0 ? (
            <p className="text-center text-xs text-slate-400 p-8">No starred messages yet</p>
          ) : (
            starred.map((m) => (
              <div
                key={m._id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{m.senderId?.name || 'User'}</span>
                  <span className="text-[10px] text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">{m.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StarredMessagesModal;
