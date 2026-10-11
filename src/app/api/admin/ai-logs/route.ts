import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    const logs = await prisma.aIChatLog.findMany({
      select: {
        id: true,
        prompt: true,
        response: true,
        createdAt: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("AI logs fetch error:", error);
    return NextResponse.json({ success: false, message: "ไม่สามารถโหลดข้อมูลได้" }, { status: 500 });
  }
}
