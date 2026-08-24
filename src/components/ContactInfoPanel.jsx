import React, { useState } from 'react';
import {
  X,
  Phone,
  Video,
  Star,
  Bell,
  Clock,
  Palette,
  Shield,
  Ban,
  Flag,
  Trash2,
  Download,
  Image as ImageIcon,
  ChevronRight,
  FileText,
  Link as LinkIcon,
  Lock,
  UserPlus,
  Hash,
  Edit2,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';
import api from '../lib/axios';
import ChatLockModal from './ChatLockModal';
import AddContactModal from './AddContactModal';

const ContactInfoPanel = ({
  isOpen,
  onClose,
  contact,
  onOpenGallery,
  onOpenStarred,
  onOpenWallpaper,
}) => {
  const { user, setUser } = useAuth();
  const {
    messages,
    chatSettings,
    updateChatSetting,
    fetchContacts,
    fetchMessages,
    selectContact,
  } = useChat();

  const [loadingBlock, setLoadingBlock] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleClearChat = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/messages/chat/${contact._id}/clear`);
      if (res.data.success) {
        await fetchMessages(contact._id);
        setShowClearConfirm(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to clear chat');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteChat = async () => {
    setActionLoading(true);
    try {
      const res = await api.delete(`/messages/chat/${contact._id}`);
      if (res.data.success) {
        await fetchContacts();
        selectContact(null);
        setShowDeleteConfirm(false);
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete chat');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen || !contact) return null;

  const isBlocked = (user?.blockedUsers || []).some(
    (b) => (b._id || b).toString() === contact._id.toString()
  );

  const currentSettings = chatSettings[contact._id] || {};
  const isMuted = Boolean(
    currentSettings.muted &&
      (!currentSettings.mutedUntil || new Date(currentSettings.mutedUntil) > new Date())
  );

  const muteOption = currentSettings.muteOption || (isMuted ? (currentSettings.mutedUntil ? '8h' : 'always') : 'off');
  const disappearingTimer = currentSettings.disappearingDuration || 0;

  // Filter media messages for count
  const mediaCount = messages.filter(
    (m) => m.imageUrl || m.fileData?.url || m.type === 'image' || m.type === 'video' || m.type === 'document'
  ).length;

  const handleToggleBlock = async () => {
    setLoadingBlock(true);
    try {
      const endpoint = isBlocked ? `/users/${contact._id}/unblock` : `/users/${contact._id}/block`;
      const res = await api.post(endpoint);
      if (res.data.success) {
        if (user) {
          const updatedBlocked = res.data.blockedUsers || [];
          setUser({ ...user, blockedUsers: updatedBlocked });
        }
        fetchContacts();
      }
    } catch (err) {
      console.error('Error toggling block state:', err);
      alert(err.response?.data?.message || 'Failed to update block status');
    } finally {
      setLoadingBlock(false);
      setShowBlockConfirm(false);
    }
  };

  const handleMuteToggle = async (hours) => {
    if (hours === 0) {
      await updateChatSetting(contact._id, { muted: false, muteHours: 0 });
    } else {
      await updateChatSetting(contact._id, { muted: true, muteHours: hours });
    }
  };

  const handleDisappearingToggle = async (durationSec) => {
    await updateChatSetting(contact._id, { disappearingDuration: durationSec });
  };

  const handleExportChat = async () => {
    try {
      const res = await api.get(`/users/export-chat/${contact._id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ChatWave_Export_${contact.name.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export chat history.');
    }
  };

  const handleReport = async () => {
    setLoadingReport(true);
    try {
      const res = await api.post(`/users/${contact._id}/report`, {
        reason: 'Reported contact from Contact Info panel',
      });
      if (res.data.success) {
        alert(`Report submitted for ${contact.name}. Thank you for keeping ChatWave safe.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setLoadingReport(false);
    }
  };

  const isMuteOptionActive = (optHours) => {
    if (optHours === 0) return !isMuted;
    if (!isMuted) return false;
    if (optHours === 8) return muteOption === '8h';
    if (optHours === 168) return muteOption === '1w';
    if (optHours === 87600) return muteOption === 'always';
    return false;
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 glass-modal rounded-none border-l border-slate-200/80 dark:border-slate-800/80 shadow-glass-lg flex flex-col animate-slide-up overflow-hidden safe-pt safe-pb">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Contact Info</h3>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Profile Header Hero */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <img
              src={contact.avatarUrl}
              alt={contact.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-brand-500/20 shadow-lg"
            />
            {isBlocked && (
              <span className="absolute bottom-0 right-0 p-1.5 bg-red-600 rounded-full text-white ring-2 ring-white dark:ring-slate-900">
                <Ban className="w-4 h-4" />
              </span>
            )}
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
              <span>{contact.nickname || contact.name}</span>
            </h2>
            {contact.nickname && (
              <p className="text-[11px] text-slate-400 font-medium">Real Name: {contact.name}</p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{contact.email}</p>
            {contact.chatwaveId && (
              <p className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 mt-1">
                ID: {contact.chatwaveId.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
              </p>
            )}
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-2 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-full inline-block">
              {contact.bio || 'Hey there! I am using ChatWave.'}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAddContactModal(true)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>{contact.isSavedContact ? 'Edit Contact Nickname' : '+ Add to Contacts'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Media, Links & Docs Shortcut */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand-500" /> Shared Media, Links & Docs
            </span>
            <button
              onClick={onOpenGallery}
              className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-0.5"
            >
              {mediaCount} items <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Shortcuts List */}
        <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          {/* Starred Messages */}
          <button
            onClick={onOpenStarred}
            className="w-full py-3 px-2 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Star className="w-4 h-4 text-amber-500" />
              <span>Starred Messages</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Mute Notifications */}
          <div className="py-3 px-2 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-brand-500" />
                <span>Mute Notifications</span>
              </div>
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">
                {isMuted ? (muteOption === '8h' ? '8 Hours' : muteOption === '1w' ? '1 Week' : 'Always') : 'Off'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[
                { label: 'Off', hours: 0 },
                { label: '8 Hours', hours: 8 },
                { label: '1 Week', hours: 168 },
                { label: 'Always', hours: 87600 },
              ].map((opt) => {
                const active = isMuteOptionActive(opt.hours);
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleMuteToggle(opt.hours)}
                    className={`py-1 px-2 text-[10px] font-bold rounded-lg transition-all ${
                      active
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Disappearing Messages */}
          <div className="py-3 px-2 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>Disappearing Messages</span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                {disappearingTimer === 0 ? 'Off' : `${disappearingTimer / 86400}d`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[
                { label: 'Off', sec: 0 },
                { label: '24 Hours', sec: 86400 },
                { label: '7 Days', sec: 604800 },
                { label: '90 Days', sec: 7776000 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleDisappearingToggle(opt.sec)}
                  className={`py-1 px-2 text-[10px] font-bold rounded-lg transition-all ${
                    disappearingTimer === opt.sec
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Chat Wallpaper */}
          <button
            onClick={onOpenWallpaper}
            className="w-full py-3 px-2 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Palette className="w-4 h-4 text-purple-500" />
              <span>Chat Wallpaper</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Chat Lock */}
          <button
            onClick={() => setShowLockModal(true)}
            className="w-full py-3 px-2 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-brand-500" />
              <span>Lock Chat</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {currentSettings.isLocked ? 'Locked 🔒' : 'Unlocked'}
            </span>
          </button>
        </div>

        {/* Security & Encryption Info Line */}
        <div className="p-3 bg-brand-50/50 dark:bg-slate-800/30 rounded-2xl border border-brand-100 dark:border-slate-800 flex items-center gap-3 text-slate-600 dark:text-slate-400 text-xs">
          <Lock className="w-5 h-5 text-brand-500 flex-shrink-0" />
          <p className="text-[11px] leading-tight">
            Messages and calls are secured with end-to-end encryption. No one outside of this chat can read or listen to them.
          </p>
        </div>

        {/* Danger Zone Actions */}
        <div className="pt-2 space-y-2">
          {/* Block / Unblock Button */}
          <button
            onClick={() => setShowBlockConfirm(true)}
            disabled={loadingBlock}
            className={`w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm ${
              isBlocked
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
            }`}
          >
            <Ban className="w-4 h-4" />
            {isBlocked ? `Unblock ${contact.name}` : `Block ${contact.name}`}
          </button>

          {/* Clear Chat History */}
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-colors"
          >
            <Trash2 className="w-4 h-4 text-amber-500" /> Clear Chat History
          </button>

          {/* Delete Chat */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2.5 px-4 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/40 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" /> Delete Chat
          </button>

          {/* Report Contact */}
          <button
            onClick={handleReport}
            disabled={loadingReport}
            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-colors"
          >
            <Flag className="w-4 h-4 text-amber-500" /> Report Contact
          </button>

          {/* Export Chat Backup */}
          <button
            onClick={handleExportChat}
            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4 text-brand-500" /> Export Chat Backup
          </button>
        </div>
      </div>

      {/* Block Confirmation Modal Overlay */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isBlocked ? `Unblock ${contact.name}?` : `Block ${contact.name}?`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isBlocked
                  ? `${contact.name} will be able to send you messages and call you.`
                  : `Blocked contacts will no longer be able to call you or send you messages.`}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 py-2.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleBlock}
                disabled={loadingBlock}
                className={`flex-1 py-2.5 text-xs font-bold text-white rounded-xl shadow ${
                  isBlocked ? 'bg-brand-600 hover:bg-brand-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Clear chat history?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Messages will be removed from your view. The contact will remain in your chat list.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleClearChat}
                disabled={actionLoading}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Delete this chat?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This chat will be removed from your list and message history cleared. The other contact is unaffected.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                disabled={actionLoading}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow"
              >
                Delete Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {showLockModal && (
        <ChatLockModal
          chatId={contact._id}
          isCurrentlyLocked={currentSettings.isLocked}
          onClose={() => setShowLockModal(false)}
        />
      )}

      {showAddContactModal && (
        <AddContactModal
          isOpen={showAddContactModal}
          onClose={() => setShowAddContactModal(false)}
          initialChatwaveId={contact.chatwaveId || ''}
          initialNickname={contact.nickname || contact.name || ''}
        />
      )}
    </div>
  );
};

export default ContactInfoPanel;
