"use client"

import { useEffect, useState, useRef, useCallback, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import {
  Send,
  Search,
  ImagePlus,
  Check,
  CheckCheck,
  Loader2,
  MessageSquare,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, timeAgo, getInitials } from "@/lib/utils"
import type { ConversationItem, ChatMessage, ApiResponse } from "@/types"

function ChatPageContent() {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const searchParams = useSearchParams()
  const farmParam = searchParams.get("farm")
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [newChatInput, setNewChatInput] = useState("")
  const [newChatSending, setNewChatSending] = useState(false)
  const [showMobileList, setShowMobileList] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Fetch conversations
  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch("/api/chat")
        if (!res.ok) throw new Error("Failed to load conversations")
        const json: ApiResponse<ConversationItem[]> = await res.json()
        setConversations(json.data ?? [])
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchConversations()
  }, [])

  // Auto-select conversation if farm param matches an existing conversation
  useEffect(() => {
    if (!farmParam || conversations.length === 0 || activeConv) return
    const match = conversations.find((c) => c.farmerId === farmParam || c.buyerId === farmParam)
    if (match) {
      setActiveConv(match.id)
      setShowMobileList(false)
    }
  }, [farmParam, conversations, activeConv])

  // Start new conversation with farm from query param
  const handleStartNewChat = useCallback(async () => {
    if (!farmParam || !newChatInput.trim() || newChatSending) return
    setNewChatSending(true)
    try {
      // Resolve farm ID to farmer user ID
      const farmRes = await fetch(`/api/farms/${farmParam}`)
      if (!farmRes.ok) throw new Error("ไม่พบฟาร์ม")
      const farmJson = await farmRes.json()
      const farmData = farmJson.data ?? farmJson
      const farmerId = farmData.farmerId ?? farmData.farmer?.id
      if (!farmerId) throw new Error("ไม่พบข้อมูลเกษตรกร")

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmerId, message: newChatInput.trim() }),
      })
      if (!res.ok) throw new Error("ไม่สามารถเริ่มแชทได้")
      const json = await res.json()
      if (json.data) {
        setNewChatInput("")
        // Refetch conversations to get the new one
        const convRes = await fetch("/api/chat")
        if (convRes.ok) {
          const convJson: ApiResponse<ConversationItem[]> = await convRes.json()
          setConversations(convJson.data ?? [])
          setActiveConv(json.data.conversationId ?? json.data.id)
          setShowMobileList(false)
        }
      }
    } catch {
      alert("ไม่สามารถส่งข้อความได้")
    } finally {
      setNewChatSending(false)
    }
  }, [farmParam, newChatInput, newChatSending])

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (!activeConv) return
    setMessagesLoading(true)
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/chat/${activeConv}`)
        if (!res.ok) throw new Error("Failed to load messages")
        const json = await res.json()
        // API returns { data: { messages: [...], buyer, farmer } }
        setMessages(json.data?.messages ?? [])
        scrollToBottom()
        // Mark messages as read
        fetch(`/api/chat/${activeConv}/read`, { method: "PATCH" }).catch(() => {})
        // Update unread badge in conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv
              ? { ...c, _count: { messages: 0 } }
              : c
          )
        )
      } catch {
        // silent
      } finally {
        setMessagesLoading(false)
      }
    }
    fetchMessages()
  }, [activeConv, scrollToBottom])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  function getOtherUser(conv: ConversationItem) {
    // Show the person who is NOT the current user
    if (currentUserId && conv.buyerId === currentUserId) return conv.farmer
    return conv.buyer
  }

  function getOtherName(conv: ConversationItem): string {
    const user = getOtherUser(conv)
    return user ? `${user.firstName} ${user.lastName}` : "ผู้ใช้"
  }

  function getOtherAvatar(conv: ConversationItem): string | null {
    return getOtherUser(conv)?.avatar ?? null
  }

  function getUnreadCount(conv: ConversationItem): number {
    return conv._count?.messages ?? 0
  }

  const filteredConversations = conversations.filter((conv) =>
    getOtherName(conv).toLowerCase().includes(search.toLowerCase())
  )

  async function handleSend() {
    if (!input.trim() || !activeConv || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/chat/${activeConv}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      })
      if (!res.ok) throw new Error("ส่งข้อความไม่สำเร็จ")
      const json: ApiResponse<ChatMessage> = await res.json()
      if (json.data) {
        setMessages((prev) => [...prev, json.data!])
        setInput("")
        // Update last message in conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv
              ? { ...c, lastMessage: json.data!.message, lastMessageTime: json.data!.createdAt }
              : c
          )
        )
      }
    } catch {
      alert("ไม่สามารถส่งข้อความได้")
    } finally {
      setSending(false)
    }
  }

  const activeConversation = conversations.find((c) => c.id === activeConv)

  function handleSelectConv(id: string) {
    setActiveConv(id)
    setShowMobileList(false)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden rounded-lg border bg-card md:h-[calc(100vh-4rem)]">
      {/* Conversation list */}
      <div
        className={cn(
          "w-full shrink-0 border-r md:w-80",
          showMobileList ? "flex flex-col" : "hidden md:flex md:flex-col"
        )}
      >
        <div className="border-b p-3">
          <h2 className="text-base font-semibold mb-2">ข้อความ</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="ค้นหาการสนทนา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? "ไม่พบการสนทนา" : "ยังไม่มีการสนทนา"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conv) => {
                const isActive = conv.id === activeConv
                const unread = getUnreadCount(conv)
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConv(conv.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50",
                      isActive && "bg-muted"
                    )}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={getOtherAvatar(conv) ?? undefined} />
                      <AvatarFallback>{getInitials(getOtherName(conv))}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">
                          {getOtherName(conv)}
                        </span>
                        {conv.lastMessageTime && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {timeAgo(conv.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage || "ยังไม่มีข้อความ"}
                        </p>
                        {unread > 0 && (
                          <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                            {unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div
        className={cn(
          "flex flex-1 flex-col",
          !showMobileList ? "flex" : "hidden md:flex"
        )}
      >
        {!activeConversation ? (
          farmParam ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-6">
              <MessageSquare className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-1">เริ่มแชทกับฟาร์ม</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                พิมพ์ข้อความเพื่อเริ่มพูดคุยกับฟาร์ม
              </p>
              <div className="flex w-full max-w-md items-center gap-2">
                <Input
                  placeholder="พิมพ์ข้อความ..."
                  value={newChatInput}
                  onChange={(e) => setNewChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleStartNewChat()
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleStartNewChat}
                  disabled={!newChatInput.trim() || newChatSending}
                  className="h-11 w-11 shrink-0"
                >
                  {newChatSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-6">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">เลือกแชทเพื่อเริ่มพูดคุย</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              เลือกการสนทนาจากรายการด้านซ้ายเพื่อดูข้อความ
            </p>
          </div>
          )
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0"
                onClick={() => setShowMobileList(true)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={getOtherAvatar(activeConversation) ?? undefined}
                />
                <AvatarFallback>
                  {getInitials(getOtherName(activeConversation))}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {getOtherName(activeConversation)}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}
                    >
                      <Skeleton
                        className={cn(
                          "h-12 w-48 rounded-xl",
                          i % 2 === 0 ? "rounded-bl-none" : "rounded-br-none"
                        )}
                      />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  ยังไม่มีข้อความ เริ่มพูดคุยกันเลย
                </div>
              ) : (
                messages.map((msg) => {
                  const isSent = msg.senderId === currentUserId

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        isSent ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                          isSent
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        )}
                      >
                        {msg.messageType === "image" ? (
                          <p className="italic text-xs">[รูปภาพ]</p>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                        )}
                        <div
                          className={cn(
                            "flex items-center justify-end gap-1 mt-1",
                            isSent ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          <span className="text-[10px]">
                            {new Date(msg.createdAt).toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isSent &&
                            (msg.isRead ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            ))}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  disabled
                  title="แนบรูปภาพ"
                >
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Input
                  placeholder="พิมพ์ข้อความ..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="h-11 w-11 shrink-0"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">กำลังโหลด...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}
