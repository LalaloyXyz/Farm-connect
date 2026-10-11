"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function AdminFarmsPage() {
  const [farms, setFarms] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch("/api/farms?limit=50&sort=newest").then(r=>r.json()).then(d=>{
      setFarms(d?.data?.farms || []); setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`คุณแน่ใจที่จะลบฟาร์ม "${name}"?`)) return
    try {
      const res = await fetch(`/api/admin/farms/${id}`, { method: "DELETE" })
      const d = await res.json()
      if (!d.success) throw new Error(d.message)
      setFarms(prev => prev.filter(f => f.id !== id))
      toast.success("ลบฟาร์มเรียบร้อย")
    } catch {
      toast.error("ไม่สามารถลบฟาร์มได้")
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">จัดการฟาร์ม</h1>
      {loading ? <Skeleton className="h-40" /> : (
        <Card><CardHeader><CardTitle>ฟาร์มทั้งหมด ({farms.length})</CardTitle></CardHeader>
        <CardContent>
          {farms.length === 0 ? <p className="text-muted-foreground">ไม่มีข้อมูล</p> : (
            <div className="space-y-3">
              {farms.map((f:any) => (
                <div key={f.id} className="flex items-center justify-between border-b pb-2 hover:bg-muted/50 p-2 rounded">
                  <Link href={`/farms/${f.id}`} className="flex-1">
                    <div><p className="font-medium">{f.farmName}</p><p className="text-xs text-muted-foreground">{f.province} • ⭐{Number(f.ratingAverage).toFixed(1)}</p></div>
                    <span className="text-xs">{f.followers} ผู้ติดตาม</span>
                  </Link>
                  <button onClick={() => handleDelete(f.id, f.farmName)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>
      )}
    </div>
  )
}
