import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }], deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        stock: true,
        unit: true,
        weight: true,
        status: true,
        coverImage: true,
        rating: true,
        sold: true,
        viewCount: true,
        pickupAvailable: true,
        deliveryAvailable: true,
        createdAt: true,
        updatedAt: true,
        farm: {
          select: {
            id: true,
            farmName: true,
            province: true,
            district: true,
            latitude: true,
            longitude: true,
            coverImage: true,
            ratingAverage: true,
            totalReviews: true,
            followers: true,
            verified: true,
            address: true,
            phone: true,
            openingTime: true,
            closingTime: true,
            description: true,
            farmer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          select: { id: true, imageUrl: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }

    // Fetch product reviews
    const reviews = await prisma.review.findMany({
      where: { productId: product.id, deletedAt: null },
      select: {
        id: true,
        rating: true,
        comment: true,
        images: true,
        farmerReply: true,
        createdAt: true,
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Increment view count (fire-and-forget)
    prisma.product
      .update({ where: { id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});

    return NextResponse.json({ success: true, data: { ...product, reviews } });
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดสินค้าได้" },
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
    if (session.user.role !== "FARMER") {
      return NextResponse.json(
        { success: false, message: "เฉพาะเกษตรกรเท่านั้นที่สามารถแก้ไขสินค้าได้" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }], deletedAt: null },
      include: { farm: { select: { farmerId: true } } },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }
    if (product.farm.farmerId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "คุณไม่มีสิทธิ์แก้ไขสินค้านี้" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      "name", "description", "price", "stock", "unit", "weight",
      "categoryId", "coverImage", "pickupAvailable", "deliveryAvailable", "status",
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (updateData.name) {
      const slug = generateSlug(updateData.name);
      const existingSlug = await prisma.product.findFirst({
        where: { slug, id: { not: id } },
      });
      updateData.slug = existingSlug ? `${slug}-${Date.now()}` : slug;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        unit: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Product update error:", error);
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
        { success: false, message: "เฉพาะเกษตรกรเท่านั้นที่สามารถลบสินค้าได้" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }], deletedAt: null },
      include: { farm: { select: { farmerId: true } } },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }
    if (product.farm.farmerId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "คุณไม่มีสิทธิ์ลบสินค้านี้" },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "DELETED",
      },
    });

    return NextResponse.json({ success: true, data: { message: "ลบสินค้าเรียบร้อย" } });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถลบสินค้าได้" },
      { status: 500 }
    );
  }
}
