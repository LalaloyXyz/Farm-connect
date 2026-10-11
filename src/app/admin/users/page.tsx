"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  FARMER: "bg-green-100 text-green-700",
  BUYER: "bg-blue-100 text-blue-700",
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/users").then(r=>r.json()).then(d => {
      setUsers(d?.data || []); setLoading(false)
    }).catch(()=>setLoading(false))

    fetch("/api/auth/me").then(r=>r.json()).then(d => {
      setCurrentUserId(d?.data?.id || null)
    }).catch(() => {})
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`คุณแน่ใจที่จะลบผู้ใช้ "${name}"?`)) return
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
      const d = await res.json()
      if (!d.success) throw new Error(d.message)
      setUsers(prev => prev.filter(u => u.id !== id))
      toast.success("ลบผู้ใช้เรียบร้อย")
    } catch {
      toast.error("ไม่สามารถลบผู้ใช้ได้")
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">จัดการผู้ใช้</h1>
      {loading ? <Skeleton className="h-60" /> : (
        <Card>
          <CardHeader><CardTitle>ผู้ใช้ทั้งหมด ({users.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">ชื่อ</th>
                    <th className="pb-2 pr-4">อีเมล</th>
                    <th className="pb-2 pr-4">เบอร์</th>
                    <th className="pb-2 pr-4">บทบาท</th>
                    <th className="pb-2 pr-4">สถานะ</th>
                    <th className="pb-2 pr-4">สมัครเมื่อ</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 pr-4 font-medium">{u.firstName} {u.lastName}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{u.email}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{u.phone || "-"}</td>
                      <td className="py-2 pr-4">
                        <Badge className={cn(ROLE_COLORS[u.role] || "", "text-xs")}>{u.role}</Badge>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={cn("text-xs", u.isActive ? "text-green-600" : "text-red-500")}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                      <td className="py-2">
                        {u.id !== currentUserId && (
                          <button onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
