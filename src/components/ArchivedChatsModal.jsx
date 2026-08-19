import React from 'react';
import { X, Archive, ArchiveRestore } from 'lucide-react';
import useChat from '../hooks/useChat';

const ArchivedChatsModal = ({ isOpen, onClose }) => {
  const { contacts, groups, chatSettings, updateChatSetting, selectContact, selectGroup } = useChat();

  if (!isOpen) return null;

  const archivedContacts = contacts.filter((c) => chatSettings[c.user._id]?.archived);
  const archivedGroups = groups.filter((g) => chatSettings[g.group._id]?.archived);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Archive className="w-5 h-5 text-brand-500" /> Archived Chats
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {archivedContacts.length === 0 && archivedGroups.length === 0 ? (
            <p className="text-center text-xs text-slate-400 p-8">No archived chats</p>
          ) : (
            <>
              {archivedContacts.map(({ user: cUser }) => (
                <div
                  key={cUser._id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => {
                      selectContact(cUser);
                      onClose();
                    }}
                  >
                    <img src={cUser.avatarUrl} alt={cUser.name} className="w-9 h-9 rounded-full object-cover" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{cUser.name}</span>
                  </div>
                  <button
                    onClick={() => updateChatSetting(cUser._id, { archived: false })}
                    className="p-1.5 text-slate-400 hover:text-brand-500"
                    title="Unarchive Chat"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {archivedGroups.map(({ group: g }) => (
                <div
                  key={g._id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => {
                      selectGroup(g);
                      onClose();
                    }}
                  >
                    <img src={g.iconUrl} alt={g.name} className="w-9 h-9 rounded-full object-cover" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{g.name}</span>
                  </div>
                  <button
                    onClick={() => updateChatSetting(g._id, { archived: false })}
                    className="p-1.5 text-slate-400 hover:text-brand-500"
                    title="Unarchive Group"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchivedChatsModal;
