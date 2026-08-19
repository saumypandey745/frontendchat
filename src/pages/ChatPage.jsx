import React, { useState } from 'react';
import NavRail from '../components/NavRail';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import StatusTab from '../components/StatusTab';
import CallsTab from '../components/CallsTab';
import CallScreen from '../components/CallScreen';
import ToastNotification from '../components/ToastNotification';
import CommandPalette from '../components/CommandPalette';
import BlockedContactsModal from '../components/BlockedContactsModal';
import TwoStepPinModal from '../components/TwoStepPinModal';
import AccountSettingsModal from '../components/AccountSettingsModal';
import useChat from '../hooks/useChat';

const ChatPage = () => {
  const { selectedUser, selectedGroup } = useChat();

  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'status' | 'calls'
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [isTwoStepModalOpen, setIsTwoStepModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleSelectMobile = () => {
    setShowMobileChat(true);
  };

  const handleBackMobile = () => {
    setShowMobileChat(false);
  };

  return (
    <div className="h-screen flex bg-slate-950 overflow-hidden font-sans antialiased">
      {/* WebRTC Call Screen Overlay */}
      <CallScreen />

      {/* Far-Left Slim Navigation Rail */}
      <NavRail
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Shell Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List / Status / Calls Sidebar Panel */}
        <div
          className={`w-full md:w-80 lg:w-96 h-full flex-shrink-0 transition-all duration-200 ${
            showMobileChat ? 'hidden md:block' : 'block'
          }`}
        >
          {activeTab === 'chats' ? (
            <ChatList
              onSelectMobile={handleSelectMobile}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            />
          ) : activeTab === 'status' ? (
            <StatusTab />
          ) : (
            <CallsTab />
          )}
        </div>

        {/* Right Main Active Workspace Panel */}
        <div
          className={`flex-1 h-full transition-all duration-200 ${
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
      />
    </div>
  );
};

export default ChatPage;
