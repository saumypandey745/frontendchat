import React from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

const ChatSearchBar = ({ isOpen, onClose, query, setQuery, matchCount, currentMatch, onNext, onPrev }) => {
  if (!isOpen) return null;

  return (
    <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 animate-fade-in z-20">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in conversation..."
          className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
          autoFocus
        />
      </div>

      {query.trim() && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{matchCount > 0 ? `${currentMatch}/${matchCount}` : 'No matches'}</span>
          <button onClick={onPrev} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={onNext} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ChatSearchBar;
