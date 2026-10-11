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

    const wishlist = await prisma.wishlist.findMany({
      where: { buyerId: session.user.id },
      select: {
        id: true,
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
            rating: true,
            sold: true,
            status: true,
            farm: {
              select: {
                id: true,
                farmName: true,
                province: true,
              },
            },
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: wishlist });
  } catch (error) {
    console.error("Wishlist fetch error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดรายการโปรดได้" },
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

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุสินค้า" },
        { status: 400 }
      );
    }

    // Check product exists
    const product = await prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!product) {
      return NextResponse.json(
        { success: false, message: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }

    // Toggle wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        buyerId_productId: {
          buyerId: session.user.id,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({
        success: true,
        data: { wishlisted: false, message: "ลบออกจากรายการโปรดแล้ว" },
      });
    }

    await prisma.wishlist.create({
      data: {
        buyerId: session.user.id,
        productId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { wishlisted: true, message: "เพิ่มในรายการโปรดแล้ว" },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Wishlist toggle error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถดำเนินการได้" },
      { status: 500 }
    );
  }
}
