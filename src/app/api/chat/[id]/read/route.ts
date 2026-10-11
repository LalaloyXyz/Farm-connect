import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
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

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [{ buyerId: session.user.id }, { farmerId: session.user.id }],
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: "ไม่พบแชท" },
        { status: 404 }
      );
    }

    // Mark all messages from the other user as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      data: { message: "อ่านแล้ว" },
    });
  } catch (error) {
    console.error("Chat read error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถอัปเดตสถานะการอ่านได้" },
      { status: 500 }
    );
  }
}
