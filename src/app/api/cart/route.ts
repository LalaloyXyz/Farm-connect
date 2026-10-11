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

    const cartItems = await prisma.cart.findMany({
      where: { buyerId: session.user.id },
      select: {
        id: true,
        quantity: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            stock: true,
            unit: true,
            coverImage: true,
            status: true,
            pickupAvailable: true,
            deliveryAvailable: true,
            farm: {
              select: {
                id: true,
                farmName: true,
                province: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by farm
    const grouped = cartItems.reduce(
      (acc: Record<string, { farm: any; items: typeof cartItems }>, item) => {
        const farmId = item.product.farm.id;
        if (!acc[farmId]) {
          acc[farmId] = {
            farm: item.product.farm,
            items: [],
          };
        }
        acc[farmId].items.push(item);
        return acc;
      },
      {}
    );

    const total = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        farms: Object.values(grouped),
        items: cartItems,
        total,
        itemCount: cartItems.length,
      },
    });
  } catch (error) {
    console.error("Cart fetch error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดตะกร้าได้" },
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

    const { productId, quantity } = await request.json();
    if (!productId) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุสินค้า" },
        { status: 400 }
      );
    }

    const qty = Math.max(1, quantity || 1);

    // Check product exists and has stock
    const product = await prisma.product.findFirst({
      where: { id: productId, status: "ACTIVE", deletedAt: null },
    });
    if (!product) {
      return NextResponse.json(
        { success: false, message: "ไม่พบสินค้าหรือสินค้าหมด" },
        { status: 404 }
      );
    }

    // Upsert cart item
    const existing = await prisma.cart.findUnique({
      where: {
        buyerId_productId: {
          buyerId: session.user.id,
          productId,
        },
      },
    });

    if (existing) {
      const newQty = Math.min(existing.quantity + qty, product.stock);
      const updated = await prisma.cart.update({
        where: { id: existing.id },
        data: { quantity: newQty },
        select: { id: true, quantity: true },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    const cartItem = await prisma.cart.create({
      data: {
        buyerId: session.user.id,
        productId,
        quantity: Math.min(qty, product.stock),
      },
      select: { id: true, quantity: true },
    });

    return NextResponse.json({ success: true, data: cartItem }, { status: 201 });
  } catch (error) {
    console.error("Cart add error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถเพิ่มสินค้าในตะกร้าได้" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { productId, quantity } = await request.json();
    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุสินค้าและจำนวน" },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      // Remove item if quantity is 0
      await prisma.cart.deleteMany({
        where: { buyerId: session.user.id, productId },
      });
      return NextResponse.json({
        success: true,
        data: { message: "ลบสินค้าออกจากตะกร้าแล้ว" },
      });
    }

    // Check stock limit
    const product = await prisma.product.findFirst({
      where: { id: productId, status: "ACTIVE", deletedAt: null },
    });
    if (!product) {
      return NextResponse.json(
        { success: false, message: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }

    const safeQty = Math.min(quantity, product.stock);

    const updated = await prisma.cart.update({
      where: {
        buyerId_productId: {
          buyerId: session.user.id,
          productId,
        },
      },
      data: { quantity: safeQty },
      select: { id: true, quantity: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Cart update error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถอัปเดตตะกร้าได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (productId) {
      await prisma.cart.deleteMany({
        where: { buyerId: session.user.id, productId },
      });
    } else {
      // Clear entire cart
      await prisma.cart.deleteMany({
        where: { buyerId: session.user.id },
      });
    }

    return NextResponse.json({
      success: true,
      data: { message: "ลบสินค้าออกจากตะกร้าเรียบร้อย" },
    });
  } catch (error) {
    console.error("Cart delete error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถลบสินค้าออกจากตะกร้าได้" },
      { status: 500 }
    );
  }
}
