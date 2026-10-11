"use client"

import { useEffect, useState } from "react"
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice, formatDate, cn } from "@/lib/utils"
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/constants"
import type { DashboardStats } from "@/types"

interface AdminStats extends DashboardStats {
  totalUsers: number
  totalFarmers: number
  totalBuyers: number
  totalRevenue: number
  monthlyRevenue: { month: string; revenue: number; orders: number }[]
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/dashboard")
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้")
        const json = await res.json()
        setStats(json.data ?? json)
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <AdminDashboardSkeleton />

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

  const statsCards = [
    {
      title: "ผู้ใช้ทั้งหมด",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "เกษตรกร",
      value: stats?.totalFarmers ?? 0,
      icon: UserCheck,
      color: "text-emerald-500",
    },
    {
      title: "ผู้ซื้อ",
      value: stats?.totalBuyers ?? 0,
      icon: Store,
      color: "text-violet-500",
    },
    {
      title: "สินค้า",
      value: stats?.totalProducts ?? 0,
      icon: Package,
      color: "text-amber-500",
    },
    {
      title: "ออเดอร์",
      value: stats?.totalOrders ?? 0,
      icon: ShoppingCart,
      color: "text-rose-500",
    },
    {
      title: "รายได้รวม",
      value: formatPrice(stats?.totalRevenue ?? 0),
      icon: DollarSign,
      color: "text-green-500",
    },
  ]

  const monthlyRevenue = stats?.monthlyRevenue ?? []
  interface ChartData { date: string; amount: number }
  const salesData: ChartData[] = monthlyRevenue.map((d) => ({ date: d.month, amount: Number(d.revenue) }))
  const ordersData: ChartData[] = monthlyRevenue.map((d) => ({ date: d.month, amount: d.orders || 0 }))
  const maxSale = Math.max(...salesData.map((d) => d.amount), 1)
  const maxOrders = Math.max(...ordersData.map((d) => d.amount), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ภาพรวมระบบ</h1>
        <p className="text-sm text-muted-foreground">ข้อมูลภาพรวมของแพลตฟอร์ม FarmConnect</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statsCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className={cn("h-4 w-4", card.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              แนวโน้มรายได้ (6 เดือน)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                ยังไม่มีข้อมูลรายได้
              </div>
            ) : (
              <div className="flex items-end gap-2" style={{ height: 160 }}>
                {salesData.map((day) => (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1 self-stretch justify-end">
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatPrice(day.amount)}
                    </span>
                    <div
                      className="w-full rounded-md bg-emerald-400/70 transition-all hover:bg-emerald-400"
                      style={{ height: Math.round(Math.max((day.amount / maxSale) * 130, 4)) }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {(() => { try { const d = new Date(day.date + "-01"); return d.toLocaleDateString("th-TH", { month: "short" }) } catch { return day.date } })()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              แนวโน้มออเดอร์ (6 เดือน)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                ยังไม่มีข้อมูลออเดอร์
              </div>
            ) : (
              <div className="flex items-end gap-2" style={{ height: 160 }}>
                {ordersData.map((day) => (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1 self-stretch justify-end">
                    <span className="text-xs font-medium text-muted-foreground">
                      {day.amount} ออเดอร์
                    </span>
                    <div
                      className="w-full rounded-md bg-blue-400/70 transition-all hover:bg-blue-400"
                      style={{ height: Math.round(Math.max((day.amount / maxOrders) * 130, 4)) }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {(() => { try { const d = new Date(day.date + "-01"); return d.toLocaleDateString("th-TH", { month: "short" }) } catch { return day.date } })()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ออเดอร์ล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.recentOrders || stats.recentOrders.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                ยังไม่มีออเดอร์
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.farm.farmName} &middot; {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-medium">{formatPrice(order.total)}</span>
                      <Badge className={cn("text-xs", ORDER_STATUS_COLOR[order.status] ?? "")}>
                        {ORDER_STATUS_LABEL[order.status] ?? order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top products by revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">สินค้าขายดี</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.topProducts || stats.topProducts.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                ยังไม่มีข้อมูล
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topProducts.slice(0, 5).map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">ขายแล้ว {item.sold} ชิ้น</p>
                    </div>
                    <span className="text-sm font-medium">{formatPrice(item.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-40" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
