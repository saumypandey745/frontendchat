import React, { useState, useRef } from 'react';
import {
  X,
  Shield,
  LogOut,
  Trash2,
  Edit2,
  Crown,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  ChevronRight,
  Bell,
  Clock,
  Palette,
  Flag,
  Download,
  UserPlus,
  Camera,
  Lock,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';
import api from '../lib/axios';
import Badge from './ui/Badge';
import Button from './ui/Button';
import AddMemberModal from './AddMemberModal';

const GroupInfoPanel = ({
  isOpen,
  onClose,
  group,
  onOpenGallery,
  onOpenWallpaper,
}) => {
  const { user } = useAuth();
  const { messages, chatSettings, updateChatSetting, fetchContacts } = useChat();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen || !group) return null;

  const currentMember = group.members?.find(
    (m) => (m.userId?._id || m.userId).toString() === user?._id?.toString()
  );
  const isAdmin = currentMember?.role === 'admin';

  const currentSettings = chatSettings[group._id] || {};
  const isMuted = Boolean(
    currentSettings.muted &&
      (!currentSettings.mutedUntil || new Date(currentSettings.mutedUntil) > new Date())
  );
  const muteOption = currentSettings.muteOption || (isMuted ? (currentSettings.mutedUntil ? '8h' : 'always') : 'off');
  const disappearingTimer = group.disappearingDuration || currentSettings.disappearingDuration || 0;

  // Group media count
  const mediaCount = messages.filter(
    (m) =>
      m.chatId === group._id &&
      (m.imageUrl || m.fileData?.url || m.type === 'image' || m.type === 'video' || m.type === 'document')
  ).length;

  const handleUpdateInfo = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (name) formData.append('name', name);
      if (description !== undefined) formData.append('description', description);
      if (iconFile) formData.append('icon', iconFile);

      const res = await api.put(`/groups/${group._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        fetchContacts();
        setIsEditing(false);
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdmin = async (targetUserId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    try {
      await api.put(`/groups/${group._id}/members/${targetUserId}/role`, { role: newRole });
      fetchContacts();
    } catch (e) {
      alert(e.response?.data?.message || 'Role change failed');
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!confirm('Remove member from group?')) return;
    try {
      await api.delete(`/groups/${group._id}/members/${targetUserId}`);
      fetchContacts();
    } catch (e) {
      alert(e.response?.data?.message || 'Remove member failed');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await api.post(`/groups/${group._id}/leave`);
      fetchContacts();
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Leave group failed');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await api.delete(`/groups/${group._id}`);
      fetchContacts();
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Delete group failed');
    }
  };

  const handleMuteToggle = async (hours) => {
    if (hours === 0) {
      await updateChatSetting(group._id, { muted: false, muteHours: 0 });
    } else {
      await updateChatSetting(group._id, { muted: true, muteHours: hours });
    }
  };

  const handleDisappearingToggle = async (durationSec) => {
    await updateChatSetting(group._id, { disappearingDuration: durationSec });
  };

  const handleExportChat = async () => {
    try {
      const res = await api.get(`/users/export-chat/${group._id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ChatWave_Group_Export_${group.name.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export group chat backup.');
    }
  };

  const handleReportGroup = async () => {
    try {
      const res = await api.post(`/groups/${group._id}/report`, {
        reason: 'Reported group for inappropriate content',
      });
      if (res.data.success) {
        alert(`Report submitted for group "${group.name}". Thank you for keeping ChatWave safe.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Report failed.');
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
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Group Details</h3>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Group Hero Avatar & Editing */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative group">
            <img
              src={iconPreview || group.iconUrl}
              alt={group.name}
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-brand-500/20 shadow-md"
            />
            {isEditing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/50 rounded-3xl flex items-center justify-center text-white opacity-90 hover:opacity-100 transition-opacity"
              >
                <Camera className="w-6 h-6" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setIconFile(file);
                  setIconPreview(URL.createObjectURL(file));
                }
              }}
            />
          </div>

          {isEditing ? (
            <div className="w-full space-y-2 text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Group Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
                <Button size="sm" variant="brand" onClick={handleUpdateInfo} loading={saving} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{group.name}</h2>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setName(group.name);
                      setDescription(group.description || '');
                      setIsEditing(true);
                    }}
                    className="p-1 text-slate-400 hover:text-brand-500 transition-colors"
                    title="Edit Group Info"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {group.description || 'No description provided.'}
              </p>
              <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mt-2 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-full inline-block">
                Group · {group.members?.length || 0} members
              </p>
            </div>
          )}
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

        {/* Members Section */}
        <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Members ({group.members?.length || 0})
            </span>
            {isAdmin && (
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add Member
              </button>
            )}
          </div>

          <div className="p-3 space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-56 overflow-y-auto">
            {group.members?.map((m) => {
              const memberUser = m.userId;
              if (!memberUser) return null;
              const memberId = (memberUser._id || memberUser).toString();
              const isMemberAdmin = m.role === 'admin';
              const isSelf = memberId === user?._id?.toString();

              return (
                <div key={memberId} className="pt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={memberUser.avatarUrl}
                      alt={memberUser.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-800"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {memberUser.name} {isSelf && '(You)'}
                      </p>
                      <p className="text-[10px] text-slate-400">{memberUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isMemberAdmin && (
                      <Badge variant="brand">
                        <Crown className="w-3 h-3 inline mr-1" /> Admin
                      </Badge>
                    )}

                    {isAdmin && !isSelf && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleAdmin(memberId, m.role)}
                          className="p-1 text-slate-400 hover:text-brand-500 transition-colors"
                          title={isMemberAdmin ? 'Demote to Member' : 'Promote to Admin'}
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(memberId)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Shortcuts List */}
        <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
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

          {/* Custom Group Wallpaper */}
          <button
            onClick={onOpenWallpaper}
            className="w-full py-3 px-2 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Palette className="w-4 h-4 text-purple-500" />
              <span>Group Wallpaper</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* End-to-End Encryption Note */}
        <div className="p-3 bg-brand-50/50 dark:bg-slate-800/30 rounded-2xl border border-brand-100 dark:border-slate-800 flex items-center gap-3 text-slate-600 dark:text-slate-400 text-xs">
          <Lock className="w-5 h-5 text-brand-500 flex-shrink-0" />
          <p className="text-[11px] leading-tight">
            Group messages are end-to-end encrypted. No one outside of this group can read or listen to them.
          </p>
        </div>

        {/* Danger Zone Actions */}
        <div className="pt-2 space-y-2">
          {/* Report Group */}
          <button
            onClick={handleReportGroup}
            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-colors"
          >
            <Flag className="w-4 h-4 text-amber-500" /> Report Group
          </button>

          {/* Export Group Chat */}
          <button
            onClick={handleExportChat}
            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4 text-brand-500" /> Export Group Chat
          </button>

          {/* Exit Group */}
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" /> Exit Group
          </button>

          {/* Delete Group (ANY Admin) */}
          {isAdmin && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md shadow-red-600/20"
            >
              <Trash2 className="w-4 h-4" /> Delete Group (Admin)
            </button>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        group={group}
      />

      {/* Leave Confirmation Overlay */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Exit "{group.name}"?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You will no longer be able to send or receive messages in this group.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveGroup}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow"
              >
                Exit Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Delete "{group.name}"?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This action is permanent and irreversible. The group and all messages will be deleted for all members.
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
                onClick={handleDeleteGroup}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupInfoPanel;
