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
    if (session.user.role !== "FARMER") {
      return NextResponse.json(
        { success: false, message: "เฉพาะเกษตรกรเท่านั้น" },
        { status: 403 }
      );
    }

    const farm = await prisma.farm.findUnique({
      where: { farmerId: session.user.id },
      select: { id: true },
    });
    if (!farm) {
      return NextResponse.json(
        { success: false, message: "กรุณาสร้างฟาร์มก่อน" },
        { status: 400 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { farmId: farm.id },
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
            product: {
              select: { name: true, coverImage: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal fields to numbers for safe serialization
    const safeOrders = orders.map((order) => ({
      ...order,
      total: Number(order.total),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })),
    }));

    return NextResponse.json({ success: true, data: safeOrders });
  } catch (error) {
    console.error("Farmer orders fetch error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดออเดอร์ได้" },
      { status: 500 }
    );
  }
}
