import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Settings, Sun, Moon, Monitor, LogOut, Star } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import EditProfileModal from './EditProfileModal';
import AccountSettingsModal from './AccountSettingsModal';
import StarredMessagesModal from './StarredMessagesModal';

const FALLBACK_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%230d9488'/%3E%3Ccircle cx='20' cy='16' r='7' fill='white' opacity='0.85'/%3E%3Cellipse cx='20' cy='36' rx='12' ry='10' fill='white' opacity='0.85'/%3E%3C/svg%3E`;

const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, openUpward: false });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isStarredModalOpen, setIsStarredModalOpen] = useState(false);

  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Estimated dropdown height (header + 3 actions + theme switcher + logout + padding)
  const DROPDOWN_HEIGHT = 320;
  const DROPDOWN_WIDTH = 288; // w-72
  const GAP = 8;

  // Compute dropdown position — flip upward if not enough space below
  const openMenu = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Horizontal: place to the right of NavRail, clamp so it doesn't overflow right edge
      const leftIdeal = rect.right + GAP;
      const left = Math.min(leftIdeal, vw - DROPDOWN_WIDTH - GAP);

      // Vertical: open downward by default, flip upward if not enough space below
      const spaceBelow = vh - rect.top;
      let top;
      let openUpward = false;

      if (spaceBelow >= DROPDOWN_HEIGHT + GAP) {
        // Enough room below → align top of dropdown with top of trigger
        top = rect.top;
      } else {
        // Not enough room below → open upward, align bottom of dropdown with bottom of trigger
        top = Math.max(GAP, rect.bottom - DROPDOWN_HEIGHT);
        openUpward = true;
      }

      setMenuPos({ top, left, openUpward });
    }
    setIsOpen(true);
  };

  // Close when clicking outside of both trigger and portal menu
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on scroll (reposition would be needed otherwise)
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  if (!user) return null;

  const avatarSrc = user.avatarUrl || FALLBACK_AVATAR;

  const dropdownMenu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 9999,
            maxHeight: `calc(100vh - ${menuPos.top}px - 8px)`,
          }}
          className="w-72 glass-dropdown rounded-2xl shadow-2xl py-2 animate-fade-in divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto"
        >
          {/* User Header */}
          <div className="px-4 py-3 flex items-center gap-3">
            <img
              src={avatarSrc}
              alt={user.name}
              onError={(e) => { e.target.src = FALLBACK_AVATAR; }}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-brand-500/30 flex-shrink-0"
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

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={() => { setIsOpen(false); setIsEditModalOpen(true); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors"
            >
              <User className="w-4 h-4 text-brand-500 flex-shrink-0" /> Edit Profile
            </button>
            <button
              onClick={() => { setIsOpen(false); setIsStarredModalOpen(true); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors"
            >
              <Star className="w-4 h-4 text-amber-500 flex-shrink-0" /> Starred Messages
            </button>
            <button
              onClick={() => { setIsOpen(false); setIsSettingsModalOpen(true); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors"
            >
              <Settings className="w-4 h-4 text-brand-500 flex-shrink-0" /> Account Settings
            </button>
          </div>

          {/* Theme Switcher */}
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

          {/* Logout */}
          <div className="py-1">
            <button
              onClick={() => { setIsOpen(false); logout(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" /> Logout
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {/* Trigger button — lives inside NavRail, always fully visible */}
      <button
        ref={triggerRef}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        title={user.name}
        className="flex items-center justify-center p-1.5 rounded-2xl hover:bg-slate-800/60 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <div className="relative">
          <img
            src={avatarSrc}
            alt={user.name}
            onError={(e) => { e.target.src = FALLBACK_AVATAR; }}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-500/30 shadow-sm"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
        </div>
      </button>

      {/* Dropdown rendered in document.body portal — never clipped by NavRail */}
      {dropdownMenu}

      {/* Modals */}
      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
      <AccountSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
      <StarredMessagesModal isOpen={isStarredModalOpen} onClose={() => setIsStarredModalOpen(false)} />
    </>
  );
};

export default ProfileMenu;
