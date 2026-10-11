import { NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `คุณคือผู้ช่วย FarmConnect AI สำหรับตลาดสินค้าเกษตรออนไลน์
ตอบคำถามเกี่ยวกับฟาร์ม สินค้าเกษตร ราคา แนะนำฟาร์มหรือสินค้า เปรียบเทียบสินค้า
- ตอบสั้น ตรงประเด็น ได้ใจความ
- ใช้ emoji เฉพาะที่จำเป็นจริงๆ ไม่เกิน 1-2 อันต่อข้อความ
- ใช้ภาษาไทยสุภาพ เป็นกันเอง
- ถ้าไม่รู้ให้บอกว่าไม่รู้ อย่าเดา`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { success: false, message: "ไม่ได้ตั้งค่า API Key" },
        { status: 500 }
      );
    }

    const res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("DeepSeek API error:", err);
      return NextResponse.json(
        { success: false, message: "AI ไม่สามารถตอบกลับได้" },
        { status: 500 }
      );
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({ success: true, data: { reply } });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
