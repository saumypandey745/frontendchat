import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, User, Users, ArrowRight, Command } from 'lucide-react';
import useChat from '../hooks/useChat';
import api from '../lib/axios';

const CommandPalette = ({ isOpen, onClose }) => {
  const { selectContact, selectGroup } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Key combination listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/messages/search?q=${encodeURIComponent(query.trim())}`);
        if (res.data.success) {
          setResults(res.data.results);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl glass-modal overflow-hidden flex flex-col max-h-[75vh]">
        {/* Command Search Bar */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3">
          <Search className="w-5 h-5 text-brand-500 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search messages, contacts, and groups..."
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-mono rounded-md text-slate-400">
            <Command className="w-3 h-3" /> K
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <p className="font-bold">Quick Navigation Command Palette</p>
              <p>Type keywords to search across messages, group chats, and contacts.</p>
            </div>
          ) : results.length === 0 && !loading ? (
            <p className="p-8 text-center text-xs text-slate-400">No matching results found for "{query}"</p>
          ) : (
            results.map((m) => (
              <div
                key={m._id}
                onClick={() => {
                  if (m.isGroup) {
                    selectGroup({ _id: m.chatId, name: 'Group Chat' });
                  } else {
                    selectContact(m.senderId);
                  }
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 hover:bg-brand-500/10 border border-slate-200/60 dark:border-slate-800/60 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {m.senderId?.name || 'User'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{m.text}</p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
