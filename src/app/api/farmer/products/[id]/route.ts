import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

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
    if (session.user.role !== "FARMER") {
      return NextResponse.json(
        { success: false, message: "เฉพาะเกษตรกรเท่านั้น" },
        { status: 403 }
      );
    }

    const { id } = await params;
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

    const product = await prisma.product.findFirst({
      where: { id, farmId: farm.id, deletedAt: null },
    });
    if (!product) {
      return NextResponse.json(
        { success: false, message: "ไม่พบสินค้าหรือไม่มีสิทธิ์แก้ไข" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: any = {};
    const allowed = ["name", "description", "price", "stock", "unit", "categoryId", "coverImage", "status", "pickupAvailable", "deliveryAvailable"];
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }
    // Convert empty string categoryId to null to avoid FK constraint failure
    if (updateData.categoryId === "") updateData.categoryId = null;

    if (updateData.name) {
      const slug = generateSlug(updateData.name);
      const existingSlug = await prisma.product.findFirst({
        where: { slug, id: { not: id } },
      });
      updateData.slug = existingSlug ? `${slug}-${Date.now()}` : slug;
    }
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.stock !== undefined) updateData.stock = parseInt(updateData.stock);

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "แก้ไขสินค้าสำเร็จ",
    });
  } catch (error) {
    console.error("Farmer product update error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถแก้ไขสินค้าได้" },
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
    if (session.user.role !== "FARMER") {
      return NextResponse.json(
        { success: false, message: "เฉพาะเกษตรกรเท่านั้น" },
        { status: 403 }
      );
    }

    const { id } = await params;
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

    const product = await prisma.product.findFirst({
      where: { id, farmId: farm.id, deletedAt: null },
    });
    if (!product) {
      return NextResponse.json(
        { success: false, message: "ไม่พบสินค้าหรือไม่มีสิทธิ์ลบ" },
        { status: 404 }
      );
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: "DELETED" },
    });

    return NextResponse.json({
      success: true,
      data: { message: "ลบสินค้าเรียบร้อย" },
    });
  } catch (error) {
    console.error("Farmer product delete error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถลบสินค้าได้" },
      { status: 500 }
    );
  }
}
