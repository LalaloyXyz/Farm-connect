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
    if (session.user.role !== "BUYER") {
      return NextResponse.json(
        { success: false, message: "เฉพาะผู้ซื้อเท่านั้น" },
        { status: 403 }
      );
    }

    const buyerId = session.user.id;

    // Order stats
    const totalOrders = await prisma.order.count({
      where: { buyerId },
    });

    const pendingOrders = await prisma.order.count({
      where: { buyerId, status: "PENDING" },
    });

    const completedOrders = await prisma.order.count({
      where: { buyerId, status: "COMPLETED" },
    });

    const totalSpentResult = await prisma.order.aggregate({
      where: { buyerId },
      _sum: { total: true },
    });
    const totalSpent = Number(totalSpentResult._sum.total ?? 0);

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      where: { buyerId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        farm: { select: { farmName: true } },
        items: {
          select: {
            id: true,
            price: true,
            quantity: true,
            subtotal: true,
            product: { select: { name: true, coverImage: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Orders by status breakdown
    const orderCountsByStatus = await prisma.order.groupBy({
      by: ["status"],
      where: { buyerId },
      _count: true,
    });

    const ordersByStatus: Record<string, number> = {};
    for (const entry of orderCountsByStatus) {
      ordersByStatus[entry.status] = entry._count;
    }

    // Wishlist
    const totalWishlist = await prisma.wishlist.count({
      where: { buyerId },
    });

    const wishlistItems = await prisma.wishlist.findMany({
      where: { buyerId },
      select: {
        product: {
          select: { id: true, name: true, price: true, coverImage: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Reviews count
    const totalReviews = await prisma.review.count({
      where: { buyerId },
    });

    // Followed farms
    const followedFarms = await prisma.farmerFollower.findMany({
      where: { buyerId },
      select: {
        id: true,
        farm: {
          select: { id: true, farmName: true, ratingAverage: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: buyerId },
      select: {
        id: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSpent,
        ordersByStatus,
        recentOrders: recentOrders.map((o) => ({
          ...o,
          total: Number(o.total),
          items: o.items.map((item) => ({
            ...item,
            price: Number(item.price),
            subtotal: Number(item.subtotal),
          })),
        })),
        totalWishlist,
        wishlistItems: wishlistItems.map((w) => ({
          id: w.product.id,
          name: w.product.name,
          price: Number(w.product.price),
          coverImage: w.product.coverImage,
        })),
        totalReviews,
        followedFarms: followedFarms.map((f) => ({
          id: f.farm.id,
          farmName: f.farm.farmName,
          ratingAverage: f.farm.ratingAverage,
        })),
        notifications,
      },
    });
  } catch (error) {
    console.error("Buyer dashboard error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้" },
      { status: 500 }
    );
  }
}
