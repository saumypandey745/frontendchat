import React, { useState } from 'react';
import { X, Image as ImageIcon, FileText, Link as LinkIcon } from 'lucide-react';
import useChat from '../hooks/useChat';

const MediaGalleryViewer = ({ isOpen, onClose }) => {
  const { messages } = useChat();
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'docs' | 'links'

  if (!isOpen) return null;

  const mediaItems = messages.filter((m) => m.imageUrl || m.type === 'image' || m.type === 'video');
  const docItems = messages.filter((m) => m.type === 'document' || m.fileData);
  const linkItems = messages.filter((m) => m.linkPreview || m.text?.includes('http'));

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-fade-in">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Media, Links & Docs</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 p-2 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-center">
        <button
          onClick={() => setActiveTab('media')}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'media' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400'
          }`}
        >
          Media ({mediaItems.length})
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'docs' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400'
          }`}
        >
          Docs ({docItems.length})
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'links' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400'
          }`}
        >
          Links ({linkItems.length})
        </button>
      </div>

      {/* Content Gallery */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'media' && (
          <div className="grid grid-cols-3 gap-2">
            {mediaItems.map((m) => (
              <img
                key={m._id}
                src={m.imageUrl || m.fileData?.url}
                alt="Shared Media"
                className="w-full h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:opacity-90"
                onClick={() => window.open(m.imageUrl || m.fileData?.url, '_blank')}
              />
            ))}
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-2">
            {docItems.map((m) => (
              <div key={m._id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between text-xs border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="w-5 h-5 text-brand-500 flex-shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{m.fileData?.name || 'Document'}</span>
                </div>
                <a href={m.fileData?.url} download className="px-2.5 py-1 bg-brand-600 text-white rounded-lg font-bold text-[10px]">
                  Download
                </a>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-2">
            {linkItems.map((m) => (
              <div key={m._id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-3 text-xs border border-slate-200 dark:border-slate-700">
                <LinkIcon className="w-5 h-5 text-brand-500 flex-shrink-0" />
                <a href={m.linkPreview?.url || m.text} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-400 font-semibold truncate hover:underline">
                  {m.linkPreview?.title || m.text}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaGalleryViewer;
