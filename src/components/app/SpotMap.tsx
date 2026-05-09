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

function getOpenStatusText(spot: Spot): { label: string; color: string; bgColor: string } {
  if (!spot.openTime || !spot.closeTime || (spot.openTime === "00:00" && spot.closeTime === "23:59")) {
    return { label: "তথ্য নেই", color: "#93796C", bgColor: "#FAF8F5" };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = spot.openTime.split(":").map(Number);
  const [closeH, closeM] = spot.closeTime.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  const todayName = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  if (spot.openDays && spot.openDays.length > 0 && !spot.openDays.includes(todayName)) {
    return { label: "বন্ধ", color: "#dc2626", bgColor: "#fef2f2" };
  }

  if (currentMinutes < openMinutes && openMinutes - currentMinutes <= 60) {
    return { label: "শীঘ্রই শুরু", color: "#c2410c", bgColor: "#FFF7ED" };
  }

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return { label: "চলছে ✓", color: "#166534", bgColor: "#DBF0E3" };
  }

  return { label: "বন্ধ", color: "#dc2626", bgColor: "#fef2f2" };
}

function toBn(n: number): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/\d/g, (d) => bnDigits[parseInt(d)]);
}

function createMapLegend(): L.Control {
  const LegendControl = L.Control.extend({
    options: { position: "bottomleft" as L.ControlPosition },
    onAdd: function (this: { _map: L.Map; _div?: HTMLElement }) {
      const div = L.DomUtil.create("div", "map-legend");
      div.innerHTML = `
        <div class="legend-title" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;" onclick="this.parentElement.classList.toggle('collapsed')">
          <span>স্পটের ধরন</span>
          <span style="font-size:10px;opacity:0.6;">▼</span>
        </div>
        <div class="legend-items">
          <div class="legend-item"><span class="legend-emoji">🍛</span> দৈনিক খাবার</div>
          <div class="legend-item"><span class="legend-emoji">🍚</span> সাপ্তাহিক খাবার</div>
          <div class="legend-item"><span class="legend-emoji">🥬</span> গ্রোসারি</div>
          <div class="legend-item"><span class="legend-emoji">🍽️</span> স্যুপ কিচেন</div>
          <div class="legend-item"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#2d8a4e;margin-right:2px;"></span> নিশ্চিত</div>
          <div class="legend-item"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f5a623;margin-right:2px;"></span> অনিশ্চিত</div>
        </div>
      `;
      return div;
    },
  });
  return new LegendControl();
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

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [23.7596, 90.379],
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      dragging: true,
      doubleClickZoom: true,
      touchZoom: true,
      boxZoom: true,
      keyboard: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      crossOrigin: "anonymous",
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    createMapLegend().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (center && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([center.lat, center.lng], 15, { duration: 1.5 });
    }
  }, [center]);

  useEffect(() => {
    if (!markersRef.current || !mapInstanceRef.current) return;

    markersRef.current.clearLayers();
    if (spots.length === 0 || isLoading) return;

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

      // Reference design: verified (#2d8a4e), unverified (#f5a623), 2.5px white border
      const markerColor = spot.verified ? '#2d8a4e' : '#f5a623';

      const icon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="position:relative;">
            ${isNewest ? '<div class="marker-new-badge">NEW</div>' : ""}
            <div class="marker-teardrop ${isNewest ? "marker-newest" : isNew ? "marker-new animate-spot-blink" : ""} ${spot.verified ? "marker-verified" : "marker-unverified"}"
                 style="width:${size}px;height:${size}px;background:${markerColor};">
              <span class="marker-emoji" style="font-size:${Math.round(size * 0.45)}px">${config.emoji}</span>
            </div>
          </div>
        `,
        iconSize: [size + 4, size + 4],
        iconAnchor: [(size + 4) / 2, size + 4],
        popupAnchor: [0, -(size + 4)],
      });

      const marker = L.marker([spot.lat + offsetLat, spot.lng + offsetLng], { icon });
      const openStatus = getOpenStatusText(spot);

      const popupHtml = `
        <div class="modern-popup" style="font-family:ui-sans-serif,system-ui,sans-serif;min-width:260px;">
          <div style="background:linear-gradient(135deg,${markerColor},${markerColor}cc);padding:12px 14px;color:white;">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              ${isNew ? '<span style="background:#f5a623;color:white;font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px;">নতুন</span>' : ""}
              ${spot.verified ? '<span style="background:rgba(255,255,255,0.25);color:white;font-size:9px;font-weight:600;padding:2px 6px;border-radius:10px;"><i class="bi bi-check-lg" style="font-size:9px;"></i> নিশ্চিত</span>' : ""}
              ${!spot.verified ? '<span style="background:rgba(255,255,255,0.15);color:white;font-size:9px;font-weight:600;padding:2px 6px;border-radius:10px;"><i class="bi bi-hourglass-split" style="font-size:9px;"></i> অপেক্ষমান</span>' : ""}
            </div>
            <h3 style="margin:6px 0 2px;font-size:15px;font-weight:700;line-height:1.3;">${spot.name}</h3>
            <span style="font-size:11px;opacity:0.9;">${config.emoji} ${config.label}</span>
          </div>
          <div style="padding:12px 14px;">
            <p style="margin:0 0 8px;font-size:13px;color:#32221B;display:flex;align-items:center;gap:4px;">
              <i class="bi bi-geo-alt" style="color:#107539;font-size:12px;"></i> ${spot.area || spot.address || spot.city}
            </p>
            ${spot.openTime && spot.closeTime && !(spot.openTime === "00:00" && spot.closeTime === "23:59") ? `
            <p style="margin:0 0 6px;font-size:12px;color:#93796C;display:flex;align-items:center;gap:4px;">
              <i class="bi bi-clock" style="font-size:11px;"></i> ${spot.openTime} - ${spot.closeTime}
            </p>
            <div style="margin:0 0 8px;">
              <span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;background:${openStatus.bgColor};color:${openStatus.color};">
                ${openStatus.label}
              </span>
            </div>
            ` : ""}
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}" target="_blank" rel="noopener"
                 style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:8px;background:#107539;color:white;font-size:12px;text-decoration:none;font-weight:600;">
                <i class="bi bi-compass-fill" style="font-size:11px;"></i> দিকনির্দেশনা
              </a>
              ${!isVoted ? `
              <button onclick="window.dispatchEvent(new CustomEvent('popupVote',{detail:{id:'${spot.id}',type:'true'}}))"
                      style="padding:6px 12px;border-radius:8px;background:#166534;color:white;font-size:12px;border:none;cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:3px;">
                <i class="bi bi-hand-thumbs-up-fill" style="font-size:11px;"></i> ${toBn(spot.positiveVotes)}
              </button>
              <button onclick="window.dispatchEvent(new CustomEvent('popupVote',{detail:{id:'${spot.id}',type:'false'}}))"
                      style="padding:6px 12px;border-radius:8px;background:#dc2626;color:white;font-size:12px;border:none;cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:3px;">
                <i class="bi bi-hand-thumbs-down-fill" style="font-size:11px;"></i> ${toBn(spot.negativeVotes)}
              </button>` : `
              <span style="padding:6px 12px;border-radius:8px;background:#EAE2D7;color:#93796C;font-size:12px;font-weight:500;">ইতিমধ্যে ভোট দিয়েছেন</span>`}
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

    if (spots.length > 0 && !center) {
      const bounds = L.latLngBounds(spots.map((s) => [s.lat, s.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [spots, center, onSpotClick, userVotes, isLoading]);

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
