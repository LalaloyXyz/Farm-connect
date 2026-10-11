"use client"

import { useState } from "react"
import Link from "next/link"
import { MapPin, Star, ChevronRight, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface Props {
  farms: any[]
  nearbyFarms: any[]
  loading: boolean
  userLocation: { lat: number; lng: number } | null
}

export default function FarmsSection({ farms, nearbyFarms, loading, userLocation }: Props) {
  const [tab, setTab] = useState("popular")

  return (
    <section className="rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 p-5 sm:p-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("popular")}
            className={cn(
              "text-sm font-semibold transition-colors px-3 py-1.5 rounded-full",
              tab === "popular" ? "bg-green-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            ฟาร์มยอดนิยม
          </button>
          <button
            onClick={() => setTab("nearby")}
            className={cn(
              "text-sm font-semibold transition-colors px-3 py-1.5 rounded-full",
              tab === "nearby" ? "bg-green-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            ฟาร์มใกล้คุณ
          </button>
        </div>
        <Link href="/farms" className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-500 shrink-0">
          ดูทั้งหมด <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {tab === "popular" ? (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent></Card>
            ))
          ) : farms.length > 0 ? (
            farms.slice(0, 3).map((farm: any) => (
              <Link key={farm.id} href={`/farms/${farm.id}`}>
                <Card className="w-[300px] shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-green-200 text-lg text-green-800">{farm.farmName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{farm.farmName}</h3>
                      <p className="truncate text-sm text-muted-foreground">{farm.province}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{Number(farm.ratingAverage).toFixed(1)}</span>
                        <span>({farm.totalReviews})</span>
                        <span>{farm.followers} ผู้ติดตาม</span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-gray-300" />
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <p className="w-full py-8 text-center text-muted-foreground">ยังไม่มีฟาร์มยอดนิยม</p>
          )}
        </div>
      ) : (
        <div>
          {!userLocation && !loading && (
            <p className="mb-3 text-xs text-muted-foreground">เปิดตำแหน่งที่ตั้งเพื่อดูฟาร์มใกล้คุณ</p>
          )}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <FarmCardSkeleton key={i} />)
            ) : nearbyFarms.length > 0 ? (
              nearbyFarms.slice(0, 6).map((farm: any) => <FarmCardView key={farm.id} farm={farm} />)
            ) : farms.length > 0 ? (
              farms.slice(0, 6).map((farm: any) => <FarmCardView key={farm.id} farm={farm} />)
            ) : (
              <p className="w-full py-8 text-center text-muted-foreground">ยังไม่มีฟาร์มใกล้คุณ</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function FarmCardSkeleton() {
  return (
    <Card className="w-[300px] shrink-0 rounded-2xl border border-gray-100">
      <CardContent className="flex items-center gap-4 p-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

function FarmCardView({ farm }: { farm: any }) {
  return (
    <Link href={`/farms/${farm.id}`} className="shrink-0">
      <Card className="w-[300px] shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-green-200 text-lg text-green-800">{farm.farmName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{farm.farmName}</h3>
            <p className="truncate text-sm text-muted-foreground">{farm.province}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{Number(farm.ratingAverage).toFixed(1)}</span>
              <span>({farm.totalReviews})</span>
              {farm.distance != null && (
                <span className="text-green-600 font-medium text-[10px] ml-auto">
                  {farm.distance < 1000 ? `${Math.round(farm.distance)} ม.` : `${(farm.distance / 1000).toFixed(1)} กม.`}
                </span>
              )}
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-gray-300" />
        </CardContent>
      </Card>
    </Link>
  )
}
