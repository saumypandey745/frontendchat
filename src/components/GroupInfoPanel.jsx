import React, { useState } from 'react';
import { X, Shield, LogOut, Trash2, Edit2, Crown, ChevronDown, ChevronUp, Image as ImageIcon, Settings } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';
import api from '../lib/axios';
import Badge from './ui/Badge';
import Button from './ui/Button';

const GroupInfoPanel = ({ isOpen, onClose, group }) => {
  const { user } = useAuth();
  const { fetchContacts } = useChat();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [saving, setSaving] = useState(false);

  const [openSection, setOpenSection] = useState('members'); // 'members' | 'settings'

  if (!isOpen || !group) return null;

  const currentMember = group.members?.find((m) => m.userId?._id === user?._id || m.userId === user?._id);
  const isAdmin = currentMember?.role === 'admin';

  const handleUpdateInfo = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/groups/${group._id}`, { name, description });
      if (res.data.success) {
        fetchContacts();
        setIsEditing(false);
      }
    } catch (e) {
      alert('Update failed');
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
      alert('Role change failed');
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!confirm('Remove member from group?')) return;
    try {
      await api.delete(`/groups/${group._id}/members/${targetUserId}`);
      fetchContacts();
    } catch (e) {
      alert('Remove member failed');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Leave this group?')) return;
    try {
      await api.post(`/groups/${group._id}/leave`);
      fetchContacts();
      onClose();
    } catch (e) {
      alert('Leave group failed');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 glass-modal rounded-none border-l border-slate-200/80 dark:border-slate-800/80 shadow-glass-lg flex flex-col animate-slide-up">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Group Details</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Group Hero Avatar */}
        <div className="flex flex-col items-center text-center space-y-3">
          <img
            src={group.iconUrl}
            alt={group.name}
            className="w-24 h-24 rounded-3xl object-cover ring-4 ring-brand-500/20 shadow-md"
          />
          {isEditing ? (
            <div className="w-full space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 text-xs rounded-xl border dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <Button size="sm" onClick={handleUpdateInfo} loading={saving}>
                Save Details
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{group.name}</h2>
                {isAdmin && (
                  <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-brand-500">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{group.description}</p>
            </div>
          )}
        </div>

        {/* Members Accordion */}
        <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpenSection(openSection === 'members' ? '' : 'members')}
            className="w-full p-3.5 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <span>Group Members ({group.members?.length || 0})</span>
            {openSection === 'members' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {openSection === 'members' && (
            <div className="p-3 space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60 animate-fade-in">
              {group.members?.map((m) => {
                const memberUser = m.userId;
                if (!memberUser) return null;
                const isMemberAdmin = m.role === 'admin';
                const isSelf = memberUser._id === user._id;

                return (
                  <div key={memberUser._id} className="pt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={memberUser.avatarUrl}
                        alt={memberUser.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
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
                            onClick={() => handleToggleAdmin(memberUser._id, m.role)}
                            className="p-1 text-slate-400 hover:text-brand-500"
                            title="Toggle Admin"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(memberUser._id)}
                            className="p-1 text-slate-400 hover:text-red-500"
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
          )}
        </div>

        {/* Leave Group Action */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <Button variant="danger" size="md" className="w-full" icon={LogOut} onClick={handleLeaveGroup}>
            Leave Group
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoPanel;
