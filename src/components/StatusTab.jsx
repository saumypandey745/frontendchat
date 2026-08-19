import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import useStatus from '../hooks/useStatus';
import useAuth from '../hooks/useAuth';
import StatusComposer from './StatusComposer';
import StatusViewer from './StatusViewer';
import Button from './ui/Button';

const StatusTab = () => {
  const { user } = useAuth();
  const { myStatus, contactStatuses } = useStatus();

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [activeViewerGroup, setActiveViewerGroup] = useState(null);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Status Updates
        </h2>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsComposerOpen(true)}>
          Add
        </Button>
      </div>

      {/* List Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* My Status */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">My Status</p>
          <div
            onClick={() => {
              if (myStatus && myStatus.statuses.length > 0) {
                setActiveViewerGroup(myStatus);
              } else {
                setIsComposerOpen(true);
              }
            }}
            className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
          >
            <div className="relative">
              <div
                className={`p-0.5 rounded-full ${
                  myStatus
                    ? 'bg-gradient-to-tr from-brand-500 via-accent-cyan to-accent-indigo animate-gradient-ring'
                    : 'border-2 border-dashed border-slate-300 dark:border-slate-700'
                }`}
              >
                <img
                  src={user?.avatarUrl}
                  alt={user?.name}
                  className="w-13 h-13 rounded-full object-cover border-2 border-white dark:border-slate-900"
                />
              </div>
              <span className="absolute bottom-0 right-0 p-1 bg-brand-600 text-white rounded-full shadow-md">
                <Plus className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">My Status</h4>
              <p className="text-[11px] text-slate-400">
                {myStatus ? `${myStatus.statuses.length} status updates` : 'Tap to add status update'}
              </p>
            </div>
          </div>
        </div>

        {/* Contacts' Status Updates */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Recent Updates</p>
          {contactStatuses.length === 0 ? (
            <p className="text-xs text-slate-400 p-2">No recent status updates from contacts</p>
          ) : (
            contactStatuses.map((group) => (
              <div
                key={group.user._id}
                onClick={() => setActiveViewerGroup(group)}
                className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                <div
                  className={`p-0.5 rounded-full ${
                    group.allViewed
                      ? 'border-2 border-slate-300 dark:border-slate-700'
                      : 'bg-gradient-to-tr from-brand-500 via-accent-cyan to-accent-indigo animate-gradient-ring'
                  }`}
                >
                  <img
                    src={group.user.avatarUrl}
                    alt={group.user.name}
                    className="w-13 h-13 rounded-full object-cover border-2 border-white dark:border-slate-900"
                  />
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {group.user.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">{group.statuses.length} status updates</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <StatusComposer isOpen={isComposerOpen} onClose={() => setIsComposerOpen(false)} />
      <StatusViewer
        isOpen={!!activeViewerGroup}
        onClose={() => setActiveViewerGroup(null)}
        userStatusGroup={activeViewerGroup}
      />
    </div>
  );
};

export default StatusTab;
