import React, { useState, useEffect } from 'react';
import { X, Eye, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import useStatus from '../hooks/useStatus';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';

const StatusViewer = ({ isOpen, onClose, userStatusGroup }) => {
  const { user: currentUser } = useAuth();
  const { markStatusViewed } = useStatus();
  const { selectContact, sendMessage } = useChat();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [replyText, setReplyText] = useState('');

  const statuses = userStatusGroup?.statuses || [];
  const activeStatus = statuses[currentIndex];
  const isOwner = userStatusGroup?.user?._id === currentUser?._id;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-lg animate-fade-in p-4">
      <div className="relative w-full max-w-md h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl">
        {/* Progress Bar Header */}
        <div className="p-4 space-y-3 z-10 bg-gradient-to-b from-slate-950/80 to-transparent">
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

            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div
          style={{ backgroundColor: activeStatus?.type === 'text' ? activeStatus.backgroundColor : '#0f172a' }}
          className="flex-1 flex items-center justify-center p-8 text-center text-white font-bold text-xl relative"
        >
          {activeStatus?.mediaUrl ? (
            <img
              src={activeStatus.mediaUrl}
              alt="Status"
              className="w-full h-full object-contain max-h-full"
            />
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{activeStatus?.content}</p>
          )}

          {/* Nav Controls */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-2 p-2 bg-slate-900/40 text-white rounded-full hover:bg-slate-900"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <button
            onClick={handleNext}
            className="absolute right-2 p-2 bg-slate-900/40 text-white rounded-full hover:bg-slate-900"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Footer / Reply or Viewer Count */}
        <div className="p-4 z-10 bg-gradient-to-t from-slate-950/80 to-transparent">
          {isOwner ? (
            <button
              onClick={() => setShowViewers(!showViewers)}
              className="w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 rounded-xl"
            >
              <Eye className="w-4 h-4 text-brand-400" />
              Viewed by {activeStatus?.viewedBy?.length || 0} people
            </button>
          ) : (
            <form onSubmit={handleReply} className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply to status..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Viewers List Modal */}
        {showViewers && (
          <div className="absolute inset-x-0 bottom-0 max-h-64 bg-slate-900 border-t border-slate-800 p-4 rounded-t-3xl z-20 overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Status Viewers</h4>
              <button onClick={() => setShowViewers(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {activeStatus?.viewedBy?.map((v, i) => (
                <div key={i} className="flex items-center gap-3 p-1.5 text-xs text-slate-300">
                  <img
                    src={v.userId?.avatarUrl}
                    alt={v.userId?.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span>{v.userId?.name || 'User'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusViewer;
