import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  CheckCheck,
  MoreVertical,
  Edit2,
  Trash2,
  Reply,
  Share2,
  Star,
  MapPin,
  User,
  FileText,
  Phone,
  PhoneMissed,
  Smile,
  X,
  Check as SaveCheck,
  Info,
  Flame,
  Eye,
  BarChart2,
  CheckSquare,
  Square,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';
import WaveformPlayer from './WaveformPlayer';
import LinkPreviewCard from './LinkPreviewCard';
import ReactionPicker from './ReactionPicker';
import Tooltip from './ui/Tooltip';
import MessageInfoModal from './MessageInfoModal';
import ViewOnceViewerModal from './ViewOnceViewerModal';

const MessageBubble = ({ message, isGrouped = false, onOpenForwardModal }) => {
  const { user } = useAuth();
  const { editMessage, deleteMessage, toggleStarMessage, setReplyingToMessage, votePoll, endPoll } = useChat();

  const isSender = message.senderId === user?._id || message.senderId?._id === user?._id;
  const isStarred = message.starredBy?.includes(user?._id);

  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showViewOnceModal, setShowViewOnceModal] = useState(false);

  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);

  const canEdit =
    isSender &&
    !message.deletedForEveryone &&
    Date.now() - new Date(message.createdAt).getTime() < 5 * 60 * 1000;

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText === message.text) {
      setIsEditing(false);
      return;
    }
    await editMessage(message._id, editText.trim());
    setIsEditing(false);
  };

  const handleDelete = (deleteForEveryone) => {
    setShowMenu(false);
    deleteMessage(message._id, deleteForEveryone);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'HH:mm');
  };

  // Group reactions by emoji
  const groupedReactions = React.useMemo(() => {
    if (!message.reactions || message.reactions.length === 0) return [];
    const map = new Map();
    message.reactions.forEach((r) => {
      const uName = r.userId?.name || 'User';
      const isMine = (r.userId?._id || r.userId)?.toString() === user?._id?.toString();
      if (!map.has(r.emoji)) {
        map.set(r.emoji, { emoji: r.emoji, count: 0, names: [], isMine: false });
      }
      const entry = map.get(r.emoji);
      entry.count += 1;
      entry.names.push(uName);
      if (isMine) entry.isMine = true;
    });
    return Array.from(map.values());
  }, [message.reactions, user]);

  return (
    <div
      className={`group flex flex-col ${isGrouped ? 'mt-1' : 'mt-3'} ${
        isSender ? 'items-end' : 'items-start'
      } animate-slide-up gpu-smooth ${showMenu || showReactionPicker ? 'z-30 relative' : ''}`}
    >
      <div className={`relative max-w-[85%] sm:max-w-[70%] ${showMenu || showReactionPicker ? 'z-40' : ''}`}>
        {/* Reaction Picker Overlay */}
        {showReactionPicker && (
          <div className={`absolute -top-10 ${isSender ? 'right-0' : 'left-0'} z-50`}>
            <ReactionPicker messageId={message._id} onClose={() => setShowReactionPicker(false)} />
          </div>
        )}

        {/* Action Menu Trigger */}
        {!message.deletedForEveryone && (
          <div
            ref={menuRef}
            className={`absolute top-2 ${
              isSender ? '-left-8' : '-right-8'
            } ${showMenu ? 'opacity-100 z-50' : 'opacity-0 group-hover:opacity-100 z-20'} transition-opacity`}
          >
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Menu Popover */}
            {showMenu && (
              <div
                className={`absolute top-6 ${
                  isSender ? 'right-0' : 'left-0'
                } glass-dropdown py-1 w-44 z-50 text-xs font-semibold animate-pop-in bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl backdrop-blur-md`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowReactionPicker(true);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Smile className="w-3.5 h-3.5 text-amber-500" /> React
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setReplyingToMessage(message);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Reply className="w-3.5 h-3.5 text-brand-500" /> Reply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onOpenForwardModal(message._id);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-500" /> Forward
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    toggleStarMessage(message._id);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Star className={`w-3.5 h-3.5 ${isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                  {isStarred ? 'Unstar' : 'Star'}
                </button>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setIsEditing(true);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-500" /> Edit
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(false)}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" /> Delete for me
                </button>

                {isSender && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowInfoModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5 text-indigo-500" /> Info
                  </button>
                )}

                {isSender && (
                  <button
                    type="button"
                    onClick={() => handleDelete(true)}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" /> Delete for everyone
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Message Bubble Card */}
        <div
          className={`p-3.5 text-sm transition-all shadow-sm ${
            isSender
              ? 'bg-gradient-to-tr from-brand-600 to-brand-500 text-white rounded-3xl rounded-br-md shadow-brand-500/10'
              : 'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 rounded-3xl rounded-bl-md shadow-glass-sm'
          }`}
        >
          {/* Forwarded Tag */}
          {message.forwarded && !message.deletedForEveryone && (
            <p className="text-[10px] italic font-semibold opacity-75 mb-1.5 flex items-center gap-1">
              <Share2 className="w-3 h-3" />
              {message.forwardCount > 5 ? 'Forwarded many times' : 'Forwarded'}
            </p>
          )}

          {/* Quoted Reply Block */}
          {message.replyTo && !message.deletedForEveryone && (
            <div
              className={`p-2 rounded-2xl mb-2 text-xs border-l-4 ${
                isSender
                  ? 'bg-brand-700/50 border-white/80 text-brand-100'
                  : 'bg-slate-100 dark:bg-slate-700/50 border-brand-500 text-slate-700 dark:text-slate-300'
              }`}
            >
              <p className="font-bold">{message.replyTo.senderId?.name || 'User'}</p>
              <p className="truncate opacity-90">{message.replyTo.text || '📷 Attachment'}</p>
            </div>
          )}

          {/* Special Type Rendering */}
          {message.isViewOnce ? (
            <div className="py-1">
              {message.viewOnceState === 'opened' ? (
                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-black/10 dark:bg-black/30 text-xs font-semibold text-slate-400 border border-slate-200/40 dark:border-slate-700/40">
                  <Flame className="w-4 h-4 text-slate-400" />
                  <span>Opened</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowViewOnceModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/20 text-amber-500 font-bold text-xs hover:bg-amber-500/30 active:scale-95 transition-all border border-amber-500/40 shadow-sm"
                >
                  <Flame className="w-4 h-4 fill-amber-500 animate-pulse" />
                  <span>🔥 View once photo</span>
                </button>
              )}
            </div>
          ) : message.type === 'video' || (message.fileData?.mimeType && message.fileData.mimeType.startsWith('video/')) ? (
            <div className="space-y-2">
              <video
                controls
                playsInline
                src={message.fileData?.url || message.imageUrl}
                className="max-h-60 w-full object-cover rounded-2xl shadow-sm border border-slate-700/50"
              />
              {message.text && <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>}
            </div>
          ) : message.type === 'audio' && message.fileData?.url ? (
            <WaveformPlayer audioUrl={message.fileData.url} isSender={isSender} />
          ) : message.type === 'location' && message.locationData ? (
            <div className="space-y-2 p-2.5 bg-black/10 dark:bg-black/30 rounded-2xl min-w-[220px]">
              <div className="flex items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-1.5">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <MapPin className={`w-4 h-4 ${message.locationData.isLive && !message.locationData.isEnded ? 'text-red-500 animate-bounce' : 'text-red-500'}`} />
                  <span className="truncate">{message.locationData.address || 'Location'}</span>
                </div>
                {message.locationData.isLive && (
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                      message.locationData.isEnded
                        ? 'bg-slate-500/20 text-slate-400'
                        : 'bg-red-600 text-white animate-pulse'
                    }`}
                  >
                    {!message.locationData.isEnded && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                    {message.locationData.isEnded ? 'Ended' : 'LIVE'}
                  </span>
                )}
              </div>

              {/* Map Coordinates & Live Until Label */}
              <div className="text-[11px] space-y-1">
                <p className="opacity-80 font-mono text-[10px]">
                  Lat: {Number(message.locationData.latitude).toFixed(4)}, Lng: {Number(message.locationData.longitude).toFixed(4)}
                </p>

                {message.locationData.isLive && (
                  <div className="flex items-center justify-between text-[10px] pt-1">
                    {message.locationData.isEnded ? (
                      <span className="italic text-slate-400 font-semibold">Live location ended</span>
                    ) : (
                      <span className="font-semibold text-emerald-400">
                        Live until {message.locationData.liveExpiresAt ? format(new Date(message.locationData.liveExpiresAt), 'HH:mm') : 'expires soon'}
                      </span>
                    )}

                    {isSender && message.locationData.isLive && !message.locationData.isEnded && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await api.post(`/messages/${message._id}/stop-live-location`);
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow transition-all"
                      >
                        Stop sharing
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : message.type === 'contact' && message.contactData ? (
            <div className="flex items-center gap-3 p-2 bg-black/10 dark:bg-black/30 rounded-2xl">
              <User className="w-8 h-8 p-2 bg-brand-500 text-white rounded-full" />
              <div className="text-xs">
                <p className="font-bold">{message.contactData.name}</p>
                <p className="opacity-80">{message.contactData.phone || message.contactData.email}</p>
              </div>
            </div>
          ) : message.type === 'document' && message.fileData ? (
            <div className="flex items-center justify-between gap-4 p-2.5 bg-black/10 dark:bg-black/30 rounded-2xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-6 h-6 text-brand-400 flex-shrink-0" />
                <div className="truncate text-xs">
                  <p className="font-bold truncate">{message.fileData.name}</p>
                  <p className="opacity-75">{Math.round((message.fileData.size || 0) / 1024)} KB</p>
                </div>
              </div>
              <a
                href={message.fileData.url}
                download
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 text-[10px] font-bold bg-white text-brand-600 rounded-xl shadow hover:bg-slate-50 transition-colors"
              >
                Download
              </a>
            </div>
          ) : message.type === 'poll' && message.poll ? (
            <div className="space-y-3 min-w-[240px] max-w-sm">
              <div className="flex items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <BarChart2 className="w-4 h-4 text-brand-400" />
                  <span className="truncate">{message.poll.question}</span>
                </div>
                {message.poll.endedAt ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 font-bold">
                    Ended
                  </span>
                ) : (
                  <span className="text-[10px] opacity-75">
                    {message.poll.allowMultiple ? 'Select multiple' : 'Select one'}
                  </span>
                )}
              </div>

              {/* Poll Options */}
              <div className="space-y-2">
                {(() => {
                  const totalVotes = message.poll.options.reduce(
                    (acc, opt) => acc + (opt.votes?.length || 0),
                    0
                  );

                  return message.poll.options.map((opt, idx) => {
                    const votesCount = opt.votes?.length || 0;
                    const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
                    const hasVoted = opt.votes?.some(
                      (v) => (v._id || v).toString() === user?._id?.toString()
                    );

                    return (
                      <button
                        key={idx}
                        disabled={Boolean(message.poll.endedAt)}
                        onClick={() => votePoll(message._id, [idx])}
                        className={`w-full relative overflow-hidden p-2.5 rounded-2xl border text-left transition-all ${
                          hasVoted
                            ? 'border-brand-500 bg-brand-500/10 font-bold'
                            : 'border-slate-300/40 dark:border-slate-700/40 bg-black/5 dark:bg-black/20 hover:bg-black/10'
                        } ${message.poll.endedAt ? 'cursor-not-allowed opacity-90' : ''}`}
                      >
                        {/* Progress Fill Bar */}
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-brand-500/20 transition-all duration-300 rounded-2xl"
                          style={{ width: `${percentage}%` }}
                        />

                        <div className="relative flex items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {message.poll.allowMultiple ? (
                              hasVoted ? (
                                <CheckSquare className="w-4 h-4 text-brand-500 flex-shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              )
                            ) : hasVoted ? (
                              <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-400 flex-shrink-0" />
                            )}
                            <span className="truncate">{opt.text}</span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px] font-mono">
                            <span className="font-bold">{votesCount}</span>
                            <span className="opacity-75">({percentage}%)</span>
                          </div>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Poll Footer */}
              <div className="flex items-center justify-between text-[10px] opacity-75 pt-1">
                <span>
                  {message.poll.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0)} total votes
                </span>

                {isSender && !message.poll.endedAt && (
                  <button
                    onClick={() => endPoll(message._id)}
                    className="font-bold text-red-400 hover:underline"
                  >
                    End Poll
                  </button>
                )}
              </div>
            </div>
          ) : message.type === 'call-log' && message.callLog ? (
            <div className="flex items-center gap-2 text-xs font-semibold">
              {message.callLog.status === 'answered' ? (
                <Phone className="w-4 h-4 text-emerald-400" />
              ) : (
                <PhoneMissed className="w-4 h-4 text-red-400" />
              )}
              <span>{message.text}</span>
            </div>
          ) : (
            <>
              {message.imageUrl && !message.deletedForEveryone && (
                <div className={message.isSticker || message.type === 'sticker' ? 'my-1 bg-transparent border-0 shadow-none' : 'mb-2 overflow-hidden rounded-2xl relative'}>
                  <img
                    src={message.imageUrl}
                    alt={message.isSticker || message.type === 'sticker' ? 'Sticker' : 'Attachment'}
                    className={
                      message.isSticker || message.type === 'sticker'
                        ? 'w-32 h-32 object-contain hover:scale-105 transition-transform bg-transparent'
                        : 'max-h-60 w-full object-cover rounded-2xl cursor-pointer hover:opacity-95 transition-opacity'
                    }
                    onClick={() => window.open(message.imageUrl, '_blank')}
                  />
                  {(message.isGif || message.type === 'gif') && (
                    <span className="absolute bottom-2 left-2 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      GIF
                    </span>
                  )}
                </div>
              )}

              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs rounded-xl border border-slate-300 text-slate-900 bg-white"
                    autoFocus
                  />
                  <button onClick={handleSaveEdit} className="p-1 bg-white text-emerald-600 rounded-lg">
                    <SaveCheck className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
              )}

              {message.linkPreview && <LinkPreviewCard linkPreview={message.linkPreview} />}
            </>
          )}

          {/* Footer Metadata */}
          <div
            className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
              isSender ? 'text-brand-200' : 'text-slate-400'
            }`}
          >
            {isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
            {message.editedAt && <span className="italic">edited</span>}
            <span>{formatTime(message.createdAt)}</span>
            {isSender && !message.deletedForEveryone && (
              <span>
                {message.status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-accent-cyan transition-colors" />
                ) : message.status === 'delivered' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-brand-200" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-brand-200" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reaction Badges */}
        {groupedReactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
            {groupedReactions.map((gr) => (
              <Tooltip key={gr.emoji} content={`Reacted by: ${gr.names.join(', ')}`}>
                <button
                  type="button"
                  onClick={() => toggleReaction(message._id, gr.emoji)}
                  className={`px-2 py-0.5 text-[11px] font-bold border rounded-full shadow-glass-sm animate-pop-in cursor-pointer transition-transform hover:scale-110 active:scale-95 flex items-center gap-1 ${
                    gr.isMine
                      ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>{gr.emoji}</span>
                  {gr.count > 1 && <span className="text-[10px] opacity-80">{gr.count}</span>}
                </button>
              </Tooltip>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showInfoModal && (
        <MessageInfoModal messageId={message._id} onClose={() => setShowInfoModal(false)} />
      )}
      {showViewOnceModal && (
        <ViewOnceViewerModal message={message} onClose={() => setShowViewOnceModal(false)} />
      )}
    </div>
  );
};

export default MessageBubble;
