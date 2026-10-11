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
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [{ buyerId: session.user.id }, { farmerId: session.user.id }],
      },
      include: {
        messages: {
          select: {
            id: true,
            senderId: true,
            message: true,
            image: true,
            messageType: true,
            isRead: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        buyer: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        farmer: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: "ไม่พบแชท" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error("Chat fetch error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดแชทได้" },
      { status: 500 }
    );
  }
}
