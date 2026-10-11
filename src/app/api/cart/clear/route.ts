import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    await prisma.cart.deleteMany({
      where: { buyerId: session.user.id },
    });

    return NextResponse.json({
      success: true,
      data: { message: "ล้างตะกร้าเรียบร้อย" },
    });
  } catch (error) {
    console.error("Cart clear error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถล้างตะกร้าได้" },
      { status: 500 }
    );
  }
}
