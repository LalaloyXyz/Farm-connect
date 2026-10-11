"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  House,
  Search,
  Bell,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";

const GUEST_LINKS = [
  { href: "/", label: "หน้าแรก", icon: House },
  { href: "/products", label: "ค้นหา", icon: Search },
  { href: "/login", label: "โปรไฟล์", icon: User },
];

const AUTH_LINKS = [
  { href: "/", label: "หน้าแรก", icon: House },
  { href: "/products", label: "ค้นหา", icon: Search },
  { href: "/notifications", label: "แจ้งเตือน", icon: Bell },
  { href: "/profile", label: "โปรไฟล์", icon: User },
];

export function MobileNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isAuthenticated = status === "authenticated";

  // Hide mobile nav on farmer and admin dashboard pages
  if (pathname.startsWith("/farmer") || pathname.startsWith("/admin")) {
    return null;
  }

  const links = isAuthenticated ? AUTH_LINKS : GUEST_LINKS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-green-700 bg-green-600 lg:hidden">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-white font-semibold"
                  : "text-white/70 hover:text-white"
              )}
            >
              <span className="relative">
                <Icon className="size-5" strokeWidth={2.5} />
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
