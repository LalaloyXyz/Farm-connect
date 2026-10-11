"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice, formatDate } from "@/lib/utils"
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/constants"
import { cn } from "@/lib/utils"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")
  useEffect(() => {
    fetch("/api/orders?limit=50").then(r=>r.json()).then(d => {
      setOrders(d?.data?.orders || []); setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])
  const filtered = filter === "ALL" ? orders : orders.filter((o:any) => o.status === filter)
  const statuses = ["ALL", "PENDING", "PAID", "PREPARING", "READY_FOR_PICKUP", "COMPLETED", "CANCELLED"]
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">จัดการออเดอร์</h1>
      <div className="flex flex-wrap gap-1">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            {s === "ALL" ? "ทั้งหมด" : ORDER_STATUS_LABEL[s] || s}
          </button>
        ))}
      </div>
      {loading ? <Skeleton className="h-60" /> : (
        <Card>
          <CardHeader><CardTitle>ออเดอร์ {filter !== "ALL" ? `(${ORDER_STATUS_LABEL[filter] || filter})` : ""} ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-2 pr-4">ออเดอร์</th><th className="pb-2 pr-4">ฟาร์ม</th><th className="pb-2 pr-4">วันที่</th><th className="pb-2 pr-4">ยอดรวม</th><th className="pb-2">สถานะ</th></tr></thead>
                <tbody>
                  {filtered.map((o: any) => (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 pr-4 font-medium">{o.orderNumber}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{o.farm?.farmName}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{formatDate(o.createdAt)}</td>
                      <td className="py-2 pr-4">{formatPrice(o.total)}</td>
                      <td className="py-2"><Badge className={cn(ORDER_STATUS_COLOR[o.status])}>{ORDER_STATUS_LABEL[o.status] || o.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
