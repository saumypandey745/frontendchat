import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/axios';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [chatSettings, setChatSettings] = useState({});
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [starredMessages, setStarredMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [toastNotification, setToastNotification] = useState(null);

  // Fetch contacts and groups
  const fetchContacts = useCallback(async () => {
    if (!user) return;
    setLoadingContacts(true);
    try {
      const res = await api.get('/users/contacts');
      if (res.data.success) {
        setContacts(res.data.contacts);
        setGroups(res.data.groups);
      }
    } catch (err) {
      console.error('Error fetching contacts & groups:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, [user]);

  // Fetch all chat settings (pin, archive, mute, wallpaper, disappearing messages)
  const fetchChatSettings = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/chat-settings');
      if (res.data.success) {
        const settingsMap = {};
        res.data.settings.forEach((s) => {
          settingsMap[s.chatId] = s;
        });
        setChatSettings(settingsMap);
      }
    } catch (err) {
      console.error('Error fetching chat settings:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchContacts();
      fetchChatSettings();
    } else {
      setContacts([]);
      setGroups([]);
      setSelectedUser(null);
      setSelectedGroup(null);
      setMessages([]);
      setChatSettings({});
    }
  }, [user, fetchContacts, fetchChatSettings]);

  // Active Chat ID helper
  const activeChatId = selectedGroup ? selectedGroup._id : selectedUser ? selectedUser._id : null;
  const isGroupActive = !!selectedGroup;

  // Fetch Messages for active chat
  const fetchMessages = useCallback(
    async (chatId, pageNum = 1, append = false, isGroup = false) => {
      if (!chatId) return;
      if (!append) setLoadingMessages(true);

      try {
        const res = await api.get(`/messages/${chatId}?page=${pageNum}&limit=20&isGroup=${isGroup}`);
        if (res.data.success) {
          if (append) {
            setMessages((prev) => [...res.data.messages, ...prev]);
          } else {
            setMessages(res.data.messages);
          }
          setHasMore(res.data.hasMore);
          setPage(pageNum);

          // Reset unread counts
          if (isGroup) {
            setGroups((prev) =>
              prev.map((g) => (g.group._id === chatId ? { ...g, unreadCount: 0 } : g))
            );
          } else {
            setContacts((prev) =>
              prev.map((c) => (c.user._id === chatId ? { ...c, unreadCount: 0 } : c))
            );
          }
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    },
    []
  );

  // Select 1-on-1 Contact
  const selectContact = useCallback(
    (contactUser) => {
      setSelectedUser(contactUser);
      setSelectedGroup(null);
      setReplyingToMessage(null);
      setMessages([]);
      setPage(1);
      setHasMore(false);
      fetchMessages(contactUser._id, 1, false, false);

      // If user was found via search and is not yet in the contacts list,
      // inject a temporary entry so they appear in the sidebar immediately.
      setContacts((prev) => {
        const alreadyExists = prev.some((c) => c.user._id === contactUser._id);
        if (alreadyExists) return prev;
        return [
          {
            user: contactUser,
            isGroup: false,
            lastMessage: null,
            unreadCount: 0,
            _isTemporary: true, // flag for awareness; removed on next fetchContacts
          },
          ...prev,
        ];
      });
    },
    [fetchMessages]
  );

  // Select Group Chat
  const selectGroup = useCallback(
    (groupData) => {
      setSelectedGroup(groupData);
      setSelectedUser(null);
      setReplyingToMessage(null);
      setMessages([]);
      setPage(1);
      setHasMore(false);
      fetchMessages(groupData._id, 1, false, true);

      if (socket) {
        socket.emit('joinGroup', { groupId: groupData._id });
      }
    },
    [fetchMessages, socket]
  );

  // Load older messages
  const loadMoreMessages = useCallback(() => {
    if (activeChatId && hasMore && !loadingMessages) {
      fetchMessages(activeChatId, page + 1, true, isGroupActive);
    }
  }, [activeChatId, hasMore, loadingMessages, page, isGroupActive, fetchMessages]);

  // Send Message
  const sendMessage = async ({ text, file, type, locationData, contactData, mentions }) => {
    if (!activeChatId) return;

    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      if (file) formData.append('media', file);
      if (type) formData.append('type', type);
      formData.append('isGroup', isGroupActive);

      if (replyingToMessage) {
        formData.append('replyTo', replyingToMessage._id);
      }
      if (mentions) {
        formData.append('mentions', JSON.stringify(mentions));
      }
      if (locationData) {
        formData.append('locationData', JSON.stringify(locationData));
      }
      if (contactData) {
        formData.append('contactData', JSON.stringify(contactData));
      }

      const res = await api.post(`/messages/${activeChatId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setReplyingToMessage(null);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to send' };
    }
  };

  // Edit Message
  const editMessage = async (messageId, newText) => {
    try {
      const res = await api.put(`/messages/${messageId}`, { text: newText });
      if (res.data.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? res.data.message : m))
        );
        return { success: true };
      }
    } catch (err) {
      console.error('Edit error:', err);
      return { success: false, message: err.response?.data?.message || 'Edit failed' };
    }
  };

  // Delete Message
  const deleteMessage = async (messageId, deleteForEveryone = false) => {
    try {
      const res = await api.delete(`/messages/${messageId}?deleteForEveryone=${deleteForEveryone}`);
      if (res.data.success) {
        if (deleteForEveryone) {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === messageId ? { ...m, text: 'This message was deleted', deletedForEveryone: true } : m
            )
          );
        } else {
          setMessages((prev) => prev.filter((m) => m._id !== messageId));
        }
        return { success: true };
      }
    } catch (err) {
      console.error('Delete error:', err);
      return { success: false, message: err.response?.data?.message || 'Delete failed' };
    }
  };

  // Toggle Reaction
  const toggleReaction = async (messageId, emoji) => {
    try {
      const res = await api.post(`/messages/${messageId}/reaction`, { emoji });
      if (res.data.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions: res.data.reactions } : m))
        );
      }
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  // Toggle Starred Message
  const toggleStarMessage = async (messageId) => {
    try {
      const res = await api.post(`/messages/${messageId}/star`);
      if (res.data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId ? { ...m, starredBy: res.data.starredBy } : m
          )
        );
      }
    } catch (err) {
      console.error('Star error:', err);
    }
  };

  // Forward Message
  const forwardMessage = async (messageId, targetChatIds) => {
    try {
      const res = await api.post(`/messages/${messageId}/forward`, { targetChatIds });
      if (res.data.success) {
        fetchContacts();
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Forward failed' };
    }
  };

  // Update Chat Settings (Pin, Archive, Mute, Wallpaper, Disappearing messages)
  const updateChatSetting = async (chatId, updates) => {
    try {
      const formData = new FormData();
      if (updates.pinned !== undefined) formData.append('pinned', updates.pinned);
      if (updates.archived !== undefined) formData.append('archived', updates.archived);
      if (updates.muted !== undefined) formData.append('muted', updates.muted);
      if (updates.muteHours) formData.append('muteHours', updates.muteHours);
      if (updates.wallpaperColor) formData.append('wallpaperColor', updates.wallpaperColor);
      if (updates.disappearingDuration !== undefined)
        formData.append('disappearingDuration', updates.disappearingDuration);
      if (updates.wallpaperFile) formData.append('wallpaper', updates.wallpaperFile);

      const res = await api.put(`/chat-settings/${chatId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setChatSettings((prev) => ({ ...prev, [chatId]: res.data.settings }));
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Setting update failed' };
    }
  };

  // Send typing status
  const sendTypingStatus = (isTyping) => {
    if (!socket || !activeChatId) return;
    if (isGroupActive) {
      socket.emit(isTyping ? 'typing' : 'stopTyping', { groupId: activeChatId });
    } else {
      socket.emit(isTyping ? 'typing' : 'stopTyping', { receiverId: activeChatId });
    }
  };

  // Socket Events Listener
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      const msgSenderId = String(newMsg.senderId?._id || newMsg.senderId || '');
      const msgReceiverId = String(newMsg.receiverId?._id || newMsg.receiverId || '');
      const currentUserId = String(user?._id || '');
      const currentChatId = String(activeChatId || '');

      const isForActiveChat =
        // Group message for the currently open group
        (isGroupActive && newMsg.chatId === currentChatId) ||
        // 1-on-1: incoming — the OTHER person sent this message to us
        (!isGroupActive && msgSenderId === currentChatId) ||
        // 1-on-1: outgoing — WE sent this message to the currently open chat
        (!isGroupActive && msgReceiverId === currentChatId && msgSenderId === currentUserId);

      if (isForActiveChat) {
        setMessages((prev) => {
          // Avoid duplicates (server may echo back what the sender already appended optimistically)
          const alreadyExists = prev.some((m) => m._id && m._id === newMsg._id);
          if (alreadyExists) return prev;
          return [...prev, newMsg];
        });
      } else if (msgSenderId !== currentUserId) {
        // Check if this chat is muted before showing toast
        const targetChatId = newMsg.isGroup ? newMsg.chatId : msgSenderId;
        const targetSettings = chatSettings[targetChatId];
        const isMuted = targetSettings?.muted && (!targetSettings?.mutedUntil || new Date(targetSettings.mutedUntil) > new Date());

        if (!isMuted) {
          // Only toast for messages FROM someone else (never for our own sent messages or muted chats)
          setToastNotification({
            id: Date.now(),
            senderId: msgSenderId,
            text: newMsg.text || '📷 Sent an attachment',
          });
        }
      }

      fetchContacts();
    };

    const handleReaction = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    const handleGroupUpdated = (updatedGroup) => {
      fetchContacts();
      if (selectedGroup && (updatedGroup?._id === selectedGroup._id || updatedGroup?.id === selectedGroup._id)) {
        setSelectedGroup(updatedGroup);
      }
    };

    const handleRemovedFromGroup = ({ groupId }) => {
      fetchContacts();
      if (selectedGroup && selectedGroup._id === groupId) {
        setSelectedGroup(null);
        setMessages([]);
      }
    };

    const handleGroupDeleted = ({ groupId }) => {
      fetchContacts();
      if (selectedGroup && selectedGroup._id === groupId) {
        setSelectedGroup(null);
        setMessages([]);
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageReaction', handleReaction);
    socket.on('groupUpdated', handleGroupUpdated);
    socket.on('removedFromGroup', handleRemovedFromGroup);
    socket.on('groupDeleted', handleGroupDeleted);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageReaction', handleReaction);
      socket.off('groupUpdated', handleGroupUpdated);
      socket.off('removedFromGroup', handleRemovedFromGroup);
      socket.off('groupDeleted', handleGroupDeleted);
    };
  }, [socket, activeChatId, isGroupActive, fetchContacts, user, chatSettings, selectedGroup]);

  return (
    <ChatContext.Provider
      value={{
        contacts,
        groups,
        loadingContacts,
        fetchContacts,
        selectedUser,
        selectedGroup,
        selectContact,
        selectGroup,
        activeChatId,
        isGroupActive,
        messages,
        loadingMessages,
        hasMore,
        loadMoreMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        toggleStarMessage,
        forwardMessage,
        replyingToMessage,
        setReplyingToMessage,
        chatSettings,
        updateChatSetting,
        sendTypingStatus,
        typingUsers,
        toastNotification,
        setToastNotification,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
