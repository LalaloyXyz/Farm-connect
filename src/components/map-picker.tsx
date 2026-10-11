"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet default marker icon path (bundler issue)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

interface MapPickerProps {
  latitude: string
  longitude: string
  onLocationSelect: (lat: string, lng: string) => void
}

export default function MapPicker({ latitude, longitude, onLocationSelect }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const lat = parseFloat(latitude) || 13.736717
  const lng = parseFloat(longitude) || 100.523186

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current).setView([lat, lng], 13)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map)

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
    markerRef.current = marker

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      onLocationSelect(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6))
    })

    marker.on("dragend", () => {
      const pos = marker.getLatLng()
      onLocationSelect(pos.lat.toFixed(6), pos.lng.toFixed(6))
    })

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mapRef} className="h-64 w-full rounded-lg" />
}
