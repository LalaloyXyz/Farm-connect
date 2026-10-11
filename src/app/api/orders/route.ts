import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { orderSchema } from "@/lib/validation";
import { generateOrderNumber } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") || "";

    // Buyers see their own orders, farmers see orders for their farm
    const where: any = {};
    if (session.user.role === "FARMER") {
      const farm = await prisma.farm.findUnique({
        where: { farmerId: session.user.id },
        select: { id: true },
      });
      if (farm) {
        where.farmId = farm.id;
      } else {
        // Farmer has no farm, return empty
        return NextResponse.json({
          success: true,
          data: { orders: [], total: 0, page, limit, totalPages: 0 },
        });
      }
    } else {
      where.buyerId = session.user.id;
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
          farm: { select: { id: true, farmName: true } },
          items: {
            select: {
              id: true,
              price: true,
              quantity: true,
              subtotal: true,
              product: {
                select: { id: true, name: true, coverImage: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดคำสั่งซื้อได้" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = orderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "ข้อมูลไม่ถูกต้อง",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { deliveryType, addressId, remark, pickupDate, pickupTime } = validation.data;

    // Get user's cart items
    const cartItems = await prisma.cart.findMany({
      where: { buyerId: session.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            farmId: true,
            farm: { select: { id: true, farmName: true, farmerId: true } },
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, message: "ตะกร้าว่างเปล่า" },
        { status: 400 }
      );
    }

    // Group items by farm (each order is per farm)
    const farmGroups = cartItems.reduce(
      (acc: Record<string, typeof cartItems>, item) => {
        const farmId = item.product.farmId;
        if (!acc[farmId]) acc[farmId] = [];
        acc[farmId].push(item);
        return acc;
      },
      {}
    );

    // Cannot order from your own farm (if buyer is also a farmer)
    const ownFarmGroups = Object.entries(farmGroups).filter(
      ([, items]) => items[0].product.farm.farmerId === session.user.id
    );
    if (ownFarmGroups.length > 0) {
      return NextResponse.json(
        { success: false, message: "ไม่สามารถสั่งซื้อสินค้าจากฟาร์มของตัวเองได้" },
        { status: 400 }
      );
    }

    // Validate stock for all items
    for (const items of Object.values(farmGroups)) {
      for (const item of items) {
        if (item.quantity > item.product.stock) {
          return NextResponse.json(
            {
              success: false,
              message: `สินค้า "${item.product.name}" มีสต็อกไม่เพียงพอ (เหลือ ${item.product.stock})`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Process orders in transaction
    const orders = await prisma.$transaction(async (tx) => {
      const createdOrders = [];

      for (const [farmId, items] of Object.entries(farmGroups)) {
        const orderNumber = generateOrderNumber();
        const subtotal = items.reduce(
          (sum, item) => sum + Number(item.product.price) * item.quantity,
          0
        );
        const shippingFee = deliveryType === "ONLINE" ? 50 : 0;
        const total = subtotal + shippingFee;

        // Create order
        const order = await tx.order.create({
          data: {
            orderNumber,
            buyerId: session.user.id,
            farmId,
            deliveryType,
            status: "PENDING",
            subtotal,
            shippingFee,
            total,
            remark: remark || null,
            items: {
              create: items.map((item) => ({
                productId: item.product.id,
                price: item.product.price,
                quantity: item.quantity,
                subtotal: Number(item.product.price) * item.quantity,
              })),
            },
          },
        });

        // Reduce stock
        for (const item of items) {
          await tx.product.update({
            where: { id: item.product.id },
            data: {
              stock: { decrement: item.quantity },
              sold: { increment: item.quantity },
            },
          });
        }

        // Handle address
        if (deliveryType === "ONLINE" && addressId) {
          await tx.address.update({
            where: { id: addressId },
            data: { orderId: order.id },
          });
        }

        // Handle pickup appointment
        if (deliveryType === "PICKUP" && pickupDate && pickupTime) {
          await tx.pickupAppointment.create({
            data: {
              orderId: order.id,
              pickupDate: new Date(pickupDate),
              pickupTime,
            },
          });
        }

        createdOrders.push(order.id);
      }

      return createdOrders;
    });

    // Clear cart
    await prisma.cart.deleteMany({
      where: { buyerId: session.user.id },
    });

    return NextResponse.json(
      { success: true, data: { orderIds: orders, message: "สร้างคำสั่งซื้อเรียบร้อย" } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถสร้างคำสั่งซื้อได้" },
      { status: 500 }
    );
  }
}
