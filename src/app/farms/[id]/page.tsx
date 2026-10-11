"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Star,
  Clock,
  Phone,
  Mail,
  Heart,
  MessageCircle,
  Share2,
  Store,
  Package,
  Shield,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  BadgeCheck,
  ImageIcon,
  Users,
  Navigation,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, formatPrice, formatDate, formatDistance, calculateDistance } from "@/lib/utils";
import { useUserLocation } from "@/hooks/useUserLocation";
import type { FarmProfile, ProductCard, ReviewWithUser } from "@/types";

// ── Components ─────────────────────────────────────────
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i < Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400"
              : i < rating
              ? "fill-yellow-300 text-yellow-300"
              : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function ProductCardFarm({ product }: { product: ProductCard }) {
  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
        <div className="flex h-36 items-center justify-center bg-gradient-to-br from-green-100 to-green-50">
          {product.coverImage ? (
            <img src={product.coverImage} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-10 w-10 text-green-300" />
          )}
        </div>
        <CardContent className="space-y-1.5 p-3">
          <h3 className="line-clamp-1 text-sm font-semibold group-hover:text-green-600">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{Number((product as any).rating ?? 0).toFixed(1)}</span>
            </div>
            <span>ขายแล้ว {product.sold}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-green-700">{formatPrice(product.price)}</span>
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
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function FarmDetailPage() {
  const params = useParams();
  const router = useRouter();
  const farmId = params.id as string;

  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [togglingFollow, setTogglingFollow] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { userLocation } = useUserLocation();

  useEffect(() => {
    setLoading(true);
    // Check if user is following this farm
    fetch(`/api/farms/${farmId}/follow`, { method: "GET" })
      .then(r => r.ok ? r.json() : null)
      .then(followData => {
        if (followData?.data) {
          setIsFollowing(followData.data.following);
        }
      }).catch(() => {})

    Promise.all([
      fetch(`/api/farms/${farmId}`).then(r => r.ok ? r.json() : null),
    ]).then(([farmData]) => {
      if (farmData?.success && farmData?.data) {
        const d = farmData.data;
        setFarm({ ...d, images: d.farmImages ?? [] });
        setProducts(d.products ?? []);
        setReviews(d.reviews ?? []);
        setFollowers(d.followers ?? 0);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [farmId]);

  async function handleToggleFollow() {
    setTogglingFollow(true);
    try {
      const res = await fetch(`/api/farms/${farmId}/follow`, { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        setIsFollowing(json.data.following);
        setFollowers(json.data.followers);
      }
    } catch {}
    setTogglingFollow(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-56 w-full sm:h-72 lg:h-80" />
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-8 w-40" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Store className="h-16 w-16 text-gray-200" />
        <h2 className="text-xl font-semibold">ไม่พบฟาร์ม</h2>
        <Button onClick={() => router.push("/")}>กลับไปหน้าแรก</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Cover Image Header ─────────────────────── */}
      <div className="relative h-56 sm:h-72 lg:h-80">
        {farm?.coverImage ? (
          <img
            src={farm.coverImage}
            alt={farm.farmName}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-600 to-emerald-700">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Farm name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
          <div className="mx-auto flex max-w-7xl items-end gap-4">
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg sm:h-24 sm:w-24">
              <AvatarFallback className="bg-green-200 text-2xl text-green-800 sm:text-3xl">
                {farm.farmName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white drop-shadow-sm sm:text-3xl lg:text-4xl">
                  {farm.farmName}
                </h1>
                {farm.verified && (
                  <BadgeCheck className="h-6 w-6 text-blue-400 drop-shadow-sm" />
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/90">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{farm.province}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{Number(farm.ratingAverage).toFixed(1)} ({farm.totalReviews} รีวิว)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{followers} ผู้ติดตาม</span>
                  {userLocation && farm.latitude && farm.longitude && (
                    <span className="text-white/70 text-xs">
                      ({formatDistance(calculateDistance(userLocation.lat, userLocation.lng, farm.latitude, farm.longitude))} จากคุณ)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-green-600">หน้าแรก</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/farms" className="hover:text-green-600">ฟาร์ม</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900">{farm.farmName}</span>
        </nav>

        {/* ── Action Buttons ─────────────────────────── */}
        <div className="mb-8 flex flex-wrap gap-2 sm:gap-3">
          <Button
            variant={isFollowing ? "default" : "outline"}
            onClick={handleToggleFollow}
            disabled={togglingFollow}
            className="flex-1 sm:flex-none"
          >
            <Heart
              className={`mr-1.5 h-4 w-4 ${isFollowing ? "fill-white" : ""}`}
            />
            {isFollowing ? "กำลังติดตาม" : "ติดตาม"}
          </Button>
          <Link
            href={`/chat?farm=${farm.id}`}
            className={cn(buttonVariants({ variant: "outline" }), "flex-1 sm:flex-none")}
          >
            <MessageCircle className="mr-1.5 h-4 w-4" />
            พูดคุย
          </Link>
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Share2 className="mr-1.5 h-4 w-4" />
            แชร์
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── Left Column: Farm Info ──────────────── */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-1">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">เกี่ยวกับฟาร์ม</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-gray-600">
                  {farm.description}
                </p>
              </CardContent>
            </Card>

            {/* Contact & Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ข้อมูลติดต่อ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <div>
                    <p className="font-medium">ที่อยู่</p>
                    <p className="text-muted-foreground">{farm.address}</p>
                    {userLocation && farm.latitude && farm.longitude && (
                      <p className="text-[10px] text-green-600 font-medium mt-1">
                        {formatDistance(calculateDistance(userLocation.lat, userLocation.lng, farm.latitude, farm.longitude))} จากคุณ
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <div>
                    <p className="font-medium">เบอร์โทรศัพท์</p>
                    <p className="text-muted-foreground">{farm.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <div>
                    <p className="font-medium">เวลาทำการ</p>
                    <p className="text-muted-foreground">
                      {farm.openingTime} - {farm.closingTime} น.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Right Column ────────────────────────── */}
          <div className="space-y-8 lg:col-span-2">
            {/* Map */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ที่ตั้งฟาร์ม</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden rounded-lg">
                {farm.latitude && farm.longitude ? (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${farm.latitude},${farm.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="relative h-64 w-full">
                      <iframe
                        title="OpenStreetMap"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${farm.longitude - 0.02},${farm.latitude - 0.02},${farm.longitude + 0.02},${farm.latitude + 0.02}&layer=mapnik&marker=${farm.latitude},${farm.longitude}`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-transparent" />
                    </div>
                  </a>
                ) : (
                  <div className="flex h-64 items-center justify-center bg-gradient-to-br from-green-200 to-green-100">
                    <div className="text-center">
                      <MapPin className="mx-auto mb-2 h-10 w-10 text-green-500" />
                      <p className="text-sm font-medium text-green-800">{farm.farmName}</p>
                      <p className="text-xs text-green-600">ไม่ระบุพิกัด</p>
                    </div>
                  </div>
                )}
                <div className="border-t p-3 text-center">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${farm.latitude},${farm.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "")}
                  >
                    <Navigation className="mr-1.5 h-3.5 w-3.5" />
                    นำทางไปสวน
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Gallery */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ภาพถ่ายฟาร์ม</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(farm.images ?? []).map((img: any, i: number) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(i)}
                      className={`flex aspect-square items-center justify-center overflow-hidden rounded-lg border-2 transition-all ${
                        selectedImage === i
                          ? "border-green-500"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {img.imageUrl ? (
                        <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <ImageIcon className="h-8 w-8 text-gray-300" />
                          <span className="mt-1 text-xs text-gray-400">รูป {i + 1}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  สินค้าทั้งหมด ({products.length})
                </h2>
                <Link
                  href={`/products?farm=${farm.id}`}
                  className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-500"
                >
                  ดูทั้งหมด <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCardFarm key={product.id} product={product} />
                ))}
              </div>
            </section>

            {/* Reviews */}
            <section>
              <Tabs defaultValue="reviews">
                <TabsList className="w-full justify-start border-b bg-transparent p-0 overflow-x-auto">
                  <TabsTrigger
                    value="reviews"
                    className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-green-600 data-[state=active]:bg-transparent"
                  >
                    รีวิว ({reviews.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="reviews" className="mt-6">
                  <div className="space-y-4">
                    {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                      <div key={review.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-green-100 text-xs text-green-700">
                                {review.buyer.firstName.charAt(0)}{review.buyer.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {review.buyer.firstName} {review.buyer.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(review.createdAt)}
                              </p>
                            </div>
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                        {review.comment && (
                          <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                        )}
                      </div>
                    ))}
                    {reviews.length > 3 && (
                      <div className="text-center pt-2">
                        <button
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          className="text-sm font-medium text-green-600 hover:text-green-500 transition-colors"
                        >
                          {showAllReviews ? "แสดงน้อยลง" : `ดูรีวิวทั้งหมด (${reviews.length})`}
                        </button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
