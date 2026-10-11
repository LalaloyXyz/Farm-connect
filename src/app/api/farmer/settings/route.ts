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

    const farm = await prisma.farm.findUnique({
      where: { farmerId: session.user.id },
    });

    if (!farm) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: farm });
  } catch (error) {
    console.error("Farm settings fetch error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดข้อมูลฟาร์มได้" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { farmName, description, phone, address, province, district, subdistrict, postalCode, openingTime, closingTime, latitude, longitude, coverImage } = body;

    const existing = await prisma.farm.findUnique({
      where: { farmerId: session.user.id },
    });

    const data: any = {
      farmName,
      description,
      phone,
      address,
      province,
      district,
      subdistrict,
      postalCode,
      openingTime,
      closingTime,
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      coverImage,
    };

    // Remove undefined fields
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    let farm;
    if (existing) {
      farm = await prisma.farm.update({
        where: { farmerId: session.user.id },
        data,
      });
    } else {
      farm = await prisma.farm.create({
        data: {
          ...data,
          farmerId: session.user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: farm,
      message: existing ? "อัปเดตฟาร์มสำเร็จ" : "สร้างฟาร์มสำเร็จ",
    });
  } catch (error) {
    console.error("Farm settings save error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถบันทึกข้อมูลฟาร์มได้" },
      { status: 500 }
    );
  }
}
