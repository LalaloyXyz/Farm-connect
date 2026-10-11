"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Plus,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  Search,
  AlertTriangle,
  Package,
  ImagePlus,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { formatPrice, cn } from "@/lib/utils"
import type { ProductCard, ApiResponse } from "@/types"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "กำลังขาย", className: "bg-green-100 text-green-800" },
  HIDDEN: { label: "ซ่อน", className: "bg-gray-100 text-gray-800" },
  OUT_OF_STOCK: { label: "หมดสต็อก", className: "bg-red-100 text-red-800" },
}

interface ProductForm {
  name: string
  categoryId: string
  price: string
  stock: string
  unit: string
  description: string
  status: string
  images: string[]
}

const emptyForm: ProductForm = {
  name: "",
  categoryId: "",
  price: "",
  stock: "0",
  unit: "กิโลกรัม",
  description: "",
  status: "ACTIVE",
  images: [],
}

interface Category {
  id: string
  name: string
}

export default function FarmerProductsPage() {
  const [products, setProducts] = useState<ProductCard[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProductForm>(emptyForm)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  async function fetchProducts() {
    try {
      const res = await fetch("/api/farmer/products")
      if (!res.ok) throw new Error("ไม่สามารถโหลดสินค้าได้")
      const json: ApiResponse<ProductCard[]> = await res.json()
      setProducts(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    } finally {
      setLoading(false)
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories")
      if (res.ok) {
        const json = await res.json()
        setCategories(json.data ?? json)
      }
    } catch {
      // silent
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase())
  )

  function openCreateDialog() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(product: ProductCard) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      categoryId: product.category?.id ?? "",
      price: String(product.price),
      stock: String(product.stock),
      unit: product.unit,
      description: product.description ?? "",
      status: product.stock === 0 ? "OUT_OF_STOCK" : product.stock > 0 ? "ACTIVE" : "ACTIVE",
      images: product.coverImage ? [product.coverImage] : [],
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.price) return
    setSaving(true)
    try {
      const body: Record<string, any> = {
        ...form,
        coverImage: form.images[0] || null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
      }
      delete body.images
      const url = editingId ? `/api/farmer/products/${editingId}` : "/api/farmer/products"
      const method = editingId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ")
      await fetchProducts()
      setDialogOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("คุณแน่ใจที่จะลบสินค้านี้?")) return
    try {
      const res = await fetch(`/api/farmer/products/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("ลบไม่สำเร็จ")
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    }
  }

  async function handleToggleStatus(product: ProductCard) {
    const nextStatus = product.stock === 0 ? "ACTIVE" : product.sold === 0 ? "HIDDEN" : "ACTIVE"
    try {
      const res = await fetch(`/api/farmer/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error("เปลี่ยนสถานะไม่สำเร็จ")
      await fetchProducts()
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
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
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">สินค้า</h1>
          <p className="text-sm text-muted-foreground">จัดการสินค้าในฟาร์มของคุณ</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-1" />
            เพิ่มสินค้า
          </Button>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</DialogTitle>
              <DialogDescription>
                กรอกข้อมูลสินค้าที่ต้องการ{editingId ? "แก้ไข" : "เพิ่ม"}ในระบบ
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">ชื่อสินค้า</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="เช่น มะม่วงน้ำดอกไม้"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">หมวดหมู่</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v ?? "" }))}
                  >
                    <SelectTrigger>
                      {form.categoryId
                        ? categories.find((c) => c.id === form.categoryId)?.name
                        : <SelectValue placeholder="เลือกหมวดหมู่" />}
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">หน่วย</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v ?? "kg" }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="กิโลกรัม">กิโลกรัม</SelectItem>
                      <SelectItem value="ลูก">ลูก</SelectItem>
                      <SelectItem value="ถุง">ถุง</SelectItem>
                      <SelectItem value="ขวด">ขวด</SelectItem>
                      <SelectItem value="กระปุก">กระปุก</SelectItem>
                      <SelectItem value="ต้น">ต้น</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">ราคา (บาท)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="100"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">สต็อก</Label>
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">รายละเอียดสินค้า</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label>รูปภาพสินค้า</Label>
                {form.images[0] ? (
                  <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-lg border">
                    <img src={form.images[0]} alt="" className="h-full w-full object-cover" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute right-1 top-1 h-6 w-6 p-0"
                      onClick={() => setForm((f) => ({ ...f, images: [] }))}
                    >
                      X
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 text-center hover:bg-muted/50"
                    onClick={() => document.getElementById("product-image-input")?.click()}
                  >
                    <ImagePlus className="mx-auto mb-1 h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">คลิกเพื่อเพิ่มรูปภาพ</p>
                  </div>
                )}
                <input
                  id="product-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 5 * 1024 * 1024) { alert("รูปภาพต้องมีขนาดไม่เกิน 5MB"); return }
                    const img = new window.Image()
                    img.onload = () => {
                      const canvas = document.createElement("canvas")
                      let w = img.width, h = img.height
                      if (w > 800) { h = h * 800 / w; w = 800 }
                      canvas.width = w; canvas.height = h
                      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
                      setForm((f) => ({ ...f, images: [canvas.toDataURL("image/jpeg", 0.7)] }))
                    }
                    const reader = new FileReader()
                    reader.onload = (e) => { img.src = e.target?.result as string }
                    reader.readAsDataURL(file)
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="active-status"
                  checked={form.status === "ACTIVE"}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, status: checked ? "ACTIVE" : "HIDDEN" }))
                  }
                />
                <Label htmlFor="active-status">เปิดขาย</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.price}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึก"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="ค้นหาสินค้า..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Empty state */}
      {filteredProducts.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">ยังไม่มีสินค้า</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search ? "ไม่พบสินค้าที่ค้นหา" : "เริ่มต้นเพิ่มสินค้าชิ้นแรกของคุณ"}
            </p>
            {!search && (
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-1" />
                เพิ่มสินค้า
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Product list */}
      {filteredProducts.length > 0 && (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const statusConfig = STATUS_CONFIG[product.stock === 0 ? "OUT_OF_STOCK" : "ACTIVE"]
            return (
              <Card key={product.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Image */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {product.coverImage ? (
                      <Image
                        src={product.coverImage}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <Badge className={cn("shrink-0 text-xs", statusConfig.className)}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span>{product.category?.name}</span>
                      <span>ราคา {formatPrice(product.price)}</span>
                      <span>สต็อก {product.stock} {product.unit}</span>
                      <span>ขายแล้ว {product.sold} ชิ้น</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleStatus(product)}
                      title={product.stock === 0 ? "เปิดขาย" : "ซ่อนสินค้า"}
                    >
                      {product.stock === 0 ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
