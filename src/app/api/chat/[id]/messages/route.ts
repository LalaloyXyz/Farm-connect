import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
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
    const { message, messageType } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกข้อความ" },
        { status: 400 }
      );
    }

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

    const msg = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: session.user.id,
        message,
        messageType: messageType || "TEXT",
      },
    });

    // Update conversation last message
    await prisma.conversation.update({
      where: { id },
      data: { lastMessage: message, lastMessageTime: new Date() },
    });

    return NextResponse.json(
      { success: true, data: msg },
      { status: 201 }
    );
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถส่งข้อความได้" },
      { status: 500 }
    );
  }
}
