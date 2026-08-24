import React, { useState, useEffect } from 'react';
import { X, Megaphone, Plus, Trash2, Send, Check, Users, Loader2, UserCheck, AlertCircle } from 'lucide-react';
import api from '../lib/axios';
import useChat from '../hooks/useChat';

const BroadcastListModal = ({ isOpen, onClose }) => {
  const { contacts } = useChat();

  const [broadcastLists, setBroadcastLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create'
  const [selectedList, setSelectedList] = useState(null);

  // New list form
  const [listName, setListName] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState([]);

  // Send message form
  const [broadcastText, setBroadcastText] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  const fetchLists = async () => {
    setLoading(true);
    try {
      const res = await api.get('/broadcasts');
      if (res.data?.success) {
        setBroadcastLists(res.data.broadcastLists || []);
      }
    } catch (err) {
      console.error('Failed to fetch broadcast lists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLists();
      setActiveTab('list');
      setSelectedList(null);
      setError('');
      setStatusMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleRecipient = (userId) => {
    setSelectedRecipients((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!listName.trim()) {
      setError('List name is required');
      return;
    }
    if (selectedRecipients.length === 0) {
      setError('Select at least one contact for the broadcast list');
      return;
    }

    setSending(true);
    setError('');
    try {
      const res = await api.post('/broadcasts', {
        name: listName.trim(),
        recipients: selectedRecipients,
      });

      if (res.data?.success) {
        setStatusMsg('Broadcast list created successfully!');
        setListName('');
        setSelectedRecipients([]);
        await fetchLists();
        setTimeout(() => {
          setActiveTab('list');
          setStatusMsg('');
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create broadcast list');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Delete this broadcast list?')) return;
    try {
      await api.delete(`/broadcasts/${listId}`);
      if (selectedList?._id === listId) setSelectedList(null);
      await fetchLists();
    } catch (err) {
      console.error('Delete broadcast list error:', err);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!selectedList || !broadcastText.trim()) return;

    setSending(true);
    setError('');
    setStatusMsg('');

    try {
      const res = await api.post(`/broadcasts/${selectedList._id}/send`, {
        text: broadcastText.trim(),
      });

      if (res.data?.success) {
        setStatusMsg(`Delivered as individual 1-on-1 messages to ${res.data.sentCount} recipients!`);
        setBroadcastText('');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send broadcast message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-500" />
            Broadcast Lists
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => {
              setActiveTab('list');
              setSelectedList(null);
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              activeTab === 'list'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            📋 My Broadcast Lists ({broadcastLists.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              activeTab === 'create'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ➕ New Broadcast List
          </button>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="m-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {statusMsg && (
          <div className="m-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Tab 1: List View & Broadcast Composer */}
        {activeTab === 'list' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              </div>
            ) : broadcastLists.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  No broadcast lists created yet
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl shadow"
                >
                  Create New Broadcast List
                </button>
              </div>
            ) : selectedList ? (
              /* Broadcast Send View */
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-brand-500" />
                      {selectedList.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedList.recipients?.length || 0} recipients
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedList(null)}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Back to all lists
                  </button>
                </div>

                {/* Recipient Avatars */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {selectedList.recipients?.map((r) => (
                    <div key={r._id} className="flex flex-col items-center flex-shrink-0 w-12 text-center">
                      <img
                        src={r.avatarUrl}
                        alt={r.name}
                        className="w-9 h-9 rounded-full object-cover border-2 border-brand-500/40"
                      />
                      <span className="text-[10px] text-slate-500 truncate w-full mt-0.5">{r.name}</span>
                    </div>
                  ))}
                </div>

                {/* Broadcast Message Input Form */}
                <form onSubmit={handleSendBroadcast} className="space-y-3 pt-2">
                  <textarea
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    rows={4}
                    placeholder="Type message to broadcast as individual 1-on-1 chats..."
                    className="w-full p-3 text-xs rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedList(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sending || !broadcastText.trim()}
                      className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl flex items-center gap-2 shadow disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Send Broadcast
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* List Selection View */
              <div className="space-y-3">
                {broadcastLists.map((list) => (
                  <div
                    key={list._id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-between hover:border-brand-500/50 transition-all cursor-pointer group"
                    onClick={() => setSelectedList(list)}
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-brand-500" />
                        {list.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        👥 {list.recipients?.length || 0} recipients
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedList(list);
                        }}
                        className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow"
                      >
                        <Send className="w-3 h-3" /> Broadcast
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list._id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Delete List"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create List View */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateList} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Broadcast List Name
              </label>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g. Work Team / VIP Clients"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Select Recipients ({selectedRecipients.length} selected)
              </label>
              <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-2xl p-2">
                {contacts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No contacts found</p>
                ) : (
                  contacts.map((c) => {
                    const isSelected = selectedRecipients.includes(c.user?._id);
                    return (
                      <div
                        key={c.user?._id}
                        onClick={() => toggleRecipient(c.user?._id)}
                        className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-brand-50 dark:bg-brand-950/40 border border-brand-500/40'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={c.user?.avatarUrl}
                            alt={c.user?.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {c.user?.nickname || c.user?.name}
                            </p>
                            <p className="text-[10px] text-slate-400">{c.user?.chatwaveId}</p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl flex items-center gap-2 shadow disabled:opacity-50"
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Broadcast List
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BroadcastListModal;
