import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, Loader2 } from 'lucide-react';
import api from '../lib/axios';
import useChat from '../hooks/useChat';

const GlobalSearchOverlay = ({ isOpen, onClose }) => {
  const { selectContact, selectGroup } = useChat();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

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
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Global Search across messages, contacts, and groups..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            autoFocus
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-brand-500" />}
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {query.trim() === '' ? (
            <p className="text-center text-xs text-slate-400 p-8">Type a keyword to search across all chats</p>
          ) : results.length === 0 && !loading ? (
            <p className="text-center text-xs text-slate-400 p-8">No messages found for "{query}"</p>
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
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-brand-500" />
                    {m.senderId?.name || 'User'}
                  </span>
                  <span className="text-[10px] text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{m.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchOverlay;
