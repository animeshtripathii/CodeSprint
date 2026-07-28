import { io } from "socket.io-client";
import { getToken } from "./api";

const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

// Lazily create (and authenticate) the shared socket connection.
export const getSocket = () => {
  if (!socket) {
    socket = io(URL, {
      autoConnect: false,
      auth: { token: getToken() },
      transports: ["websocket"],
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  const token = getToken();
  
  if (s.auth?.token !== token) {
    s.auth = { token };
    if (s.connected) {
      console.log("🔌 Socket token changed: Reconnecting to authenticate...");
      s.disconnect().connect();
    }
  }
  
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

