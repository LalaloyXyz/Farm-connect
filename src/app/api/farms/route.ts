import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { farmSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const skip = (page - 1) * limit;
    const search = searchParams.get("q") || "";
    const province = searchParams.get("province") || "";
    const sort = searchParams.get("sort") || "newest";
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { farmName: { contains: search } },
        { description: { contains: search } },
        { province: { contains: search } },
      ];
    }

    if (province) {
      where.province = province;
    }

    let orderBy: any;
    switch (sort) {
      case "rating":
        orderBy = { ratingAverage: "desc" };
        break;
      case "followers":
        orderBy = { followers: "desc" };
        break;
      case "nearby":
        orderBy = { createdAt: "desc" }; // placeholder, sorted by distance below
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const [farms, total] = await Promise.all([
      prisma.farm.findMany({
        where,
        select: {
          id: true,
          farmName: true,
          description: true,
          coverImage: true,
          latitude: true,
          longitude: true,
          province: true,
          district: true,
          ratingAverage: true,
          totalReviews: true,
          followers: true,
          verified: true,
          createdAt: true,
          _count: {
            select: {
              products: { where: { status: "ACTIVE", deletedAt: null } },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.farm.count({ where }),
    ]);

    // If lat/lng provided, calculate distance
    let data = farms;
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      if (!isNaN(userLat) && !isNaN(userLng)) {
        data = farms
          .map((farm) => {
            let distance = null;
            if (farm.latitude && farm.longitude) {
              distance = calculateDistance(
                userLat,
                userLng,
                farm.latitude,
                farm.longitude
              );
            }
            return { ...farm, distance };
          })
          .sort((a, b) => {
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        farms: data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Farms fetch error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดฟาร์มได้" },
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
        { success: false, message: "เฉพาะเกษตรกรเท่านั้นที่สามารถสร้างฟาร์มได้" },
        { status: 403 }
      );
    }

    // Check if farmer already has a farm
    const existingFarm = await prisma.farm.findUnique({
      where: { farmerId: session.user.id },
    });
    if (existingFarm) {
      return NextResponse.json(
        { success: false, message: "คุณมีฟาร์มอยู่แล้ว" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = farmSchema.safeParse(body);
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

    const data = validation.data;

    const farm = await prisma.farm.create({
      data: {
        farmerId: session.user.id,
        farmName: data.farmName,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        province: data.province,
        district: data.district,
        subdistrict: data.subdistrict,
        postalCode: data.postalCode,
        openingTime: data.openingTime,
        closingTime: data.closingTime,
        phone: data.phone,
      },
    });

    return NextResponse.json({ success: true, data: farm }, { status: 201 });
  } catch (error) {
    console.error("Farm create error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถสร้างฟาร์มได้" },
      { status: 500 }
    );
  }
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
