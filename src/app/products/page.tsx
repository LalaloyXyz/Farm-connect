"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Star,
  Grid3X3,
  List,
  Map,
  Package,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice, cn } from "@/lib/utils";
import { SORT_OPTIONS, DISTANCE_OPTIONS } from "@/constants";
import type { ProductCard, PaginatedResponse } from "@/types";

// ── Types ──────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Filters {
  q: string;
  category: string;
  province: string;
  minPrice: number;
  maxPrice: number;
  maxDistance: number;
  minRating: number;
  pickupOnly: boolean;
  deliveryOnly: boolean;
  sort: string;
  page: number;
}

type ViewMode = "grid" | "list" | "map";

// ── Helpers ────────────────────────────────────────────
function calcDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
function distText(m: number) { return m < 1000 ? `${Math.round(m)} ม.` : `${(m / 1000).toFixed(1)} กม.` }

// ── Product Card ───────────────────────────────────────
function ProductCardGrid({ product, userLoc: ul }: { product: ProductCard; userLoc?: {lat: number; lng: number} | null }) {
  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group h-full overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
        <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-green-100 to-green-50">
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
              <span>{Number(product.rating).toFixed(1)}</span>
            </div>
            <span>ขายแล้ว {product.sold}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-green-700">{formatPrice(product.price)}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {ul && product.farm.latitude && product.farm.longitude && (
                <span className="text-[10px] text-green-600 font-medium">
                  {distText(calcDist(ul.lat, ul.lng, product.farm.latitude, product.farm.longitude))}
                </span>
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

function ProductCardList({ product, userLoc: ul }: { product: ProductCard; userLoc?: {lat: number; lng: number} | null }) {
  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
        <div className="flex flex-col sm:flex-row">
          <div className="flex h-32 w-full shrink-0 items-center justify-center bg-gradient-to-br from-green-100 to-green-50 sm:w-40">
            {product.coverImage ? (
              <img src={product.coverImage} alt={product.name} className="h-full w-full object-cover" />
            ) : (
            <Package className="h-10 w-10 text-green-300" />
            )}
          </div>
          <CardContent className="flex flex-1 flex-col justify-between gap-2 p-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{product.farm.farmName}</p>
                  <h3 className="text-base font-semibold group-hover:text-green-600">{product.name}</h3>
                </div>
                <div className="flex gap-1">
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
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{Number(product.rating).toFixed(1)}</span>
                </div>
                <span>ขายแล้ว {product.sold} ชิ้น</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{product.farm.province}</span>
                </div>
                {ul && product.farm.latitude && product.farm.longitude && (
                  <span className="text-[10px] text-green-600 font-medium">
                    {distText(calcDist(ul.lat, ul.lng, product.farm.latitude, product.farm.longitude))}
                  </span>
                )}
                <Badge variant="outline" className="text-[10px]">
                  {product.category.name}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-green-700">{formatPrice(product.price)}</span>
              <Button size="sm" variant="outline" className="rounded-full">
                <ShoppingCart className="mr-1 h-3.5 w-3.5" /> เพิ่มในตะกร้า
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

function ProductCardMap({ product }: { product: ProductCard }) {
  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
        <CardContent className="flex items-center gap-3 p-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-50">
            <Package className="h-6 w-6 text-green-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{product.name}</h3>
            <p className="text-xs text-muted-foreground">{product.farm.farmName}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="font-bold text-green-700">{formatPrice(product.price)}</span>
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{Number(product.rating).toFixed(1)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Loading & Empty States ─────────────────────────────
function ProductGridSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="h-40 w-full rounded-t-lg" />
          <CardContent className="space-y-2 p-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function ProductListSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <div className="flex flex-col sm:flex-row">
            <Skeleton className="h-32 w-full shrink-0 sm:w-40" />
            <CardContent className="flex-1 space-y-2 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-6 w-24" />
            </CardContent>
          </div>
        </Card>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <Package className="mb-4 h-16 w-16 text-gray-200" />
      <h3 className="text-lg font-semibold text-gray-900">ไม่พบสินค้า</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองของคุณ
      </p>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => window.location.href = "/products"}
      >
        ล้างตัวกรองทั้งหมด
      </Button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userLoc, setUserLoc] = useState<{lat: number; lng: number} | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 5000 }
      )
    }
  }, [])

  const [filters, setFilters] = useState<Filters>({
    q: searchParams.get("q") || "",
    category: searchParams.get("category") || "",
    province: searchParams.get("province") || "",
    minPrice: Number(searchParams.get("minPrice")) || 0,
    maxPrice: Number(searchParams.get("maxPrice")) || 5000,
    maxDistance: Number(searchParams.get("maxDistance")) || 0,
    minRating: Number(searchParams.get("minRating")) || 0,
    pickupOnly: searchParams.get("pickupOnly") === "true",
    deliveryOnly: searchParams.get("deliveryOnly") === "true",
    sort: searchParams.get("sort") || "newest",
    page: Number(searchParams.get("page")) || 1,
  });

  // Load categories and provinces
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.data) setCategories(data.data);
      })
      .catch(() => {});
    fetch("/api/farms?limit=100")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        const farms = data?.data?.farms ?? data?.data ?? []
        const unique = [...new Set(farms.map((f: any) => f.province).filter(Boolean))]
        setProvinces(unique as string[])
      })
      .catch(() => {});
  }, []);

  // Load products
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("categoryId", filters.category);
    if (filters.province) params.set("province", filters.province);
    if (filters.minPrice > 0) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice < 5000) params.set("maxPrice", String(filters.maxPrice));
    // maxDistance is handled client-side
    if (filters.minRating > 0) params.set("minRating", String(filters.minRating));
    if (filters.pickupOnly) params.set("pickupOnly", "true");
    if (filters.deliveryOnly) params.set("deliveryOnly", "true");
    params.set("sort", filters.sort);
    params.set("page", String(filters.page));
    params.set("limit", "12");

    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          const result = data.data ?? data;
          let list = result?.products ?? result ?? [];
          // Client-side distance filter
          if (userLoc && filters.maxDistance > 0) {
            list = list.filter((p: any) => {
              if (!p.farm?.latitude || !p.farm?.longitude) return false;
              const d = calcDist(userLoc.lat, userLoc.lng, p.farm.latitude, p.farm.longitude);
              return d <= filters.maxDistance * 1000;
            });
          }
          setProducts(list);
          setTotalPages(result?.totalPages ?? 1);
          setTotal(result?.total ?? 0);
        } else {
          setProducts([]);
          setTotalPages(1);
          setTotal(0);
        }
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [filters, userLoc]);

  const updateFilter = useCallback(
    (key: keyof Filters, value: string | number | boolean) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
        page: key === "page" ? (value as number) : 1,
      }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({
      q: "",
      category: "",
      province: "",
      minPrice: 0,
      maxPrice: 5000,
      maxDistance: 0,
      minRating: 0,
      pickupOnly: false,
      deliveryOnly: false,
      sort: "newest",
      page: 1,
    });
  }, []);

  const hasActiveFilters =
    filters.category !== "" ||
    filters.province !== "" ||
    filters.minPrice > 0 ||
    filters.maxPrice < 5000 ||
    filters.maxDistance > 0 ||
    filters.minRating > 0 ||
    filters.pickupOnly ||
    filters.deliveryOnly;

  // ── Filter Sidebar Content ─────────────────────────
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">หมวดหมู่</h4>
        <div className="space-y-2">
          <Label
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              filters.category === "" ? "bg-green-50 text-green-700 font-medium" : "hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="category"
              checked={filters.category === ""}
              onChange={() => updateFilter("category", "")}
              className="sr-only"
            />
            ทั้งหมด
          </Label>
          {categories.map((cat) => (
            <Label
              key={cat.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                filters.category === cat.id ? "bg-green-50 text-green-700 font-medium" : "hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="category"
                checked={filters.category === cat.id}
                onChange={() => updateFilter("category", cat.id)}
                className="sr-only"
              />
              {cat.name}
            </Label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Province */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">จังหวัด</h4>
        <Select
          value={filters.province}
          onValueChange={(value) => updateFilter("province", value ?? "")}
        >
          <SelectTrigger>
            <SelectValue placeholder="ทุกจังหวัด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">ทุกจังหวัด</SelectItem>
            {provinces.map((prov) => (
              <SelectItem key={prov} value={prov}>{prov}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">ช่วงราคา</h4>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="ต่ำสุด"
            value={filters.minPrice || ""}
            onChange={(e) => updateFilter("minPrice", Number(e.target.value) || 0)}
            className="h-9 text-sm"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="สูงสุด"
            value={filters.maxPrice >= 5000 ? "" : filters.maxPrice}
            onChange={(e) => updateFilter("maxPrice", Number(e.target.value) || 5000)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      <Separator />

      {/* Distance */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">ระยะทาง</h4>
        <Select
          value={String(filters.maxDistance)}
          onValueChange={(value) => updateFilter("maxDistance", Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="เลือกระยะทาง" />
          </SelectTrigger>
          <SelectContent>
            {DISTANCE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Rating */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">คะแนนขั้นต่ำ</h4>
        <div className="flex flex-wrap gap-1.5">
          {[0, 1, 2, 3, 4].map((star) => (
            <Button
              key={star}
              variant={filters.minRating === star ? "default" : "outline"}
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={() => updateFilter("minRating", star)}
            >
              {star === 0 ? "ทั้งหมด" : (
                <span className="inline-flex items-center gap-1">
                  <span>{star}</span>
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Delivery / Pickup */}
      <div>
        <h4 className="mb-3 text-sm font-semibold">รูปแบบการรับสินค้า</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="pickup"
              checked={filters.pickupOnly}
              onCheckedChange={(checked) =>
                updateFilter("pickupOnly", checked === true)
              }
            />
            <Label htmlFor="pickup" className="cursor-pointer text-sm">
              รับที่สวน
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="delivery"
              checked={filters.deliveryOnly}
              onCheckedChange={(checked) =>
                updateFilter("deliveryOnly", checked === true)
              }
            />
            <Label htmlFor="delivery" className="cursor-pointer text-sm">
              ส่งถึงบ้าน
            </Label>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" className="w-full text-sm" onClick={clearFilters}>
          ล้างตัวกรองทั้งหมด
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="ค้นหาสินค้า..."
                value={filters.q}
                onChange={(e) => updateFilter("q", e.target.value)}
                className="w-full rounded-full bg-white pl-9 pr-4"
              />
            </div>
            {/* Mobile filter trigger */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger>
                <div className="inline-flex shrink-0 items-center justify-center rounded-lg border p-2 text-muted-foreground hover:bg-accent lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>ตัวกรอง</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-6">
          {/* ── Desktop Filter Sidebar ─────────────── */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-20 rounded-xl border bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">ตัวกรอง</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-green-600" onClick={clearFilters}>
                    ล้างทั้งหมด
                  </Button>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* ── Main Content ──────────────────────── */}
          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  พบ {total} สินค้า
                </span>
                {filters.q && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    ค้นหา: {filters.q}
                    <button onClick={() => updateFilter("q", "")}>
                      <X className="ml-1 h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Sort */}
                <Select
                  value={filters.sort}
                  onValueChange={(value) => updateFilter("sort", value ?? "newest")}
                >
                  <SelectTrigger className="h-9 w-36 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View mode toggle */}
                <div className="hidden items-center rounded-md border sm:flex">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-9 w-9 rounded-r-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-9 w-9 rounded-none border-x"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-9 w-9 rounded-l-none"
                    onClick={() => setViewMode("map")}
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              viewMode === "grid" ? (
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  <ProductGridSkeleton />
                </div>
              ) : viewMode === "list" ? (
                <div className="space-y-4">
                  <ProductListSkeleton />
                </div>
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  กำลังโหลดแผนที่...
                </Card>
              )
            ) : products.length === 0 ? (
              <EmptyState />
            ) : viewMode === "grid" ? (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCardGrid key={product.id} product={product} userLoc={userLoc} />
                ))}
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-3">
                {products.map((product) => (
                  <ProductCardList key={product.id} product={product} userLoc={userLoc} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <ProductCardMap key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={filters.page <= 1}
                  onClick={() => updateFilter("page", filters.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - filters.page) <= 1
                  )
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={filters.page === p ? "default" : "outline"}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updateFilter("page", p)}
                      >
                        {p}
                      </Button>
                    </span>
                  ))}
                <Button
                  variant="outline"
                  size="icon"
                  disabled={filters.page >= totalPages}
                  onClick={() => updateFilter("page", filters.page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">กำลังโหลด...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
