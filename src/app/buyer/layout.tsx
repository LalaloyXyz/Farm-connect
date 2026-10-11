"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ShoppingCart,
  Star,
  Menu,
  X,
  LogOut,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { signOut, useSession } from "next-auth/react"

const sidebarLinks = [
  { label: "คำสั่งซื้อ", href: "/buyer/orders", icon: ShoppingCart },
  { label: "รีวิว", href: "/buyer/reviews", icon: Star },
]

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: session } = useSession()
  const displayName = session?.user?.name || "ผู้ซื้อ"
  const userImage = session?.user?.image || ""
  const initials = displayName.slice(0, 2).toUpperCase()

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 px-3">
      {sidebarLinks.map((link) => {
        const isActive = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <User className="h-5 w-5 text-primary" />
          <span className="text-base font-semibold">บัญชีของฉัน</span>
        </div>

        <div className="flex items-center gap-3 border-b p-4">
          <Avatar className="h-9 w-9">
            <AvatarImage src={userImage} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground">ผู้บริโภค</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          <NavLinks />
        </div>

        <div className="border-t p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </Button>
        </div>
      </aside>

      {/* Mobile header & drawer */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger>
              <div className="inline-flex shrink-0 items-center justify-center rounded-lg border p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                <Menu className="h-5 w-5" />
                <span className="sr-only">เปิดเมนู</span>
              </div>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <div className="flex h-14 items-center justify-between border-b px-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <span className="text-base font-semibold">บัญชีของฉัน</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3 border-b p-4">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userImage} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground">ผู้บริโภค</p>
                </div>
              </div>
              <div className="py-3">
                <NavLinks />
              </div>
              <div className="border-t p-3">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="h-4 w-4" />
                  ออกจากระบบ
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-medium text-sm">บัญชีของฉัน</span>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
