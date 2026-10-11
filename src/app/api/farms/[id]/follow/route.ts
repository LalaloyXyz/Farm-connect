import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: true, data: { following: false } });
    }
    const { id } = await params;
    const existing = await prisma.farmerFollower.findUnique({
      where: { buyerId_farmId: { buyerId: session.user.id, farmId: id } },
    });
    return NextResponse.json({
      success: true,
      data: { following: !!existing },
    });
  } catch {
    return NextResponse.json({ success: true, data: { following: false } });
  }
}

export async function POST(
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

    // Check farm exists
    const farm = await prisma.farm.findUnique({ where: { id } });
    if (!farm) {
      return NextResponse.json(
        { success: false, message: "ไม่พบฟาร์ม" },
        { status: 404 }
      );
    }

    // Check if already following
    const existing = await prisma.farmerFollower.findUnique({
      where: { buyerId_farmId: { buyerId: session.user.id, farmId: id } },
    });

    if (existing) {
      // Unfollow
      await prisma.farmerFollower.delete({
        where: { buyerId_farmId: { buyerId: session.user.id, farmId: id } },
      });
      await prisma.farm.update({
        where: { id },
        data: { followers: { decrement: 1 } },
      });
      return NextResponse.json({
        success: true,
        data: { following: false, followers: farm.followers - 1 },
      });
    } else {
      // Follow
      await prisma.farmerFollower.create({
        data: { buyerId: session.user.id, farmId: id },
      });
      await prisma.farm.update({
        where: { id },
        data: { followers: { increment: 1 } },
      });
      return NextResponse.json({
        success: true,
        data: { following: true, followers: farm.followers + 1 },
      });
    }
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถติดตามฟาร์มได้" },
      { status: 500 }
    );
  }
}
