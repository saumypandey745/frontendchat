import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  CheckCircle,
  Plus,
  Users,
  Send,
  Loader2,
  ShieldCheck,
  Search,
  Pin,
  PinOff,
  Bell,
  BellOff,
  Share2,
  Check,
  MoreVertical,
  FileText,
  BarChart2,
  Eye,
  Edit2,
  Trash2,
  Forward,
  Flag,
  Sparkles,
  Info,
} from 'lucide-react';
import api from '../lib/axios';
import useAuth from '../hooks/useAuth';

const CATEGORIES = ['All', 'General', 'Tech', 'News', 'Sports', 'Gaming', 'Entertainment', 'Lifestyle', 'Business'];

const ChannelsModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'updates'

  // Directory Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('popular'); // 'popular' | 'newest' | 'alphabetical'

  // Channel Updates Feed State
  const [updatesFeed, setUpdatesFeed] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  // Posts Feed State
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Post Creation State
  const [postType, setPostType] = useState('text'); // 'text' | 'document' | 'poll'
  const [newPostContent, setNewPostContent] = useState('');
  const [docName, setDocName] = useState('');
  const [docSize, setDocSize] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Editing Post State
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Form State for Channel Creation
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelHandle, setChannelHandle] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [channelCategory, setChannelCategory] = useState('General');

  // UI Banners & Feedback
  const [copiedLink, setCopiedLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activePostDropdown, setActivePostDropdown] = useState(null);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/channels', {
        params: {
          search: searchQuery,
          category: selectedCategory,
          sort: sortOption,
        },
      });
      if (res.data?.success) {
        setChannels(res.data.channels || []);
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (channelId) => {
    setLoadingPosts(true);
    try {
      const res = await api.get(`/channels/${channelId}/posts`);
      if (res.data?.success) {
        setPosts(res.data.posts || []);
      }
    } catch (err) {
      console.error('Failed to fetch channel posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchUpdatesFeed = async () => {
    setLoadingUpdates(true);
    try {
      const res = await api.get('/channels/updates-feed');
      if (res.data?.success) {
        setUpdatesFeed(res.data.posts || []);
      }
    } catch (err) {
      console.error('Failed to fetch channel updates feed:', err);
    } finally {
      setLoadingUpdates(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChannels();
      setSelectedChannel(null);
      setIsCreatingChannel(false);
      setActiveTab('directory');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !selectedChannel) {
      fetchChannels();
    }
  }, [searchQuery, selectedCategory, sortOption]);

  useEffect(() => {
    if (selectedChannel) {
      fetchPosts(selectedChannel._id);
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (activeTab === 'updates') {
      fetchUpdatesFeed();
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const currentUserId = user?._id?.toString();

  const handleToggleFollow = async (e, channel) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.post(`/channels/${channel._id}/follow`);
      if (res.data?.success) {
        setChannels((prev) =>
          prev.map((c) =>
            c._id === channel._id
              ? {
                  ...c,
                  isSubscribed: res.data.isSubscribed,
                  subscriberCount: res.data.subscriberCount,
                }
              : c
          )
        );
        if (selectedChannel?._id === channel._id) {
          setSelectedChannel((prev) => ({
            ...prev,
            isSubscribed: res.data.isSubscribed,
            subscriberCount: res.data.subscriberCount,
          }));
        }
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const handleToggleMute = async (channelId) => {
    try {
      const res = await api.post(`/channels/${channelId}/mute`);
      if (res.data?.success) {
        setChannels((prev) =>
          prev.map((c) => (c._id === channelId ? { ...c, isMuted: res.data.isMuted } : c))
        );
        if (selectedChannel?._id === channelId) {
          setSelectedChannel((prev) => ({ ...prev, isMuted: res.data.isMuted }));
        }
      }
    } catch (err) {
      console.error('Mute error:', err);
    }
  };

  const handleCreateChannelSubmit = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/channels', {
        name: channelName.trim(),
        handle: channelHandle.trim(),
        description: channelDesc.trim(),
        category: channelCategory,
      });

      if (res.data?.success) {
        setSuccess('Broadcast channel created successfully!');
        setChannelName('');
        setChannelHandle('');
        setChannelDesc('');
        setIsCreatingChannel(false);
        await fetchChannels();
        if (res.data.channel) {
          setSelectedChannel(res.data.channel);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create channel');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePostSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChannel) return;

    try {
      let postPayload = {
        content: newPostContent.trim(),
        mediaType: 'none',
      };

      if (postType === 'document') {
        postPayload.mediaType = 'document';
        postPayload.fileName = docName.trim() || 'Document.pdf';
        postPayload.fileSize = docSize.trim() || '1.2 MB';
      } else if (postType === 'poll') {
        if (!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2) {
          setError('Poll requires a question and at least 2 options.');
          return;
        }
        postPayload.poll = {
          question: pollQuestion.trim(),
          options: pollOptions.filter((o) => o.trim()).map((o, idx) => ({ id: `opt_${idx}`, text: o.trim(), votes: [] })),
        };
      }

      const res = await api.post(`/channels/${selectedChannel._id}/posts`, postPayload);

      if (res.data?.success) {
        setPosts((prev) => [...prev, res.data.post]);
        setNewPostContent('');
        setDocName('');
        setDocSize('');
        setPollQuestion('');
        setPollOptions(['', '']);
        setPostType('text');
        setError('');
      }
    } catch (err) {
      console.error('Post creation error:', err);
    }
  };

  const handleEditPostSubmit = async (postId) => {
    try {
      const res = await api.put(`/channels/${selectedChannel._id}/posts/${postId}`, {
        content: editContent,
      });
      if (res.data?.success) {
        setPosts((prev) => prev.map((p) => (p._id === postId ? res.data.post : p)));
        setEditingPostId(null);
        setEditContent('');
      }
    } catch (err) {
      console.error('Edit post error:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const res = await api.delete(`/channels/${selectedChannel._id}/posts/${postId}`);
      if (res.data?.success) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      }
    } catch (err) {
      console.error('Delete post error:', err);
    }
  };

  const handlePinPost = async (postId) => {
    try {
      const res = await api.post(`/channels/${selectedChannel._id}/posts/${postId}/pin`);
      if (res.data?.success) {
        setSelectedChannel((prev) => ({ ...prev, pinnedPostId: res.data.pinnedPostId }));
        fetchPosts(selectedChannel._id);
      }
    } catch (err) {
      console.error('Pin error:', err);
    }
  };

  const handleVotePoll = async (postId, optionId) => {
    try {
      const res = await api.post(`/channels/${selectedChannel._id}/posts/${postId}/poll-vote`, {
        optionId,
      });
      if (res.data?.success) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, poll: res.data.poll } : p))
        );
      }
    } catch (err) {
      console.error('Poll vote error:', err);
    }
  };

  const handleReactToPost = async (postId, emoji) => {
    try {
      const res = await api.post(`/channels/${selectedChannel._id}/posts/${postId}/react`, {
        emoji,
      });
      if (res.data?.success) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, reactions: res.data.reactions } : p))
        );
      }
    } catch (err) {
      console.error('React error:', err);
    }
  };

  const handleReportChannel = async () => {
    if (!selectedChannel) return;
    try {
      const res = await api.post(`/channels/${selectedChannel._id}/report`, {
        reason: 'Inappropriate content',
      });
      if (res.data?.success) {
        setSuccess('Channel report submitted successfully.');
      }
    } catch (err) {
      setError('Failed to report channel.');
    }
  };

  const copyChannelShareLink = () => {
    if (!selectedChannel) return;
    const link = `${window.location.origin}/channel/@${selectedChannel.handle}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isSelectedAdmin = selectedChannel?.isAdmin || selectedChannel?.isOwner;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-brand-500 animate-pulse" />
            {selectedChannel ? selectedChannel.name : 'Broadcast Channels'}
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
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-600 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-600 text-xs flex items-center justify-between">
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
          {isCreatingChannel ? (
            /* View 1: Create Channel Form */
            <form onSubmit={handleCreateChannelSubmit} className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Create Broadcast Channel
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Channel Name</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. TechPulse Daily"
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Handle (@username)</label>
                <input
                  type="text"
                  value={channelHandle}
                  onChange={(e) => setChannelHandle(e.target.value)}
                  placeholder="techpulse_daily"
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                <select
                  value={channelCategory}
                  onChange={(e) => setChannelCategory(e.target.value)}
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                <textarea
                  value={channelDesc}
                  onChange={(e) => setChannelDesc(e.target.value)}
                  placeholder="What will you broadcast on this channel?"
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingChannel(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl flex items-center gap-2 shadow disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Create Channel
                </button>
              </div>
            </form>
          ) : selectedChannel ? (
            /* View 2: Channel Posts Feed Drawer */
            <div className="space-y-4 flex flex-col h-full">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedChannel(null)}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline"
                >
                  ← Back to Directory
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyChannelShareLink}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3 h-3 text-brand-500" /> Share Link
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleToggleMute(selectedChannel._id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={selectedChannel.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                  >
                    {selectedChannel.isMuted ? (
                      <BellOff className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Bell className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  <button
                    onClick={handleReportChannel}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Report Channel"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Channel Header Banner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      {selectedChannel.name}
                      {selectedChannel.verified && (
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />
                      )}
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-500/10 text-brand-600 rounded">
                        {selectedChannel.category || 'General'}
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      @{selectedChannel.handle} • {selectedChannel.subscriberCount} followers
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleToggleFollow(e, selectedChannel)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow ${
                    selectedChannel.isSubscribed
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      : 'bg-brand-600 text-white hover:bg-brand-700'
                  }`}
                >
                  {selectedChannel.isSubscribed ? 'Following' : 'Follow'}
                </button>
              </div>

              {/* Pinned Post Banner (If any) */}
              {selectedChannel.pinnedPostId && (
                <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Pin className="w-4 h-4 text-brand-500 fill-brand-500" />
                    <span className="text-xs font-bold text-brand-700 dark:text-brand-400">
                      Pinned Post Available
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-brand-500">Pinned</span>
                </div>
              )}

              {/* Broadcast Posts List */}
              <div className="space-y-3 flex-1 min-h-[220px] max-h-[360px] overflow-y-auto custom-scrollbar p-1">
                {loadingPosts ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No broadcast updates posted yet
                  </div>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post._id}
                      className={`p-4 rounded-2xl border space-y-2 relative group ${
                        post.isPinned
                          ? 'bg-brand-500/5 border-brand-500/30'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">
                            {post.senderId?.name || 'Channel Admin'}
                          </span>
                          {post.editedAt && (
                            <span className="text-[9px] text-slate-400 italic">(edited)</span>
                          )}
                          {post.isPinned && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-brand-500 text-white rounded">
                              Pinned
                            </span>
                          )}
                        </div>

                        {/* Admin Action Menu */}
                        {isSelectedAdmin && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActivePostDropdown(
                                  activePostDropdown === post._id ? null : post._id
                                )
                              }
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {activePostDropdown === post._id && (
                              <div className="absolute right-0 top-6 z-20 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-1 text-xs">
                                <button
                                  onClick={() => handlePinPost(post._id)}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5"
                                >
                                  <Pin className="w-3.5 h-3.5" /> {post.isPinned ? 'Unpin' : 'Pin'}
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingPostId(post._id);
                                    setEditContent(post.content);
                                    setActivePostDropdown(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5"
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Edit
                                </button>

                                <button
                                  onClick={() => handleDeletePost(post._id)}
                                  className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 font-semibold flex items-center gap-1.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Content Render */}
                      {editingPostId === post._id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingPostId(null)}
                              className="px-3 py-1 text-xs text-slate-500"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleEditPostSubmit(post._id)}
                              className="px-3 py-1 bg-brand-600 text-white rounded-xl text-xs font-bold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>
                      )}

                      {/* Document Render */}
                      {post.mediaType === 'document' && (
                        <div className="p-3 bg-slate-200/60 dark:bg-slate-700/60 rounded-xl flex items-center gap-3">
                          <FileText className="w-6 h-6 text-brand-500" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {post.fileName || 'Document.pdf'}
                            </p>
                            <p className="text-[10px] text-slate-500">{post.fileSize || '1.2 MB'}</p>
                          </div>
                        </div>
                      )}

                      {/* Poll Render */}
                      {post.poll && post.poll.options && (
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <BarChart2 className="w-4 h-4 text-brand-500" /> {post.poll.question}
                          </p>
                          <div className="space-y-1.5">
                            {post.poll.options.map((opt) => {
                              const hasVoted = opt.votes?.some(
                                (v) => (v._id || v).toString() === currentUserId
                              );
                              const totalVotes = post.poll.options.reduce(
                                (acc, o) => acc + (o.votes?.length || 0),
                                0
                              );
                              const pct =
                                totalVotes > 0 ? Math.round(((opt.votes?.length || 0) / totalVotes) * 100) : 0;

                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => handleVotePoll(post._id, opt.id)}
                                  className={`w-full p-2 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all ${
                                    hasVoted
                                      ? 'bg-brand-500/10 border-brand-500 text-brand-600'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <span>{opt.text}</span>
                                  <span className="text-[10px] font-bold">{pct}% ({opt.votes?.length || 0})</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Footer Info & Emoji Reactions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          {post.uniqueViewers?.length || 1} views
                        </span>

                        <div className="flex items-center gap-1">
                          {['👍', '❤️', '🔥', '🎉', '🚀'].map((emoji) => {
                            const count = post.reactions?.filter((r) => r.emoji === emoji).length || 0;
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleReactToPost(post._id, emoji)}
                                className="px-2 py-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs flex items-center gap-1 transition-all"
                              >
                                <span>{emoji}</span>
                                {count > 0 && <span className="text-[10px] font-bold">{count}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Owner / Admin Post Composer */}
              {isSelectedAdmin ? (
                <form onSubmit={handleCreatePostSubmit} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <button
                      type="button"
                      onClick={() => setPostType('text')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        postType === 'text' ? 'bg-brand-600 text-white' : 'text-slate-500'
                      }`}
                    >
                      Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostType('document')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        postType === 'document' ? 'bg-brand-600 text-white' : 'text-slate-500'
                      }`}
                    >
                      Document
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostType('poll')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        postType === 'poll' ? 'bg-brand-600 text-white' : 'text-slate-500'
                      }`}
                    >
                      Poll
                    </button>
                  </div>

                  {postType === 'text' && (
                    <input
                      type="text"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Broadcast update to followers..."
                      className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  )}

                  {postType === 'document' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Document description..."
                        className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          placeholder="File Name (e.g. Project_Plan.pdf)"
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          value={docSize}
                          onChange={(e) => setDocSize(e.target.value)}
                          placeholder="Size (e.g. 2.4 MB)"
                          className="w-28 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  {postType === 'poll' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="Poll question..."
                        className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                      />
                      {pollOptions.map((opt, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...pollOptions];
                            newOpts[idx] = e.target.value;
                            setPollOptions(newOpts);
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => setPollOptions([...pollOptions, ''])}
                        className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        + Add Option
                      </button>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow"
                    >
                      <Send className="w-3.5 h-3.5" /> Broadcast Post
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-[11px] text-center text-slate-400 py-2 border-t border-slate-200 dark:border-slate-800">
                  📢 One-way channel: Only channel owners and admins can post updates.
                </p>
              )}
            </div>
          ) : (
            /* View 3: Channel Directory List & Channel Updates Feed */
            <div className="space-y-4">
              {/* Directory vs Updates Feed Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('directory')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'directory'
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Channel Directory
                  </button>

                  <button
                    onClick={() => setActiveTab('updates')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTab === 'updates'
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Channel Updates Feed
                  </button>
                </div>

                <button
                  onClick={() => setIsCreatingChannel(true)}
                  className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Channel
                </button>
              </div>

              {/* Directory Sub-View */}
              {activeTab === 'directory' && (
                <div className="space-y-3">
                  {/* Search Bar & Category Filters */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by channel name or @handle..."
                          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                      >
                        <option value="popular">Most Followers</option>
                        <option value="newest">Newest</option>
                        <option value="alphabetical">Alphabetical</option>
                      </select>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            selectedCategory === cat
                              ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Channel Cards */}
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                    </div>
                  ) : channels.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <Radio className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        No channels found
                      </p>
                    </div>
                  ) : (
                    channels.map((ch) => (
                      <div
                        key={ch._id}
                        onClick={() => setSelectedChannel(ch)}
                        className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold flex-shrink-0">
                            <Radio className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1">
                              {ch.name}
                              {ch.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-500" />}
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded ml-1">
                                {ch.category || 'General'}
                              </span>
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              @{ch.handle} • {ch.subscriberCount} followers
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleToggleFollow(e, ch)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              ch.isSubscribed
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                : 'bg-brand-600 text-white hover:bg-brand-700'
                            }`}
                          >
                            {ch.isSubscribed ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Updates Feed Sub-View */}
              {activeTab === 'updates' && (
                <div className="space-y-3">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Recent Updates Across All Followed Channels
                  </p>

                  {loadingUpdates ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                    </div>
                  ) : updatesFeed.length === 0 ? (
                    <p className="text-center py-12 text-xs text-slate-400">
                      No recent updates from followed channels. Follow more channels to get updates!
                    </p>
                  ) : (
                    updatesFeed.map((post) => (
                      <div
                        key={post._id}
                        className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-2"
                      >
                        <div className="flex items-center gap-2.5 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                          <Radio className="w-4 h-4 text-brand-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {post.channelId?.name}
                          </span>
                          <span className="text-[10px] text-slate-400">@{post.channelId?.handle}</span>
                        </div>

                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                          {post.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelsModal;
