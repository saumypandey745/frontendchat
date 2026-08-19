import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/axios';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const StatusContext = createContext();

export const StatusProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [myStatus, setMyStatus] = useState(null);
  const [contactStatuses, setContactStatuses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStatuses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/statuses');
      if (res.data.success) {
        setMyStatus(res.data.myStatus);
        setContactStatuses(res.data.contactStatuses);
      }
    } catch (err) {
      console.error('Error fetching statuses:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const postStatus = async ({ type, content, file, backgroundColor, font }) => {
    try {
      const formData = new FormData();
      if (type) formData.append('type', type);
      if (content) formData.append('content', content);
      if (backgroundColor) formData.append('backgroundColor', backgroundColor);
      if (font) formData.append('font', font);
      if (file) formData.append('media', file);

      const res = await api.post('/statuses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        fetchStatuses();
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to post status' };
    }
  };

  const markStatusViewed = async (statusId) => {
    try {
      await api.post(`/statuses/${statusId}/view`);
    } catch (e) {
      console.error('View status error:', e);
    }
  };

  const deleteStatus = async (statusId) => {
    try {
      const res = await api.delete(`/statuses/${statusId}`);
      if (res.data.success) {
        fetchStatuses();
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: 'Delete status failed' };
    }
  };

  useEffect(() => {
    if (!socket) return;
    socket.on('statusPosted', () => {
      fetchStatuses();
    });
    return () => {
      socket.off('statusPosted');
    };
  }, [socket, fetchStatuses]);

  return (
    <StatusContext.Provider
      value={{
        myStatus,
        contactStatuses,
        loading,
        fetchStatuses,
        postStatus,
        markStatusViewed,
        deleteStatus,
      }}
    >
      {children}
    </StatusContext.Provider>
  );
};

export const useStatus = () => {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
};
