"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Star, Package, ArrowLeft, Loader2, ShoppingCart, Store, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDate, cn } from "@/lib/utils";

function ReviewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  const [order, setOrder] = useState<any>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setOrder(data.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const handleSubmit = async () => {
    if (!order || !selectedProductId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          farmId: order.farm.id,
          rating,
          comment,
        }),
      });
      const result = await res.json();

      if (result.success) {
        toast.success("ส่งรีวิวสินค้าสำเร็จ");
        router.push("/buyer/orders");
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("ไม่สามารถส่งรีวิวได้");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">ไม่พบคำสั่งซื้อ</p>
        <Link href="/buyer/reviews" className="mt-4">
          <Button variant="outline">กลับไปหน้ารีวิว</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/buyer/reviews"
        className="mb-6 flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-500"
      >
        <ArrowLeft className="h-4 w-4" />
        ย้อนกลับ
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">เขียนรีวิว</CardTitle>
          <p className="text-sm text-muted-foreground">
            คำสั่งซื้อ: {order.orderNumber} — {order.farm?.farmName}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Select product to review */}
          {order.items && (
            <div className="space-y-2">
              <p className="text-sm font-medium">เลือกรายการสินค้าที่ต้องการรีวิว:</p>
              {order.items.map((item: any) => {
                const prodId = item.product?.id || item.productId
                const isSelected = selectedProductId === prodId
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedProductId(prodId)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      isSelected ? "border-green-500 bg-green-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <input type="radio" checked={isSelected} readOnly className="accent-green-600" />
                    <Package className="h-8 w-8 text-green-400" />
                    <div>
                      <p className="text-sm font-medium">{item.product?.name || "สินค้า"}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} x {formatPrice(Number(item.price))}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          {!selectedProductId && (
            <p className="text-xs text-destructive">กรุณาเลือกรายการสินค้าที่ต้องการรีวิว</p>
          )}

          {/* Star rating */}
          <div className="space-y-2">
            <p className="text-sm font-medium">คะแนน</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredStar || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-200"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating === 1 && "แย่มาก"}
                {rating === 2 && "แย่"}
                {rating === 3 && "ปานกลาง"}
                {rating === 4 && "ดี"}
                {rating === 5 && "ดีมาก"}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <p className="text-sm font-medium">ความคิดเห็น</p>
            <Textarea
              placeholder="แบ่งปันประสบการณ์ของคุณกับฟาร์มนี้..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !selectedProductId} className="w-full" size="lg">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
            {submitting ? "กำลังส่ง..." : "ส่งรีวิว"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewableOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/buyer/orders")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.data) {
          setOrders(data.data.filter((o: any) => o.status === "COMPLETED" && !o.hasReview));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Star className="mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-1">ไม่มีคำสั่งซื้อที่รอรีวิว</h3>
            <p className="text-sm text-muted-foreground mb-4">เมื่อได้รับสินค้าและออเดอร์เสร็จสิ้นแล้ว คุณสามารถรีวิวฟาร์มได้ที่นี่</p>
            <Link href="/buyer/orders">
              <Button variant="outline" size="sm">ดูคำสั่งซื้อ</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        orders.map((order: any) => (
          <Card key={order.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm font-medium truncate">{order.farm?.farmName}</p>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {order.orderNumber} &middot; {formatDate(order.createdAt)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {order.items?.length || 0} รายการ &middot; {formatPrice(Number(order.total))}
                </p>
              </div>
              <Link href={`/buyer/reviews?order=${order.id}`}>
                <Button size="sm">
                  <Star className="mr-1 h-3.5 w-3.5" />
                  รีวิว
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function ReviewsContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  if (orderId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <ReviewOrderForm />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Star className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">รีวิวฟาร์ม</h1>
      </div>
      <ReviewableOrders />
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">โหลด...</div>}>
      <ReviewsContent />
    </Suspense>
  );
}
