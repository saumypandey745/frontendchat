import React, { useState, useEffect } from 'react';
import { X, Building2, Plus, Users, Megaphone, ChevronRight, Loader2, ShieldCheck, MessageSquare } from 'lucide-react';
import api from '../lib/axios';
import useChat from '../hooks/useChat';

const CommunitiesModal = ({ isOpen, onClose }) => {
  const { selectGroup, fetchGroups } = useChat();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  // Form States
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [isCreatingSubGroup, setIsCreatingSubGroup] = useState(false);

  const [commName, setCommName] = useState('');
  const [commDesc, setCommDesc] = useState('');

  const [subGroupName, setSubGroupName] = useState('');
  const [subGroupDesc, setSubGroupDesc] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  useEffect(() => {
    if (isOpen) {
      fetchCommunities();
      setSelectedCommunity(null);
      setIsCreatingCommunity(false);
      setIsCreatingSubGroup(false);
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
      });

      if (res.data?.success) {
        setSuccess('Community and Announcements group created!');
        setCommName('');
        setCommDesc('');
        setIsCreatingCommunity(false);
        await fetchCommunities();
        await fetchGroups(); // Refresh chat list with newly created Announcements group
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create community');
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
      });

      if (res.data?.success) {
        setSuccess('Sub-group added to community!');
        setSubGroupName('');
        setSubGroupDesc('');
        setIsCreatingSubGroup(false);
        await fetchCommunities();
        await fetchGroups();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add sub-group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-500" />
            Communities
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
          <div className="m-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-600 text-xs">
            {error}
          </div>
        )}
        {success && (
          <div className="m-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-600 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> {success}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {/* View 1: Create New Community Form */}
          {isCreatingCommunity ? (
            <form onSubmit={handleCreateCommunitySubmit} className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                New Community & Auto-Announcements
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Community Name</label>
                <input
                  type="text"
                  value={commName}
                  onChange={(e) => setCommName(e.target.value)}
                  placeholder="e.g. University Tech Club"
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
            /* View 2: Community Details Drawer */
            <div className="space-y-4">
              <button
                onClick={() => setSelectedCommunity(null)}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline"
              >
                ← Back to Communities List
              </button>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {selectedCommunity.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedCommunity.description}</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-brand-500/10 text-brand-500 rounded-full flex items-center gap-1">
                  <Users className="w-3 h-3" /> {selectedCommunity.members?.length || 1} Members
                </span>
              </div>

              {/* Announcements Group */}
              {selectedCommunity.announcementsGroupId && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-5 h-5 text-amber-500" />
                    <div>
                      <h5 className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        {selectedCommunity.announcementsGroupId.name || 'Community Announcements'}
                      </h5>
                      <p className="text-[10px] text-amber-600 dark:text-amber-500">
                        📢 Only admins can post official announcements
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

              {/* Sub-Groups Section */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Community Groups ({selectedCommunity.groups?.length || 0})
                  </h5>
                  <button
                    onClick={() => setIsCreatingSubGroup(true)}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Sub-Group
                  </button>
                </div>

                {isCreatingSubGroup ? (
                  <form onSubmit={handleCreateSubGroupSubmit} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl space-y-3">
                    <input
                      type="text"
                      value={subGroupName}
                      onChange={(e) => setSubGroupName(e.target.value)}
                      placeholder="Sub-group name (e.g. Frontend Team)"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingSubGroup(false)}
                        className="px-3 py-1 text-xs text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-3 py-1 bg-brand-600 text-white rounded-xl text-xs font-bold"
                      >
                        Add Group
                      </button>
                    </div>
                  </form>
                ) : (
                  selectedCommunity.groups?.map((grp) => (
                    <div
                      key={grp._id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="w-4 h-4 text-brand-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{grp.name}</p>
                          <p className="text-[10px] text-slate-500">{grp.members?.length || 1} members</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          selectGroup(grp);
                          onClose();
                        }}
                        className="p-1.5 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-xl"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
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
    </div>
  );
};

export default CommunitiesModal;
