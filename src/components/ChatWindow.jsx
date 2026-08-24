import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Mic,
  MapPin,
  User,
  FileText,
  Palette,
  ChevronDown,
  Users,
  X,
  Flame,
  Lock,
  BarChart2,
  UserPlus,
  Trash2,
  Ban,
  Download,
  Bell,
  Shield,
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';
import useSocket from '../hooks/useSocket';
import useTheme from '../hooks/useTheme';
import useCall from '../hooks/useCall';

import MessageBubble from './MessageBubble';
import VoiceRecorder from './VoiceRecorder';
import ReplyPreview from './ReplyPreview';
import ForwardModal from './ForwardModal';
import LocationPickerModal from './LocationPickerModal';
import ContactShareModal from './ContactShareModal';
import StickerGifPicker from './StickerGifPicker';
import CameraCaptureModal from './CameraCaptureModal';
import ImageEditorModal from './ImageEditorModal';
import PollModal from './PollModal';
import AddContactModal from './AddContactModal';
import GroupInfoPanel from './GroupInfoPanel';
import ContactInfoPanel from './ContactInfoPanel';
import MediaGalleryViewer from './MediaGalleryViewer';
import ChatSearchBar from './ChatSearchBar';
import WallpaperPickerModal from './WallpaperPickerModal';
import StarredMessagesModal from './StarredMessagesModal';
import EmptyState from './EmptyState';

