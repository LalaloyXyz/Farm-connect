import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

export async function GET() {
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

    const products = await prisma.product.findMany({
      where: { farmId: farm.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        unit: true,
        status: true,
        sold: true,
        coverImage: true,
        description: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("Farmer products fetch error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดสินค้าได้" },
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
    if (session.user.role !== "FARMER") {
      return NextResponse.json(
        { success: false, message: "เฉพาะเกษตรกรเท่านั้น" },
        { status: 403 }
      );
    }

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

    const body = await request.json();
    const { name, description, price, stock, unit, categoryId, coverImage, pickupAvailable, deliveryAvailable } = body;

    if (!name || !price) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกชื่อและราคาสินค้า" },
        { status: 400 }
      );
    }

    const slug = generateSlug(name);
    const existingSlug = await prisma.product.findFirst({ where: { slug } });
    const uniqueSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    const product = await prisma.product.create({
      data: {
        farmId: farm.id,
        categoryId: categoryId || null,
        name,
        slug: uniqueSlug,
        description,
        price: parseFloat(price),
        stock: parseInt(stock || "0"),
        unit: unit || "kg",
        coverImage: coverImage || null,
        status: "ACTIVE",
        pickupAvailable: pickupAvailable ?? true,
        deliveryAvailable: deliveryAvailable ?? true,
      },
    });

    return NextResponse.json(
      { success: true, data: product, message: "เพิ่มสินค้าสำเร็จ" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Farmer product create error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถเพิ่มสินค้าได้" },
      { status: 500 }
    );
  }
}
