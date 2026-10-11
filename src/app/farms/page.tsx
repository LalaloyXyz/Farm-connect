"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  MapPin,
  Star,
  Search,
  Users,
  Clock,
  ChevronRight,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance, calculateDistance } from "@/lib/utils";
import { useUserLocation } from "@/hooks/useUserLocation";

interface FarmItem {
  id: string;
  farmName: string;
  coverImage: string | null;
  province: string | null;
  district: string | null;
  ratingAverage: number;
  totalReviews: number;
  followers: number;
  verified: boolean;
  openingTime: string | null;
  closingTime: string | null;
  latitude: number | null;
  longitude: number | null;
  _count: { products: number };
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<FarmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { userLocation } = useUserLocation();

  useEffect(() => {
    fetch("/api/farms")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setFarms(data?.data?.farms ?? data?.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = farms.filter((f) =>
    !search || f.farmName.toLowerCase().includes(search.toLowerCase()) ||
    f.province?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Store className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">ฟาร์มทั้งหมด</h1>
          <Badge variant="secondary">{farms.length} ฟาร์ม</Badge>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาฟาร์มหรือจังหวัด..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-10"
          />
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="h-36 w-full rounded-t-lg" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Store className="h-16 w-16 text-gray-300" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              {search ? "ไม่พบฟาร์มที่ค้นหา" : "ยังไม่มีฟาร์ม"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {search ? "ลองค้นหาด้วยคำอื่น" : "รอเกษตรกรมาลงทะเบียน"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((farm) => (
              <Link key={farm.id} href={`/farms/${farm.id}`}>
                <Card className="group h-full overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
                  <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-green-100 to-emerald-50">
                    {farm.coverImage ? (
                      <img
                        src={farm.coverImage}
                        alt={farm.farmName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Store className="h-14 w-14 text-green-300" />
                    )}
                    {farm.verified && (
                      <Badge className="absolute left-2 top-2 bg-green-600">Verified</Badge>
                    )}
                  </div>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-base font-semibold group-hover:text-green-600">
                        {farm.farmName}
                      </h3>
                      <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{farm.province}{farm.district ? `, ${farm.district}` : ""}</span>
                      {userLocation && farm.latitude && farm.longitude && (
                        <span className="text-[10px] text-green-600 font-medium">
                          {formatDistance(calculateDistance(userLocation.lat, userLocation.lng, farm.latitude, farm.longitude))}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{Number(farm.ratingAverage).toFixed(1)}</span>
                        <span>({farm.totalReviews})</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Package className="h-3 w-3" />
                        <span>{farm._count?.products ?? 0} สินค้า</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Users className="h-3 w-3" />
                        <span>{farm.followers}</span>
                      </div>
                    </div>
                    {farm.openingTime && farm.closingTime && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Clock className="h-3 w-3" />
                        <span>เปิด {farm.openingTime} - {farm.closingTime} น.</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
