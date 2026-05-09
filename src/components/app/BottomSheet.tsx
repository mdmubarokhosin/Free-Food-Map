"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import type { Spot, SpotType } from "@/types";
import { SPOT_TYPE_CONFIG } from "@/types";

interface BottomSheetProps {
  spots: Spot[];
  onAddClick: () => void;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  onSpotClick?: (spot: Spot) => void;
  selectedSpotId?: string | null;
  isLoading?: boolean;
}

function toBn(n: number): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/\d/g, (d) => bnDigits[parseInt(d)]);
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (mins < 1) return "এইমাত্র";
  if (mins < 60) return `${toBn(mins)} মিনিট আগে`;

  const spotDate = new Date(timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const spotDay = new Date(spotDate);
  spotDay.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (spotDay.getTime() === today.getTime()) return "আজ";
  if (spotDay.getTime() === yesterday.getTime()) return "গতকাল";

  const dayNames = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
  const dayDiff = Math.floor((today.getTime() - spotDay.getTime()) / 86400000);
  if (dayDiff > 0 && dayDiff < 7) return dayNames[spotDate.getDay()];

  if (hours < 24) return `${toBn(hours)} ঘন্টা আগে`;
  const days = Math.floor(diff / 86400000);
  return `${toBn(days)} দিন আগে`;
}

function isOldSpot(timestamp: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return timestamp < today.getTime();
}

function getOpenStatus(spot: Spot): { status: "open" | "closing" | "closed" | "unknown"; label: string; color: string } {
  if (!spot.openTime || !spot.closeTime || spot.openTime === "00:00" && spot.closeTime === "23:59") {
    return { status: "unknown", label: "তথ্য নেই", color: "status-unknown" };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = spot.openTime.split(":").map(Number);
  const [closeH, closeM] = spot.closeTime.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  const todayName = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  if (spot.openDays && spot.openDays.length > 0 && !spot.openDays.includes(todayName)) {
    return { status: "closed", label: "বন্ধ", color: "status-closed" };
  }

  if (currentMinutes < openMinutes && openMinutes - currentMinutes <= 60) {
    return { status: "closing", label: "শীঘ্রই শুরু", color: "status-closing" };
  }

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return { status: "open", label: "চলছে", color: "status-open" };
  }

  return { status: "closed", label: "বন্ধ", color: "status-closed" };
}

