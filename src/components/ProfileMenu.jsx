import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, Sun, Moon, Monitor, LogOut, ChevronDown, Star } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import EditProfileModal from './EditProfileModal';
import AccountSettingsModal from './AccountSettingsModal';
import StarredMessagesModal from './StarredMessagesModal';

const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isStarredModalOpen, setIsStarredModalOpen] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all focus:outline-none"
        >
          <div className="relative">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-500/20 shadow-sm"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </div>
          <span className="hidden sm:block text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
            {user.name}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 glass-dropdown rounded-2xl shadow-2xl py-2 z-40 animate-fade-in divide-y divide-slate-100 dark:divide-slate-800">
            <div className="px-4 py-3 flex items-center gap-3">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-brand-500/30"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors"
              >
                <User className="w-4 h-4 text-brand-500" /> Edit Profile
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsStarredModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors"
              >
                <Star className="w-4 h-4 text-amber-500" /> Starred Messages
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsSettingsModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors"
              >
                <Settings className="w-4 h-4 text-brand-500" /> Account Settings
              </button>
            </div>

            <div className="px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Theme
              </p>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    theme === 'light'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    theme === 'dark'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Dark
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    theme === 'system'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Auto
                </button>
              </div>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
      <AccountSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
      <StarredMessagesModal isOpen={isStarredModalOpen} onClose={() => setIsStarredModalOpen(false)} />
    </>
  );
};

export default ProfileMenu;
