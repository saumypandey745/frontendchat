import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Users, UserX, UserCheck, Volume2, VolumeX, Check, Loader2, Search } from 'lucide-react';
import api from '../lib/axios';
import useChat from '../hooks/useChat';
import useStatus from '../hooks/useStatus';

const StatusPrivacyModal = ({ isOpen, onClose }) => {
  const { contacts } = useChat();
  const { fetchStatuses } = useStatus();

  const [mode, setMode] = useState('contacts'); // 'contacts' | 'contacts_except' | 'only_share_with'
  const [selectedExceptions, setSelectedExceptions] = useState([]); // array of userIds
  const [mutedUsers, setMutedUsers] = useState([]); // array of populated user objects

  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPrivacyData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/statuses/privacy');
      if (res.data?.success) {
        setMode(res.data.statusPrivacy?.mode || 'contacts');
        const excIds = (res.data.statusPrivacy?.exceptions || []).map((u) => u._id || u);
        setSelectedExceptions(excIds);
        setMutedUsers(res.data.mutedStatusUsers || []);
      }
    } catch (err) {
      console.error('Fetch status privacy error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPrivacyData();
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSavePrivacy = async (newMode, newExceptions) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/statuses/privacy', {
        mode: newMode || mode,
        exceptions: newExceptions !== undefined ? newExceptions : selectedExceptions,
      });

      if (res.data?.success) {
        setSuccess('Status privacy updated!');
        setMode(res.data.statusPrivacy.mode);
        const excIds = (res.data.statusPrivacy.exceptions || []).map((u) => u._id || u);
        setSelectedExceptions(excIds);
        await fetchStatuses();
        setTimeout(() => setSuccess(''), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status privacy');
    } finally {
      setSaving(false);
    }
  };

  const handleUnmuteUser = async (targetUserId) => {
    try {
      const res = await api.post('/statuses/mute-user', { targetUserId });
      if (res.data?.success) {
        setMutedUsers(res.data.mutedStatusUsers || []);
        await fetchStatuses();
      }
    } catch (err) {
      console.error('Unmute error:', err);
    }
  };

  const toggleExceptionUser = (userId) => {
    const nextExceptions = selectedExceptions.includes(userId)
      ? selectedExceptions.filter((id) => id !== userId)
      : [...selectedExceptions, userId];

    setSelectedExceptions(nextExceptions);
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-500" />
            Status Privacy & Settings
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-600 flex items-center gap-2">
              <Check className="w-4 h-4" /> {success}
            </div>
          )}

          {/* Section 1: Who can see my status */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Who can see my status updates
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Changes will apply immediately to who can view your current and future status updates.
              </p>
            </div>

            <div className="space-y-2">
              {[
                {
                  id: 'contacts',
                  title: 'My contacts',
                  desc: 'All saved contacts can view your status updates',
                  icon: Users,
                },
                {
                  id: 'contacts_except',
                  title: 'My contacts, except...',
                  desc: 'All contacts except specific people you exclude',
                  icon: UserX,
                },
                {
                  id: 'only_share_with',
                  title: 'Only share with...',
                  desc: 'Only specific contacts you select can view your status',
                  icon: UserCheck,
                },
              ].map((option) => {
                const isSelected = mode === option.id;
                const Icon = option.icon;

                return (
                  <div
                    key={option.id}
                    onClick={() => {
                      setMode(option.id);
                      if (option.id !== 'contacts') {
                        setIsContactPickerOpen(true);
                      } else {
                        handleSavePrivacy('contacts', []);
                      }
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand-50/60 dark:bg-brand-950/30 border-brand-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {option.title}
                        </h5>
                        <p className="text-[10px] text-slate-500">{option.desc}</p>
                        {option.id !== 'contacts' && isSelected && (
                          <span className="inline-block mt-1 text-[10px] font-extrabold text-brand-600 dark:text-brand-400">
                            {selectedExceptions.length} contacts selected (tap to edit)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Muted Status Updates */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <VolumeX className="w-4 h-4 text-amber-500" />
                Muted Status Updates ({mutedUsers.length})
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Muted contacts appear under "Muted updates" at the bottom without sending notifications.
              </p>
            </div>

            {mutedUsers.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl text-center">
                No muted status contacts
              </p>
            ) : (
              <div className="space-y-2">
                {mutedUsers.map((mUser) => (
                  <div
                    key={mUser._id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={mUser.avatarUrl}
                        alt={mUser.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {mUser.name}
                        </h5>
                        <p className="text-[10px] text-slate-500">{mUser.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnmuteUser(mUser._id)}
                      className="px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Unmute
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Exceptions Contact Picker Overlay Modal */}
        {isContactPickerOpen && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col animate-fade-in">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {mode === 'contacts_except' ? 'Exclude Contacts' : 'Select Contacts to Share With'}
              </h4>
              <button
                onClick={() => {
                  setIsContactPickerOpen(false);
                  handleSavePrivacy(mode, selectedExceptions);
                }}
                className="px-4 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-bold shadow"
              >
                Done ({selectedExceptions.length})
              </button>
            </div>

            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {filteredContacts.map((contact) => {
                const isSelected = selectedExceptions.includes(contact._id);
                return (
                  <div
                    key={contact._id}
                    onClick={() => toggleExceptionUser(contact._id)}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-brand-50/60 dark:bg-brand-950/30 border-brand-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={contact.avatarUrl}
                        alt={contact.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {contact.nickname || contact.name}
                        </h5>
                        <p className="text-[10px] text-slate-500">{contact.chatwaveId || contact.email}</p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'}`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusPrivacyModal;
