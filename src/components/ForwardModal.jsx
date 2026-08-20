import React, { useState } from 'react';
import { X, Send, Check, Search } from 'lucide-react';
import useChat from '../hooks/useChat';

const ForwardModal = ({ isOpen, onClose, messageId }) => {
  const { contacts, groups, forwardMessage } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [forwarding, setForwarding] = useState(false);

  if (!isOpen || !messageId) return null;

  const filteredContacts = contacts.filter(({ user: cUser }) =>
    cUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cUser?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(({ group: g }) =>
    g?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const handleForward = async () => {
    if (selectedIds.length === 0) return;
    setForwarding(true);
    const res = await forwardMessage(messageId, selectedIds);
    setForwarding(false);
    if (res.success) {
      setSelectedIds([]);
      setSearchQuery('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Forward Message To</h3>
          <button
            onClick={() => {
              setSelectedIds([]);
              setSearchQuery('');
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts & groups..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
        </div>

        {/* Destinations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Contacts List */}
          {filteredContacts.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Contacts</p>
              <div className="space-y-1">
                {filteredContacts.map(({ user: cUser }) => {
                  const isSelected = selectedIds.includes(cUser._id);
                  return (
                    <div
                      key={cUser._id}
                      onClick={() => toggleSelect(cUser._id)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                        isSelected ? 'bg-brand-50 dark:bg-brand-950/50 border border-brand-500/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={cUser.avatarUrl} alt={cUser.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{cUser.name}</p>
                          <p className="text-[10px] text-slate-400">{cUser.email}</p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                          isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Groups List */}
          {filteredGroups.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pt-2">Groups</p>
              <div className="space-y-1">
                {filteredGroups.map(({ group: g }) => {
                  const isSelected = selectedIds.includes(g._id);
                  return (
                    <div
                      key={g._id}
                      onClick={() => toggleSelect(g._id)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                        isSelected ? 'bg-brand-50 dark:bg-brand-950/50 border border-brand-500/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={g.iconUrl} alt={g.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{g.name}</p>
                          <p className="text-[10px] text-slate-400">{g.members?.length || 0} members</p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                          isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredContacts.length === 0 && filteredGroups.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No contacts or groups found matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => {
              setSelectedIds([]);
              setSearchQuery('');
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={forwarding || selectedIds.length === 0}
            className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl flex items-center gap-2 shadow-md shadow-brand-600/30 transition-transform active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            {forwarding ? 'Sending...' : `Send to ${selectedIds.length} chat${selectedIds.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
