import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../lib/axios';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    let socketInstance = null;

    if (user) {
      const token = getAccessToken();
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

      socketInstance = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'], // websocket-first; polling as fallback
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected successfully:', socketInstance.id);
      });

      socketInstance.on('getOnlineUsers', (users) => {
        setOnlineUsers(users);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      setSocket(socketInstance);
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setOnlineUsers([]);
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
