"use client";

import { useRef, useState, useMemo } from "react";
import type { Spot } from "@/types";
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

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "এখনই";
  if (mins < 60) return `${mins} মিনিট আগে`;
  if (hours < 24) return `${hours} ঘন্টা আগে`;
  if (days === 1) return "গতকাল";
  return `${days} দিন আগে`;
}

function isOldSpot(timestamp: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return timestamp < today.getTime();
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

  const todaySpots = useMemo(() => spots.filter((s) => !isOldSpot(s.createdAt)), [spots]);
  const oldSpots = useMemo(() => spots.filter((s) => isOldSpot(s.createdAt)), [spots]);

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
      className="bottom-sheet absolute bottom-0 left-0 right-0 z-[1001] flex flex-col no-print"
      style={{ maxHeight: expanded ? "75vh" : "35vh" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Handle */}
      <div className="flex justify-center pt-2 pb-1 cursor-pointer" onClick={onToggleExpand}>
        <div className="bottom-sheet-handle"></div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            স্পট সমূহ
          </span>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            {todaySpots.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddClick}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold hover:shadow-md transition-all hover:scale-[1.02]"
          >
            <i className="bi bi-plus-lg text-sm"></i>
            <span className="hidden sm:inline">নতুন স্পট</span>
          </button>
          <button
            onClick={onToggleExpand}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <i className={`bi bi-chevron-up text-sm text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}></i>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="spinner"></div>
          </div>
        ) : spots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p className="text-3xl mb-2"><i className="bi bi-map text-muted-foreground"></i></p>
            <p>কোন স্পট পাওয়া যায়নি</p>
          </div>
        ) : (
          <>
            {/* Today's Spots */}
            {todaySpots.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground px-1 mb-1.5">
                  আজকের স্পট ({todaySpots.length})
                </p>
                <div className="space-y-2">
                  {todaySpots.map((spot) => (
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
            {oldSpots.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground px-1 mb-1.5 mt-3">
                  পুরাতন স্পট ({oldSpots.length})
                </p>
                <div className="space-y-2 opacity-60">
                  {oldSpots.map((spot) => (
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

// Spot Card sub-component
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

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
        isLatest
          ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md animate-pulse-glow"
          : "bg-card hover:bg-secondary/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5"
      } ${isSelected ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div
            className={`marker-teardrop shrink-0 ${isLatest ? '' : ''}`}
            style={{
              width: 32,
              height: 32,
              background: isLatest ? "rgba(255,255,255,0.3)" : config.color,
              border: spot.verified ? "2px solid gold" : "none",
            }}
          >
            <span className="marker-emoji" style={{ fontSize: 14 }}>
              {config.emoji}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className={`text-sm font-bold truncate ${isLatest ? "text-white" : "text-foreground"}`}>
                {spot.name}
              </h4>
              {spot.verified && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500 text-white flex items-center gap-0.5">
                  <i className="bi bi-patch-check-fill text-[8px]"></i>
                </span>
              )}
              {isNew && !isLatest && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent text-accent-foreground animate-badge-bounce">
                  নতুন
                </span>
              )}
            </div>
            <p className={`text-xs mt-0.5 truncate ${isLatest ? "text-white/80" : "text-muted-foreground"}`}>
              <i className="bi bi-geo-alt text-[10px]"></i> {spot.area || spot.address || spot.city}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[11px] ${isLatest ? "text-white/70" : "text-muted-foreground"}`}>
                {config.label}
              </span>
              <span className={`text-[11px] ${isLatest ? "text-white/70" : "text-muted-foreground"}`}>
                • {formatTimeAgo(spot.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Vote buttons */}
        <div className="flex items-center gap-1 shrink-0 sm:flex-col">
          <button
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
          >
            <i className="bi bi-hand-thumbs-up text-[10px]"></i> {spot.positiveVotes}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDislike(); }}
            className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
          >
            <i className="bi bi-hand-thumbs-down text-[10px]"></i> {spot.negativeVotes}
          </button>
        </div>
      </div>
    </div>
  );
}
