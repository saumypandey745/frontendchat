import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Plus,
  Users,
  Megaphone,
  ChevronRight,
  Loader2,
  ShieldCheck,
  MessageSquare,
  Share2,
  Link,
  Copy,
  Check,
  Settings,
  UserPlus,
  Trash2,
  LogOut,
  MoreVertical,
  Lock,
  Unlock,
  RefreshCw,
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
} from 'lucide-react';
import api from '../lib/axios';
import useChat from '../hooks/useChat';
import useAuth from '../hooks/useAuth';

const CommunitiesModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { selectGroup, fetchGroups } = useChat();

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' | 'members' | 'settings' | 'requests'

  // Standalone groups for attaching
  const [myAdminGroups, setMyAdminGroups] = useState([]);
  const [selectedExistingGroupIds, setSelectedExistingGroupIds] = useState([]);
  const [showAttachGroupModal, setShowAttachGroupModal] = useState(false);

  // Members Aggregate State
  const [aggregateMembers, setAggregateMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  // Form States
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [isCreatingSubGroup, setIsCreatingSubGroup] = useState(false);

  const [commName, setCommName] = useState('');
  const [commDesc, setCommDesc] = useState('');
  const [commIconUrl, setCommIconUrl] = useState('');

  const [subGroupName, setSubGroupName] = useState('');
  const [subGroupDesc, setSubGroupDesc] = useState('');
  const [subGroupIsOpen, setSubGroupIsOpen] = useState(true);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    whoCanAddGroups: 'admins',
    requiresApproval: false,
    whoCanInvite: 'everyone',
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Member Action Menu Dropdown State
  const [activeMemberDropdown, setActiveMemberDropdown] = useState(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [confirmExitModal, setConfirmExitModal] = useState(false);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/communities');
      if (res.data?.success) {
        setCommunities(res.data.communities || []);
      }
    } catch (err) {
      console.error('Failed to fetch communities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAdminGroups = async () => {
    try {
      const res = await api.get('/groups/my-admin-groups');
      if (res.data?.success) {
        setMyAdminGroups(res.data.groups || []);
      }
    } catch (err) {
      console.error('Failed to fetch my admin groups:', err);
    }
  };

  const fetchAggregateMembers = async (commId) => {
    setLoadingMembers(true);
    try {
      const res = await api.get(`/communities/${commId}/members-aggregate`);
      if (res.data?.success) {
        setAggregateMembers(res.data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch aggregate members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCommunities();
      fetchMyAdminGroups();
      setSelectedCommunity(null);
      setIsCreatingCommunity(false);
      setIsCreatingSubGroup(false);
      setShowAttachGroupModal(false);
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCommunity) {
      setActiveTab('groups');
      setSettingsForm({
        name: selectedCommunity.name || '',
        description: selectedCommunity.description || '',
        whoCanAddGroups: selectedCommunity.settings?.whoCanAddGroups || 'admins',
        requiresApproval: selectedCommunity.settings?.requiresApproval || false,
        whoCanInvite: selectedCommunity.settings?.whoCanInvite || 'everyone',
      });
      fetchAggregateMembers(selectedCommunity._id);
    }
  }, [selectedCommunity]);

  if (!isOpen) return null;

  const currentUserId = user?._id?.toString();
  const isUserCommunityAdmin = selectedCommunity
    ? selectedCommunity.creatorId?._id?.toString() === currentUserId ||
      selectedCommunity.creatorId?.toString() === currentUserId ||
      selectedCommunity.communityAdmins?.some(
        (a) => (a._id ? a._id.toString() : a.toString()) === currentUserId
      ) ||
      selectedCommunity.admins?.some(
        (a) => (a._id ? a._id.toString() : a.toString()) === currentUserId
      )
    : false;

  const isUserCreator = selectedCommunity
    ? (selectedCommunity.creatorId?._id || selectedCommunity.creatorId)?.toString() === currentUserId
    : false;

  const handleCreateCommunitySubmit = async (e) => {
    e.preventDefault();
    if (!commName.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/communities', {
        name: commName.trim(),
        description: commDesc.trim(),
        iconUrl: commIconUrl.trim() || undefined,
        existingGroupIds: selectedExistingGroupIds,
      });

      if (res.data?.success) {
        setSuccess('Community and Announcements group created!');
        setCommName('');
        setCommDesc('');
        setCommIconUrl('');
        setSelectedExistingGroupIds([]);
        setIsCreatingCommunity(false);
        await fetchCommunities();
        if (fetchGroups) await fetchGroups();
        if (res.data.community) {
          setSelectedCommunity(res.data.community);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create community');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubGroupSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCommunity || !subGroupName.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post(`/communities/${selectedCommunity._id}/groups`, {
        name: subGroupName.trim(),
        description: subGroupDesc.trim(),
        isOpenToJoin: subGroupIsOpen,
      });

      if (res.data?.success) {
        setSuccess('Sub-group added to community!');
        setSubGroupName('');
        setSubGroupDesc('');
        setIsCreatingSubGroup(false);
        await fetchCommunities();
        if (fetchGroups) await fetchGroups();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add sub-group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachExistingGroup = async (groupId) => {
    if (!selectedCommunity) return;
    try {
      const res = await api.post(`/communities/${selectedCommunity._id}/add-existing-group`, {
        groupId,
      });

      if (res.data?.success) {
        setSuccess('Group attached to community!');
        setShowAttachGroupModal(false);
        await fetchCommunities();
        await fetchMyAdminGroups();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to attach group');
    }
  };

  const handleDetachGroup = async (groupId) => {
    if (!selectedCommunity) return;
    try {
      const res = await api.delete(`/communities/${selectedCommunity._id}/groups/${groupId}`);
      if (res.data?.success) {
        setSuccess('Group detached from community (remains standalone)');
        await fetchCommunities();
        await fetchMyAdminGroups();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to detach group');
    }
  };

  const handleJoinCommunityGroup = async (groupId) => {
    if (!selectedCommunity) return;
    try {
      const res = await api.post(`/communities/${selectedCommunity._id}/groups/${groupId}/join`);
      if (res.data?.success) {
        setSuccess('Joined group!');
        await fetchCommunities();
        if (fetchGroups) await fetchGroups();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join group');
    }
  };

  const handleUpdateCommunitySettings = async (e) => {
    e.preventDefault();
    if (!selectedCommunity) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.put(`/communities/${selectedCommunity._id}`, {
        name: settingsForm.name,
        description: settingsForm.description,
        settings: {
          whoCanAddGroups: settingsForm.whoCanAddGroups,
          requiresApproval: settingsForm.requiresApproval,
          whoCanInvite: settingsForm.whoCanInvite,
        },
      });

      if (res.data?.success) {
        setSuccess('Settings updated successfully!');
        setSelectedCommunity(res.data.community);
        await fetchCommunities();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetInviteLink = async () => {
    if (!selectedCommunity) return;
    try {
      const res = await api.post(`/communities/${selectedCommunity._id}/revoke-invite`);
      if (res.data?.success) {
        setSuccess('Invite link reset successfully!');
        setSelectedCommunity((prev) => ({ ...prev, inviteCode: res.data.inviteCode }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset invite link');
    }
  };

  const handlePromoteDemoteAdmin = async (targetUserId, action) => {
    if (!selectedCommunity) return;
    try {
      const res = await api.post(`/communities/${selectedCommunity._id}/admins/${action}`, {
        targetUserId,
      });

      if (res.data?.success) {
        setSuccess(`User ${action}d successfully`);
        setActiveMemberDropdown(null);
        await fetchAggregateMembers(selectedCommunity._id);
        await fetchCommunities();
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} user`);
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!selectedCommunity) return;
    try {
      const res = await api.post(`/communities/${selectedCommunity._id}/members/remove`, {
        targetUserId,
      });

      if (res.data?.success) {
        setSuccess('Member removed from community');
        setActiveMemberDropdown(null);
        await fetchAggregateMembers(selectedCommunity._id);
        await fetchCommunities();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleHandleJoinRequest = async (applicantId, action) => {
    if (!selectedCommunity) return;
    try {
      const res = await api.post(`/communities/${selectedCommunity._id}/requests/${applicantId}/${action}`);
      if (res.data?.success) {
        setSuccess(`Join request ${action}d`);
        await fetchCommunities();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to handle join request');
    }
  };

  const handleExitCommunity = async () => {
    if (!selectedCommunity) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/communities/${selectedCommunity._id}/exit`);
      if (res.data?.success) {
        setSuccess('You left the community');
        setConfirmExitModal(false);
        setSelectedCommunity(null);
        await fetchCommunities();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to exit community');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!selectedCommunity) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/communities/${selectedCommunity._id}`);
      if (res.data?.success) {
        setSuccess('Community deleted. Sub-groups detached as standalone groups.');
        setConfirmDeleteModal(false);
        setSelectedCommunity(null);
        await fetchCommunities();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete community');
    } finally {
      setSubmitting(false);
    }
  };

  const copyInviteLink = () => {
    if (!selectedCommunity?.inviteCode) return;
    const link = `${window.location.origin}/community/join/${selectedCommunity.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredMembers = aggregateMembers.filter(
    (m) =>
      m.name?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-500" />
            {selectedCommunity ? selectedCommunity.name : 'Communities'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banners */}
        {error && (
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> {success}
            </span>
            <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {/* View 1: Create New Community Form */}
          {isCreatingCommunity ? (
            <form onSubmit={handleCreateCommunitySubmit} className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Create Community & Auto-Announcements
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Community Name</label>
                <input
                  type="text"
                  value={commName}
                  onChange={(e) => setCommName(e.target.value)}
                  placeholder="e.g. Developer Community"
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                <textarea
                  value={commDesc}
                  onChange={(e) => setCommDesc(e.target.value)}
                  placeholder="Brief description of this community..."
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 h-20"
                />
              </div>

              {/* Attach Existing Standalone Groups */}
              {myAdminGroups.length > 0 && (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-semibold text-slate-500">
                    Add Existing Groups You Admin (Optional)
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1">
                    {myAdminGroups.map((grp) => {
                      const isSelected = selectedExistingGroupIds.includes(grp._id);
                      return (
                        <div
                          key={grp._id}
                          onClick={() => {
                            setSelectedExistingGroupIds((prev) =>
                              isSelected ? prev.filter((id) => id !== grp._id) : [...prev, grp._id]
                            );
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-brand-500" />
                            <span className="text-xs font-semibold">{grp.name}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCommunity(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl flex items-center gap-2 shadow disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Create Community
                </button>
              </div>
            </form>
          ) : selectedCommunity ? (
            /* View 2: Full Community Details View */
            <div className="space-y-4">
              {/* Back to Communities list */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedCommunity(null)}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline"
                >
                  ← Back to Communities List
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyInviteLink}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-brand-500" /> Invite Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Community Banner Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {selectedCommunity.name}
                      {isUserCreator && (
                        <span className="px-2 py-0.5 text-[9px] bg-amber-500/10 text-amber-600 rounded-md font-bold">
                          Creator
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedCommunity.description}</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2.5 py-1 bg-brand-500/10 text-brand-500 rounded-full flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {selectedCommunity.members?.length || 1} Members
                </span>
              </div>

              {/* Announcements Banner */}
              {selectedCommunity.announcementsGroupId && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-5 h-5 text-amber-500" />
                    <div>
                      <h5 className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        {selectedCommunity.announcementsGroupId.name || 'Community Announcements'}
                      </h5>
                      <p className="text-[10px] text-amber-600 dark:text-amber-500">
                        📢 Official announcements for all members
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      selectGroup(selectedCommunity.announcementsGroupId);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold shadow hover:bg-amber-700"
                  >
                    Open Chat
                  </button>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-1">
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'groups'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Groups ({selectedCommunity.groups?.length || 0})
                </button>

                <button
                  onClick={() => setActiveTab('members')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'members'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Members Aggregate ({selectedCommunity.members?.length || 0})
                </button>

                {isUserCommunityAdmin && (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTab === 'settings'
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" /> Settings
                  </button>
                )}

                {isUserCommunityAdmin && (selectedCommunity.pendingMembers?.length > 0 || selectedCommunity.settings?.requiresApproval) && (
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTab === 'requests'
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Requests ({selectedCommunity.pendingMembers?.length || 0})
                  </button>
                )}
              </div>

              {/* TAB 1: Sub-groups List */}
              {activeTab === 'groups' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Community Sub-Groups
                    </p>
                    {isUserCommunityAdmin && (
                      <div className="flex items-center gap-2">
                        {myAdminGroups.length > 0 && (
                          <button
                            onClick={() => setShowAttachGroupModal(true)}
                            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Attach Standalone Group
                          </button>
                        )}
                        <button
                          onClick={() => setIsCreatingSubGroup(true)}
                          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> New Group
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Modal to Attach Existing Standalone Group */}
                  {showAttachGroupModal && (
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl space-y-2 border border-brand-500/20">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Select a standalone group to attach:
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {myAdminGroups.map((grp) => (
                          <div
                            key={grp._id}
                            className="p-2 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-between"
                          >
                            <span className="text-xs font-semibold">{grp.name}</span>
                            <button
                              onClick={() => handleAttachExistingGroup(grp._id)}
                              className="px-3 py-1 bg-brand-600 text-white text-xs font-bold rounded-lg shadow"
                            >
                              Attach
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowAttachGroupModal(false)}
                        className="text-xs text-slate-400 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Form to Create New Sub-group */}
                  {isCreatingSubGroup ? (
                    <form onSubmit={handleCreateSubGroupSubmit} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl space-y-3">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Create Sub-Group</h5>
                      <input
                        type="text"
                        value={subGroupName}
                        onChange={(e) => setSubGroupName(e.target.value)}
                        placeholder="Group name (e.g. Marketing Team)"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        required
                      />
                      <input
                        type="text"
                        value={subGroupDesc}
                        onChange={(e) => setSubGroupDesc(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subGroupIsOpen}
                          onChange={(e) => setSubGroupIsOpen(e.target.checked)}
                          className="w-4 h-4 text-brand-600 rounded"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                          Open group (any community member can join)
                        </span>
                      </label>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsCreatingSubGroup(false)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-4 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-bold shadow"
                        >
                          Add Sub-Group
                        </button>
                      </div>
                    </form>
                  ) : (
                    selectedCommunity.groups?.map((grp) => {
                      const isMemberOfGroup = grp.members?.some(
                        (m) => (m.userId?._id || m.userId)?.toString() === currentUserId
                      );
                      const isAnnouncements = grp.isAnnouncementsGroup || grp._id === selectedCommunity.announcementsGroupId?._id;

                      return (
                        <div
                          key={grp._id}
                          className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 flex-shrink-0">
                              <MessageSquare className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                                {grp.name}
                                {grp.isOpenToJoin ? (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded">
                                    Open
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-500/10 text-slate-500 rounded">
                                    Invite-Only
                                  </span>
                                )}
                              </h5>
                              <p className="text-[10px] text-slate-500 truncate">
                                {grp.members?.length || 1} members
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isMemberOfGroup ? (
                              <button
                                onClick={() => {
                                  selectGroup(grp);
                                  onClose();
                                }}
                                className="px-3 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-bold shadow hover:bg-brand-700"
                              >
                                Chat
                              </button>
                            ) : grp.isOpenToJoin ? (
                              <button
                                onClick={() => handleJoinCommunityGroup(grp._id)}
                                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-brand-600 hover:text-white transition-all"
                              >
                                Join
                              </button>
                            ) : null}

                            {isUserCommunityAdmin && !isAnnouncements && (
                              <button
                                onClick={() => handleDetachGroup(grp._id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                                title="Detach from community (remains standalone)"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: Aggregate Deduplicated Members */}
              {activeTab === 'members' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      placeholder="Search community members..."
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {loadingMembers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400">No members found</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar p-1">
                      {filteredMembers.map((m) => (
                        <div
                          key={m._id}
                          className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={
                                m.avatarUrl ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`
                              }
                              alt={m.name}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                                {m.name}
                                {m.isCreator && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded">
                                    Creator
                                  </span>
                                )}
                                {!m.isCreator && m.isCommunityAdmin && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded">
                                    Admin
                                  </span>
                                )}
                              </h5>
                              <p className="text-[10px] text-slate-400 truncate">
                                Belongs to {m.groups?.length || 0} sub-group(s)
                              </p>
                            </div>
                          </div>

                          {/* Actions for Community Admins */}
                          {isUserCommunityAdmin && !m.isCreator && (
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setActiveMemberDropdown(
                                    activeMemberDropdown === m._id ? null : m._id
                                  )
                                }
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeMemberDropdown === m._id && (
                                <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-1 text-xs">
                                  {m.isCommunityAdmin ? (
                                    <button
                                      onClick={() => handlePromoteDemoteAdmin(m._id, 'demote')}
                                      className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                                    >
                                      Demote Admin
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handlePromoteDemoteAdmin(m._id, 'promote')}
                                      className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                                    >
                                      Promote to Admin
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRemoveMember(m._id)}
                                    className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 font-semibold"
                                  >
                                    Remove from Community
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Community Settings (Admins Only) */}
              {activeTab === 'settings' && isUserCommunityAdmin && (
                <form onSubmit={handleUpdateCommunitySettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Community Name</label>
                    <input
                      type="text"
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                    <textarea
                      value={settingsForm.description}
                      onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                      className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 h-16"
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Who can add groups?</p>
                        <p className="text-[10px] text-slate-400">Control who can create sub-groups</p>
                      </div>
                      <select
                        value={settingsForm.whoCanAddGroups}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whoCanAddGroups: e.target.value })}
                        className="px-3 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                      >
                        <option value="admins">Admins Only</option>
                        <option value="everyone">Any Member</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Require Admin Approval</p>
                        <p className="text-[10px] text-slate-400">New members must be approved by admins</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsForm.requiresApproval}
                        onChange={(e) => setSettingsForm({ ...settingsForm, requiresApproval: e.target.checked })}
                        className="w-4 h-4 text-brand-600 rounded"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleResetInviteLink}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reset Invite Link
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow"
                    >
                      Save Settings
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-4 border-t border-red-200/60 dark:border-red-950/60 space-y-2">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-red-500">Danger Zone</p>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteModal(true)}
                      className="w-full py-2.5 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border border-red-500/20 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Community
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: Pending Requests */}
              {activeTab === 'requests' && isUserCommunityAdmin && (
                <div className="space-y-3">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Pending Join Requests ({selectedCommunity.pendingMembers?.length || 0})
                  </p>

                  {selectedCommunity.pendingMembers?.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400">No pending join requests</p>
                  ) : (
                    selectedCommunity.pendingMembers?.map((applicant) => (
                      <div
                        key={applicant._id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              applicant.avatarUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(applicant.name)}`
                            }
                            alt={applicant.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">{applicant.name}</h5>
                            <p className="text-[10px] text-slate-400">{applicant.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleHandleJoinRequest(applicant._id, 'approve')}
                            className="p-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                            title="Approve"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleHandleJoinRequest(applicant._id, 'reject')}
                            className="p-2 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                            title="Reject"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Exit Community Action */}
              {!isUserCreator && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setConfirmExitModal(true)}
                    className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Exit Community
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* View 3: Communities Main List */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Your Communities</p>
                <button
                  onClick={() => setIsCreatingCommunity(true)}
                  className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> New Community
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                </div>
              ) : communities.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    No communities joined yet
                  </p>
                  <button
                    onClick={() => setIsCreatingCommunity(true)}
                    className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl shadow"
                  >
                    Create Your First Community
                  </button>
                </div>
              ) : (
                communities.map((comm) => (
                  <div
                    key={comm._id}
                    onClick={() => setSelectedCommunity(comm)}
                    className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-brand-500/10 text-brand-500 rounded-2xl">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{comm.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {comm.groups?.length || 0} Groups • {comm.members?.length || 1} Members
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal: Delete Community */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" /> Delete Community?
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              This action will delete the official **Announcements** group and remove the community wrapper.
              All other sub-groups will be **detached as standalone groups** so no group chats or messages are lost.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCommunity}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete Community'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Exit Community */}
      {confirmExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-amber-500" /> Exit Community?
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              You will be removed from all sub-groups in this community, including the Announcements group.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmExitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleExitCommunity}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Exit Community'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitiesModal;
