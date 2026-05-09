// services/socket.js - Socket.io client singleton
// A singleton ensures only ONE connection is made per app lifecycle,
// preventing duplicate event listeners on re-renders.
import { io } from 'socket.io-client';
import { API_URL } from '../config/env';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: false,       // Connect only when needed (lazy connection)
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🟢 Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error:', err.message);
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};