export default function BottomSheet({
  spots,
  onAddClick,
  onLike,
  onDislike,
  expanded,
  onToggleExpand,
  onSpotClick,
  selectedSpotId,
  isLoading,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const todaySpots = useMemo(() => spots.filter((s) => !isOldSpot(s.createdAt)), [spots]);
  const oldSpots = useMemo(() => spots.filter((s) => isOldSpot(s.createdAt)), [spots]);
  const verifiedCount = useMemo(() => spots.filter((s) => s.verified && s.active).length, [spots]);

  useEffect(() => {
    if (selectedSpotId) {
      const el = document.getElementById(`spot-${selectedSpotId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedSpotId]);

  const filteredTodaySpots = useMemo(() => {
    if (activeFilter === "all") return todaySpots;
    return todaySpots.filter((s) => s.type === activeFilter);
  }, [todaySpots, activeFilter]);

  const filteredOldSpots = useMemo(() => {
    if (activeFilter === "all") return oldSpots;
    return oldSpots.filter((s) => s.type === activeFilter);
  }, [oldSpots, activeFilter]);

  const totalFiltered = filteredTodaySpots.length + filteredOldSpots.length;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = touchStart - e.touches[0].clientY;
    if (diff > 30 && !expanded) onToggleExpand();
    if (diff < -30 && expanded) onToggleExpand();
  };

  return (
    <div
      ref={sheetRef}
      className="bottom-panel absolute bottom-0 left-0 right-0 z-[1000] flex flex-col no-print"
      style={{ maxHeight: expanded ? "75vh" : "220px" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Green gradient background */}
      <div className="flex-1 flex flex-col rounded-t-2xl shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgb(16, 117, 53), rgb(28, 156, 75))' }}>
        
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1 cursor-pointer" onClick={onToggleExpand}>
          <div className="w-10 h-1 rounded-full bg-white/30"></div>
        </div>

        {/* Header */}
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-white text-sm font-bold">🍛 আজকের সক্রিয় স্পট</h2>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white">
              সরাসরি
            </span>
          </div>
          <button
            onClick={onToggleExpand}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label={expanded ? "সংকোচ করুন" : "প্রসারিত করুন"}
          >
            <i className={`bi bi-chevron-up text-xs transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}></i>
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter("all")}
            className={activeFilter === "all" ? "filter-chip-active" : "filter-chip"}
            role="button"
            aria-label="সব স্পট ফিল্টার করুন"
            aria-pressed={activeFilter === "all"}
          >
            সব
          </button>
          {Object.entries(SPOT_TYPE_CONFIG).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={activeFilter === key ? "filter-chip-active" : "filter-chip"}
              role="button"
              aria-label={`${val.label} ফিল্টার করুন`}
              aria-pressed={activeFilter === key}
            >
              {val.emoji} {val.label}
            </button>
          ))}
        </div>

        {/* Scrollable body with warm off-white cards */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-2 rounded-t-2xl" style={{ background: 'rgb(250, 248, 245)' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="relative mb-3">
                <div className="w-12 h-12 rounded-2xl gradient-primary-green flex items-center justify-center shadow-md animate-float">
                  <i className="bi bi-cup-hot text-white text-lg"></i>
                </div>
              </div>
              <p className="text-sm font-semibold text-[#32221B]">স্পট খুঁজে আনা হচ্ছে...</p>
              <p className="text-xs text-[#93796C] mt-1">অনুগ্রহ করে অপেক্ষা করুন</p>
            </div>
          ) : spots.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#FBE9D0] flex items-center justify-center border-2 border-dashed border-[#f5a623]/40">
                <i className="bi bi-geo-alt text-3xl text-[#f5a623]"></i>
              </div>
              <p className="text-sm font-bold text-[#32221B] mb-1">এখনও কোন স্পট নেই</p>
              <p className="text-xs text-[#93796C] mb-4">আপনি চাইলে প্রথম ফ্রি ফুড স্পটটি যুক্ত করতে পারেন।</p>
              <button onClick={onAddClick} className="btn-primary">
                <i className="bi bi-plus-lg"></i> স্পট যোগ করুন
              </button>
            </div>
          ) : totalFiltered === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm font-bold text-[#32221B] mb-1">এই ক্যাটাগরিতে কোন স্পট নেই</p>
              <button onClick={() => setActiveFilter("all")} className="btn-primary mt-3">
                সব স্পট দেখুন
              </button>
            </div>
          ) : (
            <>
              {filteredTodaySpots.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-1 mb-2 mt-1">
                    <div className="w-5 h-5 rounded-md gradient-orange-fab flex items-center justify-center shadow-sm">
                      <i className="bi bi-fire text-white text-[10px]"></i>
                    </div>
                    <span className="text-xs font-bold text-[#32221B]">আজকের স্পট</span>
                    <span className="text-[10px] font-bold text-[#f5a623] bg-[#FBE9D0] px-1.5 py-0.5 rounded-full">
                      {toBn(filteredTodaySpots.length)}
                    </span>
                    <div className="flex-1 h-px bg-[#EAE2D7]"></div>
                  </div>
                  <div className="space-y-2">
                    {filteredTodaySpots.map((spot) => (
                      <SpotCard
                        key={spot.id}
                        spot={spot}
                        isNew={Date.now() - spot.createdAt < 2 * 60 * 60 * 1000}
                        isLatest={todaySpots[0]?.id === spot.id}
                        isSelected={selectedSpotId === spot.id}
                        onLike={() => onLike(spot.id)}
                        onDislike={() => onDislike(spot.id)}
                        onClick={() => onSpotClick?.(spot)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredOldSpots.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-1 mb-2 mt-4">
                    <div className="w-5 h-5 rounded-md bg-[#EAE2D7] flex items-center justify-center">
                      <i className="bi bi-clock-history text-[#93796C] text-[10px]"></i>
                    </div>
                    <span className="text-xs font-bold text-[#93796C]">পূর্বের স্পট</span>
                    <span className="text-[10px] font-medium text-[#93796C] bg-[#EAE2D7] px-1.5 py-0.5 rounded-full">
                      {toBn(filteredOldSpots.length)}
                    </span>
                    <div className="flex-1 h-px bg-[#EAE2D7]"></div>
                  </div>
                  <div className="space-y-2">
                    {filteredOldSpots.map((spot) => (
                      <SpotCard
                        key={spot.id}
                        spot={spot}
                        isNew={false}
                        isLatest={false}
                        isSelected={selectedSpotId === spot.id}
                        onLike={() => onLike(spot.id)}
                        onDislike={() => onDislike(spot.id)}
                        onClick={() => onSpotClick?.(spot)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Spot Card — Reference design: emoji icon, name, location, time, vote buttons
function SpotCard({
  spot,
  isNew,
  isLatest,
  isSelected,
  onLike,
  onDislike,
  onClick,
}: {
  spot: Spot;
  isNew: boolean;
  isLatest: boolean;
  isSelected: boolean;
  onLike: () => void;
  onDislike: () => void;
  onClick: () => void;
}) {
  const config = SPOT_TYPE_CONFIG[spot.type] || SPOT_TYPE_CONFIG.other;
  const openStatus = getOpenStatus(spot);

  return (
    <div
      id={`spot-${spot.id}`}
      onClick={onClick}
      className={`
        group relative p-3 rounded-xl cursor-pointer transition-all duration-300
        ${isLatest
          ? "bg-gradient-to-r from-[#107539] to-[#1C9C4B] text-white shadow-lg"
          : "bg-white hover:shadow-lg shadow-sm hover:-translate-y-0.5 border border-[#EAE2D7]/60"
        }
        ${isSelected ? "ring-2 ring-[#107539] ring-offset-2 ring-offset-[rgb(250,248,245)]" : ""}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Emoji icon — amber bg for unverified, green for verified */}
        <div className="relative shrink-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${
              isLatest ? "bg-white/20" : "bg-[#FBE9D0]"
            }`}
            aria-label={config.label}
          >
            {config.emoji}
          </div>
          {spot.verified && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2d8a4e] flex items-center justify-center shadow-sm border-2 border-white">
              <i className="bi bi-check text-white text-[7px]"></i>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-sm truncate leading-tight ${isLatest ? "text-white" : "text-[#32221B]"}`}>
            {spot.name}
          </h4>
          
          {/* Location with map-pin */}
          <p className={`text-xs mt-0.5 truncate flex items-center gap-1 ${isLatest ? "text-white/80" : "text-[#93796C]"}`}>
            <i className="bi bi-geo-alt text-[10px] shrink-0"></i>
            <span>{spot.area || spot.address || spot.city}</span>
          </p>

          {/* Time with clock */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs flex items-center gap-1 ${isLatest ? "text-white/60" : "text-[#93796C]"}`}>
              <i className="bi bi-clock text-[10px]"></i>
              {formatTimeAgo(spot.createdAt)}
            </span>
            <span className={`${openStatus.color} text-[10px] px-2 py-0.5 ${isLatest && openStatus.status === "open" ? "!bg-white/20 !text-white" : ""}`}>
              {openStatus.status === "open" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse-dot" aria-hidden="true"></span>}
              {openStatus.label}
            </span>
          </div>

          {/* Verified/Unverified badge */}
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {spot.verified ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#166534] bg-[#DBF0E3] px-1.5 py-0.5 rounded-md">
                <i className="bi bi-patch-check-fill text-[9px]"></i> নিশ্চিত
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#f5a623] bg-[#FBE9D0] px-1.5 py-0.5 rounded-md">
                <i className="bi bi-hourglass-split text-[9px]"></i> অপেক্ষমান
              </span>
            )}
            {isNew && !isLatest && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-[#FBE9D0] text-[#f5a623]">
                নতুন
              </span>
            )}
          </div>
        </div>

        {/* Vote buttons — সত্যি (green) / ভুয়া (red) */}
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-90 ${
              isLatest
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-[#DBF0E3] text-[#166534] hover:bg-[#D7EADE]"
            }`}
            aria-label={`সত্যি: ${toBn(spot.positiveVotes)}`}
          >
            <i className="bi bi-hand-thumbs-up-fill text-[10px]"></i>
            <span>সত্যি</span>
            {spot.positiveVotes > 0 && <span>{toBn(spot.positiveVotes)}</span>}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDislike(); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-90 ${
              isLatest
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-red-50 text-red-500 hover:bg-red-100"
            }`}
            aria-label={`ভুয়া: ${toBn(spot.negativeVotes)}`}
          >
            <i className="bi bi-hand-thumbs-down text-[10px]"></i>
            <span>ভুয়া</span>
            {spot.negativeVotes > 0 && <span>{toBn(spot.negativeVotes)}</span>}
          </button>
        </div>
      </div>

      {/* Direction button for non-latest */}
      {!isLatest && (
        <div className="mt-2 pt-2 border-t border-[#EAE2D7] flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`, "_blank");
            }}
            title="ম্যাপে রাস্তা দেখুন"
            aria-label="ম্যাপে রাস্তা দেখুন"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold gradient-primary-green text-white hover:opacity-90 transition-all active:scale-95 shadow-sm"
          >
            <i className="bi bi-compass-fill text-[9px]"></i> ডিরেকশন
            <i className="bi bi-box-arrow-up-right text-[8px] opacity-70"></i>
          </button>
        </div>
      )}
    </div>
  );
}
