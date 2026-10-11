"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Bell,
  AlertTriangle,
  ArrowLeft,
  CheckCheck,
  ShoppingCart,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatDate } from "@/lib/utils"
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/constants"

interface Notification {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  linkUrl?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const items = data?.data?.notifications ?? data?.data ?? []
        if (Array.isArray(items)) setNotifications(items)
        else setError("ไม่สามารถโหลดการแจ้งเตือนได้")
      })
      .catch(() => setError("เกิดข้อผิดพลาด"))
      .finally(() => setLoading(false))
  }, [])

  async function markAllRead() {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      }
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-20 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h2 className="mb-2 text-lg font-semibold">เกิดข้อผิดพลาด</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">การแจ้งเตือน</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-1 h-4 w-4" /> อ่านทั้งหมด
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-20 text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 text-gray-200" />
          <h3 className="text-lg font-semibold">ไม่มีการแจ้งเตือน</h3>
          <p className="mt-1 text-sm text-muted-foreground">ไม่มีการแจ้งเตือนในขณะนี้</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const isOrder = n.title?.includes("ออเดอร์") || n.title?.includes("คำสั่งซื้อ") || n.title?.includes("สถานะ")
            const statusMatch = n.message?.match(/สถานะ.*?:?\s*(\w+)/)
            const statusKey = statusMatch?.[1] || ""

            return (
              <Card
                key={n.id}
                className={cn(
                  "transition-colors",
                  !n.isRead && "border-primary/20 bg-primary/5"
                )}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div
                    className={cn(
                      "mt-1 h-2 w-2 shrink-0 rounded-full",
                      !n.isRead ? "bg-primary" : "bg-transparent"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    {isOrder ? (
                      <Link
                        href="/buyer/orders"
                        className="group flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 shrink-0 text-primary" />
                            <p className={cn("text-sm", !n.isRead && "font-medium")}>{n.title}</p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                          {statusKey && ORDER_STATUS_LABEL[statusKey] && (
                            <Badge className={cn("mt-1 text-xs", ORDER_STATUS_COLOR[statusKey] ?? "")}>
                              {ORDER_STATUS_LABEL[statusKey]}
                            </Badge>
                          )}
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    ) : (
                      <>
                        <p className={cn("text-sm", !n.isRead && "font-medium")}>{n.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                      </>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(n.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> กลับหน้าแรก
        </Link>
      </div>
    </div>
  )
}
