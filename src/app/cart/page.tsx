"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,

  Truck,
  Store,
  Package,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { formatDistance, calculateDistance } from "@/lib/utils";
import { useUserLocation } from "@/hooks/useUserLocation";
import { DELIVERY_TYPE } from "@/constants";
import { useCart } from "@/hooks/useCart";

// ── Components ─────────────────────────────────────────

function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
  userLoc,
}: {
  item: {
    id: string;
    productId: string;
    quantity: number;
    product: {
      name: string;
      slug: string;
      coverImage: string | null;
      price: number;
      unit: string;
      stock: number;
      pickupAvailable: boolean;
      deliveryAvailable: boolean;
      farm: { id: string; farmName: string; latitude?: number | null; longitude?: number | null };
    };
  };
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  userLoc?: { lat: number; lng: number } | null;
}) {
  const p = item.product;
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5 sm:gap-6">
        <Link href={`/products/${p.slug}`}>
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-50 sm:h-24 sm:w-24">
            {p.coverImage ? (
              <img src={p.coverImage} alt={p.name} className="h-full w-full rounded-lg object-cover" />
            ) : (
              <Package className="h-8 w-8 text-green-300 sm:h-10 sm:w-10" />
            )}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/products/${p.slug}`}
                className="text-sm font-semibold hover:text-green-600 sm:text-base"
              >
                {p.name}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {p.farm.farmName}
                {userLoc && p.farm.latitude && p.farm.longitude && (
                  <span className="ml-1 text-[10px] text-green-600 font-medium">
                    ({formatDistance(calculateDistance(userLoc.lat, userLoc.lng, p.farm.latitude, p.farm.longitude))})
                  </span>
                )}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {p.pickupAvailable && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">
                    รับที่สวน
                  </Badge>
                )}
                {p.deliveryAvailable && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-[10px]">
                    ส่งถึงบ้าน
                  </Badge>
                )}
              </div>
            </div>
            <p className="shrink-0 text-base font-semibold sm:text-lg">
              {formatPrice(Number(p.price) * item.quantity)}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center rounded-lg border">
              <button
                onClick={() => onUpdateQuantity(item.id, -1)}
                className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:bg-gray-50 disabled:opacity-50 sm:h-9 sm:w-9"
                disabled={item.quantity <= 1}
              >
                <Minus className="h-4 w-4 sm:h-3 sm:w-3" />
              </button>
              <span className="flex h-10 w-12 items-center justify-center border-x text-sm font-medium sm:h-9 sm:w-12">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.id, 1)}
                className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:bg-gray-50 disabled:opacity-50 sm:h-9 sm:w-9"
                disabled={item.quantity >= p.stock}
              >
                <Plus className="h-4 w-4 sm:h-3 sm:w-3" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatPrice(Number(p.price))} / {p.unit}
              </span>
              <button
                onClick={() => onRemove(item.id)}
                className="flex items-center justify-center rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 min-h-10 min-w-10"
                title="ลบสินค้า"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CartItemSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5 sm:gap-6">
        <Skeleton className="h-20 w-20 shrink-0 rounded-lg sm:h-24 sm:w-24" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
        <ShoppingBag className="h-12 w-12 text-gray-300" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-gray-900">ตะกร้าของคุณว่างเปล่า</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        ไปเลือกซื้อสินค้าเกษตรคุณภาพดีจากฟาร์มทั่วไทยกันเถอะ
      </p>
      <Link href="/products">
        <Button className="mt-6">
          <ShoppingBag className="mr-2 h-4 w-4" />
          ไปเลือกซื้อสินค้า
        </Button>
      </Link>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { cart, isLoading, updateCart, removeFromCart } = useCart();
  const [deliveryType, setDeliveryType] = useState<string>(DELIVERY_TYPE.ONLINE);
  const [checkingOut, setCheckingOut] = useState(false);
  const { userLocation } = useUserLocation();

  const handleUpdateQuantity = async (id: string, delta: number) => {
    const item = cart?.items.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);
    try {
      await updateCart(id, newQty);
    } catch {
      toast.error("ไม่สามารถอัปเดตจำนวนได้");
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await removeFromCart(id);
      toast.success("ลบสินค้าออกจากตะกร้าแล้ว");
    } catch {
      toast.error("ไม่สามารถลบสินค้าได้");
    }
  };


  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );
  const shipping =
    deliveryType === DELIVERY_TYPE.ONLINE && subtotal > 0
      ? subtotal >= 500
        ? 0
        : 50
      : 0;
  const discount = 0;
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    if (!session) {
      router.push("/login?callbackUrl=/cart");
      return;
    }
    setCheckingOut(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryType }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("สร้างคำสั่งซื้อสำเร็จ");
        router.push(`/buyer/orders`);
      } else {
        toast.error(data.message || "ไม่สามารถสร้างคำสั่งซื้อได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-8 h-8 w-32" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CartItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">ตะกร้าสินค้า</h1>
          <Badge variant="secondary" className="ml-auto">
            {items.length} รายการ
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
                userLoc={userLocation}
              />
            ))}
            <Link
              href="/products"
              className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-500"
            >
              <ArrowLeft className="h-4 w-4" />
              เลือกซื้อสินค้าเพิ่มเติม
            </Link>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">รูปแบบการรับสินค้า</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  defaultValue={DELIVERY_TYPE.ONLINE}
                  value={deliveryType}
                  onValueChange={setDeliveryType}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-green-500 has-[[data-state=checked]]:bg-green-50">
                    <RadioGroupItem value={DELIVERY_TYPE.ONLINE} id="delivery" />
                    <Label htmlFor="delivery" className="flex cursor-pointer items-center gap-2">
                      <Truck className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">ส่งถึงบ้าน</p>
                        <p className="text-xs text-muted-foreground">
                          {subtotal >= 500 ? "ฟรีค่าจัดส่ง" : "ค่าจัดส่ง 50 บาท"}
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-green-500 has-[[data-state=checked]]:bg-green-50">
                    <RadioGroupItem value={DELIVERY_TYPE.PICKUP} id="pickup" />
                    <Label htmlFor="pickup" className="flex cursor-pointer items-center gap-2">
                      <Store className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">รับที่สวน</p>
                        <p className="text-xs text-muted-foreground">ไม่เสียค่าธรรมเนียม</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">สรุปคำสั่งซื้อ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">รายการสินค้า</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ค่าจัดส่ง</span>
                  <span>
                    {deliveryType === DELIVERY_TYPE.ONLINE ? (
                      shipping === 0 ? (
                        <span className="text-green-600">ฟรี</span>
                      ) : (
                        formatPrice(shipping)
                      )
                    ) : (
                      <span className="text-green-600">ไม่มีค่าธรรมเนียม</span>
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>ยอดรวมทั้งสิ้น</span>
                  <span className="text-green-700">{formatPrice(total)}</span>
                </div>
                {deliveryType === DELIVERY_TYPE.ONLINE && subtotal < 500 && subtotal > 0 && (
                  <p className="text-xs text-muted-foreground">
                    สั่งซื้อเพิ่มอีก {formatPrice(500 - subtotal)} เพื่อรับสิทธิ์จัดส่งฟรี
                  </p>
                )}
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full text-base"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ShoppingBag className="mr-2 h-5 w-5" />
              )}
              {checkingOut ? "กำลังดำเนินการ..." : "ดำเนินการสั่งซื้อ"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
