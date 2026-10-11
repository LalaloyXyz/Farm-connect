"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"

const MapPicker = dynamic(() => import("@/components/map-picker"), { ssr: false })
import {
  Store,
  MapPin,
  ImagePlus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface FarmSettings {
  farmName: string
  description: string
  phone: string
  address: string
  province: string
  district: string
  subdistrict: string
  postalCode: string
  openingTime: string
  closingTime: string
  latitude: string
  longitude: string
  coverImage: string | null
}

const emptySettings: FarmSettings = {
  farmName: "",
  description: "",
  phone: "",
  address: "",
  province: "",
  district: "",
  subdistrict: "",
  postalCode: "",
  openingTime: "08:00",
  closingTime: "18:00",
  latitude: "",
  longitude: "",
  coverImage: null,
}

export default function FarmSettingsPage() {
  const [settings, setSettings] = useState<FarmSettings>(emptySettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch("/api/farmer/settings")
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลฟาร์มได้")
      const json = await res.json()
      const data = json.data ?? json
      if (data) {
        setSettings({
          farmName: data.farmName ?? "",
          description: data.description ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          province: data.province ?? "",
          district: data.district ?? "",
          subdistrict: data.subdistrict ?? "",
          postalCode: data.postalCode ?? "",
          openingTime: data.openingTime ?? "08:00",
          closingTime: data.closingTime ?? "18:00",
          latitude: data.latitude != null ? String(data.latitude) : "",
          longitude: data.longitude != null ? String(data.longitude) : "",
          coverImage: data.coverImage ?? null,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = useCallback((lat: string, lng: string) => {
    update("latitude", lat)
    update("longitude", lng)
  }, [])

  async function handleSave() {
    if (!settings.farmName) return
    setSaving(true)
    setSaved(false)
    try {
      const body: Record<string, any> = {
        ...settings,
        latitude: settings.latitude !== "" ? parseFloat(settings.latitude) : null,
        longitude: settings.longitude !== "" ? parseFloat(settings.longitude) : null,
      }
      const res = await fetch("/api/farmer/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "บันทึกไม่สำเร็จ")
      // Refetch fresh data from API
      const freshRes = await fetch("/api/farmer/settings")
      if (freshRes.ok) {
        const freshJson = await freshRes.json()
        const freshData = freshJson.data ?? freshJson
        if (freshData) {
          setSettings({
            farmName: freshData.farmName ?? "",
            description: freshData.description ?? "",
            phone: freshData.phone ?? "",
            address: freshData.address ?? "",
            province: freshData.province ?? "",
            district: freshData.district ?? "",
            subdistrict: freshData.subdistrict ?? "",
            postalCode: freshData.postalCode ?? "",
            openingTime: freshData.openingTime ?? "08:00",
            closingTime: freshData.closingTime ?? "18:00",
            latitude: freshData.latitude != null ? String(freshData.latitude) : "",
            longitude: freshData.longitude != null ? String(freshData.longitude) : "",
            coverImage: freshData.coverImage ?? null,
          })
        }
      }
      setSaved(true)
      toast.success("บันทึกข้อมูลสำเร็จ")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    } finally {
      setSaving(false)
    }
  }

  function update(field: keyof Omit<FarmSettings, "coverImage">, value: string) {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ตั้งค่าฟาร์ม</h1>
        <p className="text-sm text-muted-foreground">จัดการข้อมูลและรูปภาพฟาร์มของคุณ</p>
      </div>

      {/* Farm Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4" />
            ข้อมูลฟาร์ม
          </CardTitle>
          <CardDescription>ข้อมูลพื้นฐานของฟาร์มของคุณ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="farmName">ชื่อฟาร์ม</Label>
            <Input
              id="farmName"
              value={settings.farmName}
              onChange={(e) => update("farmName", e.target.value)}
              placeholder="เช่น สวนเกษตรสุขใจ"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">คำอธิบายฟาร์ม</Label>
            <Textarea
              id="description"
              value={settings.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="แนะนำฟาร์มของคุณ..."
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
            <Input
              id="phone"
              value={settings.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="08X-XXX-XXXX"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="openingTime">เวลาเปิด</Label>
              <Input
                id="openingTime"
                type="time"
                value={settings.openingTime}
                onChange={(e) => update("openingTime", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="closingTime">เวลาปิด</Label>
              <Input
                id="closingTime"
                type="time"
                value={settings.closingTime}
                onChange={(e) => update("closingTime", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            ที่อยู่และแผนที่
          </CardTitle>
          <CardDescription>ที่ตั้งฟาร์มสำหรับการนัดรับสินค้า</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="address">ที่อยู่</Label>
            <Textarea
              id="address"
              value={settings.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="เลขที่ ถนน ตำบล อำเภอ จังหวัด"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="district">อำเภอ/เขต</Label>
              <Input
                id="district"
                value={settings.district}
                onChange={(e) => update("district", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="province">จังหวัด</Label>
              <Input
                id="province"
                value={settings.province}
                onChange={(e) => update("province", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="subdistrict">ตำบล/แขวง</Label>
              <Input
                id="subdistrict"
                value={settings.subdistrict}
                onChange={(e) => update("subdistrict", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="postalCode">รหัสไปรษณีย์</Label>
              <Input
                id="postalCode"
                value={settings.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
              />
            </div>
          </div>

          {/* Interactive Map */}
          <div>
            <p className="mb-2 text-sm font-medium">เลือกตำแหน่งฟาร์มบนแผนที่</p>
            <p className="mb-3 text-xs text-muted-foreground">คลิกบนแผนที่หรือลาก marker เพื่อเปลี่ยนพิกัด</p>
            <MapPicker
              latitude={settings.latitude}
              longitude={settings.longitude}
              onLocationSelect={handleLocationSelect}
            />
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div className="grid gap-1">
                <Label htmlFor="latitude" className="text-xs">ละติจูด</Label>
                <Input
                  id="latitude"
                  value={settings.latitude}
                  onChange={(e) => update("latitude", e.target.value)}
                  placeholder="13.736717"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="longitude" className="text-xs">ลองจิจูด</Label>
                <Input
                  id="longitude"
                  value={settings.longitude}
                  onChange={(e) => update("longitude", e.target.value)}
                  placeholder="100.523186"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farm Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImagePlus className="h-4 w-4" />
            รูปภาพฟาร์ม
          </CardTitle>
          <CardDescription>อัปโหลดรูปภาพฟาร์มของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Preview */}
            {settings.coverImage && (
              <div className="relative mx-auto h-48 w-full max-w-md overflow-hidden rounded-lg border">
                <img
                  src={settings.coverImage}
                  alt="รูปฟาร์ม"
                  className="h-full w-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => setSettings((s) => ({ ...s, coverImage: null }))}
                >
                  ลบ
                </Button>
              </div>
            )}

            {/* Upload */}
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <div>
                <ImagePlus className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">ลากและวางรูปภาพที่นี่</p>
                <p className="text-xs text-muted-foreground mb-3">หรือคลิกเพื่อเลือกไฟล์</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="farm-image-upload"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error("รูปภาพต้องมีขนาดไม่เกิน 10MB");
                      return;
                    }
                    setUploading(true);
                    const img = new Image();
                    img.onload = () => {
                      const canvas = document.createElement("canvas");
                      let w = img.width, h = img.height;
                      if (w > 800) { h = h * 800 / w; w = 800; }
                      canvas.width = w; canvas.height = h;
                      const ctx = canvas.getContext("2d")!;
                      ctx.drawImage(img, 0, 0, w, h);
                      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                      setSettings((s) => ({ ...s, coverImage: dataUrl }));
                      setUploading(false);
                      toast.success("อัปโหลดรูปภาพสำเร็จ");
                    };
                    img.onerror = () => { setUploading(false); toast.error("ไม่สามารถโหลดรูปภาพได้"); };
                    const reader = new FileReader();
                    reader.onload = (e) => { img.src = e.target?.result as string; };
                    reader.readAsDataURL(file);
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("farm-image-upload")?.click()}
                >
                  <ImagePlus className="h-4 w-4 mr-1" />
                  เลือกรูปภาพ
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              รองรับไฟล์ JPG, PNG, WebP ขนาดไม่เกิน 10MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving || !settings.farmName}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            "บันทึก"
          )}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            บันทึกสำเร็จ
          </span>
        )}
      </div>
    </div>
  )
}
