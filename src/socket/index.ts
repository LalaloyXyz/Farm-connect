import { io, Socket } from "socket.io-client";
import type { ChatMessage } from "@/types";

/* ------------------------------------------------------------------ */
/*  Callback types                                                     */
/* ------------------------------------------------------------------ */

export interface OnlineStatusPayload {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface ReadReceiptPayload {
  conversationId: string;
  messageId: string;
  userId: string;
}

type MessageCallback = (message: ChatMessage) => void;
type TypingCallback = (payload: TypingPayload) => void;
type OnlineStatusCallback = (payload: OnlineStatusPayload) => void;
type ReadReceiptCallback = (payload: ReadReceiptPayload) => void;

/* ------------------------------------------------------------------ */
/*  Socket initialisation                                              */
/* ------------------------------------------------------------------ */

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}`
    : "");

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

const listeners: {
  message: MessageCallback[];
  typing: TypingCallback[];
  onlineStatus: OnlineStatusCallback[];
  readReceipt: ReadReceiptCallback[];
} = {
  message: [],
  typing: [],
  onlineStatus: [],
  readReceipt: [],
};

function initializeSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.5,
    timeout: 10000,
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    reconnectAttempts = 0;
  });

  socket.on("disconnect", (_reason) => {
    // Will auto-reconnect via config above
  });

  socket.on("connect_error", () => {
    reconnectAttempts += 1;
  });

  socket.on("message", (data: ChatMessage) => {
    listeners.message.forEach((cb) => cb(data));
  });

  socket.on("typing", (data: TypingPayload) => {
    listeners.typing.forEach((cb) => cb(data));
  });

  socket.on("online_status", (data: OnlineStatusPayload) => {
    listeners.onlineStatus.forEach((cb) => cb(data));
  });

  socket.on("read_receipt", (data: ReadReceiptPayload) => {
    listeners.readReceipt.forEach((cb) => cb(data));
  });

  return socket;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function getSocket(): Socket {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
}

export function joinConversation(conversationId: string): void {
  const sock = getSocket();
  sock.emit("join_conversation", { conversationId });
}

export function leaveConversation(conversationId: string): void {
  const sock = getSocket();
  sock.emit("leave_conversation", { conversationId });
}

export function sendMessage(data: {
  conversationId: string;
  message?: string;
  image?: string;
  messageType: "text" | "image";
}): void {
  const sock = getSocket();
  sock.emit("send_message", data);
}

export function sendTyping(
  conversationId: string,
  isTyping: boolean
): void {
  const sock = getSocket();
  sock.emit("typing", { conversationId, isTyping });
}

export function markRead(
  conversationId: string,
  messageId: string
): void {
  const sock = getSocket();
  sock.emit("read_receipt", { conversationId, messageId });
}

export function onMessage(callback: MessageCallback): () => void {
  listeners.message.push(callback);
  return () => {
    const idx = listeners.message.indexOf(callback);
    if (idx >= 0) listeners.message.splice(idx, 1);
  };
}

export function onTyping(callback: TypingCallback): () => void {
  listeners.typing.push(callback);
  return () => {
    const idx = listeners.typing.indexOf(callback);
    if (idx >= 0) listeners.typing.splice(idx, 1);
  };
}

export function onOnlineStatus(
  callback: OnlineStatusCallback
): () => void {
  listeners.onlineStatus.push(callback);
  return () => {
    const idx = listeners.onlineStatus.indexOf(callback);
    if (idx >= 0) listeners.onlineStatus.splice(idx, 1);
  };
}

export function onReadReceipt(
  callback: ReadReceiptCallback
): () => void {
  listeners.readReceipt.push(callback);
  return () => {
    const idx = listeners.readReceipt.indexOf(callback);
    if (idx >= 0) listeners.readReceipt.splice(idx, 1);
  };
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  listeners.message.length = 0;
  listeners.typing.length = 0;
  listeners.onlineStatus.length = 0;
  listeners.readReceipt.length = 0;
}

/* ------------------------------------------------------------------ */
/*  Re-export singleton for convenience                                */
/* ------------------------------------------------------------------ */

export { socket };
