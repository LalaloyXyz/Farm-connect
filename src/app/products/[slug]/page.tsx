"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Star,
  MapPin,
  Clock,
  MessageCircle,
  Sparkles,
  Minus,
  Plus,
  ShoppingCart,
  ChevronRight,
  Truck,
  Store,
  Package,
  Check,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Loader2,
  Navigation,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDate, formatDistance, calculateDistance, cn } from "@/lib/utils";
import { useUserLocation } from "@/hooks/useUserLocation";
import type { ProductCard } from "@/types";

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

function ReviewList({ reviews }: { reviews: any[] }) {
  const [showAll, setShowAll] = useState(false);
  const display = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="space-y-3">
      {display.map((review: any) => (
        <div key={review.id} className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-green-100 text-xs text-green-700">
                  {(review.buyer?.firstName?.[0] || "") + (review.buyer?.lastName?.[0] || "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {review.buyer?.firstName || "ผู้ซื้อ"} {review.buyer?.lastName || ""}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
              </div>
            </div>
            <StarRating rating={review.rating} />
          </div>
          {review.comment && (
            <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
          )}
          {review.farmerReply && (
            <div className="ml-4 mt-2 rounded-lg bg-green-50 p-2 text-sm">
              <p className="text-xs font-medium text-green-700">ฟาร์มตอบกลับ:</p>
              <p className="mt-0.5 text-gray-600">{review.farmerReply}</p>
            </div>
          )}
        </div>
      ))}
      {reviews.length > 3 && (
        <div className="text-center pt-2">
          <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
            {showAll ? "แสดงน้อยลง" : `ดูรีวิวทั้งหมด (${reviews.length})`}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const { userLocation } = useUserLocation();

  const { addToCart } = useCart();
  const { data: session } = useSession();
  const [addingToCart, setAddingToCart] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.data) {
          setProduct(data.data);
          // Fetch related products from same category
          if (data.data.category?.id) {
            fetch(`/api/products?categoryId=${data.data.category.id}&limit=4&sort=newest`)
              .then(r => r.ok ? r.json() : null)
              .then(related => {
                if (related?.data?.products) {
                  setRelatedProducts(
                    related.data.products.filter((p: any) => p.id !== data.data.id).slice(0, 4)
                  );
                }
              })
              .catch(() => {});
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setProduct(null);
        setLoading(false);
      });
  }, [slug]);

  const handleAISummary = useCallback(async () => {
    if (!product || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `สินค้า: ${product.name}\nราคา: ${product.price} บาท\nคำอธิบาย: ${product.description || "ไม่มี"}\nฟาร์ม: ${product.farm?.farmName || "ไม่ระบุ"}\n\nช่วยสรุปข้อมูลสินค้านี้ให้หน่อย`
          }],
        }),
      });
      const data = await res.json();
      if (data?.data?.reply) {
        setAiSummary(data.data.reply);
        toast.success("สรุปสินค้าโดย AI เรียบร้อย");
      }
    } catch {}
    setAiLoading(false);
  }, [product, aiLoading]);

  const handleAddToCart = useCallback(async () => {
    if (!product || !session) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      toast.success(`เพิ่ม "${product.name}" ในตะกร้าแล้ว`);
    } catch {
      toast.error("ไม่สามารถเพิ่มสินค้าในตะกร้าได้");
    } finally {
      setAddingToCart(false);
    }
  }, [product, quantity, addToCart, session, router]);

  const handleBuyNow = useCallback(async () => {
    if (!product) return;
    if (!session) {
      router.push("/login?callbackUrl=" + encodeURIComponent("/cart"));
      return;
    }
    try {
      await addToCart(product.id, quantity);
      router.push("/cart");
    } catch {
      toast.error("ไม่สามารถเพิ่มสินค้าในตะกร้าได้");
    }
  }, [product, quantity, addToCart, session, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Package className="h-16 w-16 text-gray-200" />
        <h2 className="text-xl font-semibold">ไม่พบสินค้า</h2>
        <Button onClick={() => router.push("/products")}>กลับไปหน้ารายการสินค้า</Button>
      </div>
    );
  }

  const hasDiscount = false;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-sm text-muted-foreground scrollbar-hide">
          <Link href="/" className="hover:text-green-600">หน้าแรก</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/products" className="hover:text-green-600">สินค้า</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/products?category=${product.category.slug}`} className="hover:text-green-600">
            {product.category.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* ── Product Hero Section ─────────────────── */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-green-50">
              {product.coverImage ? (
                <img src={product.coverImage} alt={product.name} className="h-full w-full rounded-xl object-cover" />
              ) : (
                <Package className="h-24 w-24 text-green-300" />
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            <div>
              <Badge variant="outline" className="mb-2">
                {product.category.name}
              </Badge>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {product.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={product.rating} size="md" />
                  <span className="text-sm font-medium">{Number(product.rating).toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({product.farm.totalReviews} รีวิว)
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ขายแล้ว {product.sold} {product.unit}
                </span>
                {userLocation && product.farm.latitude && product.farm.longitude && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <Navigation className="h-3.5 w-3.5" />
                    {formatDistance(calculateDistance(userLocation.lat, userLocation.lng, product.farm.latitude, product.farm.longitude))} จากคุณ
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-700">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(Number(product.price) * 1.2)}
                  </span>
                  <Badge className="bg-red-100 text-red-700">
                    -{Math.round(20)}%
                  </Badge>
                </>
              )}
              <span className="text-sm text-muted-foreground">/{product.unit}</span>
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2 text-sm">
              {product.stock > 0 ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-700">
                    สินค้าพร้อมส่ง ({product.stock} {product.unit})
                  </span>
                </>
              ) : (
                <span className="text-red-500">สินค้าหมดชั่วคราว</span>
              )}
            </div>

            {/* AI Summary button */}
            <div className="flex flex-col gap-3">
              <Button onClick={handleAISummary} disabled={aiLoading}
                className="w-full sm:w-auto h-11 px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
                {aiLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {aiLoading ? "กำลังวิเคราะห์..." : "สรุปด้วย AI"}
              </Button>
              {aiSummary && (
                <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-400">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </span>
                    <span className="text-sm font-semibold text-green-700">AI สรุปให้</span>
                    <button onClick={() => setAiSummary(null)} className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{aiSummary}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="mb-2 text-sm font-semibold">รายละเอียดสินค้า</h3>
              <p className={`text-sm leading-relaxed text-gray-600 ${!showFullDescription ? "line-clamp-3" : ""}`}>
                {product.description}
              </p>
              {product.description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-1 flex items-center gap-1 py-1.5 text-xs font-medium text-green-600 hover:text-green-500"
                >
                  {showFullDescription ? "แสดงน้อยลง" : "แสดงเพิ่มเติม"}
                  {showFullDescription ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              )}
            </div>

            {/* Delivery / Pickup */}
            <div className="flex gap-3">
              {product.deliveryAvailable && (
                <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
                  <Truck className="h-4 w-4" />
                  ส่งถึงบ้าน
                </div>
              )}
              {product.pickupAvailable && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <Store className="h-4 w-4" />
                  รับที่สวน
                </div>
              )}
            </div>

            <Separator />

            {/* Quantity + Actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">จำนวน:</span>
                <div className="flex items-center rounded-lg border">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:bg-gray-50 disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex h-10 w-14 items-center justify-center border-x text-sm font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:bg-gray-50 disabled:opacity-50"
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-row gap-2">
                <Button className="flex-1 h-14 sm:h-14 text-base font-semibold rounded-xl min-h-[56px]" onClick={handleAddToCart} disabled={addingToCart}>
                  {addingToCart ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="mr-2 h-5 w-5" />
                  )}
                  {addingToCart ? "กำลังเพิ่ม..." : "เพิ่มในตะกร้า"}
                </Button>
                <Button variant="outline" className="flex-1 h-14 sm:h-14 text-base font-semibold rounded-xl min-h-[56px] border-2 border-green-500 bg-white hover:bg-green-50" onClick={handleBuyNow}>
                  ซื้อเลย
                </Button>
              </div>
              <div className="flex gap-2">
                <Link href={`/chat?farm=${product.farm.id}`} className="flex-1">
                  <Button variant="outline" className="w-full h-14 text-base font-semibold rounded-xl border-2 border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 gap-2">
                    <MessageCircle className="h-5 w-5" />
                    พูดคุยกับเกษตรกร
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Middle Sections ──────────────────────── */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {/* Farm Info Card */}
          <div className="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm">
            {/* Header with green gradient */}
            <div className="bg-gradient-to-r from-green-700 to-green-600 px-5 py-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 shrink-0 ring-2 ring-white/30 shadow-sm">
                  <AvatarFallback className="bg-white/20 text-lg font-bold text-white">
                    {product.farm.farmName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-white">
                  <Link
                    href={`/farms/${product.farm.id}`}
                    className="block truncate text-base font-bold hover:text-green-100 transition-colors"
                  >
                    {product.farm.farmName}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {product.farm.verified && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-green-200">
                        <Check className="h-3 w-3" /> ยืนยันแล้ว
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <StarRating rating={product.farm.ratingAverage} />
                    <span className="text-xs text-white/80">({product.farm.totalReviews})</span>
                    {product.farm.followers > 0 && (
                      <span className="text-xs text-white/60 ml-1.5">
                        {product.farm.followers} ผู้ติดตาม
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="space-y-3 p-4 pt-4">
              <div className="flex items-start gap-3 rounded-xl bg-green-50/60 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                  <MapPin className="h-4 w-4 text-green-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-green-700">ใกล้ฉัน</p>
                  {userLocation && product.farm.latitude && product.farm.longitude && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      {formatDistance(calculateDistance(userLocation.lat, userLocation.lng, product.farm.latitude, product.farm.longitude))} จากคุณ
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-green-50/60 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Clock className="h-4 w-4 text-green-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-green-700">เวลาทำการ</p>
                  <p className="text-sm text-gray-700">{product.farm.openingTime || "08:00"} - {product.farm.closingTime || "18:00"} น.</p>
                </div>
              </div>
              <Link href={`/farms/${product.farm.id}`}>
                <Button size="default" className="mt-1 w-full gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm hover:from-green-700 hover:to-emerald-700 h-10 text-sm">
                  <Store className="h-4 w-4" /> ดูฟาร์มนี้
                </Button>
              </Link>
            </CardContent>
          </div>

          {/* Map */}
          <div className="lg:col-span-2 overflow-hidden rounded-2xl border-0 shadow-sm bg-card text-card-foreground">
            <div className="bg-white px-5 py-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-green-900 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> ที่ตั้งฟาร์ม
              </h3>
            </div>
            <CardContent className="p-0">
              {product.farm.latitude && product.farm.longitude ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${product.farm.latitude},${product.farm.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="relative h-64 w-full">
                    <iframe
                      title="OpenStreetMap"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${product.farm.longitude - 0.02},${product.farm.latitude - 0.02},${product.farm.longitude + 0.02},${product.farm.latitude + 0.02}&layer=mapnik&marker=${product.farm.latitude},${product.farm.longitude}`}
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
                    <p className="text-sm font-medium text-green-800">{product.farm.farmName}</p>
                    <p className="text-xs text-green-600">ไม่ระบุพิกัด</p>
                  </div>
                </div>
              )}
              <div className="border-t p-3 text-center">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${product.farm.latitude},${product.farm.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "")}
                >
                  <Navigation className="mr-1.5 h-3.5 w-3.5" />
                  นำทางไปสวน
                </a>
              </div>
            </CardContent>
          </div>
        </div>

        {/* ── Farm Reviews ─────────────────────────── */}
        {product.reviews?.length > 0 && (
          <section className="mt-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">รีวิวจากผู้ซื้อ</h2>
              <span className="text-sm text-muted-foreground">{product.farm.totalReviews} รีวิว</span>
            </div>
            <ReviewList reviews={product.reviews} />
          </section>
        )}

        {/* ── Related Products ─────────────────────── */}
        <section className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">สินค้าที่เกี่ยวข้อง</h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-500"
            >
              ดูทั้งหมด <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {relatedProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">ไม่มีสินค้าที่เกี่ยวข้อง</p>
          ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {relatedProducts.map((related) => (
              <Link key={related.id} href={`/products/${related.slug}`} className="shrink-0">
                <Card className="w-[220px] group overflow-hidden rounded-2xl border border-gray-100 transition-all duration-300 hover:shadow-md p-0">
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-green-100 to-green-50 overflow-hidden rounded-t-2xl">
                    {related.coverImage ? (
                      <img src={related.coverImage} alt={related.name} className="h-full w-full object-cover" />
                    ) : (
                    <Package className="h-10 w-10 text-green-300" />
                    )}
                  </div>
                  <CardContent className="space-y-1.5 p-3">
                    <p className="text-xs text-muted-foreground">{related.farm.farmName}</p>
                    <h3 className="line-clamp-1 text-sm font-semibold">{related.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{Number((related.farm as any)?.ratingAverage ?? related.rating).toFixed(1)}</span>
                      </div>
                      <span>ขายแล้ว {related.sold}</span>
                    </div>
                    <span className="text-lg font-bold text-green-700">{formatPrice(related.price)}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          )}
        </section>
      </div>
    </div>
  );
}
