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
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

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
import GroupInfoPanel from './GroupInfoPanel';
import MediaGalleryViewer from './MediaGalleryViewer';
import ChatSearchBar from './ChatSearchBar';
import WallpaperPickerModal from './WallpaperPickerModal';
import EmptyState from './EmptyState';

const ChatWindow = ({ onBackMobile }) => {
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
    typingUsers,
    chatSettings,
  } = useChat();

  const { onlineUsers } = useSocket();
  const { theme } = useTheme();
  const { startCall } = useCall();

  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');

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
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isSearchInChatOpen, setIsSearchInChatOpen] = useState(false);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  const activeChatId = isGroupActive ? selectedGroup?._id : selectedUser?._id;
  const isOnline = !isGroupActive && onlineUsers.includes(selectedUser?._id) && !selectedUser?.hideOnlineStatus;
  const isTyping = typingUsers[activeChatId];
  const activeWallpaper = chatSettings[activeChatId]?.wallpaper;

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

    setSending(true);
    await sendMessage({
      text,
      file: selectedFile,
      type: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'document') : 'text',
    });

    setText('');
    setSelectedFile(null);
    setFilePreview('');
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

  const currentTitle = isGroupActive ? selectedGroup.name : selectedUser.name;
  const currentAvatar = isGroupActive ? selectedGroup.iconUrl : selectedUser.avatarUrl;

  return (
    <div
      style={{ backgroundColor: activeWallpaper || undefined }}
      className="flex-1 flex flex-col h-full bg-slate-50/60 dark:bg-slate-950/60 relative overflow-hidden"
    >
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
            onClick={() => isGroupActive && setIsGroupInfoOpen(true)}
          >
            <img src={currentAvatar} alt={currentTitle} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200/80 dark:ring-slate-800/80 shadow-sm" />
            {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />}
          </div>

          <div className="cursor-pointer" onClick={() => isGroupActive && setIsGroupInfoOpen(true)}>
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
          <button
            onClick={() => (isGroupActive ? setIsGroupInfoOpen(true) : setIsGalleryOpen(true))}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-brand-500 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            title="Info & Gallery"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
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
        accept=".pdf,.doc,.docx,.zip,.txt"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) setSelectedFile(file);
        }}
        className="hidden"
      />

      {/* Bottom Message Input Bar */}
      {isRecordingVoice ? (
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
            className="p-2.5 text-slate-400 hover:text-brand-500 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-30 shadow-glass-lg rounded-3xl animate-pop-in">
          <EmojiPicker
            onEmojiClick={(eData) => setText((prev) => prev + eData.emoji)}
            theme={theme === 'dark' ? 'dark' : 'light'}
          />
        </div>
      )}

      {/* Modals */}
      <ForwardModal isOpen={!!forwardMessageId} onClose={() => setForwardMessageId(null)} messageId={forwardMessageId} />
      <LocationPickerModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} onSendLocation={(loc) => sendMessage({ type: 'location', locationData: loc, text: `📍 ${loc.address}` })} />
      <ContactShareModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} onSendContact={(c) => sendMessage({ type: 'contact', contactData: c, text: `📇 ${c.name}` })} />
      <GroupInfoPanel isOpen={isGroupInfoOpen} onClose={() => setIsGroupInfoOpen(false)} group={selectedGroup} />
      <MediaGalleryViewer isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
      <WallpaperPickerModal isOpen={isWallpaperModalOpen} onClose={() => setIsWallpaperModalOpen(false)} chatId={activeChatId} />
    </div>
  );
};

export default ChatWindow;
