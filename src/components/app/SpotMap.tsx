"use client";

import { useEffect, useRef, useMemo } from "react";
import type { Spot } from "@/types";
import { SPOT_TYPE_CONFIG } from "@/types";
import L from "leaflet";

interface SpotMapProps {
  spots: Spot[];
  onSpotClick?: (spot: Spot) => void;
  center?: { lat: number; lng: number };
  onVote?: (spotId: string, type: "true" | "false") => void;
  userVotes?: Record<string, "true" | "false">;
  isLoading?: boolean;
}

export default function SpotMap({
  spots,
  onSpotClick,
  center,
  onVote,
  userVotes = {},
  isLoading,
}: SpotMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [23.7596, 90.379],
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // Fly to center when it changes
  useEffect(() => {
    if (center && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([center.lat, center.lng], 15, { duration: 1.5 });
    }
  }, [center]);

  // Update markers
  useEffect(() => {
    if (!markersRef.current || !mapInstanceRef.current) return;

    markersRef.current.clearLayers();

    if (spots.length === 0 || isLoading) return;

    // Group by location to handle duplicates
    const locationGroups = new Map<string, Spot[]>();
    spots.forEach((spot) => {
      const key = `${spot.lat.toFixed(4)}_${spot.lng.toFixed(4)}`;
      if (!locationGroups.has(key)) locationGroups.set(key, []);
      locationGroups.get(key)!.push(spot);
    });

    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    spots.forEach((spot, index) => {
      const config = SPOT_TYPE_CONFIG[spot.type] || SPOT_TYPE_CONFIG.other;
      const isNew = now - spot.createdAt < TWO_HOURS;
      const isNewest = index === 0 && isNew;
      const isVoted = !!userVotes[spot.id];

      // Duplicate offset
      const locKey = `${spot.lat.toFixed(4)}_${spot.lng.toFixed(4)}`;
      const group = locationGroups.get(locKey) || [];
      let offsetLat = 0;
      let offsetLng = 0;
      if (group.length > 1) {
        const idx = group.indexOf(spot);
        const angle = (idx / group.length) * 2 * Math.PI;
        offsetLat = Math.cos(angle) * 0.003;
        offsetLng = Math.sin(angle) * 0.003;
      }

      const size = isNewest ? 44 : isNew ? 38 : 32;

      const icon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="position:relative;">
            ${isNewest ? '<div class="marker-new-badge">NEW</div>' : ""}
            <div class="marker-teardrop ${isNewest ? "marker-newest" : isNew ? "marker-new animate-spot-blink" : ""}"
                 style="width:${size}px;height:${size}px;background:${config.color};${spot.verified ? "border:2px solid gold;" : ""}">
              <span class="marker-emoji" style="font-size:${size * 0.45}px">${config.emoji}</span>
            </div>
          </div>
        `,
        iconSize: [size + 4, size + 4],
        iconAnchor: [(size + 4) / 2, size + 4],
        popupAnchor: [0, -(size + 4)],
      });

      const marker = L.marker([spot.lat + offsetLat, spot.lng + offsetLng], { icon });

      // Popup content
      const popupHtml = `
        <div class="modern-popup" style="font-family:'Segoe UI',system-ui,sans-serif;min-width:260px;">
          <div style="background:linear-gradient(135deg,${config.color},${config.color}cc);padding:12px 14px;color:white;">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              ${isNew ? '<span style="background:#ff8000;color:white;font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px;">নতুন</span>' : ""}
              ${spot.verified ? '<span style="background:rgba(255,255,255,0.25);color:white;font-size:9px;font-weight:600;padding:2px 6px;border-radius:10px;"><i class="bi bi-check-lg" style="font-size:9px;"></i> নিশ্চিত</span>' : ""}
            </div>
            <h3 style="margin:6px 0 2px;font-size:15px;font-weight:700;line-height:1.3;">${spot.name}</h3>
            <span style="font-size:11px;opacity:0.9;">${config.emoji} ${config.label}</span>
          </div>
          <div style="padding:12px 14px;">
            <p style="margin:0 0 8px;font-size:13px;color:#555;display:flex;align-items:center;gap:4px;">
              <i class="bi bi-geo-alt" style="color:#e74c3c;font-size:12px;"></i> ${spot.area || spot.address || spot.city}
            </p>
            ${spot.openTime && spot.closeTime ? `<p style="margin:0 0 8px;font-size:12px;color:#888;display:flex;align-items:center;gap:4px;"><i class="bi bi-clock" style="font-size:11px;"></i> ${spot.openTime} - ${spot.closeTime}</p>` : ""}
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}" target="_blank" rel="noopener"
                 style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:8px;background:#2d7a30;color:white;font-size:12px;text-decoration:none;font-weight:600;">
                <i class="bi bi-cursor-fill" style="font-size:11px;"></i> দিকনির্দেশনা
              </a>
              ${!isVoted ? `
              <button onclick="window.dispatchEvent(new CustomEvent('popupVote',{detail:{id:'${spot.id}',type:'true'}}))"
                      style="padding:6px 12px;border-radius:8px;background:#22c55e;color:white;font-size:12px;border:none;cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:3px;">
                <i class="bi bi-hand-thumbs-up-fill" style="font-size:11px;"></i> ${spot.positiveVotes}
              </button>
              <button onclick="window.dispatchEvent(new CustomEvent('popupVote',{detail:{id:'${spot.id}',type:'false'}}))"
                      style="padding:6px 12px;border-radius:8px;background:#ef4444;color:white;font-size:12px;border:none;cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:3px;">
                <i class="bi bi-hand-thumbs-down-fill" style="font-size:11px;"></i> ${spot.negativeVotes}
              </button>` : `
              <span style="padding:6px 12px;border-radius:8px;background:#e5e7eb;color:#666;font-size:12px;font-weight:500;">ইতিমধ্যে ভোট দিয়েছেন</span>`}
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 300, className: "" });

      marker.on("click", () => {
        if (onSpotClick) onSpotClick(spot);
      });

      markersRef.current!.addLayer(marker);
    });

    // Fit bounds if spots exist
    if (spots.length > 0 && !center) {
      const bounds = L.latLngBounds(spots.map((s) => [s.lat, s.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [spots, center, onSpotClick, userVotes, isLoading]);

  // Listen for popup votes
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && onVote) {
        onVote(detail.id, detail.type);
      }
    };
    window.addEventListener("popupVote", handler);
    return () => window.removeEventListener("popupVote", handler);
  }, [onVote]);

  return <div ref={mapRef} className="w-full h-full" />;
}
