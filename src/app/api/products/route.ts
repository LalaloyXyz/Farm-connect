import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validation";
import { generateSlug } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const skip = (page - 1) * limit;
    const search = searchParams.get("q") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const province = searchParams.get("province") || "";
    const sort = searchParams.get("sort") || "newest";
    const farmId = searchParams.get("farmId") || "";
    const minRating = searchParams.get("minRating");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const isNearby = sort === "nearby" || (lat && lng);

    // Build where clause
    const where: any = {
      status: "ACTIVE",
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (province || minRating) {
      where.farm = {};
      if (province) where.farm.province = province;
      if (minRating) where.farm.ratingAverage = { gte: parseFloat(minRating) };
    }

    if (farmId) {
      where.farmId = farmId;
    }

    // Build orderBy
    let orderBy: any;
    switch (sort) {
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "rating":
        orderBy = { rating: "desc" };
        break;
      case "sold":
        orderBy = { sold: "desc" };
        break;
      case "nearby":
        orderBy = { createdAt: "desc" }; // placeholder, sorted by distance below
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
          status: true,
          createdAt: true,
          farm: {
            select: {
              id: true,
              farmName: true,
              province: true,
              latitude: true,
              longitude: true,
              ratingAverage: true,
            },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy,
        skip,
        take: isNearby ? limit * 3 : limit, // fetch more for nearby re-sort
      }),
      prisma.product.count({ where }),
    ]);

    // If lat/lng provided, calculate distance and sort by proximity
    let data = products;
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      if (!isNaN(userLat) && !isNaN(userLng)) {
        data = products
          .map((p) => {
            let distance = null;
            if (p.farm.latitude && p.farm.longitude) {
              distance = calculateDistance(userLat, userLng, p.farm.latitude, p.farm.longitude);
            }
            return { ...p, distance };
          })
          .filter((p) => p.distance !== null)
          .sort((a, b) => (a.distance as number) - (b.distance as number))
          .slice(0, limit);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        products: data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Products fetch error:", error);
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
        { success: false, message: "เฉพาะเกษตรกรเท่านั้นที่สามารถเพิ่มสินค้าได้" },
        { status: 403 }
      );
    }

    // Check farmer has a farm
    const farm = await prisma.farm.findUnique({
      where: { farmerId: session.user.id },
    });
    if (!farm) {
      return NextResponse.json(
        { success: false, message: "กรุณาสร้างฟาร์มก่อนเพิ่มสินค้า" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = productSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ถูกต้อง", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const slug = generateSlug(data.name);

    // Check slug uniqueness
    const existingProduct = await prisma.product.findUnique({ where: { slug } });
    const finalSlug = existingProduct ? `${slug}-${Date.now()}` : slug;

    const product = await prisma.product.create({
      data: {
        farmId: farm.id,
        categoryId: data.categoryId,
        name: data.name,
        slug: finalSlug,
        description: data.description,
        price: data.price,
        stock: data.stock,
        unit: data.unit,
        weight: data.weight,
        pickupAvailable: data.pickupAvailable,
        deliveryAvailable: data.deliveryAvailable,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        unit: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถสร้างสินค้าได้" },
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
