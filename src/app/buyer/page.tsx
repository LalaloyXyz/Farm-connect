"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ShoppingCart,
  Heart,
  Star,
  Bell,
  Store,
  ChevronRight,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice, formatDate, cn } from "@/lib/utils"
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/constants"

interface BuyerData {
  totalOrders: number
  totalWishlist: number
  totalReviews: number
  recentOrders: {
    id: string
    orderNumber: string
    status: string
    total: number
    createdAt: Date
    farm: { farmName: string }
    items: { product: { name: string } }[]
  }[]
  wishlistItems: { id: string; name: string; price: number; coverImage: string | null }[]
  followedFarms: { id: string; farmName: string; ratingAverage: number }[]
  notifications: {
    id: string
    title: string
    message: string
    isRead: boolean
    createdAt: Date
  }[]
}

export default function BuyerDashboardPage() {
  const [data, setData] = useState<BuyerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/buyer/dashboard")
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้")
        const json = await res.json()
        setData(json.data ?? json)
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <BuyerDashboardSkeleton />

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
      title: "คำสั่งซื้อทั้งหมด",
      value: data?.totalOrders ?? 0,
      icon: ShoppingCart,
      color: "text-blue-500",
    },
    {
      title: "รายการโปรด",
      value: data?.totalWishlist ?? 0,
      icon: Heart,
      color: "text-rose-500",
    },
    {
      title: "รีวิว",
      value: data?.totalReviews ?? 0,
      icon: Star,
      color: "text-amber-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ภาพรวม</h1>
        <p className="text-sm text-muted-foreground">ยินดีต้อนรับกลับสู่ FarmConnect</p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
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

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/buyer/orders">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">คำสั่งซื้อ</p>
                <p className="text-xs text-muted-foreground">ดูออเดอร์ทั้งหมด</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/cart">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <ShoppingCart className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">ตะกร้าสินค้า</p>
                <p className="text-xs text-muted-foreground">สินค้าที่เลือกไว้</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/products">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <Store className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium">สินค้า</p>
                <p className="text-xs text-muted-foreground">เลือกซื้อสินค้า</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/chat">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <Bell className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">ข้อความ</p>
                <p className="text-xs text-muted-foreground">แชทกับฟาร์ม</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">คำสั่งซื้อล่าสุด</CardTitle>
            <Link href="/buyer/orders">
              <Button variant="link" size="sm">
                ดูทั้งหมด <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!data?.recentOrders || data.recentOrders.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                ยังไม่มีคำสั่งซื้อ
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentOrders.map((order) => (
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

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">การแจ้งเตือน</CardTitle>
            <Link href="/chat">
              <Button variant="link" size="sm">
                ดูทั้งหมด <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!data?.notifications || data.notifications.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                ไม่มีการแจ้งเตือน
              </div>
            ) : (
              <div className="space-y-3">
                {data.notifications.slice(0, 4).map((notif) => (
                  <div key={notif.id} className="flex gap-3">
                    <Bell className={cn("h-4 w-4 mt-0.5 shrink-0", notif.isRead ? "text-muted-foreground" : "text-primary")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(notif.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Wishlist */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">รายการโปรด</CardTitle>
            <Link href="/wishlist">
              <Button variant="link" size="sm">
                ดูทั้งหมด <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!data?.wishlistItems || data.wishlistItems.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                ยังไม่มีรายการโปรด
              </div>
            ) : (
              <div className="space-y-3">
                {data.wishlistItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <Heart className="h-4 w-4 text-rose-500 shrink-0" />
                    <p className="text-sm flex-1 truncate">{item.name}</p>
                    <span className="text-sm font-medium">{formatPrice(item.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Followed Farms */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">ฟาร์มที่ติดตาม</CardTitle>
            <Link href="/farms">
              <Button variant="link" size="sm">
                ดูทั้งหมด <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!data?.followedFarms || data.followedFarms.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                ยังไม่ได้ติดตามฟาร์ม
              </div>
            ) : (
              <div className="space-y-3">
                {data.followedFarms.slice(0, 4).map((farm) => (
                  <div key={farm.id} className="flex items-center gap-3">
                    <Store className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-sm flex-1 truncate">{farm.farmName}</p>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{Number(farm.ratingAverage).toFixed(1)}</span>
                    </div>
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

function BuyerDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-32" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-32" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
