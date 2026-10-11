import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all"; // "all", "products", "farms"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;
    const autocomplete = searchParams.get("autocomplete") === "true";

    if (!q || q.trim().length === 0) {
      return NextResponse.json({
        success: true,
        data: { products: [], farms: [], total: 0, suggestions: [] },
      });
    }

    const keyword = q.trim();

    // Log search history (fire-and-forget for guests)
    const session = await auth();
    if (session?.user?.id && !autocomplete) {
      prisma.searchHistory
        .create({
          data: {
            keyword,
            buyerId: session.user.id,
          },
        })
        .catch(() => {});
    }

    // Autocomplete mode: just return keyword suggestions
    if (autocomplete) {
      const recentSearches = await prisma.searchHistory.findMany({
        where: {
          keyword: { contains: keyword },
          ...(session?.user?.id ? { buyerId: session.user.id } : {}),
        },
        select: { keyword: true },
        orderBy: { searchedAt: "desc" },
        take: 10,
        distinct: ["keyword"],
      });

      const suggestions = [
        ...new Set(recentSearches.map((s) => s.keyword)),
      ].slice(0, 8);

      return NextResponse.json({
        success: true,
        data: { suggestions },
      });
    }

    // Full search mode
    const searchCondition = { contains: keyword };

    let products: any[] = [];
    let farms: any[] = [];
    let total = 0;

    if (type === "all" || type === "products") {
      const productWhere: any = {
        status: "ACTIVE",
        deletedAt: null,
        OR: [
          { name: searchCondition },
          { description: searchCondition },
        ],
      };

      const [productResults, productCount] = await Promise.all([
        prisma.product.findMany({
          where: productWhere,
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
            farm: {
              select: { id: true, farmName: true, province: true },
            },
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
          orderBy: [{ sold: "desc" }, { rating: "desc" }],
          skip,
          take: limit,
        }),
        prisma.product.count({ where: productWhere }),
      ]);

      products = productResults;
      total += productCount;
    }

    if (type === "all" || type === "farms") {
      const farmWhere: any = {
        deletedAt: null,
        OR: [
          { farmName: searchCondition },
          { description: searchCondition },
          { province: searchCondition },
          { district: searchCondition },
        ],
      };

      const [farmResults, farmCount] = await Promise.all([
        prisma.farm.findMany({
          where: farmWhere,
          select: {
            id: true,
            farmName: true,
            coverImage: true,
            province: true,
            district: true,
            ratingAverage: true,
            totalReviews: true,
            followers: true,
            verified: true,
            _count: {
              select: {
                products: { where: { status: "ACTIVE", deletedAt: null } },
              },
            },
          },
          orderBy: [{ ratingAverage: "desc" }, { followers: "desc" }],
          skip,
          take: limit,
        }),
        prisma.farm.count({ where: farmWhere }),
      ]);

      farms = farmResults;
      total += farmCount;
    }

    return NextResponse.json({
      success: true,
      data: {
        products,
        farms,
        total,
        query: keyword,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถค้นหาได้" },
      { status: 500 }
    );
  }
}
