import React from 'react';
import { ExternalLink } from 'lucide-react';

const LinkPreviewCard = ({ linkPreview }) => {
  if (!linkPreview || !linkPreview.url) return null;

  return (
    <a
      href={linkPreview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-900/80 hover:border-brand-500 transition-colors shadow-sm text-left group"
    >
      {linkPreview.image && (
        <img
          src={linkPreview.image}
          alt={linkPreview.title}
          className="w-full h-32 object-cover"
        />
      )}
      <div className="p-3 space-y-1">
        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 truncate">
          {linkPreview.title || linkPreview.url}
        </h5>
        {linkPreview.description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {linkPreview.description}
          </p>
        )}
        <div className="flex items-center gap-1 text-[10px] text-brand-600 dark:text-brand-400 font-semibold pt-1">
          <ExternalLink className="w-3 h-3" />
          <span className="truncate">{new URL(linkPreview.url).hostname}</span>
        </div>
      </div>
    </a>
  );
};

export default LinkPreviewCard;
