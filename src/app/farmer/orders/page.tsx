"use client"

import { useEffect, useState } from "react"
import {
  ShoppingCart,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice, formatDate, cn } from "@/lib/utils"
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
} from "@/constants"
import type { OrderWithItems, ApiResponse } from "@/types"

const TAB_FILTERS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "PENDING", label: "รอดำเนินการ" },
  { value: "PAID", label: "ชำระแล้ว" },
  { value: "PREPARING", label: "กำลังเตรียม" },
  { value: "READY_FOR_PICKUP", label: "พร้อมรับ" },
  { value: "COMPLETED", label: "เสร็จสิ้น" },
]

/** Actions available per status */
const STATUS_ACTIONS: Record<string, { label: string; nextStatus: string }[]> = {
  PENDING: [
    { label: "ยืนยันออเดอร์", nextStatus: "PAID" },
    { label: "ยกเลิก", nextStatus: "CANCELLED" },
  ],
  PAID: [{ label: "เตรียมสินค้า", nextStatus: "PREPARING" }],
  PREPARING: [{ label: "พร้อมรับ", nextStatus: "READY_FOR_PICKUP" }],
  READY_FOR_PICKUP: [{ label: "เสร็จสิ้น", nextStatus: "COMPLETED" }],
}

export default function FarmerOrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("ALL")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      const res = await fetch("/api/farmer/orders")
      if (!res.ok) throw new Error("ไม่สามารถโหลดออเดอร์ได้")
      const json: ApiResponse<OrderWithItems[]> = await res.json()
      setOrders(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStatus(orderId: string, status: string) {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("อัปเดตสถานะไม่สำเร็จ")
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOrders =
    activeTab === "ALL"
      ? orders
      : orders.filter((o) => o.status === activeTab)

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
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
        <h1 className="text-2xl font-bold tracking-tight">ออเดอร์</h1>
        <p className="text-sm text-muted-foreground">จัดการออเดอร์ที่ได้รับ</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          {TAB_FILTERS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Empty state */}
      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">ไม่มีออเดอร์</h3>
            <p className="text-sm text-muted-foreground">
              {activeTab === "ALL"
                ? "ยังไม่มีออเดอร์ในขณะนี้"
                : `ไม่มีออเดอร์สถานะ "${TAB_FILTERS.find((t) => t.value === activeTab)?.label}"`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Order list */}
      <div className="space-y-3">
        {filteredOrders.map((order) => {
          const isExpanded = expandedId === order.id
          const actions = STATUS_ACTIONS[order.status] ?? []

          return (
            <Card key={order.id}>
              <CardContent className="p-4">
                {/* Summary row */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        className="flex items-center gap-1 text-left"
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      >
                        <span className="text-sm font-semibold">{order.orderNumber}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <Badge className={cn("text-xs", ORDER_STATUS_COLOR[order.status] ?? "")}>
                        {ORDER_STATUS_LABEL[order.status] ?? order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(order.createdAt)} &middot; {order.items?.length ?? 0} รายการ
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{formatPrice(order.total)}</p>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-4 space-y-3">
                    <Separator />
                    <div className="space-y-2">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.product.name} x{item.quantity}
                          </span>
                          <span>{formatPrice(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    {actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {actions.map((action) => (
                          <Button
                            key={action.nextStatus}
                            size="sm"
                            variant={action.nextStatus === "CANCELLED" ? "destructive" : "default"}
                            disabled={updatingId === order.id}
                            onClick={() => handleUpdateStatus(order.id, action.nextStatus)}
                          >
                            {updatingId === order.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : null}
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
