"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Sparkles, X, Send, Bot, Store, Package,
  ChevronRight, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, formatPrice } from "@/lib/utils"

interface Message {
  role: "user" | "bot"
  text: string
  results?: { type: "farm" | "product"; id: string; name: string; subtitle?: string; price?: number; img?: string }[]
  reviews?: { rating: number; comment: string; buyer: string }[]
  suggestions?: string[]
  fallback?: boolean // true when results are "popular items" rather than an actual match
}

interface Filters {
  intent?: "search_product" | "search_farm" | "review" | "general"
  province?: string
  priceMin?: number
  priceMax?: number
  farmName?: string
  keywords?: string
  nearby?: boolean
}

const SUGGESTIONS = [
  "ช่วยหาร้านผักใกล้ๆให้หน่อย",
  "ช่วยเปรียบเทียบราคาสินค้าเกษตร",
  "ฟาร์มในจังหวัดอะไรบ้าง",
  "ดูรีวิวให้หน่อย",
]

const STORAGE_KEY = "farmconnect_ai_messages"
const FILTERS_KEY = "farmconnect_ai_filters"

const CLASSIFY_SYSTEM = `คุณเป็นตัวช่วยแยกความตั้งใจ (intent) และดึงข้อมูลจากคำถามของผู้ใช้ร้านค้าเกษตรออนไลน์
ตอบกลับเป็น JSON เท่านั้น ไม่มีคำอธิบายอื่น รูปแบบ:
{"intent":"search_product|search_farm|review|general","province":string|null,"priceMin":number|null,"priceMax":number|null,"farmName":string|null,"keywords":string|null,"nearby":boolean|null}

กติกา:
- ถ้าผู้ใช้ถามต่อเนื่องแบบไม่ระบุใหม่ (เช่น "ถูกกว่านี้มีไหม", "ที่จังหวัดเดิม") ให้คงค่าฟิลด์เดิมที่ให้มาไว้ (จาก "ฟิลเตอร์ปัจจุบัน") เว้นแต่ข้อความใหม่ระบุเปลี่ยน
- keywords คือคำค้นสินค้า/หมวดสินค้า ไม่ใช่ทั้งประโยค
- ถ้าถามรีวิว ให้ intent เป็น "review" และใส่ farmName
- priceMin/priceMax ให้แปลงจากคำพูด เช่น "ไม่เกิน 100 บาท" -> priceMax:100
- nearby=true ถ้าผู้ใช้ต้องการสินค้าหรือฟาร์มใกล้ๆ (เช่น "ใกล้ๆ", "แถวนี้", "ใกล้บ้าน", "nearby")`

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "สวัสดีครับ ถามอะไรเกี่ยวกับฟาร์มหรือสินค้าเกษตรได้เลย", suggestions: SUGGESTIONS }
  ])
  const [filters, setFilters] = useState<Filters>({})
  const [userLoc, setUserLoc] = useState<{lat: number; lng: number} | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Tracks the in-flight request so a slower, older response can never
  // overwrite a newer one if the user fires off two messages quickly.
  const requestIdRef = useRef(0)

  // Request location once on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 5000 }
      )
    }
  }, [])

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) setMessages(JSON.parse(saved))
      const savedFilters = sessionStorage.getItem(FILTERS_KEY)
      if (savedFilters) setFilters(JSON.parse(savedFilters))
    } catch {}
  }, [])

  useEffect(() => { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages)) } catch {} }, [messages])
  useEffect(() => { try { sessionStorage.setItem(FILTERS_KEY, JSON.stringify(filters)) } catch {} }, [filters])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  // Listen for AI Search from homepage — keep latest handler via ref
  const handleSendRef = useRef(handleSend)
  handleSendRef.current = handleSend

  useEffect(() => {
    const handler = (e: Event) => {
      const query = (e as CustomEvent).detail
      if (query) {
        setOpen(true)
        setTimeout(() => {
          inputRef.current?.focus()
          handleSendRef.current(query)
        }, 300)
      }
    }
    window.addEventListener("ai-search", handler)
    return () => window.removeEventListener("ai-search", handler)
  }, [])
  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  async function classify(q: string, prevFilters: Filters): Promise<Filters> {
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: CLASSIFY_SYSTEM },
            { role: "user", content: `ฟิลเตอร์ปัจจุบัน: ${JSON.stringify(prevFilters)}\nข้อความผู้ใช้: ${q}` },
          ],
        }),
      })
      const raw = (await res.json())?.data?.reply || "{}"
      const cleaned = raw.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(cleaned)
      return {
        intent: parsed.intent ?? prevFilters.intent ?? "general",
        province: parsed.province ?? prevFilters.province,
        priceMin: parsed.priceMin ?? undefined,
        priceMax: parsed.priceMax ?? undefined,
        farmName: parsed.farmName ?? prevFilters.farmName,
        keywords: parsed.keywords ?? undefined,
        nearby: parsed.nearby ?? prevFilters.nearby ?? undefined,
      }
    } catch {
      // Keep whatever we already knew instead of throwing it away.
      return { ...prevFilters, intent: prevFilters.intent ?? "general" }
    }
  }

  async function handleSend(text: string) {
    const q = text.trim()
    if (!q || loading) return

    const myRequestId = ++requestIdRef.current

    setMessages((prev) => [...prev, { role: "user", text: q }])
    setInput("")
    setLoading(true)

    try {
      const isReview = ["รีวิว", "review", "ดีไหม", "ความคิดเห็น", "คะแนน"].some((k) => q.toLowerCase().includes(k))
      const parsed = await classify(q, filters)

      // Bail out silently if a newer message has since been sent.
      if (myRequestId !== requestIdRef.current) return

      setFilters(parsed)

      let farmResults: any[] = []
      let productResults: any[] = []
      let reviewResults: any[] = []
      let farmName = parsed.farmName || ""
      let usedFallback = false
      const forcedReview = isReview || parsed.intent === "review"

      if (forcedReview) {
        const prodQuery = parsed.keywords || farmName
        if (prodQuery) {
          const pd = await (await fetch(`/api/products?q=${encodeURIComponent(prodQuery)}&limit=1`)).json()
          const prods = pd?.data?.products ?? pd?.data ?? []
          if (prods[0]) {
            productResults = [prods[0]]
            const farmId = prods[0].farm?.id || prods[0].farmId
            const rd = await (await fetch(`/api/reviews?productId=${prods[0].id}&farmId=${farmId}&limit=5`)).json()
            reviewResults = rd?.data?.reviews ?? rd?.data ?? []
          }
        }
        if (reviewResults.length === 0 && farmName) {
          // Only search by farm name if the user actually gave one —
          // never fall back to a placeholder name.
          const fd = await (await fetch(`/api/farms?q=${encodeURIComponent(farmName)}&limit=1`)).json()
          const farms = fd?.data?.farms ?? fd?.data ?? []
          if (farms[0]) {
            farmResults = [farms[0]]
            const rd = await (await fetch(`/api/reviews?farmId=${farms[0].id}&limit=5`)).json()
            reviewResults = rd?.data?.reviews ?? rd?.data ?? []
          }
        }
      } else if (parsed.intent === "search_farm") {
        const params = new URLSearchParams()
        const isNearby = parsed.nearby || q.toLowerCase().includes("ใกล้")
        if (isNearby && userLoc) {
          params.set("sort", "nearby")
          params.set("lat", String(userLoc.lat))
          params.set("lng", String(userLoc.lng))
        } else {
          if (parsed.keywords) params.set("q", parsed.keywords)
          if (parsed.province) params.set("province", parsed.province)
          params.set("sort", "popular")
        }
        params.set("limit", "5")
        const fd = await (await fetch(`/api/farms?${params}`)).json()
        farmResults = fd?.data?.farms ?? []
        if (farmResults.length === 0) {
          const url = isNearby && userLoc
            ? `/api/farms?limit=3&sort=nearby&lat=${userLoc.lat}&lng=${userLoc.lng}`
            : "/api/farms?limit=3&sort=popular"
          const fallback = await (await fetch(url)).json()
          farmResults = fallback?.data?.farms ?? []
          usedFallback = farmResults.length > 0
        }
      } else if (parsed.intent === "search_product") {
        const params = new URLSearchParams()
        const isNearby = parsed.nearby || q.toLowerCase().includes("ใกล้")
        if (parsed.keywords) params.set("q", parsed.keywords)
        if (parsed.priceMin != null) params.set("priceMin", String(parsed.priceMin))
        if (parsed.priceMax != null) params.set("priceMax", String(parsed.priceMax))
        params.set("limit", "5")
        if (isNearby && userLoc) {
          params.set("sort", "nearby")
          params.set("lat", String(userLoc.lat))
          params.set("lng", String(userLoc.lng))
        } else {
          params.set("sort", "popular")
        }
        const pd = await (await fetch(`/api/products?${params}`)).json()
        productResults = pd?.data?.products ?? []
        if (productResults.length === 0) {
          const fallbackUrl = isNearby && userLoc
            ? `/api/products?limit=3&sort=nearby&lat=${userLoc.lat}&lng=${userLoc.lng}`
            : "/api/products?limit=3&sort=popular"
          const fallback = await (await fetch(fallbackUrl)).json()
          productResults = fallback?.data?.products ?? []
          usedFallback = productResults.length > 0
        }
        if (parsed.province) {
          const fd = await (await fetch(`/api/farms?province=${encodeURIComponent(parsed.province)}&limit=3`)).json()
          farmResults = fd?.data?.farms ?? []
        }
      }
      // "general" intent: no longer fetches random popular items. If the
      // user isn't clearly searching for something, we let the model just
      // reply conversationally instead of dumping unrelated cards.

      if (myRequestId !== requestIdRef.current) return

      const contextParts: string[] = []
      if (reviewResults.length > 0) {
        const label = productResults[0]?.name || farmName || ""
        contextParts.push(`รีวิว "${label}":\n` + reviewResults.map((r: any) =>
          `- ${r.rating}/5 "${r.comment || ""}" โดย ${r.buyer?.firstName || "ผู้ซื้อ"}`).join("\n"))
      }
      if (farmResults.length > 0) contextParts.push(`ฟาร์ม${usedFallback ? " (แนะนำ)" : ""}: ${farmResults.map((f: any) => {
        const d = f.distance != null ? (f.distance < 1000 ? ` ${Math.round(f.distance)}ม.` : ` ${(f.distance / 1000).toFixed(1)}กม.`) : ""
        return f.farmName + "(" + (f.province || "") + ")" + d
      }).join(", ")}`)
      if (productResults.length > 0) contextParts.push(`สินค้า${usedFallback ? " (แนะนำ ไม่ตรงกับที่ค้นหาเป๊ะ)" : ""}: ${productResults.map((p: any) => p.name + " " + Number(p.price) + "บ.").join(", ")}`)

      let reply = ""
      try {
        // /api/ai/chat expects standard chat-completion roles. Our Message
        // type uses "bot" for assistant turns internally, so it must be
        // translated here or the API call fails and we silently fall back
        // to the hardcoded strings below.
        const hist = messages.slice(-4).map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.text }))
        hist.push({
          role: "user",
          content: q + "\nข้อมูล:\n" + (contextParts.join("\n") || "(ไม่พบข้อมูลที่ตรงกับคำถาม)") +
            "\n\nตอบสั้น ตรงประเด็น ใช้ข้อมูลนี้เท่านั้น อย่าใช้คำพูดซ้ำซาก ถ้าไม่พบข้อมูลให้บอกตรงๆ ว่าไม่พบ อย่าสมมติข้อมูลขึ้นเอง",
        })
        const replyRes = await fetch("/api/ai/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: hist }),
        })
        if (!replyRes.ok) {
          console.error("[AIAssistant] /api/ai/chat reply call failed", replyRes.status, await replyRes.text().catch(() => ""))
        } else {
          reply = (await replyRes.json())?.data?.reply || ""
        }
      } catch (err) {
        console.error("[AIAssistant] reply generation threw", err)
      }

      if (myRequestId !== requestIdRef.current) return

      const results = [
        ...farmResults.map((f: any) => {
          const dist = f.distance != null
            ? (f.distance < 1000 ? `${Math.round(f.distance)} ม.` : `${(f.distance / 1000).toFixed(1)} กม.`)
            : ""
          return {
            type: "farm" as const, id: f.id, name: f.farmName,
            subtitle: reviewResults.length > 0 ? `⭐${f.ratingAverage}/5` : dist ? `${dist} · ${f.province || ""}` : f.province || "",
            img: f.coverImage,
          }
        }),
        ...productResults.map((p: any) => {
          const dist = p.distance != null
            ? (p.distance < 1000 ? `${Math.round(p.distance)} ม.` : `${(p.distance / 1000).toFixed(1)} กม.`)
            : ""
          return {
            type: "product" as const, id: p.slug, name: p.name,
            subtitle: dist ? `${dist} · ${p.farm?.farmName || ""}` : p.farm?.farmName || "",
            price: Number(p.price), img: p.coverImage,
          }
        }),
      ]
      const reviewsData = reviewResults.length > 0 ? reviewResults.map((r: any) => ({ rating: r.rating, comment: r.comment || "", buyer: r.buyer?.firstName || "" })) : undefined

      setMessages((prev) => [...prev, {
        role: "bot",
        text: reply || (reviewsData
          ? `รีวิว "${productResults[0]?.name || farmName || ''}" ${reviewsData.length} รายการ`
          : results.length > 0
            ? (usedFallback ? `ไม่พบรายการที่ตรงเป๊ะ นี่คือรายการยอดนิยมแทน:` : (productResults.length > 0 ? `สินค้าที่มีในระบบ:` : `ฟาร์มที่มีในระบบ:`))
            : `ไม่พบข้อมูลที่ตรงกับคำถามครับ`),
        results: results.length > 0 ? results : undefined,
        reviews: reviewsData,
        fallback: usedFallback,
        suggestions: reviewsData
          ? ["ช่วยเปรียบเทียบราคาสินค้าเกษตร", "หาร้านใกล้ๆให้หน่อย"]
          : ["ช่วยเปรียบเทียบราคาสินค้าเกษตร", "หาร้านใกล้ๆให้หน่อย", "ฟาร์มในจังหวัดอะไรบ้าง"],
      }])
    } catch {
      if (myRequestId === requestIdRef.current) {
        setMessages((prev) => [...prev, { role: "bot", text: "ขออภัย ลองใหม่อีกครั้ง", suggestions: SUGGESTIONS }])
      }
    }
    if (myRequestId === requestIdRef.current) setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={cn("fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-all hover:bg-green-700 hover:scale-105 active:scale-95", open && "scale-0 opacity-0")} style={{ boxShadow: "0 4px 20px rgba(22, 163, 74, 0.4)" }}>
        <Sparkles className="h-6 w-6" />
      </button>

      <div className={cn("fixed bottom-20 right-4 z-50 flex w-[90vw] max-w-sm flex-col rounded-2xl border bg-white shadow-2xl transition-all duration-300", open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0")} style={{ height: "70vh", maxHeight: "600px" }}>
        <div className="flex shrink-0 items-center justify-between rounded-t-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 text-white">
          <div className="flex items-center gap-2"><Bot className="h-5 w-5" /><span className="text-sm font-semibold">FarmConnect AI</span></div>
          <div className="flex items-center gap-1">
            <button onClick={() => {
              setMessages([{ role: "bot", text: "สวัสดีครับ ถามอะไรเกี่ยวกับฟาร์มหรือสินค้าเกษตรได้เลย", suggestions: SUGGESTIONS }])
              setFilters({})
              try { sessionStorage.removeItem(STORAGE_KEY); sessionStorage.removeItem(FILTERS_KEY) } catch {}
            }} className="rounded-full p-1.5 hover:bg-white/20 text-xs" title="เริ่มการสนทนาใหม่">🔄</button>
            <button onClick={() => { setOpen(false); try { sessionStorage.removeItem(STORAGE_KEY); sessionStorage.removeItem(FILTERS_KEY) } catch {}; setFilters({}) }} className="rounded-full p-1 hover:bg-white/20"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 p-3">
          {messages.map((msg, i) => (
            <div key={i}>
              <div className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", msg.role === "user" ? "bg-green-600 text-white rounded-br-sm" : "bg-gray-100 rounded-bl-sm")}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>

              {msg.results && msg.results.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {msg.fallback && (
                    <p className="px-1 text-[11px] text-muted-foreground">รายการแนะนำ (ไม่ตรงกับที่ค้นหาโดยตรง)</p>
                  )}
                  {msg.results.map((r) => (
                    <Link key={r.id} href={r.type === "farm" ? `/farms/${r.id}` : `/products/${r.id}`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg border bg-white p-2.5 transition-colors hover:bg-green-50">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-50">
                        {r.img ? <img src={r.img} alt="" className="h-full w-full rounded-lg object-cover" /> : r.type === "farm" ? <Store className="h-5 w-5 text-green-500" /> : <Package className="h-5 w-5 text-green-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
                      </div>
                      {r.price != null && <span className="shrink-0 text-sm font-bold text-green-700">{formatPrice(r.price)}</span>}
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}

              {msg.reviews && msg.reviews.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {msg.reviews.map((r, idx) => (
                    <div key={idx} className="rounded-lg border bg-white p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{r.buyer}</span>
                        <span className="text-xs text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      </div>
                      {r.comment && <p className="mt-0.5 text-xs text-gray-600">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}

              {msg.suggestions && msg.suggestions.length > 0 && i === messages.length - 1 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.suggestions.map((s) => (
                    <button key={s} onClick={() => handleSend(s)} disabled={loading} className="rounded-full border bg-white px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-green-300 hover:text-green-700 disabled:opacity-50">{s}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> กำลังค้นหา...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 border-t p-3">
          <div className="flex items-center gap-2">
            <Input ref={inputRef} placeholder="พิมพ์คำถาม..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input) } }} className="h-9 text-sm" />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => handleSend(input)} disabled={!input.trim() || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}