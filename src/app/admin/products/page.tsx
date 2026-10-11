"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/lib/utils"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function AdminProductsPage() {
  const [data, setData] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch("/api/products?limit=50&sort=newest").then(r=>r.json()).then(d => {
      setData(d?.data?.products || []); setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`คุณแน่ใจที่จะลบสินค้า "${name}"?`)) return
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
      const d = await res.json()
      if (!d.success) throw new Error(d.message)
      setData(prev => prev.filter(p => p.id !== id))
      toast.success("ลบสินค้าเรียบร้อย")
    } catch {
      toast.error("ไม่สามารถลบสินค้าได้")
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">จัดการสินค้า</h1>
      {loading ? <Skeleton className="h-60" /> : (
        <Card>
          <CardHeader><CardTitle>สินค้าทั้งหมด ({data.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-2 pr-4">ชื่อ</th><th className="pb-2 pr-4">ฟาร์ม</th><th className="pb-2 pr-4">ราคา</th><th className="pb-2 pr-4">สต็อก</th><th className="pb-2 pr-4">สถานะ</th><th className="pb-2" /></tr></thead>
                <tbody>
                  {data.map((p: any) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 pr-4 font-medium">{p.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{p.farm?.farmName}</td>
                      <td className="py-2 pr-4">{formatPrice(p.price)}</td>
                      <td className="py-2 pr-4">{p.stock}</td>
                      <td className="py-2"><Badge variant={p.status === "ACTIVE" ? "default" : "secondary"}>{p.status}</Badge></td>
                      <td className="py-2">
                        <button onClick={() => handleDelete(p.id, p.name)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
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
