import { io } from 'socket.io-client';

// Returns the root URL of the backend socket server
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

let socket = null;

// Connects and returns the shared Socket.io client instance
export const getSocket = () => {
  if (!socket) {
    socket = io(getSocketUrl(), {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    // Logs when socket successfully connects to server
    socket.on('connect', () => {
      console.log('⚡ Socket.io connected:', socket.id);
    });

    // Logs connection errors when socket fails to connect
    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error:', err.message);
    });
  }
  return socket;
};

// Disconnects the active Socket.io client connection
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;
