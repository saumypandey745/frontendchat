import React, { useState, useEffect } from 'react';
import { UserPlus, X, Hash, Tag, Check, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/axios';
import useChat from '../hooks/useChat';

const AddContactModal = ({ isOpen, onClose, initialChatwaveId = '', initialNickname = '' }) => {
  const { fetchContacts, selectContact } = useChat();

  const [chatwaveId, setChatwaveId] = useState(initialChatwaveId);
  const [nickname, setNickname] = useState(initialNickname);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setChatwaveId(initialChatwaveId);
      setNickname(initialNickname);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, initialChatwaveId, initialNickname]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanId = chatwaveId.trim().replace(/\s+/g, '');
    if (!cleanId) {
      setError('Please enter a 10-digit ChatWave ID');
      return;
    }

    if (!/^\d{10}$/.test(cleanId)) {
      setError('ChatWave ID must be exactly 10 digits (e.g. 4829173650)');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/users/contacts/add', {
        chatwaveId: cleanId,
        nickname: nickname.trim(),
      });

      if (res.data.success) {
        setSuccessMsg(`Added ${res.data.contact.user.name} to your contacts!`);
        await fetchContacts();
        if (res.data.contact?.user) {
          selectContact(res.data.contact.user);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-pop-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Add Contact by ID</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ChatWave ID Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-brand-500" />
              <span>ChatWave ID (10 digits)</span>
            </label>
            <input
              type="text"
              value={chatwaveId}
              onChange={(e) => setChatwaveId(e.target.value)}
              placeholder="e.g. 4829 173 650"
              maxLength={14}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm font-bold tracking-wider placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-[10px] text-slate-400">Ask your contact for their 10-digit ChatWave ID found on their Profile.</p>
          </div>

          {/* Optional Nickname Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-500" />
              <span>Custom Nickname (Optional)</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Save as custom display name..."
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>Add Contact</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContactModal;
