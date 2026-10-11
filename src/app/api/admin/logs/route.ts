import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readFileSync, statSync } from "fs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    const logFile = "/tmp/nextdev.log";
    const maxLines = 200;

    try {
      const stats = statSync(logFile);
      const size = stats.size;
      const chunkSize = Math.min(size, 50000);
      const buffer = Buffer.alloc(chunkSize);
      const fd = require("fs").openSync(logFile, "r");
      require("fs").readSync(fd, buffer, 0, chunkSize, Math.max(0, size - chunkSize));
      require("fs").closeSync(fd);

      const text = buffer.toString("utf-8");
      const lines = text.split("\n").filter(Boolean).slice(-maxLines).reverse();

      return NextResponse.json({ success: true, data: lines });
    } catch {
      return NextResponse.json({ success: true, data: ["ไม่พบไฟล์ log"] });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: "ไม่สามารถโหลดข้อมูลได้" }, { status: 500 });
  }
}
