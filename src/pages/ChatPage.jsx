import React, { useState, useEffect } from 'react';
import NavRail from '../components/NavRail';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import StatusTab from '../components/StatusTab';
import CallsTab from '../components/CallsTab';
import CallScreen from '../components/CallScreen';
import FloatingCallBar from '../components/FloatingCallBar';
import PermissionErrorModal from '../components/PermissionErrorModal';
import ToastNotification from '../components/ToastNotification';
import CommandPalette from '../components/CommandPalette';
import BlockedContactsModal from '../components/BlockedContactsModal';
import TwoStepPinModal from '../components/TwoStepPinModal';
import AccountSettingsModal from '../components/AccountSettingsModal';
import BroadcastListModal from '../components/BroadcastListModal';
import EditProfileModal from '../components/EditProfileModal';
import CommunitiesModal from '../components/CommunitiesModal';
import ChannelsModal from '../components/ChannelsModal';
import useChat from '../hooks/useChat';

const ChatPage = () => {
  const { selectedUser, selectedGroup } = useChat();

  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'status' | 'calls'
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [isTwoStepModalOpen, setIsTwoStepModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isCommunitiesModalOpen, setIsCommunitiesModalOpen] = useState(false);
  const [isChannelsModalOpen, setIsChannelsModalOpen] = useState(false);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsBlockedModalOpen(false);
        setIsTwoStepModalOpen(false);
        setIsSettingsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectMobile = () => {
    setShowMobileChat(true);
  };

  const handleBackMobile = () => {
    setShowMobileChat(false);
  };

  return (
    <div className="h-dvh w-full flex flex-col md:flex-row bg-slate-950 overflow-hidden font-sans antialiased safe-pt safe-pb">
      {/* WebRTC Call Screen Overlay & Minimized Bar */}
      <CallScreen />
      <FloatingCallBar />
      <PermissionErrorModal />

      {/* Navigation (Left rail on desktop, fixed bottom bar on mobile) */}
      <NavRail
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenCommunities={() => setIsCommunitiesModalOpen(true)}
        onOpenChannels={() => setIsChannelsModalOpen(true)}
        showMobileChat={showMobileChat}
      />

      {/* Main Shell Split View */}
      <div className="flex-1 flex overflow-hidden w-full h-full relative">
        {/* Chat List / Status / Calls Sidebar Panel */}
        <div
          className={`w-full md:w-80 lg:w-96 h-full flex-shrink-0 transition-all duration-200 pb-16 md:pb-0 ${
            showMobileChat ? 'hidden md:block' : 'block'
          }`}
        >
          {activeTab === 'chats' ? (
            <ChatList
              onSelectMobile={handleSelectMobile}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
            />
          ) : activeTab === 'status' ? (
            <StatusTab />
          ) : (
            <CallsTab />
          )}
        </div>

        {/* Right Main Active Workspace Panel */}
        <div
          className={`flex-1 h-full min-w-0 transition-all duration-200 ${
            showMobileChat ? 'block' : 'hidden md:block'
          }`}
        >
          <ChatWindow onBackMobile={handleBackMobile} />
        </div>
      </div>

      {/* Toast Alert Banner */}
      <ToastNotification />

      {/* Overlays */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
      <BlockedContactsModal
        isOpen={isBlockedModalOpen}
        onClose={() => setIsBlockedModalOpen(false)}
      />
      <TwoStepPinModal
        isOpen={isTwoStepModalOpen}
        onClose={() => setIsTwoStepModalOpen(false)}
      />
      <AccountSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
      />
      <BroadcastListModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
      />
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
      />
      <CommunitiesModal
        isOpen={isCommunitiesModalOpen}
        onClose={() => setIsCommunitiesModalOpen(false)}
      />
      <ChannelsModal
        isOpen={isChannelsModalOpen}
        onClose={() => setIsChannelsModalOpen(false)}
      />
    </div>
  );
};

export default ChatPage;
