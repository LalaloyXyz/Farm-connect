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

    const userId = session.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { farmerId: userId }],
      },
      select: {
        id: true,
        buyerId: true,
        farmerId: true,
        lastMessage: true,
        lastMessageTime: true,
        createdAt: true,
        buyer: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        farmer: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        _count: {
          select: {
            messages: { where: { senderId: { not: userId }, isRead: false } },
          },
        },
      },
      orderBy: { lastMessageTime: "desc" },
    });

    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    console.error("Chat fetch error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถโหลดแชทได้" },
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

    const { farmerId, message } = await request.json();

    if (!farmerId || !message) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุข้อมูลให้ครบ" },
        { status: 400 }
      );
    }

    // Find existing conversation (could be buyer or farmer initiating)
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { buyerId: session.user.id, farmerId },
          { buyerId: farmerId, farmerId: session.user.id },
        ],
      },
    });

    if (!conversation) {
      // Determine buyer/farmer roles: current user could be either
      const [buyerId, actualFarmerId] =
        session.user.role === "FARMER"
          ? [farmerId, session.user.id]
          : [session.user.id, farmerId];

      conversation = await prisma.conversation.create({
        data: {
          buyerId,
          farmerId: actualFarmerId,
          lastMessage: message,
          lastMessageTime: new Date(),
        },
      });
    }

    const msg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        message,
        messageType: "TEXT",
      },
    });

    // Update conversation last message
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessage: message, lastMessageTime: new Date() },
    });

    return NextResponse.json(
      { success: true, data: msg },
      { status: 201 }
    );
  } catch (error) {
    console.error("Chat create error:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถส่งข้อความได้" },
      { status: 500 }
    );
  }
}
