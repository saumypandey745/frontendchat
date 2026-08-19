import React, { useState } from 'react';
import { X, User, Send, Check } from 'lucide-react';
import useChat from '../hooks/useChat';

const ContactShareModal = ({ isOpen, onClose, onSendContact }) => {
  const { contacts } = useChat();
  const [selectedContact, setSelectedContact] = useState(null);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!selectedContact) return;
    onSendContact({
      name: selectedContact.name,
      email: selectedContact.email,
      phone: selectedContact.phone || '+1 555-0199',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-500" /> Share Contact Card
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {contacts.map(({ user: cUser }) => {
            const isSelected = selectedContact?._id === cUser._id;
            return (
              <div
                key={cUser._id}
                onClick={() => setSelectedContact(cUser)}
                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${
                  isSelected ? 'bg-brand-50 dark:bg-brand-950/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img src={cUser.avatarUrl} alt={cUser.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{cUser.name}</h4>
                    <p className="text-[10px] text-slate-500">{cUser.email}</p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedContact}
            className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl flex items-center gap-2 shadow disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Share Contact
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactShareModal;
