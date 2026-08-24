import React, { useState, useEffect } from 'react';
import { X, Radio, CheckCircle, Plus, Users, Send, ThumbsUp, Heart, Flame, Sparkles, Loader2, ShieldCheck, Search } from 'lucide-react';
import api from '../lib/axios';

const ChannelsModal = ({ isOpen, onClose }) => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);

  // Posts Feed
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');

  // Form State
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelHandle, setChannelHandle] = useState('');
  const [channelDesc, setChannelDesc] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/channels');
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

  useEffect(() => {
    if (isOpen) {
      fetchChannels();
      setSelectedChannel(null);
      setIsCreatingChannel(false);
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedChannel) {
      fetchPosts(selectedChannel._id);
    }
  }, [selectedChannel]);

  if (!isOpen) return null;

  const handleToggleFollow = async (e, channel) => {
    e.stopPropagation();
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
      });

      if (res.data?.success) {
        setSuccess('Broadcast channel created!');
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
    if (!selectedChannel || !newPostContent.trim()) return;

    try {
      const res = await api.post(`/channels/${selectedChannel._id}/posts`, {
        content: newPostContent.trim(),
      });

      if (res.data?.success) {
        setPosts((prev) => [...prev, res.data.post]);
        setNewPostContent('');
      }
    } catch (err) {
      console.error('Post creation error:', err);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-brand-500 animate-pulse" />
            Channels
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
          {isCreatingChannel ? (
            /* Create Channel Form */
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
            /* Channel Posts Feed Drawer */
            <div className="space-y-4 flex flex-col h-full">
              <button
                onClick={() => setSelectedChannel(null)}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline"
              >
                ← Back to Channel Directory
              </button>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      {selectedChannel.name}
                      {selectedChannel.verified && (
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-500">
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
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-2"
                    >
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                        {post.content}
                      </p>

                      {/* Emoji Reactions Bar */}
                      <div className="flex items-center gap-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
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
                  ))
                )}
              </div>

              {/* Owner Broadcast Input */}
              {selectedChannel.isOwner ? (
                <form onSubmit={handleCreatePostSubmit} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Broadcast update to followers..."
                    className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow"
                  >
                    <Send className="w-3.5 h-3.5" /> Post
                  </button>
                </form>
              ) : (
                <p className="text-[11px] text-center text-slate-400 py-2 border-t border-slate-200 dark:border-slate-800">
                  📢 One-way channel: Only channel owners can post updates.
                </p>
              )}
            </div>
          ) : (
            /* Channel Directory List */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Public Channel Directory</p>
                <button
                  onClick={() => setIsCreatingChannel(true)}
                  className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Channel
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                </div>
              ) : (
                channels.map((ch) => (
                  <div
                    key={ch._id}
                    onClick={() => setSelectedChannel(ch)}
                    className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
                        <Radio className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          {ch.name}
                          {ch.verified && <CheckCircle className="w-3.5 h-3.5 text-blue-500" />}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          @{ch.handle} • {ch.subscriberCount} followers
                        </p>
                      </div>
                    </div>

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
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelsModal;
