import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const farm = await prisma.farm.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        farmName: true,
        description: true,
        coverImage: true,
        latitude: true,
        longitude: true,
        address: true,
        province: true,
        district: true,
        subdistrict: true,
        postalCode: true,
        openingTime: true,
        closingTime: true,
        phone: true,
        facebook: true,
        line: true,
        website: true,
        verified: true,
        ratingAverage: true,
        totalReviews: true,
        followers: true,
        createdAt: true,
        updatedAt: true,
        farmer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            phone: true,
          },
        },
        farmImages: {
          select: { id: true, imageUrl: true },
          orderBy: { sortOrder: "asc" },
        },
        products: {
          where: { status: "ACTIVE", deletedAt: null },
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
            pickupAvailable: true,
            deliveryAvailable: true,
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        reviews: {
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
        },
        _count: {
          select: {
            products: { where: { status: "ACTIVE", deletedAt: null } },
          },
        },
      },
    });

    if (!farm) {
      return NextResponse.json(
        { success: false, message: "ไม่พบฟาร์ม" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: farm });
  } catch (error) {
    console.error("Farm fetch error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดฟาร์มได้" },
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

    const farm = await prisma.farm.findFirst({
      where: { id, deletedAt: null },
    });
    if (!farm) {
      return NextResponse.json(
        { success: false, message: "ไม่พบฟาร์ม" },
        { status: 404 }
      );
    }
    if (farm.farmerId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "คุณไม่มีสิทธิ์แก้ไขฟาร์มนี้" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      "farmName", "description", "coverImage", "latitude", "longitude",
      "address", "province", "district", "subdistrict", "postalCode",
      "openingTime", "closingTime", "phone", "facebook", "line", "website",
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่มีข้อมูลที่จะอัปเดต" },
        { status: 400 }
      );
    }

    const updated = await prisma.farm.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        farmName: true,
        coverImage: true,
        province: true,
        district: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Farm update error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถแก้ไขฟาร์มได้" },
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

    const farm = await prisma.farm.findFirst({
      where: { id, deletedAt: null },
    });
    if (!farm) {
      return NextResponse.json(
        { success: false, message: "ไม่พบฟาร์ม" },
        { status: 404 }
      );
    }
    if (farm.farmerId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "คุณไม่มีสิทธิ์ลบฟาร์มนี้" },
        { status: 403 }
      );
    }

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

    return NextResponse.json({ success: true, data: { message: "ลบฟาร์มเรียบร้อย" } });
  } catch (error) {
    console.error("Farm delete error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถลบฟาร์มได้" },
      { status: 500 }
    );
  }
}
