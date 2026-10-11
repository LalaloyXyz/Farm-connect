"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Sparkles,
  MapPin,
  Star,
  ChevronRight,
  Truck,
  Store,
  Package,
  ArrowRight,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice, formatDistance, calculateDistance, cn } from "@/lib/utils";
import FarmsSection from "@/components/farms-section";
import type { ProductCard, FarmProfile } from "@/types";

// ── Types ──────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  imageUrl: string | null;
}

// ── Components ─────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <Card className="w-full">
      <Skeleton className="h-40 w-full rounded-t-lg" />
      <CardContent className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}

function FarmCardSkeleton() {
  return (
    <Card className="w-[200px] shrink-0">
      <Skeleton className="h-28 w-full rounded-t-lg" />
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </CardContent>
    </Card>
  );
}

function ProductCardItem({ product, userLoc }: { product: ProductCard; userLoc?: {lat: number; lng: number} | null }) {
  const farmRating = product.rating
  const dist = userLoc && product.farm.latitude && product.farm.longitude
    ? calculateDistance(userLoc.lat, userLoc.lng, product.farm.latitude, product.farm.longitude)
    : null
  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 p-0">
        <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-green-100 to-green-50 overflow-hidden rounded-t-2xl">
          {product.coverImage ? (
            <img src={product.coverImage} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-12 w-12 text-green-300" />
          )}
          <div className="absolute right-2 top-2 flex flex-col gap-1">
            {product.pickupAvailable && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">
                รับที่สวน
              </Badge>
            )}
            {product.deliveryAvailable && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-[10px]">
                ส่งถึงบ้าน
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="space-y-1.5 p-3">
          <p className="text-xs text-muted-foreground">{product.farm.farmName}</p>
          <h3 className="line-clamp-1 text-sm font-semibold">{product.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{Number(farmRating).toFixed(1)}</span>
            </div>
            <span>|</span>
            <span>ขายแล้ว {product.sold} {product.unit === "kg" ? "กก." : product.unit === "ถุง" ? "ถุง" : product.unit === "ขวด" ? "ขวด" : "ชิ้น"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-green-700">{formatPrice(product.price)}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {dist != null && (
                <span className="text-[10px] text-green-600 font-medium">{formatDistance(dist)}</span>
              )}
              {product.farm.province && (
                <>
                  <MapPin className="h-3 w-3" />
                  <span>{product.farm.province}</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function FarmCardItem({ farm }: { farm: FarmProfile }) {
  return (
    <Link href={`/farms/${farm.id}`}>
      <Card className="group w-[200px] shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
        <div className="flex h-28 items-center justify-center bg-gradient-to-br from-green-200 to-emerald-100">
          {farm.coverImage ? (
            <img src={farm.coverImage} alt={farm.farmName} className="h-full w-full object-cover" />
          ) : (
            <Store className="h-10 w-10 text-green-400" />
          )}
        </div>
        <CardContent className="space-y-1.5 p-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-green-100 text-xs text-green-700">
                {farm.farmName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold">{farm.farmName}</h3>
            </div>
            {farm.verified && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] px-1.5">
                Verified
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{Number(farm.ratingAverage).toFixed(1)}</span>
            </div>
            <span>({farm.totalReviews})</span>
            <MapPin className="ml-1 h-3 w-3" />
            <span className="truncate">{farm.province}</span>
            {(farm as any).distance != null && (
              <span className="ml-auto text-[10px] text-green-600 font-medium">
                {(farm as any).distance < 1000
                  ? `${Math.round((farm as any).distance)} ม.`
                  : `${((farm as any).distance / 1000).toFixed(1)} กม.`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Main Page ──────────────────────────────────────────

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [farms, setFarms] = useState<FarmProfile[]>([]);
  const [nearbyFarms, setNearbyFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);

  // Request user location on mount, then load data
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { loadAllData(null) }, // permission denied — load without location
        { enableHighAccuracy: false, timeout: 5000 }
      )
    } else {
      loadAllData(null)
    }
  }, [])

  // Load data whenever userLocation changes
  useEffect(() => {
    loadAllData(userLocation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation])

  async function loadAllData(location: {lat: number; lng: number} | null) {
      try {
        const nearbyUrl = location
          ? `/api/farms?limit=6&sort=nearby&lat=${location.lat}&lng=${location.lng}`
          : "/api/farms?limit=6&sort=popular"
        const [catRes, prodRes, farmRes, nearbyRes] = await Promise.all([
          fetch("/api/categories").catch(() => null),
          fetch("/api/products?limit=8&sort=popular").catch(() => null),
          fetch("/api/farms?limit=6&sort=popular").catch(() => null),
          fetch(nearbyUrl).catch(() => null),
        ]);

        if (catRes?.ok) {
          const catData = await catRes.json();
          setCategories(catData.data ?? catData ?? []);
        }

        if (prodRes?.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.data?.products ?? prodData.data ?? prodData ?? []);
        }

        if (farmRes?.ok) {
          const farmData = await farmRes.json();
          setFarms(farmData.data?.farms ?? farmData.data ?? farmData ?? []);
        }

        if (nearbyRes?.ok) {
          const nearbyData = await nearbyRes.json();
          setNearbyFarms(nearbyData.data?.farms ?? nearbyData.data ?? nearbyData ?? []);
        } else {
          // Fallback to popular farms if nearby fails
          setNearbyFarms([]);
        }
      } catch {
        // API failed — keep state as empty arrays
      } finally {
        setLoading(false);
      }
    }

  return (
    <div className="min-h-screen">
      {/* ── Hero Banner ─────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        <div className="absolute inset-0">
          <Image src="/banner.png" alt="" fill className="object-cover" priority sizes="100vw" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/5" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Leaf className="h-6 w-6 text-white/70" />
            <span className="text-sm font-medium text-white/90 tracking-wider uppercase">
              สดจากสวน ส่งถึงบ้านคุณ
            </span>
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl drop-shadow-lg">
            สินค้าเกษตรคุณภาพดี
            <br />
            <span className="text-yellow-300 drop-shadow-md">จากเกษตรกรไทย</span>
          </h1>
          <p className="mx-auto mb-8 max-w-lg text-base text-white/80 leading-relaxed sm:text-lg">
            เลือกซื้อผักสด ผลไม้ตามฤดูกาล และสินค้าเกษตรคุณภาพสูง
            ส่งตรงจากฟาร์มถึงมือคุณ
          </p>

          {/* Search bar */}
          <div className="mx-auto max-w-xl">
            <div className="flex items-center gap-2 rounded-full bg-white p-1 shadow-lg">
              <div className="flex flex-1 items-center gap-2 pl-4">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="ค้นหาสินค้าหรือฟาร์ม..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      window.location.href = `/products?q=${encodeURIComponent(searchQuery.trim())}`
                    }
                  }}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <Button
                type="button"
                className="rounded-full bg-green-600 px-4 py-2.5 text-sm hover:bg-green-700 min-h-11"
                onClick={() => {
                  if (searchQuery.trim()) {
                    window.dispatchEvent(new CustomEvent("ai-search", { detail: searchQuery.trim() }))
                  }
                }}
              >
                <Sparkles className="mr-1 h-4 w-4" />
                AI Search
              </Button>
            </div>
          </div>

        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">

        
        <FarmsSection farms={farms} nearbyFarms={nearbyFarms} loading={loading} userLocation={userLocation} />

{/* ── Recommended Products ──────────────────── */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">สินค้าแนะนำ</h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-500"
            >
              ดูทั้งหมด <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : products.length > 0
                ? products.map((product) => (
                    <ProductCardItem key={product.id} product={product} userLoc={userLocation} />
                  ))
                : <p className="col-span-full py-8 text-center text-muted-foreground">ยังไม่มีสินค้าแนะนำในขณะนี้</p>}
          </div>
        </section>

              </div>
    </div>
  );
}
