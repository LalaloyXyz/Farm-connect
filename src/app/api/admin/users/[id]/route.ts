import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "ไม่มีสิทธิ์" },
        { status: 403 }
      );
    }

    const { id } = await params;

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({
      success: true,
      data: { message: "ลบผู้ใช้เรียบร้อย" },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "ไม่สามารถลบผู้ใช้ได้" },
      { status: 500 }
    );
  }
}
