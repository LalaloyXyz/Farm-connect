"use client";

import { useState, useCallback } from "react";

export interface NominatimResult {
  displayName: string;
  lat: number;
  lng: number;
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
}

interface NominatimApiResponse {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    province?: string;
    state?: string;
    city?: string;
    town?: string;
    district?: string;
    village?: string;
    subdistrict?: string;
    postcode?: string;
  };
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useLocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserLocation = useCallback((): Promise<{
    lat: number;
    lng: number;
  } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง");
        resolve(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLoading(false);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          setIsLoading(false);
          const messages: Record<number, string> = {
            1: "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง",
            2: "ไม่สามารถระบุตำแหน่งได้",
            3: "การขอตำแหน่งหมดเวลา",
          };
          const message = messages[err.code] ?? "เกิดข้อผิดพลาดในการขอตำแหน่ง";
          setError(message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, []);

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      return haversineDistance(lat1, lon1, lat2, lon2);
    },
    []
  );

  const searchAddress = useCallback(
    async (query: string): Promise<NominatimResult[]> => {
      setIsLoading(true);
      setError(null);
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("q", query);
        url.searchParams.set("format", "json");
        url.searchParams.set("limit", "10");
        url.searchParams.set("countrycodes", "th");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("accept-language", "th");

        const res = await fetch(url.toString(), {
          headers: {
            "User-Agent": "FarmConnect/1.0",
          },
        });

        if (!res.ok) {
          throw new Error("ไม่สามารถค้นหาที่อยู่ได้");
        }

        const data: NominatimApiResponse[] = await res.json();

        return data.map((item) => ({
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          province:
            item.address.province ??
            item.address.state ??
            "",
          district:
            item.address.city ??
            item.address.town ??
            item.address.district ??
            "",
          subdistrict:
            item.address.village ??
            item.address.subdistrict ??
            "",
          postalCode: item.address.postcode ?? "",
        }));
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการค้นหาที่อยู่";
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reverseGeocode = useCallback(
    async (
      lat: number,
      lng: number
    ): Promise<NominatimResult | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const url = new URL(
          "https://nominatim.openstreetmap.org/reverse"
        );
        url.searchParams.set("lat", lat.toString());
        url.searchParams.set("lon", lng.toString());
        url.searchParams.set("format", "json");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("accept-language", "th");

        const res = await fetch(url.toString(), {
          headers: {
            "User-Agent": "FarmConnect/1.0",
          },
        });

        if (!res.ok) {
          throw new Error("ไม่สามารถระบุตำแหน่งได้");
        }

        const data: NominatimApiResponse & { error?: string } =
          await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        return {
          displayName: data.display_name,
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lon),
          province:
            data.address.province ??
            data.address.state ??
            "",
          district:
            data.address.city ??
            data.address.town ??
            data.address.district ??
            "",
          subdistrict:
            data.address.village ??
            data.address.subdistrict ??
            "",
          postalCode: data.address.postcode ?? "",
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดในการระบุตำแหน่ง";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    getUserLocation,
    calculateDistance,
    searchAddress,
    reverseGeocode,
    isLoading,
    error,
  } as const;
}
