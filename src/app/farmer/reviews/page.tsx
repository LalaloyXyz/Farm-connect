"use client"

import { useEffect, useState } from "react"
import {
  Star,
  AlertTriangle,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDate, cn } from "@/lib/utils"

interface ReviewItem {
  id: string
  rating: number
  comment: string | null
  farmerReply: string | null
  createdAt: string
  buyer: {
    firstName: string
    lastName: string
    avatar: string | null
  }
}

export default function FarmerReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // Get farm ID from settings
        const settingsRes = await fetch("/api/farmer/settings")
        if (!settingsRes.ok) throw new Error("ไม่สามารถโหลดข้อมูลฟาร์ม")
        const settingsJson = await settingsRes.json()
        const farmData = settingsJson.data ?? settingsJson
        const farmId = farmData.id
        if (!farmId) throw new Error("กรุณาตั้งค่าฟาร์มก่อน")

        // Fetch reviews for this farm
        const reviewRes = await fetch(`/api/reviews?farmId=${farmId}&limit=20`)
        if (!reviewRes.ok) throw new Error("ไม่สามารถโหลดรีวิวได้")
        const reviewJson = await reviewRes.json()
        setReviews(reviewJson.data?.reviews ?? reviewJson.data ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-1">เกิดข้อผิดพลาด</h2>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          ลองอีกครั้ง
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">รีวิว</h1>
        <p className="text-sm text-muted-foreground">รีวิวจากผู้ซื้อ</p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">ยังไม่มีรีวิว</h3>
            <p className="text-sm text-muted-foreground">
              รีวิวจากผู้ซื้อจะแสดงที่นี่
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-100 text-xs text-green-700">
                        {review.buyer.firstName.charAt(0)}{review.buyer.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {review.buyer.firstName} {review.buyer.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-200"
                        )}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-700">{review.comment}</p>
                )}
                {review.farmerReply && (
                  <div className="ml-4 rounded-lg bg-green-50 p-3 text-sm">
                    <p className="text-xs font-medium text-green-700">คุณตอบกลับ:</p>
                    <p className="mt-0.5 text-gray-600">{review.farmerReply}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
