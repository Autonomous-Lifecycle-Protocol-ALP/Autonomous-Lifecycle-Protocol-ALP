import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:5000";

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("[ALP Realtime] Connected to WebSocket event stream:", socketInstance.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[ALP Realtime] Disconnected from WebSocket:", reason);
    });

    socketInstance.on("connect_error", (error) => {
      console.warn("[ALP Realtime] Connection error:", error.message);
    });
  }

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
