import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  Pin,
  VolumeX,
  Clock,
  Archive,
  UserPlus,
  Command,
  Lock,
  Unlock,
  Megaphone,
} from 'lucide-react';
import useChat from '../hooks/useChat';
import useSocket from '../hooks/useSocket';
import api from '../lib/axios';
import CreateGroupModal from './CreateGroupModal';
import ArchivedChatsModal from './ArchivedChatsModal';
import ChatLockModal from './ChatLockModal';
import AddContactModal from './AddContactModal';
import Skeleton from './ui/Skeleton';
import Badge from './ui/Badge';
import EmptyState from './EmptyState';
import { format, isToday, isYesterday } from 'date-fns';

const ChatList = ({ onSelectMobile, activeTab, setActiveTab, onOpenCommandPalette, onOpenBroadcastModal }) => {
  const {
    contacts,
    groups,
    loadingContacts,
    selectContact,
    selectGroup,
    selectedUser,
    selectedGroup,
    typingUsers,
    chatSettings,
  } = useChat();

  const { onlineUsers } = useSocket();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [isLockedFolderUnlocked, setIsLockedFolderUnlocked] = useState(false);
  const [showUnlockFolderModal, setShowUnlockFolderModal] = useState(false);
  const [unlockTargetChatId, setUnlockTargetChatId] = useState(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.data.success) {
          setSearchResults(res.data.users);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectUser = (user) => {
    if (chatSettings[user._id]?.isLocked && !isLockedFolderUnlocked) {
      setUnlockTargetChatId(user._id);
      setShowUnlockFolderModal(true);
      return;
    }
    selectContact(user);
    setSearchQuery('');
    if (onSelectMobile) onSelectMobile();
  };

  const handleSelectGroup = (group) => {
    if (chatSettings[group._id]?.isLocked && !isLockedFolderUnlocked) {
      setUnlockTargetChatId(group._id);
      setShowUnlockFolderModal(true);
      return;
    }
    selectGroup(group);
    setSearchQuery('');
    if (onSelectMobile) onSelectMobile();
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  // Merge contacts and groups
  const allConversations = [
    ...contacts.map((c) => ({ ...c, isGroup: false, id: c.user._id })),
    ...groups.map((g) => ({
      ...g,
      isGroup: true,
      id: g.group._id,
      user: { name: g.group.name, avatarUrl: g.group.iconUrl },
    })),
  ];

  const lockedConversations = allConversations.filter((c) => chatSettings[c.id]?.isLocked);
  const lockedCount = lockedConversations.length;

  const unarchivedConversations = allConversations.filter((c) => {
    if (chatSettings[c.id]?.archived) return false;
    if (chatSettings[c.id]?.isLocked && !isLockedFolderUnlocked) return false;
    return true;
  });

  const sortByRecent = (arr) => {
    return [...arr].sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  };

  const pinnedConversations = sortByRecent(unarchivedConversations.filter((c) => chatSettings[c.id]?.pinned));
  const regularConversations = sortByRecent(unarchivedConversations.filter((c) => !chatSettings[c.id]?.pinned));

  const archivedCount = allConversations.filter((c) => chatSettings[c.id]?.archived).length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Messages
          </h2>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenCommandPalette}
              className="min-h-[44px] min-w-[44px] p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors flex items-center justify-center"
              title="Global Search (Cmd+K)"
            >
              <Command className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenBroadcastModal}
              className="min-h-[44px] min-w-[44px] p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-500/20 transition-colors flex items-center justify-center"
              title="Broadcast Lists"
            >
              <Megaphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAddContactOpen(true)}
              className="min-h-[44px] min-w-[44px] p-2.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl hover:bg-brand-500/20 transition-colors flex items-center justify-center"
              title="Add Contact by ID"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="min-h-[44px] min-w-[44px] p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
              title="New Group Chat"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Filter Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts or groups..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>
      </div>

      {/* Locked Chats Folder Pill */}
      {lockedCount > 0 && searchQuery.trim() === '' && (
        <button
          onClick={() => {
            if (isLockedFolderUnlocked) {
              setIsLockedFolderUnlocked(false);
            } else {
              setUnlockTargetChatId(null);
              setShowUnlockFolderModal(true);
            }
          }}
          className="px-4 py-2.5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors bg-slate-50/50 dark:bg-slate-900/50"
        >
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-brand-500" />
            <span>Locked Chats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="brand">{lockedCount}</Badge>
            <span className="text-[10px] text-slate-400">
              {isLockedFolderUnlocked ? 'Unlocked 🔓' : 'Locked 🔒'}
            </span>
          </div>
        </button>
      )}

      {/* Archived Section Pill */}
      {archivedCount > 0 && searchQuery.trim() === '' && (
        <button
          onClick={() => setIsArchivedModalOpen(true)}
          className="px-4 py-2.5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Archive className="w-4 h-4 text-brand-500" />
            <span>Archived Chats</span>
          </div>
          <Badge variant="brand">{archivedCount}</Badge>
        </button>
      )}

      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
        {searchQuery.trim() !== '' ? (
          /* Search Results */
          <div className="p-2 space-y-1">
            {searchResults.map((u) => (
              <button
                key={u._id}
                onClick={() => handleSelectUser(u)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 text-left transition-colors"
              >
                <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{u.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                </div>
                <UserPlus className="w-4 h-4 text-brand-500" />
              </button>
            ))}
          </div>
        ) : loadingContacts ? (
          /* Shimmer Loading Skeleton */
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-2.5 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : unarchivedConversations.length === 0 ? (
          <EmptyState type="chats" onAction={() => setIsGroupModalOpen(true)} />
        ) : (
          <>
            {/* Pinned Chats Section */}
            {pinnedConversations.length > 0 && (
              <div className="p-1 space-y-1">
                <p className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Pinned Chats
                </p>
                {pinnedConversations.map((item) => renderChatItem(item))}
                <div className="my-1 border-b border-slate-200/60 dark:border-slate-800/60" />
              </div>
            )}

            {/* Regular Conversations */}
            <div className="p-1 space-y-1">
              {regularConversations.map((item) => renderChatItem(item))}
            </div>
          </>
        )}
      </div>

      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
      <AddContactModal isOpen={isAddContactOpen} onClose={() => setIsAddContactOpen(false)} />
      <ArchivedChatsModal isOpen={isArchivedModalOpen} onClose={() => setIsArchivedModalOpen(false)} />
      {showUnlockFolderModal && (
        <ChatLockModal
          chatId={unlockTargetChatId || (lockedConversations[0]?.id)}
          isCurrentlyLocked={true}
          onClose={() => {
            setShowUnlockFolderModal(false);
            setUnlockTargetChatId(null);
          }}
          onLockStateChanged={(unlockedState) => {
            if (!unlockedState) {
              setIsLockedFolderUnlocked(true);
            }
          }}
        />
      )}
    </div>
  );

  function renderChatItem(item) {
    const isGroup = item.isGroup;
    const isSelected = isGroup
      ? selectedGroup?._id === item.group._id
      : selectedUser?._id === item.user._id;

    const settings = chatSettings[item.id] || {};
    const isMuted = Boolean(
      settings.muted &&
        (!settings.mutedUntil || new Date(settings.mutedUntil) > new Date())
    );
    const isDisappearing = item.isGroup
      ? Boolean(item.group?.disappearingDuration > 0)
      : Boolean(settings.disappearingDuration > 0);

    const isOnline = !isGroup && onlineUsers.includes(item.user._id) && !item.user.hideOnlineStatus;
    const isTyping = typingUsers[item.id];

    return (
      <button
        key={item.id}
        onClick={() => (isGroup ? handleSelectGroup(item.group) : handleSelectUser(item.user))}
        className={`w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all duration-150 text-left relative border-l-4 ${
          isSelected
            ? 'bg-brand-500/10 border-brand-500 shadow-sm'
            : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40 border-transparent'
        }`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={isGroup ? item.group.iconUrl : item.user.avatarUrl}
            alt={item.user.name}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-200/50 dark:ring-slate-800/50"
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          )}
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
              {isGroup && <Users className="w-3.5 h-3.5 text-brand-500 inline flex-shrink-0" />}
              <span className="truncate">{item.user.name}</span>
            </h4>
            <div className="flex items-center gap-1 flex-shrink-0 text-[10px] font-semibold text-slate-400">
              {settings.isLocked && <Lock className="w-3 h-3 text-brand-500 fill-brand-500" />}
              {settings.pinned && <Pin className="w-3 h-3 text-brand-500 fill-brand-500" />}
              {isDisappearing && <Clock className="w-3 h-3 text-emerald-500" />}
              {isMuted && <VolumeX className="w-3 h-3 text-slate-400" />}
              {item.lastMessage?.createdAt && formatTime(item.lastMessage.createdAt)}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {isTyping ? (
              <span className="text-brand-500 font-bold animate-pulse">typing...</span>
            ) : settings.isLocked && !isLockedFolderUnlocked ? (
              <span className="italic text-slate-400">🔒 Locked Chat</span>
            ) : (
              item.lastMessage?.text || (item.lastMessage?.imageUrl ? '📷 Attachment' : 'No messages')
            )}
          </p>
        </div>

        {/* Unread Badge */}
        {item.unreadCount > 0 && (
          <Badge variant="brand" className="animate-pop-in">
            {item.unreadCount}
          </Badge>
        )}
      </button>
    );
  }
};

export default ChatList;
