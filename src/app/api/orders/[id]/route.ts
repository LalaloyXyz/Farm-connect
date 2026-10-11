import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ORDER_STATUS_LABEL } from "@/constants";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        deliveryType: true,
        paymentStatus: true,
        subtotal: true,
        shippingFee: true,
        discount: true,
        total: true,
        remark: true,
        createdAt: true,
        updatedAt: true,
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        farm: {
          select: {
            id: true,
            farmName: true,
            province: true,
            phone: true,
            coverImage: true,
          },
        },
        items: {
          select: {
            id: true,
            price: true,
            quantity: true,
            subtotal: true,
            product: {
              select: {
                id: true,
                name: true,
                coverImage: true,
                unit: true,
              },
            },
          },
        },
        pickupAppointment: true,
        address: true,
        payment: {
          select: {
            id: true,
            method: true,
            amount: true,
            status: true,
            slipImage: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "ไม่พบคำสั่งซื้อ" },
        { status: 404 }
      );
    }

    // Authorization: buyer who owns the order, farmer of the farm, or admin
    const isBuyer = order.buyer.id === session.user.id;
    const farmOwner = await prisma.farm.findUnique({
      where: { id: order.farm.id },
      select: { farmerId: true },
    });
    const isFarmer = farmOwner?.farmerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isBuyer && !isFarmer && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "คุณไม่มีสิทธิ์ดูคำสั่งซื้อนี้" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดคำสั่งซื้อได้" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุสถานะ" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: { farm: { select: { farmerId: true } } },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "ไม่พบคำสั่งซื้อ" },
        { status: 404 }
      );
    }

    // Only farmer or admin can update status
    const isFarmer = order.farm.farmerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isFarmer && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "เฉพาะเกษตรกรเท่านั้นที่สามารถอัปเดตสถานะคำสั่งซื้อได้" },
        { status: 403 }
      );
    }

    // Validate status transition
    const allowedTransitions = VALID_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `ไม่สามารถเปลี่ยนสถานะจาก "${order.status}" เป็น "${newStatus}" ได้`,
        },
        { status: 400 }
      );
    }

    // If cancelling, restore stock
    if (newStatus === "CANCELLED" && order.status !== "CANCELLED") {
      await prisma.$transaction(async (tx) => {
        const items = await tx.orderItem.findMany({
          where: { orderId: id },
          select: { productId: true, quantity: true },
        });
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              sold: { decrement: item.quantity },
            },
          });
        }
        await tx.order.update({
          where: { id },
          data: { status: newStatus as any },
        });
      });
    } else {
      await prisma.order.update({
        where: { id },
        data: { status: newStatus as any },
      });
    }

    // Create notification for the buyer
    try {
      const orderInfo = await prisma.order.findUnique({
        where: { id },
        select: { orderNumber: true, buyerId: true },
      });
      if (orderInfo) {
        await prisma.notification.create({
          data: {
            userId: orderInfo.buyerId,
            title: "สถานะคำสั่งซื้อเปลี่ยน",
            message: `ออเดอร์ ${orderInfo.orderNumber} เปลี่ยนสถานะเป็น "${ORDER_STATUS_LABEL[newStatus] || newStatus}"`,
          },
        });
      }
    } catch {
      // Silent - notification is optional
    }

    return NextResponse.json({
      success: true,
      data: { id, status: newStatus, message: "อัปเดตสถานะเรียบร้อย" },
    });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถอัปเดตคำสั่งซื้อได้" },
      { status: 500 }
    );
  }
}
