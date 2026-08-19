import React, { useState, useEffect } from 'react';
import { X, ShieldOff, Loader2 } from 'lucide-react';
import api from '../lib/axios';

const BlockedContactsModal = ({ isOpen, onClose }) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBlocked = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/blocked');
      if (res.data.success) {
        setBlockedUsers(res.data.blockedUsers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchBlocked();
  }, [isOpen]);

  const handleUnblock = async (targetUserId) => {
    try {
      await api.post(`/users/block/${targetUserId}`);
      fetchBlocked();
    } catch (e) {
      alert('Unblock failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldOff className="w-5 h-5 text-red-500" /> Blocked Contacts
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
          ) : blockedUsers.length === 0 ? (
            <p className="text-center text-xs text-slate-400 p-8">No blocked contacts</p>
          ) : (
            blockedUsers.map((bUser) => (
              <div
                key={bUser._id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <img src={bUser.avatarUrl} alt={bUser.name} className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{bUser.name}</h4>
                    <p className="text-[10px] text-slate-400">{bUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleUnblock(bUser._id)}
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-semibold rounded-lg text-slate-800 dark:text-slate-200"
                >
                  Unblock
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockedContactsModal;
