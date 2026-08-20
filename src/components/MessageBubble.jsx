import React, { useState } from 'react';
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
} from 'lucide-react';
import { format } from 'date-fns';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';
import WaveformPlayer from './WaveformPlayer';
import LinkPreviewCard from './LinkPreviewCard';
import ReactionPicker from './ReactionPicker';
import Tooltip from './ui/Tooltip';

const MessageBubble = ({ message, isGrouped = false, onOpenForwardModal }) => {
  const { user } = useAuth();
  const { editMessage, deleteMessage, toggleStarMessage, setReplyingToMessage } = useChat();

  const isSender = message.senderId === user?._id || message.senderId?._id === user?._id;
  const isStarred = message.starredBy?.includes(user?._id);

  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

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
      } animate-slide-up gpu-smooth`}
    >
      <div className="relative max-w-[85%] sm:max-w-[70%]">
        {/* Reaction Picker Overlay */}
        {showReactionPicker && (
          <div className={`absolute -top-10 ${isSender ? 'right-0' : 'left-0'} z-40`}>
            <ReactionPicker messageId={message._id} onClose={() => setShowReactionPicker(false)} />
          </div>
        )}

        {/* Action Menu Trigger */}
        {!message.deletedForEveryone && (
          <div
            className={`absolute top-2 ${
              isSender ? '-left-8' : '-right-8'
            } opacity-0 group-hover:opacity-100 transition-opacity z-20`}
          >
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Menu Popover */}
            {showMenu && (
              <div
                className={`absolute top-6 ${
                  isSender ? 'left-0' : 'right-0'
                } glass-dropdown py-1 w-40 z-40 text-xs font-semibold animate-pop-in`}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowReactionPicker(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Smile className="w-3.5 h-3.5 text-amber-500" /> React
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setReplyingToMessage(message);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Reply className="w-3.5 h-3.5 text-brand-500" /> Reply
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenForwardModal(message._id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-500" /> Forward
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    toggleStarMessage(message._id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Star className={`w-3.5 h-3.5 ${isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                  {isStarred ? 'Unstar' : 'Star'}
                </button>

                {canEdit && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setIsEditing(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-500" /> Edit
                  </button>
                )}

                <button
                  onClick={() => handleDelete(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" /> Delete for me
                </button>

                {isSender && (
                  <button
                    onClick={() => handleDelete(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
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
          {message.type === 'video' || (message.fileData?.mimeType && message.fileData.mimeType.startsWith('video/')) ? (
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
            <div className="space-y-1.5 p-2 bg-black/10 dark:bg-black/30 rounded-2xl">
              <div className="flex items-center gap-2 font-bold text-xs">
                <MapPin className="w-4 h-4 text-red-500" />
                <span>{message.locationData.address}</span>
              </div>
              <p className="text-[10px] opacity-75">
                Lat: {message.locationData.latitude}, Lng: {message.locationData.longitude}
              </p>
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
                <div className="mb-2 overflow-hidden rounded-2xl">
                  <img
                    src={message.imageUrl}
                    alt="Attachment"
                    className="max-h-60 w-full object-cover rounded-2xl cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => window.open(message.imageUrl, '_blank')}
                  />
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
    </div>
  );
};

export default MessageBubble;
