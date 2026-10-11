"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Plus,
  Store,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice, formatDate, cn } from "@/lib/utils"
import type { DashboardStats } from "@/types"

const statusColorMap: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  PREPARING: "bg-indigo-100 text-indigo-800",
  READY_FOR_PICKUP: "bg-teal-100 text-teal-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

const statusLabelMap: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  PAID: "ชำระแล้ว",
  PREPARING: "กำลังเตรียม",
  READY_FOR_PICKUP: "พร้อมรับ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
}

export default function FarmerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/farmer/dashboard")
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

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    const isNoFarm = error.includes("กรุณาสร้างฟาร์ม");
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        {isNoFarm ? (
          <>
            <Store className="h-16 w-16 text-green-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">ยินดีต้อนรับสู่ FarmConnect</h2>
            <p className="text-sm text-muted-foreground mb-2">คุณยังไม่มีฟาร์ม กรุณาสร้างฟาร์มก่อนเริ่มใช้งาน</p>
            <Link href="/farmer/settings">
              <Button className="mt-4">
                <Store className="mr-2 h-4 w-4" />
                สร้างฟาร์มตอนนี้
              </Button>
            </Link>
          </>
        ) : (
          <>
            <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-1">เกิดข้อผิดพลาด</h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              ลองอีกครั้ง
            </Button>
          </>
        )}
      </div>
    )
  }

  const salesData = stats?.salesData ?? []
  const maxSale = Math.max(...salesData.map((d) => d.amount), 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{stats?.farmName || "ภาพรวมฟาร์ม"}</h1>
          <p className="text-sm text-muted-foreground">ข้อมูลล่าสุดของฟาร์มของคุณ</p>
        </div>
        <div className="flex gap-2">
          <Link href="/farmer/products">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              เพิ่มสินค้า
            </Button>
          </Link>
          <Link href="/farmer/settings">
            <Button variant="outline">
              <Store className="h-4 w-4 mr-1" />
              จัดการสวน
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">รายได้วันนี้</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats?.todaySales ?? 0)}</div>
            <p className="text-xs text-muted-foreground">รายได้ของวันนี้</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">รายได้เดือนนี้</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats?.monthlySales ?? 0)}</div>
            <p className="text-xs text-muted-foreground">รายได้เดือนนี้ทั้งหมด</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ออเดอร์รอดำเนินการ</CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingOrders ?? 0}</div>
            <p className="text-xs text-muted-foreground">รอการยืนยัน/ดำเนินการ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">สินค้าคงเหลือ</CardTitle>
            <Package className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts ?? 0}</div>
            <p className="text-xs text-muted-foreground">สินค้าที่เปิดขายอยู่</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">รายได้ 7 วันล่าสุด</CardTitle>
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
                      className="w-full rounded-md bg-primary/70 transition-all hover:bg-primary"
                      style={{ height: Math.round(Math.max((day.amount / maxSale) * 130, 4)) }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {new Date(day.date).toLocaleDateString("th-TH", { weekday: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">สินค้าขายดี</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.topProducts || stats.topProducts.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                ยังไม่มีสินค้าขายดี
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">ขายแล้ว {product.sold} ชิ้น</p>
                    </div>
                    <span className="text-sm font-medium">{formatPrice(product.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions + Low Stock + Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ดำเนินการด่วน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/farmer/products">
              <Button className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มสินค้า
              </Button>
            </Link>
            <Link href="/farmer/settings">
              <Button variant="outline" className="w-full justify-start">
                <Store className="h-4 w-4 mr-2" />
                จัดการสวน
              </Button>
            </Link>
            <Link href="/farmer/orders">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="h-4 w-4 mr-2" />
                ดูออเดอร์
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              สินค้าใกล้หมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.lowStockProducts && stats.lowStockProducts > 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl font-bold text-amber-500 mb-1">{stats.lowStockProducts}</p>
                <p className="text-sm text-muted-foreground">รายการที่กำลังจะหมดสต็อก</p>
                <Link href="/farmer/products">
                  <Button variant="link" size="sm" className="mt-2">
                    จัดการสินค้าคงเหลือ
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                สินค้าทั้งหมดมีสต็อกเพียงพอ
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders - This is a summary */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">ออเดอร์ล่าสุด</CardTitle>
            <Link href="/farmer/orders">
              <Button variant="link" size="sm">ดูทั้งหมด</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!stats?.recentOrders || stats.recentOrders.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                ยังไม่มีออเดอร์
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentOrders.slice(0, 4).map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <Badge className={cn("shrink-0", statusColorMap[order.status] ?? "")}>
                      {statusLabelMap[order.status] ?? order.status}
                    </Badge>
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
