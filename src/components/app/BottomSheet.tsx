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

// Helper: convert English numerals to Bengali numerals
function toBn(n: number): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/\d/g, (d) => bnDigits[parseInt(d)]);
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "এইমাত্র";
  if (mins < 60) return `${toBn(mins)} মিনিট আগে`;
  if (hours < 24) return `${toBn(hours)} ঘন্টা আগে`;

  // Check if yesterday
  const spotDate = new Date(timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (spotDate >= yesterday.getTime()) return "গতকাল";
  if (days < 7) return `${toBn(days)} দিন আগে`;
  return `${toBn(days)} দিন আগে`;
}

function isOldSpot(timestamp: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return timestamp < today.getTime();
}

// Helper: get open/closed status for a spot
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

  // Check if today is an open day
  const todayName = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  if (spot.openDays && spot.openDays.length > 0 && !spot.openDays.includes(todayName)) {
    return { status: "closed", label: "বন্ধ", color: "status-closed" };
  }

  // Opening within 1 hour
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

  // ISSUE 7: Scroll to selected spot card when marker is clicked
  useEffect(() => {
    if (selectedSpotId) {
      const el = document.getElementById(`spot-${selectedSpotId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedSpotId]);

  // Filter spots by active type filter
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
      className="bottom-sheet absolute bottom-0 left-0 right-0 z-[1001] flex flex-col no-print bg-card border-t border-border"
      style={{ maxHeight: expanded ? "75vh" : "35vh" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Decorative top gradient border */}
      <div className="h-1.5 w-full bg-gradient-to-r from-teal-600 via-emerald-500 to-amber-400 rounded-t-2xl" />

      {/* Handle */}
      <div className="flex justify-center pt-1.5 pb-0.5 cursor-pointer" onClick={onToggleExpand}>
        <div className="bottom-sheet-handle"></div>
      </div>

      {/* Header - Beautiful gradient */}
      <div className="mx-3 mb-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 shadow-lg shadow-teal-200/40 dark:shadow-teal-900/30 ring-1 ring-white/10" >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Spots Icon */}
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/10">
              <i className="bi bi-map text-white text-base"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">স্পট সমূহ</h2>
              </div>
              {/* ISSUE 11: Counter as visual pill badges */}
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-semibold">
                  <i className="bi bi-geo-alt text-[9px]"></i> {toBn(spots.length)}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-400/20 text-[10px] font-semibold">
                  <i className="bi bi-fire text-[9px]"></i> {toBn(todaySpots.length)}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-400/20 text-[10px] font-semibold">
                  <i className="bi bi-check-circle text-[9px]"></i> {toBn(verifiedCount)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* ISSUE 5: Prominent CTA button (not in filter row) */}
            <button
              onClick={onAddClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold hover:from-orange-600 hover:to-amber-600 active:scale-95 transition-all shadow-md ring-1 ring-white/20"
              aria-label="নতুন স্পট যোগ করুন"
            >
              <i className="bi bi-plus-lg text-sm"></i>
              <span className="hidden sm:inline">নতুন স্পট</span>
            </button>
            {/* Expand/Collapse */}
            <button
              onClick={onToggleExpand}
              className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform ring-1 ring-white/10"
              aria-label={expanded ? "সংকোচ করুন" : "প্রসারিত করুন"}
            >
              <i className={`bi bi-chevron-up text-sm transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* ISSUE 9: Quick type filter chips with aria-labels */}
      <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveFilter("all")}
          className={activeFilter === "all" ? "filter-chip-active" : "filter-chip"}
          role="button"
          aria-label="সব স্পট ফিল্টার করুন"
          aria-pressed={activeFilter === "all"}
        >
          <i className="bi bi-grid-3x3-gap-fill text-[10px]"></i> সব
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
            <span aria-label={val.label}>{val.emoji}</span> {val.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4 space-y-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="relative mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center shadow-md animate-float">
                <i className="bi bi-cup-hot text-teal-500 dark:text-teal-400 text-lg"></i>
              </div>
            </div>
            <p className="text-sm font-semibold text-[#1C1917] dark:text-stone-200">স্পট খুঁজে আনা হচ্ছে...</p>
            <p className="text-xs text-[#78716C] dark:text-stone-400 mt-1">অনুগ্রহ করে অপেক্ষা করুন</p>
          </div>
        ) : spots.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 flex items-center justify-center border-2 border-dashed border-orange-200/60 dark:border-orange-700/40 shadow-inner">
              <i className="bi bi-geo-alt text-3xl text-orange-400 dark:text-orange-300"></i>
            </div>
            <p className="text-sm font-bold text-[#1C1917] dark:text-stone-200 mb-1">এখনও কোন স্পট নেই</p>
            <p className="text-xs text-[#78716C] dark:text-stone-400 mb-4">আপনি চাইলে প্রথম ফ্রি ফুড স্পটটি যুক্ত করতে পারেন।</p>
            <button
              onClick={onAddClick}
              className="btn-primary"
            >
              <i className="bi bi-plus-lg"></i> স্পট যোগ করুন
            </button>
          </div>
        ) : totalFiltered === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 flex items-center justify-center border-2 border-dashed border-emerald-200/60 dark:border-emerald-700/40 shadow-inner">
              <i className="bi bi-funnel text-3xl text-emerald-400 dark:text-emerald-300"></i>
            </div>
            <p className="text-sm font-bold text-[#1C1917] dark:text-stone-200 mb-1">এই ক্যাটাগরিতে কোন স্পট নেই</p>
            <button
              onClick={() => setActiveFilter("all")}
              className="btn-primary"
            >
              <i className="bi bi-grid-3x3-gap-fill"></i> সব স্পট দেখুন
            </button>
          </div>
        ) : (
          <>
            {/* Today's Spots */}
            {filteredTodaySpots.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-1 mb-2 mt-1">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-sm">
                    <i className="bi bi-fire text-white text-[10px]"></i>
                  </div>
                  <span className="text-xs font-bold text-[#1C1917] dark:text-stone-200">আজকের স্পট</span>
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded-full">
                    {toBn(filteredTodaySpots.length)}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-orange-200/60 to-transparent dark:from-orange-800/50"></div>
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

            {/* Old Spots */}
            {filteredOldSpots.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-1 mb-2 mt-4">
                  <div className="w-5 h-5 rounded-md bg-secondary flex items-center justify-center">
                    <i className="bi bi-clock-history text-muted-foreground text-[10px]"></i>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">পূর্বের স্পট</span>
                  <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                    {toBn(filteredOldSpots.length)}
                  </span>
                  <div className="flex-1 h-px bg-border"></div>
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
  );
}

// Spot Card sub-component - Redesigned with rich UI
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
        group relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300
        ${isLatest
          ? "bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white shadow-lg shadow-teal-300/30 dark:shadow-teal-900/40 ring-1 ring-teal-400/40"
          : isNew
          ? "new-spot-card bg-card hover:bg-secondary/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5 ring-1 ring-transparent hover:ring-orange-200/40 dark:hover:ring-orange-800/20"
          : "bg-card hover:bg-secondary/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5 ring-1 ring-transparent hover:ring-border"
        }
        ${isSelected ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-background" : ""}
      `}
    >
      {/* Latest spot glow effect */}
      {isLatest && (
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-400 opacity-20 -z-10 blur-sm"></div>
      )}

      {/* ISSUE 3: Top row with better spacing */}
      <div className="flex items-start gap-3">
        {/* Type Marker */}
        <div className="relative shrink-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${
              isLatest
                ? "bg-white/20 backdrop-blur-sm border border-white/30"
                : ""
            }`}
            style={!isLatest ? {
              background: `linear-gradient(135deg, ${config.color}15, ${config.color}25)`,
              border: spot.verified ? `2px solid ${config.color}` : "none",
            } : undefined}
            aria-label={config.label}
          >
            {config.emoji}
          </div>
          {/* Verified badge on marker */}
          {spot.verified && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shadow-sm border-2 border-card">
              <i className="bi bi-check text-white text-[7px]"></i>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* ISSUE 3: More prominent name with text-[15px] */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className={`text-[15px] font-bold truncate leading-tight ${isLatest ? "text-white" : "text-foreground"}`}>
              {spot.name}
            </h4>
            {isNew && !isLatest && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-gradient-to-r from-orange-500 to-amber-500 text-white animate-badge-bounce">
                নতুন
              </span>
            )}
          </div>

          {/* Location */}
          <p className={`text-xs mt-1 truncate flex items-center gap-1 ${isLatest ? "text-white/80" : "text-muted-foreground"}`}>
            <i className="bi bi-geo-alt text-[10px] shrink-0"></i>
            <span>{spot.area || spot.address || spot.city}</span>
          </p>

          {/* ISSUE 3: Type + Time row with better spacing */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-[10px] font-semibold rounded-lg px-2 py-0.5 ${
              isLatest ? "bg-white/20 text-white" : "text-muted-foreground bg-secondary"
            }`}>
              {config.emoji} {config.label}
            </span>
            {spot.openTime && spot.closeTime && !(spot.openTime === "00:00" && spot.closeTime === "23:59") && (
              <span className={`text-[10px] ${isLatest ? "text-white/60" : "text-muted-foreground/70"}`}>
                <i className="bi bi-clock text-[9px]"></i> {spot.openTime}-{spot.closeTime}
              </span>
            )}
            <span className={`text-[10px] ${isLatest ? "text-white/60" : "text-muted-foreground/70"}`}>
              {formatTimeAgo(spot.createdAt)}
            </span>
          </div>

          {/* ISSUE 3: Open/Closed Status Badge - slightly larger with pulsing dot for "open" */}
          <div className="mt-2">
            <span className={`${openStatus.color} text-[11px] px-3 py-1 ${isLatest && openStatus.status === "open" ? "!bg-white/20 !text-white" : ""}`}>
              {openStatus.status === "open" && <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse-dot" aria-hidden="true"></span>}
              {openStatus.status === "closing" && <i className="bi bi-clock text-[9px]"></i>}
              {openStatus.status === "closed" && <i className="bi bi-x-circle text-[9px]"></i>}
              {openStatus.status === "unknown" && <i className="bi bi-dash-circle text-[9px]"></i>}
              {openStatus.label}
            </span>
          </div>
        </div>

        {/* ISSUE 3: Vote buttons - only show count if > 0 */}
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-90 ${
              isLatest
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-600 dark:text-green-400 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 border border-green-200/50 dark:border-green-800/50"
            }`}
            aria-label={`পছন্দ: ${toBn(spot.positiveVotes)}`}
          >
            <i className="bi bi-hand-thumbs-up-fill text-[10px]"></i>
            {spot.positiveVotes > 0 && <span>{toBn(spot.positiveVotes)}</span>}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDislike(); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-90 ${
              isLatest
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 text-red-500 dark:text-red-400 hover:from-red-100 hover:to-rose-100 dark:hover:from-red-900/30 dark:hover:to-rose-900/30 border border-red-200/50 dark:border-red-800/50"
            }`}
            aria-label={`অপছন্দ: ${toBn(spot.negativeVotes)}`}
          >
            <i className="bi bi-hand-thumbs-down text-[10px]"></i>
            {spot.negativeVotes > 0 && <span>{toBn(spot.negativeVotes)}</span>}
          </button>
        </div>
      </div>

      {/* Verified banner for latest */}
      {isLatest && spot.verified && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
            <i className="bi bi-patch-check-fill text-yellow-300 text-[10px]"></i>
            <span className="text-[10px] font-semibold text-white">ভেরিফাইড</span>
          </div>
          {/* ISSUE 2: Only show view count when > 0 */}
          {(spot.viewCount || 0) > 0 && (
            <>
              <span className="text-[10px] text-white/50">•</span>
              <span className="text-[10px] text-white/60 flex items-center gap-0.5">
                <i className="bi bi-eye text-[9px]"></i> {toBn(spot.viewCount || 0)}
              </span>
            </>
          )}
        </div>
      )}

      {/* Bottom bar for non-latest cards */}
      {!isLatest && (
        <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {spot.verified && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-md">
                <i className="bi bi-patch-check-fill text-[9px]"></i> ভেরিফাইড
              </span>
            )}
            {!spot.verified && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md">
                <i className="bi bi-hourglass-split text-[9px]"></i> ভেরিফিকেশন অপেক্ষমান
              </span>
            )}
            {/* ISSUE 2: Only show view/direction counts when values > 0 */}
            {((spot.viewCount || 0) > 0 || (spot.directionCount || 0) > 0) && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                {(spot.viewCount || 0) > 0 && (
                  <span className="flex items-center gap-0.5">
                    <i className="bi bi-eye text-[9px]"></i> {toBn(spot.viewCount || 0)}
                  </span>
                )}
                {(spot.viewCount || 0) > 0 && (spot.directionCount || 0) > 0 && <span className="ml-1">•</span>}
                {(spot.directionCount || 0) > 0 && (
                  <span className="ml-1 flex items-center gap-0.5">
                    <i className="bi bi-compass text-[9px]"></i> {toBn(spot.directionCount)}
                  </span>
                )}
              </span>
            )}
          </div>
          {/* ISSUE 4: Direction button with compass icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`, "_blank");
            }}
            title="ম্যাপে রাস্তা দেখুন"
            aria-label="ম্যাপে রাস্তা দেখুন"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all active:scale-95 shadow-sm"
          >
            <i className="bi bi-compass-fill text-[9px]"></i> ডিরেকশন
            <i className="bi bi-box-arrow-up-right text-[8px] opacity-70"></i>
          </button>
        </div>
      )}
    </div>
  );
}
