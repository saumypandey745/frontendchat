import React from 'react';
import { MessageSquare, Radar, Phone, Settings, Sparkles } from 'lucide-react';
import Tooltip from './ui/Tooltip';
import ProfileMenu from './ProfileMenu';
import useStatus from '../hooks/useStatus';

const NavRail = ({ activeTab, setActiveTab, onOpenSettings }) => {
  const { contactStatuses } = useStatus();
  const hasUnseenStatus = contactStatuses.some((g) => !g.allViewed);

  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'status', label: 'Status Stories', icon: Radar, isStatus: true },
    { id: 'calls', label: 'Calls Log', icon: Phone },
  ];

  return (
    <aside className="w-16 h-full bg-slate-900 border-r border-slate-800 flex flex-col items-center justify-between py-4 flex-shrink-0 z-30 shadow-xl">
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-cyan text-white flex items-center justify-center shadow-lg shadow-brand-500/30 animate-pulse">
          <Sparkles className="w-5 h-5" />
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Tooltip key={item.id} content={item.label} position="right">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`relative p-3 rounded-2xl transition-all duration-200 active:scale-95 group ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-glow-brand'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {/* Outer Radar Conic Ring for Active Status Tab */}
                  {item.isStatus && isActive && (
                    <div className="absolute -inset-1 rounded-2xl radar-ring opacity-40 blur-xs -z-10" />
                  )}

                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    }`}
                  />

                  {/* Glowing Unseen Status Dot Indicator */}
                  {item.isStatus && hasUnseenStatus && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent-cyan rounded-full shadow-glow-brand animate-pulse" />
                  )}

                  {/* Active Left Indicator Bar */}
                  {isActive && (
                    <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-brand-400 rounded-l-full" />
                  )}
                </button>
              </Tooltip>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-3">
        <Tooltip content="Account Settings" position="right">
          <button
            onClick={onOpenSettings}
            className="p-3 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-2xl transition-all active:scale-95"
          >
            <Settings className="w-5 h-5" />
          </button>
        </Tooltip>

        <ProfileMenu />
      </div>
    </aside>
  );
};

export default NavRail;
