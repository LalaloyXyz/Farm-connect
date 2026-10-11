"use client";

import { useState, useEffect } from "react";

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLoadingLocation(false);
        },
        () => {
          setLoadingLocation(false);
        },
        { enableHighAccuracy: false, timeout: 5000 },
      );
    } else {
      setLoadingLocation(false);
    }
  }, []);

  return { userLocation, loadingLocation };
}
