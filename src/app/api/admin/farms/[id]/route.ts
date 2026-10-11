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

    // Soft delete farm and hide its products
    await prisma.$transaction([
      prisma.product.updateMany({
        where: { farmId: id, deletedAt: null },
        data: { deletedAt: new Date(), status: "DELETED" },
      }),
      prisma.farm.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { message: "ลบฟาร์มเรียบร้อย" },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "ไม่สามารถลบฟาร์มได้" },
      { status: 500 }
    );
  }
}
