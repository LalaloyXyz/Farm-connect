import { prisma } from "@/lib/db";

/** Maximum daily AI requests per user. */
const DAILY_LIMIT = 20;

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface AiProductDescriptionParams {
  productName: string;
  category: string;
}

export interface AiSearchParams {
  query: string;
  filters?: Record<string, string>;
}

export interface AiSearchResult {
  type: "product" | "farm" | "general";
  title: string;
  description: string;
  relevance: number;
  link?: string;
}

export interface AiRecommendation {
  type: "product" | "farm";
  title: string;
  description: string;
  reason: string;
  imageUrl?: string;
  id?: string;
}

export interface AiChatLog {
  userId: string;
  prompt: string;
  response: string;
  tokens: number;
}

export interface AiApiResponse {
  content: string;
  tokens: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return {
    async chat(
      messages: { role: "system" | "user" | "assistant"; content: string }[],
      maxTokens = 500
    ): Promise<AiApiResponse> {
      const res = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            max_tokens: maxTokens,
          }),
        }
      );

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenAI API error (${res.status}): ${body}`);
      }

      const data = await res.json();

      return {
        content: (data.choices?.[0]?.message?.content ?? "").trim(),
        tokens: data.usage?.total_tokens ?? 0,
      };
    },
  };
}

async function enforceDailyLimit(userId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await prisma.aIChatLog.count({
    where: {
      userId,
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  if (count >= DAILY_LIMIT) {
    throw new Error(
      "คุณใช้คำขอ AI ครบจำนวน 20 ครั้งต่อวันแล้ว กรุณากลับมาใหม่พรุ่งนี้"
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Generate a product description using OpenAI.
 */
export async function generateProductDescription(
  productName: string,
  category: string
): Promise<string> {
  const client = getOpenAIClient();

  const { content } = await client.chat([
    {
      role: "system",
      content:
        "คุณคือผู้ช่วยเขียนคำอธิบายสินค้าเกษตรไทย " +
        "ตอบเป็นภาษาไทย กระชับ ไม่เกิน 3 ประโยค เน้นจุดเด่นของสินค้า",
    },
    {
      role: "user",
      content: `ช่วยเขียนคำอธิบายสำหรับสินค้า "${productName}" "ในหมวด ${category}"`,
    },
  ]);

  return content;
}

/**
 * AI-powered search across products and farms.
 */
export async function aiSearch(
  query: string,
  _filters?: Record<string, string>
): Promise<AiSearchResult[]> {
  const client = getOpenAIClient();

  const { content } = await client.chat([
    {
      role: "system",
      content:
        "คุณคือผู้ช่วยค้นหาสินค้าเกษตร " +
        "ตอบเป็น JSON array เท่านั้น " +
        '[{"type":"product|farm|general","title":"...","description":"...","relevance":0-100}]',
    },
    {
      role: "user",
      content: `ค้นหา: "${query}"`,
    },
  ]);

  try {
    const results: AiSearchResult[] = JSON.parse(content);
    return results.slice(0, 10);
  } catch {
    return [
      {
        type: "general",
        title: query,
        description: content,
        relevance: 100,
      },
    ];
  }
}

/**
 * Get personalised AI recommendations for a user.
 */
export async function getRecommendations(
  userId: string
): Promise<AiRecommendation[]> {
  const client = getOpenAIClient();

  const recentOrders = await prisma.order.findMany({
    where: { buyerId: userId },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, category: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  type FlatOrder = { items: { product: { name: string; category: { name: string } | null } }[] };
  const purchaseHistory = (recentOrders as FlatOrder[])
    .flatMap((o) => o.items)
    .map((i) => `${i.product.name} (${i.product.category?.name ?? ""})`)
    .join(", ");

  const prompt = purchaseHistory
    ? `ผู้ใช้เคยซื้อ: ${purchaseHistory}`
    : "ผู้ใช้ใหม่ยังไม่มีประวัติการซื้อ";

  const { content } = await client.chat([
    {
      role: "system",
      content:
        "คุณคือระบบแนะนำสินค้าเกษตร " +
        "ตอบเป็น JSON array เท่านั้น " +
        '[{"type":"product|farm","title":"...","description":"...","reason":"..."}]',
    },
    {
      role: "user",
      content: prompt,
    },
  ]);

  try {
    const recommendations: AiRecommendation[] = JSON.parse(content);
    return recommendations.slice(0, 6);
  } catch {
    return [];
  }
}

/**
 * Check remaining AI requests for the user today.
 */
export async function checkAILimit(
  userId: string
): Promise<{ remaining: number; limit: number; resetAt: Date }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await prisma.aIChatLog.count({
    where: {
      userId,
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  return {
    remaining: Math.max(0, DAILY_LIMIT - count),
    limit: DAILY_LIMIT,
    resetAt: tomorrow,
  };
}

/**
 * Log an AI interaction to the database.
 */
export async function logAIChat(
  userId: string,
  prompt: string,
  response: string,
  tokens: number
): Promise<void> {
  await prisma.aIChatLog.create({
    data: {
      userId,
      prompt,
      response,
      tokens,
    },
  });
}
