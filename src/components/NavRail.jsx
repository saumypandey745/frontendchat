import React, { useState, useEffect } from 'react';
import { MessageSquare, Radar, Phone, Settings, Sparkles, Download, Building2, Radio } from 'lucide-react';
import Tooltip from './ui/Tooltip';
import ProfileMenu from './ProfileMenu';
import useStatus from '../hooks/useStatus';

const NavRail = ({ activeTab, setActiveTab, onOpenSettings, onOpenCommunities, onOpenChannels, showMobileChat }) => {
  const { contactStatuses } = useStatus();
  const hasUnseenStatus = contactStatuses.some((g) => !g.allViewed);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'channels', label: 'Channels', icon: Radio, isChannel: true },
    { id: 'communities', label: 'Communities', icon: Building2, isCommunity: true },
    { id: 'status', label: 'Status Stories', icon: Radar, isStatus: true },
    { id: 'calls', label: 'Calls Log', icon: Phone },
  ];

  return (
    <>
      {/* 1. Desktop Vertical Navigation Rail (>= 768px) */}
      <aside className="hidden md:flex w-16 h-full bg-slate-900 border-r border-slate-800 flex-col items-center justify-between py-4 flex-shrink-0 z-30 shadow-xl">
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
                    onClick={() => {
                      if (item.isChannel) {
                        if (onOpenChannels) onOpenChannels();
                      } else if (item.isCommunity) {
                        if (onOpenCommunities) onOpenCommunities();
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`relative min-h-[44px] min-w-[44px] p-3 rounded-2xl transition-all duration-200 active:scale-95 group flex items-center justify-center ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-glow-brand'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {item.isStatus && isActive && (
                      <div className="absolute -inset-1 rounded-2xl radar-ring opacity-40 blur-xs -z-10" />
                    )}

                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isActive ? 'scale-110' : 'group-hover:scale-110'
                      }`}
                    />

                    {item.isStatus && hasUnseenStatus && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent-cyan rounded-full shadow-glow-brand animate-pulse" />
                    )}

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
          {deferredPrompt && (
            <Tooltip content="Install ChatWave PWA" position="right">
              <button
                onClick={() => {
                  deferredPrompt.prompt();
                  deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
                }}
                className="min-h-[44px] min-w-[44px] p-3 text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl transition-all active:scale-95 flex items-center justify-center animate-bounce"
              >
                <Download className="w-5 h-5" />
              </button>
            </Tooltip>
          )}

          <Tooltip content="Account Settings" position="right">
            <button
              onClick={onOpenSettings}
              className="min-h-[44px] min-w-[44px] p-3 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-2xl transition-all active:scale-95 flex items-center justify-center"
            >
              <Settings className="w-5 h-5" />
            </button>
          </Tooltip>

          <ProfileMenu />
        </div>
      </aside>

      {/* 2. Mobile Fixed Bottom Navigation Tab Bar (< 768px) - Hidden when active chat is open */}
      <div className={`md:hidden ${showMobileChat ? 'hidden' : 'fixed'} bottom-0 inset-x-0 h-16 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 z-30 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] shadow-2xl`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isChannel) {
                  if (onOpenChannels) onOpenChannels();
                } else if (item.isCommunity) {
                  if (onOpenCommunities) onOpenCommunities();
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all duration-200 active:scale-95 relative ${
                isActive ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                {item.isStatus && hasUnseenStatus && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-cyan rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label.split(' ')[0]}</span>
              {isActive && (
                <span className="absolute top-0 inset-x-4 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          );
        })}

        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center flex-1 h-12 rounded-xl text-slate-400 hover:text-slate-200 active:scale-95"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Settings</span>
        </button>

        <div className="flex items-center justify-center flex-1 h-12">
          <ProfileMenu />
        </div>
      </div>
    </>
  );
};

export default NavRail;
