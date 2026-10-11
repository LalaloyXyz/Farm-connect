import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { buyerId: session.user.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        deliveryType: true,
        total: true,
        createdAt: true,
        farm: { select: { farmName: true } },
        items: {
          select: {
            id: true,
            price: true,
            quantity: true,
            subtotal: true,
            productId: true,
            product: {
              select: { name: true, coverImage: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Check which products have been reviewed
    const allProductIds = orders.flatMap((o) => o.items.map((i) => i.productId));
    const reviewedProductIds = allProductIds.length > 0
      ? (await prisma.review.findMany({
          where: { buyerId: session.user.id, productId: { in: allProductIds } },
          select: { productId: true },
        })).map((r) => r.productId)
      : [];

    return NextResponse.json({
      success: true,
      data: orders.map((o) => {
        const itemProductIds = o.items.map((i) => i.productId);
        const allReviewed = itemProductIds.every((pid) => reviewedProductIds.includes(pid));
        return {
          ...o,
          total: Number(o.total),
          hasReview: allReviewed,
          items: o.items.map((item) => ({
            ...item,
            price: Number(item.price),
            subtotal: Number(item.subtotal),
            hasReview: reviewedProductIds.includes(item.productId),
          })),
        };
      }),
    });
  } catch (error) {
    console.error("Buyer orders fetch error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดคำสั่งซื้อได้" },
      { status: 500 }
    );
  }
}
