import React from 'react';
import { MessageSquarePlus, Search, Star, Archive, ShieldOff } from 'lucide-react';
import Button from './ui/Button';

const EmptyState = ({ type = 'chats', onAction }) => {
  const configs = {
    chats: {
      icon: MessageSquarePlus,
      title: 'No active conversations yet',
      description: 'Start a 1-on-1 chat with a friend or create a group to begin messaging.',
      actionLabel: 'New Chat / Group',
    },
    search: {
      icon: Search,
      title: 'No matching results found',
      description: 'Try searching with a different keyword, name, or message snippet.',
      actionLabel: null,
    },
    starred: {
      icon: Star,
      title: 'No starred messages yet',
      description: 'Star important messages in any chat to save them here for quick access.',
      actionLabel: null,
    },
    archive: {
      icon: Archive,
      title: 'No archived chats',
      description: 'Archive conversations you want to hide from your main chat feed.',
      actionLabel: null,
    },
    blocked: {
      icon: ShieldOff,
      title: 'No blocked contacts',
      description: 'Contacts you block will appear here.',
      actionLabel: null,
    },
  };

  const current = configs[type] || configs.chats;
  const Icon = current.icon;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 rounded-3xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 flex items-center justify-center shadow-glow-brand">
          <Icon className="w-8 h-8 stroke-[1.5]" />
        </div>
      </div>

      <div className="max-w-xs space-y-1">
        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{current.title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {current.description}
        </p>
      </div>

      {current.actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {current.actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
