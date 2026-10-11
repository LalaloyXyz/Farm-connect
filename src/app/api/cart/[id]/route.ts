import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    const { quantity } = await request.json();

    const cartItem = await prisma.cart.findFirst({
      where: { id, buyerId: session.user.id },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, message: "ไม่พบสินค้าในตะกร้า" },
        { status: 404 }
      );
    }

    const updated = await prisma.cart.update({
      where: { id },
      data: { quantity },
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

export async function DELETE(
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

    const cartItem = await prisma.cart.findFirst({
      where: { id, buyerId: session.user.id },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, message: "ไม่พบสินค้าในตะกร้า" },
        { status: 404 }
      );
    }

    await prisma.cart.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { message: "ลบสินค้าออกจากตะกร้าแล้ว" },
    });
  } catch (error) {
    console.error("Cart delete error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถลบสินค้าได้" },
      { status: 500 }
    );
  }
}
