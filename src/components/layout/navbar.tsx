"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Bell,
  MessageCircle,
  Menu,
  User,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

const NAV_LINKS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/products", label: "สินค้า" },
  { href: "/farms", label: "สวน" },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const { cartItemCount } = useCart();
  const pathname = usePathname();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ type: string; id: string; name: string; subtitle: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions from products + farms APIs
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSuggestions([]); return }
    clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const [prodRes, farmRes] = await Promise.all([
          fetch(`/api/products?q=${encodeURIComponent(searchQuery.trim())}&limit=3&sort=popular`),
          fetch(`/api/farms?q=${encodeURIComponent(searchQuery.trim())}&limit=3&sort=popular`),
        ])
        const prodData = await prodRes.json(), farmData = await farmRes.json()
        const items: { type: string; id: string; name: string; subtitle: string }[] = []
        const prods = prodData?.data?.products ?? prodData?.data ?? []
        const farms = farmData?.data?.farms ?? farmData?.data ?? []
        prods.forEach((p: any) => items.push({ type: "product", id: p.slug, name: p.name, subtitle: p.farm?.farmName || "" }))
        farms.forEach((f: any) => items.push({ type: "farm", id: f.id, name: f.farmName, subtitle: f.province || "" }))
        setSuggestions(items.slice(0, 6))
        setShowSuggestions(items.length > 0)
      } catch {}
    }, 200)
  }, [searchQuery])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Hide navbar on farmer and admin dashboard pages (they have their own sidebar)
  if (pathname.startsWith("/farmer") || pathname.startsWith("/admin")) {
    return null;
  }

  const isAuthenticated = status === "authenticated";
  const unreadNotifications = 0;
  const unreadMessages = 0;
  const user = session?.user;
  const userName = user?.name ?? "";
  const userAvatar = (user as any)?.image ?? null;
  const userInitials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-green-700 bg-green-600 shadow-lg">
      {/* Desktop */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-6">
        {/* Mobile menu trigger */}
        <Sheet>
          <SheetTrigger aria-label="เปิดเมนู">
            <div className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-white/80 hover:bg-green-500 hover:text-white lg:hidden">
              <Menu className="size-5" strokeWidth={2.5} />
            </div>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-4 py-4">
                <Link
                  href="/"
                  className="text-xl font-bold text-green-600"
                >
                  FarmConnect
                </Link>
              </div>
              <nav className="flex-1 space-y-1 px-3 py-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "bg-green-50 text-green-700"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-3" />
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                    >
                      <User className="size-4" strokeWidth={2.5} />
                      โปรไฟล์
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="size-4" strokeWidth={2.5} />
                      ออกจากระบบ
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 px-3">
                    <Link href="/login">
                      <Button variant="outline" className="w-full">
                        เข้าสู่ระบบ
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full">สมัครสมาชิก</Button>
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="shrink-0 text-xl font-bold text-white">
          FarmConnect
        </Link>

        {/* Desktop search */}
        <div ref={searchRef} className="relative hidden flex-1 lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="ค้นหาสินค้าหรือฟาร์ม..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                setShowSuggestions(false)
                window.location.href = `/products?q=${encodeURIComponent(searchQuery.trim())}`
              }
            }}
            className="w-full rounded-full bg-gray-50 pl-9 pr-4"
          />
          {showSuggestions && (
            <div className="absolute top-full mt-1 w-full rounded-lg border bg-white py-1 shadow-lg z-50">
              {suggestions.map((s, i) => (
                <a
                  key={`${s.type}-${s.id}-${i}`}
                  href={s.type === "farm" ? `/farms/${s.id}` : `/products/${s.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs text-muted-foreground shrink-0 w-12">{s.type === "farm" ? "🏡" : "📦"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.subtitle}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-green-700 text-white"
                  : "text-white/80 hover:bg-green-500 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="ค้นหา"
          >
            <Search className="size-5" strokeWidth={2.5} />
          </Button>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white"
              >
                <Link href="/notifications" aria-label="การแจ้งเตือน">
                  <Bell className="size-5" strokeWidth={2.5} />
                  {unreadNotifications > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
                    >
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </Badge>
                  )}
                </Link>
              </Button>

              {/* Messages */}
              <Button variant="ghost" size="icon" className="relative text-white">
                <Link href="/chat" aria-label="ข้อความ">
                  <MessageCircle className="size-5" strokeWidth={2.5} />
                  {unreadMessages > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
                    >
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </Badge>
                  )}
                </Link>
              </Button>

              {/* Cart */}
              <Button variant="ghost" size="icon" className="relative text-white">
                <Link href="/cart" aria-label="ตะกร้าสินค้า">
                  <ShoppingCart className="size-5" strokeWidth={2.5} />
                  {cartItemCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
                    >
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="ml-1 inline-flex shrink-0 items-center justify-center rounded-full p-0.5 hover:bg-accent"
                  aria-label="เมนูผู้ใช้"
                >
                  <Avatar size="sm">
                    {userAvatar ? (
                      <AvatarImage src={userAvatar} alt={userName} />
                    ) : null}
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-56"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {userName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user?.email}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="size-4" strokeWidth={2.5} />
                      โปรไฟล์
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                  >
                    <LogOut className="size-4" strokeWidth={2.5} />
                    ออกจากระบบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="outline" size="sm">
                  เข้าสู่ระบบ
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">สมัครสมาชิก</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="border-t px-4 pb-3 pt-2 lg:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="ค้นหาสินค้าหรือฟาร์ม..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  setShowSuggestions(false)
                  window.location.href = `/products?q=${encodeURIComponent(searchQuery.trim())}`
                }
              }}
              className="w-full rounded-full bg-gray-50 pl-9 pr-4"
              autoFocus
            />
          </div>
          {showSuggestions && (
            <div className="relative mt-1 rounded-lg border bg-white py-1 shadow-lg">
              {suggestions.map((s, i) => (
                <a
                  key={`m-${s.type}-${s.id}-${i}`}
                  href={s.type === "farm" ? `/farms/${s.id}` : `/products/${s.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs shrink-0 w-12">{s.type === "farm" ? "🏡" : "📦"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.subtitle}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
