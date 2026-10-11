"use client";

import { useState, useEffect, useCallback } from "react";
import type { ChatMessage, ConversationItem, ApiResponse } from "@/types";

export function useChat() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/conversations", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("ไม่สามารถโหลดรายการแชทได้");
      }
      const json: ApiResponse<ConversationItem[]> = await res.json();
      if (json.success && json.data) {
        setConversations(json.data);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดแชท";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("ไม่สามารถโหลดข้อความได้");
      }
      const json: ApiResponse<ChatMessage[]> = await res.json();
      if (json.success && json.data) {
        setMessages(json.data);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อความ";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (
      conversationId: string,
      message: string,
      type: "text" | "image" = "text"
    ) => {
      try {
        const res = await fetch(
          `/api/chat/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, messageType: type }),
            credentials: "include",
          }
        );
        if (!res.ok) {
          throw new Error("ไม่สามารถส่งข้อความได้");
        }
        const json: ApiResponse<ChatMessage> = await res.json();
        if (json.success && json.data) {
          setMessages((prev) => [...prev, json.data!]);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งข้อความ";
        setError(message);
        throw err;
      }
    },
    []
  );

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
    } catch {
      // Silent fail for read receipts
    }
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/chat/unread", {
          credentials: "include",
        });
        if (res.ok) {
          const json: ApiResponse<{ count: number }> = await res.json();
          if (json.success && json.data) {
            setUnreadCount(json.data.count);
          }
        }
      } catch {
        // Silent fail
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    conversations,
    messages,
    sendMessage,
    unreadCount,
    isLoading,
    error,
    fetchConversations,
    fetchMessages,
    markAsRead,
  } as const;
}
