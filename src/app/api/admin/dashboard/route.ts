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
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "เฉพาะผู้ดูแลระบบเท่านั้น" },
        { status: 403 }
      );
    }

    const now = new Date();

    // User counts
    const [
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalAdmins,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { role: "FARMER", deletedAt: null } }),
      prisma.user.count({ where: { role: "BUYER", deletedAt: null } }),
      prisma.user.count({ where: { role: "ADMIN", deletedAt: null } }),
    ]);

    // Product count
    const totalProducts = await prisma.product.count({
      where: { deletedAt: null },
    });

    // Farm count
    const totalFarms = await prisma.farm.count({
      where: { deletedAt: null },
    });

    // Order counts and revenue
    const totalOrders = await prisma.order.count();
    const revenueResult = await prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { total: true },
    });
    const totalRevenue = Number(revenueResult._sum.total ?? 0);

    // Today's stats
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const [
      todayOrders,
      todayRevenueResult,
      todayNewUsers,
    ] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      }),
      prisma.user.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd }, deletedAt: null },
      }),
    ]);
    const todayRevenue = Number(todayRevenueResult._sum.total ?? 0);

    // Order status breakdown
    const orderStatusCounts = await prisma.order.groupBy({
      by: ["status"],
      _count: true,
    });

    const pendingOrders =
      orderStatusCounts.find((o) => o.status === "PENDING")?._count || 0;
    const completedOrders =
      orderStatusCounts.find((o) => o.status === "COMPLETED")?._count || 0;
    const cancelledOrders =
      orderStatusCounts.find((o) => o.status === "CANCELLED")?._count || 0;

    // Daily active users (users who logged in today)
    const dailyActiveUsers = await prisma.user.count({
      where: {
        lastLogin: { gte: todayStart, lte: todayEnd },
        deletedAt: null,
      },
    });

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        buyer: {
          select: { id: true, firstName: true, lastName: true },
        },
        farm: {
          select: { id: true, farmName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Monthly revenue for chart (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthResult = await prisma.order.aggregate({
        where: {
          createdAt: { gte: monthDate, lte: monthEnd },
          status: "COMPLETED",
        },
        _sum: { total: true },
        _count: true,
      });

      monthlyRevenue.push({
        month: monthDate.toISOString().substring(0, 7),
        revenue: Number(monthResult._sum.total ?? 0),
        orders: monthResult._count,
      });
    }

    // Top selling products
    const rawProducts = await prisma.product.findMany({
      where: { deletedAt: null, status: { not: "DELETED" } },
      select: {
        id: true,
        name: true,
        sold: true,
        price: true,
        coverImage: true,
        farm: { select: { farmName: true } },
      },
      orderBy: { sold: "desc" },
      take: 10,
    });

    const topProducts = rawProducts.map((p) => ({
      ...p,
      price: Number(p.price),
      revenue: Number(p.price) * p.sold,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalFarmers,
        totalBuyers,
        totalAdmins,
        totalProducts,
        totalFarms,
        totalOrders,
        totalRevenue,
        todayOrders,
        todayRevenue,
        todayNewUsers,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        dailyActiveUsers,
        recentOrders,
        monthlyRevenue,
        topProducts,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้" },
      { status: 500 }
    );
  }
}
