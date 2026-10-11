import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, subDays } from "date-fns";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }
    if (session.user.role !== "FARMER") {
      return NextResponse.json(
        { success: false, message: "เฉพาะเกษตรกรเท่านั้น" },
        { status: 403 }
      );
    }

    const farm = await prisma.farm.findUnique({
      where: { farmerId: session.user.id },
      select: { id: true, farmName: true },
    });

    if (!farm) {
      return NextResponse.json(
        { success: false, message: "กรุณาสร้างฟาร์มก่อน" },
        { status: 400 }
      );
    }

    const farmId = farm.id;
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total revenue
    const totalRevenueResult = await prisma.order.aggregate({
      where: {
        farmId,
        status: { in: ["COMPLETED", "SHIPPING", "READY_FOR_PICKUP"] },
      },
      _sum: { total: true },
    });
    const totalRevenue = Number(totalRevenueResult._sum.total ?? 0);

    // Today's sales
    const todaySalesResult = await prisma.order.aggregate({
      where: {
        farmId,
        createdAt: { gte: todayStart, lte: todayEnd },
        status: { not: "CANCELLED" },
      },
      _sum: { total: true },
    });
    const todaySales = Number(todaySalesResult._sum.total ?? 0);

    // Monthly sales
    const monthlySalesResult = await prisma.order.aggregate({
      where: {
        farmId,
        createdAt: { gte: monthStart },
        status: { not: "CANCELLED" },
      },
      _sum: { total: true },
    });
    const monthlySales = Number(monthlySalesResult._sum.total ?? 0);

    // Order counts by status
    const orderCounts = await prisma.order.groupBy({
      by: ["status"],
      where: { farmId },
      _count: true,
    });

    const pendingOrders =
      orderCounts.find((o) => o.status === "PENDING")?._count || 0;
    const preparingOrders =
      orderCounts.find((o) => o.status === "PREPARING")?._count || 0;
    const completedOrders =
      orderCounts.find((o) => o.status === "COMPLETED")?._count || 0;
    const cancelledOrders =
      orderCounts.find((o) => o.status === "CANCELLED")?._count || 0;
    const totalOrders = orderCounts.reduce((sum, o) => sum + o._count, 0);

    // Product counts
    const productCounts = await prisma.product.groupBy({
      by: ["status"],
      where: { farmId, deletedAt: null },
      _count: true,
    });
    const activeProducts =
      productCounts.find((p) => p.status === "ACTIVE")?._count || 0;
    const outOfStockProducts =
      productCounts.find((p) => p.status === "OUT_OF_STOCK")?._count || 0;
    const totalProducts = productCounts.reduce((sum, p) => sum + p._count, 0);

    // Top products by sold
    const topProducts = await prisma.product.findMany({
      where: { farmId, deletedAt: null, status: { not: "DELETED" } },
      select: {
        id: true,
        name: true,
        sold: true,
        price: true,
        coverImage: true,
      },
      orderBy: { sold: "desc" },
      take: 10,
    });

    const topProductsWithRevenue = topProducts.map((p) => ({
      ...p,
      revenue: Number(p.price) * p.sold,
    }));

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      where: { farmId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        buyer: {
          select: { id: true, firstName: true, lastName: true },
        },
        items: {
          select: { quantity: true, product: { select: { name: true } } },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Sales chart data for last 7 days
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayResult = await prisma.order.aggregate({
        where: {
          farmId,
          createdAt: { gte: dayStart, lte: dayEnd },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
        _count: true,
      });

      salesData.push({
        date: date.toISOString().split("T")[0],
        amount: Number(dayResult._sum.total ?? 0),
        orders: dayResult._count,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        farmName: farm.farmName,
        totalRevenue,
        todaySales,
        monthlySales,
        totalOrders,
        pendingOrders,
        preparingOrders,
        completedOrders,
        cancelledOrders,
        activeProducts,
        outOfStockProducts,
        totalProducts,
        topProducts: topProductsWithRevenue,
        recentOrders,
        salesData,
      },
    });
  } catch (error) {
    console.error("Farmer dashboard error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้" },
      { status: 500 }
    );
  }
}
