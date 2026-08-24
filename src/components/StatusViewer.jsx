import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, ChevronLeft, ChevronRight, Send, Trash2 } from 'lucide-react';
import useStatus from '../hooks/useStatus';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';

const StatusViewer = ({ isOpen, onClose, userStatusGroup }) => {
  const { user: currentUser } = useAuth();
  const { markStatusViewed, deleteStatus, reactToStatus } = useStatus();
  const { selectContact, sendMessage } = useChat();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [myReaction, setMyReaction] = useState('');

  const touchStartY = useRef(0);

  const statuses = userStatusGroup?.statuses || [];
  const activeStatus = statuses[currentIndex];
  const isOwner = userStatusGroup?.user?._id === currentUser?._id;

  useEffect(() => {
    if (activeStatus && currentUser) {
      const existingView = (activeStatus.viewedBy || []).find(
        (v) => v.userId?._id?.toString() === currentUser._id?.toString() || v.userId?.toString() === currentUser._id?.toString()
      );
      if (existingView?.reaction) {
        setMyReaction(existingView.reaction);
      } else {
        setMyReaction('');
      }
    }
  }, [currentIndex, activeStatus, currentUser]);

  const handleSendReaction = async (emoji) => {
    if (!activeStatus) return;
    setMyReaction(emoji);
    await reactToStatus(activeStatus._id, emoji);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, statuses.length]);

  useEffect(() => {
    if (activeStatus && !isOwner) {
      markStatusViewed(activeStatus._id);
    }
  }, [currentIndex, activeStatus, isOwner, markStatusViewed]);

  if (!isOpen || !userStatusGroup || statuses.length === 0) return null;

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Touch Tap Zones (Left 1/3 = prev, Right 2/3 = next)
  const handleContentClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const thirdWidth = rect.width / 3;

    if (clickX < thirdWidth) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  // Touch Swipe Down to Dismiss
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const swipeDistance = touchEndY - touchStartY.current;
    if (swipeDistance > 80) {
      onClose();
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    selectContact(userStatusGroup.user);
    await sendMessage({
      text: `Replied to status: "${activeStatus.content || 'Photo'}"\n\n${replyText}`,
    });
    setReplyText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-lg animate-fade-in p-0 sm:p-4 safe-p">
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-full sm:max-w-md sm:h-[85vh] bg-slate-900 border-0 sm:border border-slate-800 sm:rounded-3xl rounded-none overflow-hidden flex flex-col justify-between shadow-2xl"
      >
        {/* Progress Bar Header */}
        <div className="p-4 space-y-3 z-20 bg-gradient-to-b from-slate-950/90 to-transparent pt-[env(safe-area-inset-top,1rem)]">
          <div className="flex gap-1.5">
            {statuses.map((s, idx) => (
              <div key={s._id} className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-white transition-all duration-300 ${
                    idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full animate-pulse' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={userStatusGroup.user.avatarUrl}
                alt={userStatusGroup.user.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500"
              />
              <div>
                <h4 className="text-sm font-bold text-white">{userStatusGroup.user.name}</h4>
                <p className="text-[10px] text-slate-400">24h Status Update</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isOwner && activeStatus && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm('Delete this status update?')) {
                      await deleteStatus(activeStatus._id);
                      if (statuses.length <= 1) {
                        onClose();
                      } else {
                        setCurrentIndex(0);
                      }
                    }
                  }}
                  className="min-h-[44px] min-w-[44px] p-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-xl flex items-center justify-center transition-colors"
                  title="Delete Status Update"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:text-white rounded-xl flex items-center justify-center"
                title="Close Story Viewer (Swipe Down or Esc)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body with Left 1/3 and Right 2/3 Tap Zones */}
        <div
          onClick={handleContentClick}
          style={{
            background:
              activeStatus?.type === 'text'
                ? activeStatus.backgroundColor || '#6366f1'
                : '#0f172a',
          }}
          className="flex-1 flex items-center justify-center p-6 text-center text-white font-bold text-xl relative cursor-pointer select-none"
        >
          {activeStatus?.mediaUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {activeStatus.type === 'video' || activeStatus.mediaUrl.match(/\.(mp4|webm|mov|ogg)$/i) ? (
                <video
                  src={activeStatus.mediaUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain max-h-full"
                />
              ) : (
                <img
                  src={activeStatus.mediaUrl}
                  alt="Status"
                  className="w-full h-full object-contain max-h-full"
                />
              )}

              {/* Caption Overlay for Media Statuses */}
              {activeStatus.content && (
                <div className="absolute bottom-4 inset-x-4 p-3 bg-slate-950/80 backdrop-blur-md rounded-2xl text-xs font-semibold text-white text-center border border-white/10 shadow-xl">
                  {activeStatus.content}
                </div>
              )}
            </div>
          ) : (
            <p
              style={{ fontFamily: activeStatus?.font || 'sans-serif' }}
              className="whitespace-pre-wrap leading-relaxed max-w-full break-words text-2xl sm:text-3xl font-extrabold drop-shadow-md"
            >
              {activeStatus?.content}
            </p>
          )}

          {/* Desktop Visual Nav Buttons */}
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="hidden sm:flex absolute left-3 min-h-[44px] min-w-[44px] p-2 bg-slate-900/60 text-white rounded-full hover:bg-slate-900 items-center justify-center z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="hidden sm:flex absolute right-3 min-h-[44px] min-w-[44px] p-2 bg-slate-900/60 text-white rounded-full hover:bg-slate-900 items-center justify-center z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Footer / Reply & Quick Reaction Bar or Viewer Count */}
        <div className="p-4 z-20 bg-gradient-to-t from-slate-950/90 to-transparent pb-[env(safe-area-inset-bottom,1rem)] space-y-3">
          {isOwner ? (
            <button
              onClick={() => setShowViewers(!showViewers)}
              className="w-full min-h-[44px] py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 rounded-2xl"
            >
              <Eye className="w-4 h-4 text-brand-400" />
              Viewed by {activeStatus?.viewedBy?.length || 0} people
            </button>
          ) : (
            <div className="space-y-2.5">
              {/* Quick Emoji Reaction Bar */}
              <div className="flex items-center justify-around px-2 py-1.5 bg-slate-950/80 border border-white/10 rounded-2xl backdrop-blur-md shadow-xl">
                {['❤️', '😂', '😮', '😢', '🙏', '👏', '🔥', '👍'].map((emoji) => {
                  const isSelected = myReaction === emoji;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSendReaction(emoji)}
                      className={`text-lg p-1.5 rounded-xl transition-transform active:scale-125 ${
                        isSelected
                          ? 'bg-brand-600/40 border border-brand-500 scale-125 shadow-glow-brand'
                          : 'hover:scale-125 opacity-85 hover:opacity-100'
                      }`}
                      title={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleReply} className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reply to status..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none placeholder-slate-400"
                />
                <button
                  type="submit"
                  className="min-h-[44px] min-w-[44px] p-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-brand-600/30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Viewers List Modal */}
        {showViewers && (
          <div className="absolute inset-x-0 bottom-0 max-h-72 bg-slate-900 border-t border-slate-800 p-4 rounded-t-3xl z-30 overflow-y-auto animate-fade-in shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Status Viewers ({activeStatus?.viewedBy?.length || 0})
              </h4>
              <button onClick={() => setShowViewers(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {activeStatus?.viewedBy?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No viewers yet</p>
              ) : (
                activeStatus?.viewedBy?.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <img
                        src={v.userId?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.userId?.name || 'User')}`}
                        alt={v.userId?.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <h5 className="text-xs font-bold text-slate-200">{v.userId?.name || 'User'}</h5>
                        <p className="text-[10px] text-slate-400">
                          {v.viewedAt ? new Date(v.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Viewed'}
                        </p>
                      </div>
                    </div>

                    {/* Display Viewer's Reaction Emoji */}
                    {v.reaction && (
                      <span className="text-lg px-2 py-0.5 bg-slate-950/80 border border-slate-700 rounded-full animate-pop-in">
                        {v.reaction}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusViewer;
