import React, { useState } from 'react';
import { X, Send, Check } from 'lucide-react';
import useChat from '../hooks/useChat';

const ForwardModal = ({ isOpen, onClose, messageId }) => {
  const { contacts, groups, forwardMessage } = useChat();
  const [selectedIds, setSelectedIds] = useState([]);
  const [forwarding, setForwarding] = useState(false);

  if (!isOpen || !messageId) return null;

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
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Forward Message To</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Contacts List */}
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Contacts</p>
          {contacts.map(({ user: cUser }) => {
            const isSelected = selectedIds.includes(cUser._id);
            return (
              <div
                key={cUser._id}
                onClick={() => toggleSelect(cUser._id)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                  isSelected ? 'bg-brand-50 dark:bg-brand-950/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img src={cUser.avatarUrl} alt={cUser.name} className="w-8 h-8 rounded-full object-cover" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{cUser.name}</span>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}

          {/* Groups List */}
          {groups.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">Groups</p>
              {groups.map(({ group: g }) => {
                const isSelected = selectedIds.includes(g._id);
                return (
                  <div
                    key={g._id}
                    onClick={() => toggleSelect(g._id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50 dark:bg-brand-950/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={g.iconUrl} alt={g.name} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{g.name}</span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={forwarding || selectedIds.length === 0}
            className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 rounded-xl flex items-center gap-2 shadow"
          >
            <Send className="w-3.5 h-3.5" />
            Send ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
