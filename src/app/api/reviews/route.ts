import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { reviewSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const farmId = searchParams.get("farmId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    if (!farmId) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ farmId" },
        { status: 400 }
      );
    }

    const where: any = { farmId };
    if (productId) where.productId = productId;

    const [reviews, total, aggregate] = await Promise.all([
      prisma.review.findMany({
        where,
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
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    const ratingDistribution = [0, 0, 0, 0, 0];
    const allRatings = await prisma.review.findMany({
      where,
      select: { rating: true },
    });
    for (const r of allRatings) {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingDistribution[r.rating - 1]++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        averageRating: aggregate._avg.rating || 0,
        totalReviews: aggregate._count,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดรีวิวได้" },
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
    if (session.user.role !== "BUYER") {
      return NextResponse.json(
        { success: false, message: "เฉพาะผู้ซื้อเท่านั้นที่สามารถรีวิวได้" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = reviewSchema.safeParse(body);
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

    const { productId, farmId, rating, comment, images } = validation.data;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุสินค้า" },
        { status: 400 }
      );
    }

    // Check buyer has a completed order for this product
    const completedOrder = await prisma.order.findFirst({
      where: {
        buyerId: session.user.id,
        farmId,
        status: "COMPLETED",
        items: { some: { productId } },
      },
    });

    if (!completedOrder) {
      return NextResponse.json(
        { success: false, message: "คุณต้องสั่งซื้อสินค้านี้และได้รับสินค้าแล้วจึงจะรีวิวได้" },
        { status: 400 }
      );
    }

    // Check for existing review for this product
    const existingReview = await prisma.review.findFirst({
      where: { buyerId: session.user.id, productId },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, message: "คุณได้รีวิวสินค้านี้แล้ว" },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        buyerId: session.user.id,
        farmId,
        productId,
        rating,
        comment: comment || null,
        images: images ? JSON.stringify(images) : null,
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });

    // Update product rating
    const productReviews = await prisma.review.aggregate({
      where: { productId, deletedAt: null },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: productId },
      data: { rating: productReviews._avg.rating || 0 },
    });

    // Update farm rating (average of all product ratings)
    const farmProductIds = await prisma.product.findMany({
      where: { farmId, deletedAt: null },
      select: { id: true },
    });
    const farmReviews = await prisma.review.aggregate({
      where: { productId: { in: farmProductIds.map((p) => p.id) }, deletedAt: null },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.farm.update({
      where: { id: farmId },
      data: {
        ratingAverage: farmReviews._avg.rating || 0,
        totalReviews: farmReviews._count,
      },
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    console.error("Review create error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถสร้างรีวิวได้" },
      { status: 500 }
    );
  }
}
