"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ShoppingCart,
  AlertTriangle,
  XCircle,
  Star,
  MessageSquare,
  CheckCircle2,
  Package,
  ChefHat,
  Truck,
  Store,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice, formatDate, cn } from "@/lib/utils"
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/constants"
import type { OrderWithItems, ApiResponse } from "@/types"

/** Timeline steps for the order progress */
const STATUS_STEPS = [
  "PENDING",
  "PAID",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COMPLETED",
]

const STEP_ICONS: Record<string, React.ReactNode> = {
  PENDING: <ShoppingCart className="h-4 w-4" />,
  PAID: <CheckCircle2 className="h-4 w-4" />,
  PREPARING: <ChefHat className="h-4 w-4" />,
  READY_FOR_PICKUP: <Truck className="h-4 w-4" />,
  COMPLETED: <Package className="h-4 w-4" />,
}

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      const res = await fetch("/api/buyer/orders")
      if (!res.ok) throw new Error("ไม่สามารถโหลดคำสั่งซื้อได้")
      const json: ApiResponse<OrderWithItems[]> = await res.json()
      setOrders(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(orderId: string) {
    if (!window.confirm("คุณแน่ใจที่จะยกเลิกคำสั่งซื้อนี้?")) return
    setCancellingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      })
      if (!res.ok) throw new Error("ยกเลิกไม่สำเร็จ")
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    } finally {
      setCancellingId(null)
    }
  }

  /** Returns the current step index for the status timeline */
  function getCurrentStep(status: string): number {
    const idx = STATUS_STEPS.indexOf(status)
    return idx >= 0 ? idx : 0
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-1">เกิดข้อผิดพลาด</h2>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          ลองอีกครั้ง
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">คำสั่งซื้อของฉัน</h1>
        <p className="text-sm text-muted-foreground">ติดตามสถานะคำสั่งซื้อทั้งหมด</p>
      </div>

      {/* Empty state */}
      {orders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">ยังไม่มีคำสั่งซื้อ</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ไปเลือกซื้อสินค้าเกษตรจากฟาร์มใกล้คุณ
            </p>
            <Link href="/products">
              <Button>ไปที่ร้านค้า</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Order list */}
      <div className="space-y-4">
        {orders.map((order) => {
          const currentStep = getCurrentStep(order.status)
          const isCancelled = order.status === "CANCELLED"
          const isCompleted = order.status === "COMPLETED"
          const canCancel = order.status === "PENDING"

          return (
            <Card key={order.id}>
              <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <Badge className={cn("text-xs", ORDER_STATUS_COLOR[order.status] ?? "")}>
                    {ORDER_STATUS_LABEL[order.status] ?? order.status}
                  </Badge>
                </div>

                <Separator />

                {/* Farm name */}
                <div className="flex items-center gap-2 text-sm">
                  <Store className="h-4 w-4 text-primary" />
                  <span className="font-medium">{order.farm.farmName}</span>
                </div>

                {/* Items */}
                <div className="space-y-1">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.product.name} x{item.quantity}
                      </span>
                      <span>{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">รวมทั้งหมด</span>
                  <span className="text-base font-bold">{formatPrice(order.total)}</span>
                </div>

                {/* Status Timeline */}
                {!isCancelled && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide">
                      {STATUS_STEPS.map((step, idx) => {
                        const isActive = idx <= currentStep
                        const isCurrent = idx === currentStep
                        return (
                          <div key={step} className="flex flex-col items-center gap-1">
                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                                isActive
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/30 text-muted-foreground/50"
                              )}
                            >
                              {STEP_ICONS[step]}
                            </div>
                            <span
                              className={cn(
                                "text-[10px] text-center leading-tight max-w-14",
                                isCurrent
                                  ? "font-medium text-foreground"
                                  : isActive
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground/50"
                              )}
                            >
                              {ORDER_STATUS_LABEL[step]}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    {/* Connecting line */}
                    <div className="relative mt-2">
                      <div className="absolute top-0 left-0 h-0.5 bg-muted w-full" />
                      <div
                        className="absolute top-0 left-0 h-0.5 bg-primary transition-all"
                        style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      disabled={cancellingId === order.id}
                      onClick={() => handleCancel(order.id)}
                    >
                      {cancellingId === order.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      ยกเลิกออเดอร์
                    </Button>
                  )}
                  {isCompleted && (
                    <>
                      {(order as any).hasReview ? (
                        <Button variant="outline" size="sm" disabled>
                          <Star className="h-3 w-3 mr-1" />
                          รีวิวแล้ว
                        </Button>
                      ) : (
                        <Link href={`/buyer/reviews?order=${order.id}`}>
                          <Button variant="outline" size="sm">
                            <Star className="h-3 w-3 mr-1" />
                            รีวิว
                          </Button>
                        </Link>
                      )}
                      <Link href={`/chat?order=${order.id}`}>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          พูดคุยกับฟาร์ม
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
