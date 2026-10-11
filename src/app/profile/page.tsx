"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  User,
  Mail,
  Shield,
  ShoppingCart,
  Heart,
  MessageCircle,
  LogOut,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { signOut } from "next-auth/react"

const ROLE_LABELS: Record<string, string> = {
  BUYER: "ผู้ซื้อ",
  FARMER: "เกษตรกร",
  ADMIN: "ผู้ดูแลระบบ",
}

export default function ProfilePage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-40" />
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <User className="mx-auto mb-4 h-16 w-16 text-gray-200" />
        <h2 className="mb-2 text-xl font-semibold">กรุณาเข้าสู่ระบบ</h2>
        <Link href="/login">
          <Button className="mt-4">เข้าสู่ระบบ</Button>
        </Link>
      </div>
    )
  }

  const user = session.user
  const name = user?.name ?? ""
  const email = user?.email ?? ""
  const image = (user as any)?.image ?? null
  const role = (user as any)?.role ?? ""
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??"

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> กลับหน้าแรก
      </Link>

      <h1 className="mb-6 text-2xl font-bold">โปรไฟล์</h1>

      {/* User Info */}
      <Card className="mb-6">
        <CardContent className="flex flex-col items-center p-6 sm:flex-row sm:items-start sm:gap-6">
          <Avatar className="mb-4 h-20 w-20 sm:mb-0">
            <AvatarImage src={image ?? undefined} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold">{name}</h2>
            <div className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
              <Mail className="h-3.5 w-3.5" />
              {email}
            </div>
            <div className="mt-1 flex items-center justify-center gap-2 text-sm sm:justify-start">
              <Shield className="h-3.5 w-3.5" />
              {ROLE_LABELS[role] || role}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">เมนูลัด</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {role === "FARMER" ? (
            <Link href="/farmer">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" /> จัดการฟาร์ม
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/buyer/orders">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" /> คำสั่งซื้อ
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" /> ตะกร้าสินค้า
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="w-full justify-start">
                  <Heart className="mr-2 h-4 w-4" /> สินค้า
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="mr-2 h-4 w-4" /> ข้อความ
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      <Separator className="mb-6" />

      <Button
        variant="outline"
        className="w-full text-destructive"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut className="mr-2 h-4 w-4" />
        ออกจากระบบ
      </Button>
    </div>
  )
}