const ChatWindow = ({ onBackMobile }) => {
  const { user } = useAuth();
  const {
    selectedUser,
    selectedGroup,
    isGroupActive,
    messages,
    loadingMessages,
    hasMore,
    loadMoreMessages,
    sendMessage,
    sendTypingStatus,
    setReplyingToMessage,
    typingUsers,
    chatSettings,
  } = useChat();

  const { onlineUsers } = useSocket();
  const { theme } = useTheme();
  const { startCall } = useCall();

  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [isViewOnceAttachment, setIsViewOnceAttachment] = useState(false);

  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [sending, setSending] = useState(false);

  // Scroll anchor state
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Modals
  const [forwardMessageId, setForwardMessageId] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState('');
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);

  const handleCreatePoll = async (pollData) => {
    try {
      await sendMessage({
        type: 'poll',
        pollData: JSON.stringify(pollData),
      });
    } catch (err) {
      console.error('Poll creation error:', err);
    }
  };
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isSearchInChatOpen, setIsSearchInChatOpen] = useState(false);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const [isStarredModalOpen, setIsStarredModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  const activeChatId = isGroupActive ? selectedGroup?._id : selectedUser?._id;
  const isOnline = !isGroupActive && onlineUsers.includes(selectedUser?._id) && !selectedUser?.hideOnlineStatus;
  const isTyping = typingUsers[activeChatId];
  const activeWallpaper = chatSettings[activeChatId]?.wallpaper;

  const currentMember = isGroupActive && selectedGroup?.members?.find(
    (m) => (m.userId?._id || m.userId)?.toString() === user?._id?.toString()
  );
  const isCurrentGroupAdmin = currentMember?.role === 'admin';
  const isSendingRestricted = isGroupActive && selectedGroup?.permissions?.sendMessages === 'admins' && !isCurrentGroupAdmin;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight > 200) {
      setShowScrollDown(true);
    } else {
      setShowScrollDown(false);
    }
  };

  const handleSendText = async (e) => {
    e?.preventDefault();
    if (!text.trim() && !selectedFile) return;

    if (selectedFile && selectedFile.size > 25 * 1024 * 1024) {
      alert('File size exceeds the 25MB limit.');
      return;
    }

    setSending(true);

    let msgType = 'text';
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) msgType = 'image';
      else if (selectedFile.type.startsWith('video/')) msgType = 'video';
      else if (selectedFile.type.startsWith('audio/')) msgType = 'audio';
      else msgType = 'document';
    }

    await sendMessage({
      text,
      file: selectedFile,
      type: msgType,
      isViewOnce: isViewOnceAttachment,
    });

    setText('');
    setSelectedFile(null);
    setFilePreview('');
    setIsViewOnceAttachment(false);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    setSending(false);
  };

  const handleSendVoiceNote = async (audioFile) => {
    setSending(true);
    await sendMessage({
      file: audioFile,
      type: 'audio',
    });
    setIsRecordingVoice(false);
    setSending(false);
  };

  if (!selectedUser && !selectedGroup) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-950/50">
        <EmptyState type="chats" />
      </div>
    );
  }

  const currentTitle = isGroupActive ? selectedGroup.name : (selectedUser.nickname || selectedUser.name);
  const currentAvatar = isGroupActive ? selectedGroup.iconUrl : selectedUser.avatarUrl;

  const getWallpaperStyle = () => {
    if (!activeWallpaper) return {};
    if (
      activeWallpaper.startsWith('url(') ||
      activeWallpaper.startsWith('http://') ||
      activeWallpaper.startsWith('https://') ||
      activeWallpaper.startsWith('/uploads/')
    ) {
      const bgUrl = activeWallpaper.startsWith('url(') ? activeWallpaper : `url(${activeWallpaper})`;
      return {
        backgroundImage: bgUrl,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    if (activeWallpaper.startsWith('linear-gradient')) {
      return { backgroundImage: activeWallpaper };
    }
    return { backgroundColor: activeWallpaper };
  };

  return (
    <div
      style={getWallpaperStyle()}
      className="flex-1 flex flex-col h-full bg-slate-50/60 dark:bg-slate-950/60 relative overflow-hidden"
    >
      {/* Background Contrast Overlay for Readability */}
      {activeWallpaper && (
        <div className="absolute inset-0 bg-slate-950/20 backdrop-brightness-95 pointer-events-none z-0" />
      )}
      {/* Header Bar */}
      <div className="px-5 py-3 glass-panel border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackMobile}
            className="md:hidden p-2 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className="relative cursor-pointer"
            onClick={() => (isGroupActive ? setIsGroupInfoOpen(true) : setIsContactInfoOpen(true))}
          >
            <img src={currentAvatar} alt={currentTitle} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200/80 dark:ring-slate-800/80 shadow-sm" />
            {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />}
          </div>

          <div className="cursor-pointer flex items-center gap-2" onClick={() => (isGroupActive ? setIsGroupInfoOpen(true) : setIsContactInfoOpen(true))}>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{currentTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isTyping ? (
                  <span className="text-brand-500 font-bold animate-pulse">typing...</span>
                ) : isOnline ? (
                  <span className="text-emerald-500 font-semibold">Online</span>
                ) : isGroupActive ? (
                  `${selectedGroup.members?.length || 0} members`
                ) : (
                  'Offline'
                )}
              </p>
            </div>

            {!isGroupActive && selectedUser && !selectedUser.isSavedContact && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddContactModalOpen(true);
                }}
                className="px-2.5 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 border border-brand-500/30"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Contact</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center gap-1 sm:gap-2">
          {!isGroupActive && (
            <>
              <button
                onClick={() => startCall(selectedUser, 'voice')}
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-brand-500 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => startCall(selectedUser, 'video')}
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-brand-500 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                title="Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => setIsSearchInChatOpen(!isSearchInChatOpen)}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-brand-500 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            title="Search in Chat"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsWallpaperModalOpen(true)}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-brand-500 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            title="Wallpaper"
          >
            <Palette className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowThreeDotMenu(!showThreeDotMenu)}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-brand-500 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              title="Chat Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showThreeDotMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowThreeDotMenu(false)}
                />

                <div className="absolute right-0 top-12 z-40 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1.5 animate-pop-in divide-y divide-slate-100 dark:divide-slate-800/60">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowThreeDotMenu(false);
                        if (isGroupActive) {
                          setIsGroupInfoOpen(true);
                        } else {
                          setIsContactInfoOpen(true);
                        }
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                    >
                      <User className="w-4 h-4 text-brand-500" />
                      <span>{isGroupActive ? 'Group Info' : 'View Contact Profile'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowThreeDotMenu(false);
                        setIsWallpaperModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                    >
                      <Palette className="w-4 h-4 text-purple-500" />
                      <span>Chat Wallpaper</span>
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowThreeDotMenu(false);
                        if (isGroupActive) {
                          setIsGroupInfoOpen(true);
                        } else {
                          setIsContactInfoOpen(true);
                        }
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                    >
                      <Trash2 className="w-4 h-4 text-amber-500" />
                      <span>Clear Chat History</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowThreeDotMenu(false);
                        if (isGroupActive) {
                          setIsGroupInfoOpen(true);
                        } else {
                          setIsContactInfoOpen(true);
                        }
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2.5"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                      <span>Delete Chat</span>
                    </button>
                  </div>

                  {!isGroupActive && (
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowThreeDotMenu(false);
                          setIsContactInfoOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                      >
                        <Ban className="w-4 h-4 text-red-500" />
                        <span>Block / Unblock User</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* In-Chat Search Bar */}
      <ChatSearchBar
        isOpen={isSearchInChatOpen}
        onClose={() => setIsSearchInChatOpen(false)}
        query={searchQuery}
        setQuery={setSearchQuery}
      />

      {/* Messages Scroll Feed */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-5 space-y-2 relative"
      >
        {/* "New conversation" banner — shown when chat is empty */}
        {!loadingMessages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <div className="w-16 h-16 rounded-3xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center shadow-glow-brand">
              <img
                src={currentAvatar}
                alt={currentTitle}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-brand-500/30"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{currentTitle}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No messages yet. Say hi! 👋
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const prevMsg = messages[index - 1];
          const isGrouped =
            prevMsg &&
            prevMsg.senderId === msg.senderId &&
            new Date(msg.createdAt) - new Date(prevMsg.createdAt) < 2 * 60 * 1000;

          return (
            <MessageBubble
              key={msg._id || index}
              message={msg}
              isGrouped={isGrouped}
              onOpenForwardModal={(msgId) => setForwardMessageId(msgId)}
            />
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Jump Down Floating Button */}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 p-2.5 bg-white dark:bg-slate-800 text-brand-500 rounded-full shadow-glass-md border border-slate-200 dark:border-slate-700 animate-pop-in z-20"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Quoted Reply Banner */}
      <ReplyPreview />

      {/* Selected File Preview Banner */}
      {selectedFile && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between animate-fade-in z-20">
          <div className="flex items-center gap-3 truncate">
            {filePreview ? (
              selectedFile.type.startsWith('video/') ? (
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white text-[10px] font-bold">
                  VIDEO
                </div>
              ) : (
                <img src={filePreview} alt="Preview" className="w-10 h-10 rounded-xl object-cover" />
              )
            ) : (
              <div className="p-2 bg-brand-500/10 text-brand-500 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div className="truncate text-xs">
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) && (
              <button
                type="button"
                onClick={() => setIsViewOnceAttachment(!isViewOnceAttachment)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isViewOnceAttachment
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-105'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
                title="Send as View Once Media"
              >
                <Flame className="w-4 h-4" />
                <span>View Once</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setFilePreview('');
                setIsViewOnceAttachment(false);
              }}
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            setSelectedFile(file);
            setFilePreview(URL.createObjectURL(file));
          }
        }}
        className="hidden"
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.zip,.txt,.csv,.xlsx,.pptx"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) setSelectedFile(file);
        }}
        className="hidden"
      />

      {/* Bottom Message Input Bar */}
      {isSendingRestricted ? (
        <div className="p-3.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-amber-500" />
          <span>Only admins can send messages in this group.</span>
        </div>
      ) : isRecordingVoice ? (
        <VoiceRecorder
          onCancel={() => setIsRecordingVoice(false)}
          onSendAudio={handleSendVoiceNote}
        />
      ) : (
        <form
          onSubmit={handleSendText}
          className="p-3 glass-panel border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 text-slate-400 hover:text-brand-500 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-2.5 rounded-2xl transition-colors ${
              showAttachMenu
                ? 'bg-brand-500/10 text-brand-500'
                : 'text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              sendTypingStatus(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendText();
              }
            }}
            rows={1}
            placeholder={`Message ${currentTitle}...`}
            className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm resize-none"
          />

          {text.trim() || selectedFile ? (
            <button
              type="submit"
              disabled={sending}
              className="p-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl shadow-md shadow-brand-600/30 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="p-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl shadow-md shadow-brand-600/30 transition-transform active:scale-95"
              title="Hold to Record Voice Note"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </form>
      )}

      {/* Attachment Options Popover */}
      {showAttachMenu && (
        <div className="absolute bottom-20 left-4 sm:left-12 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-2 shadow-glass-lg animate-pop-in flex flex-col space-y-1 w-52 max-w-[calc(100vw-2rem)]">
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              setIsCameraModalOpen(true);
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors min-h-[44px]"
          >
            <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
              <Camera className="w-4 h-4" />
            </div>
            <span>Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors min-h-[44px]"
          >
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <User className="w-4 h-4" />
            </div>
            <span>Photos & Videos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              docInputRef.current?.click();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors min-h-[44px]"
          >
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
            <span>Document</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              setIsLocationModalOpen(true);
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors min-h-[44px]"
          >
            <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
              <MapPin className="w-4 h-4" />
            </div>
            <span>Location</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              setIsContactModalOpen(true);
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors min-h-[44px]"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <User className="w-4 h-4" />
            </div>
            <span>Contact Card</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              setIsPollModalOpen(true);
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors min-h-[44px]"
          >
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span>Create Poll</span>
          </button>
        </div>
      )}

      {/* Emoji, Sticker & GIF Picker Popover */}
      <StickerGifPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={(emoji) => setText((prev) => prev + emoji)}
        onSendSticker={(stickerUrl) => sendMessage({ type: 'image', imageUrl: stickerUrl, isSticker: true })}
        onSendGif={(gifUrl) => sendMessage({ type: 'image', imageUrl: gifUrl, isGif: true })}
      />

      {/* Modals */}
      <ForwardModal isOpen={!!forwardMessageId} onClose={() => setForwardMessageId(null)} messageId={forwardMessageId} />
      <LocationPickerModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} onSendLocation={(loc) => sendMessage({ type: 'location', locationData: loc, text: `📍 ${loc.address}` })} />
      <PollModal isOpen={isPollModalOpen} onClose={() => setIsPollModalOpen(false)} onCreatePoll={handleCreatePoll} />
      <AddContactModal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        initialChatwaveId={selectedUser?.chatwaveId || ''}
        initialNickname={selectedUser?.nickname || selectedUser?.name || ''}
      />
      <ContactShareModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} onSendContact={(c) => sendMessage({ type: 'contact', contactData: c, text: `📇 ${c.name}` })} />
      <GroupInfoPanel
        isOpen={isGroupInfoOpen}
        onClose={() => setIsGroupInfoOpen(false)}
        group={selectedGroup}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenWallpaper={() => setIsWallpaperModalOpen(true)}
      />
      <ContactInfoPanel
        isOpen={isContactInfoOpen}
        onClose={() => setIsContactInfoOpen(false)}
        contact={selectedUser}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenStarred={() => setIsStarredModalOpen(true)}
        onOpenWallpaper={() => setIsWallpaperModalOpen(true)}
      />
      <MediaGalleryViewer isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
      <WallpaperPickerModal isOpen={isWallpaperModalOpen} onClose={() => setIsWallpaperModalOpen(false)} chatId={activeChatId} />
      <StarredMessagesModal isOpen={isStarredModalOpen} onClose={() => setIsStarredModalOpen(false)} />
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(dataUrl) => {
          setCapturedPhotoUrl(dataUrl);
          setIsEditorModalOpen(true);
        }}
      />
      <ImageEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        imageDataUrl={capturedPhotoUrl}
        onSendEditedImage={async (file) => {
          await sendMessage({ file, type: 'image' });
        }}
      />
    </div>
  );
};

export default ChatWindow;
