'use client';

import { useState, useCallback, useMemo } from 'react';

import { Spot, SPOT_TYPE_CONFIG, SPOT_EMOJIS, DAY_SHORT_LABELS, DAY_ORDER } from '@/types';
import { useLanguage } from '@/hooks/use-language';
import { useFavorites } from '@/hooks/use-favorites';
import { voteSpot } from '@/lib/firebase-service';
import { toast } from 'sonner';

interface SpotCardProps {
  spot: Spot;
  isNew: boolean;
  selected: boolean;
  highlighted: boolean;
  favorited: boolean;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
}

export default function SpotCard({
  spot,
  isNew,
  selected,
  highlighted,
  favorited,
  onClick,
  onHover,
  onLeave,
}: SpotCardProps) {
  const { t, toBengaliNum, getDayLabel, getSpotTypeLabel } = useLanguage();
  const { toggleFavorite } = useFavorites();
  const [voted, setVoted] = useState<'true' | 'false' | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(`vote-${spot.id}`) as 'true' | 'false' | null;
  });
  const [isVoting, setIsVoting] = useState(false);

  const typeConfig = SPOT_TYPE_CONFIG[spot.type];
  const timeAgo = getTimeAgo(spot.createdAt);

  const handleVote = useCallback(async (voteType: 'true' | 'false') => {
    if (voted || isVoting) return;
    setIsVoting(true);
    try {
      await voteSpot(spot.id, voteType);
      localStorage.setItem(`vote-${spot.id}`, voteType);
      setVoted(voteType);
      if (voteType === 'true') {
        toast.success(<span><i className="bi bi-check-circle-fill text-emerald-500"></i> ভোট দেওয়া হয়েছে — ধন্যবাদ!</span>);
      } else {
        toast.info('আপনার মতামত জমা হয়েছে');
      }
    } catch {
      toast.error('ভোট দিতে সমস্যা হয়েছে');
    } finally {
      setIsVoting(false);
    }
  }, [voted, isVoting, spot.id]);

  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(spot.id);
  }, [spot.id, toggleFavorite]);

  const handleDirections = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
    window.open(url, '_blank');
  }, [spot.lat, spot.lng]);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}?spot=${spot.id}`;
    if (navigator.share) {
      navigator.share({ title: spot.name, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('লিংক কপি হয়েছে');
    }
  }, [spot.name, spot.id]);

  // Sort open days by order
  const sortedOpenDays = useMemo(() => {
    return [...spot.openDays].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  }, [spot.openDays]);

  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        group relative rounded-xl p-3 cursor-pointer transition-all duration-200
        ${isNew ? 'new-spot-card' : 'bg-white'}
        ${selected ? 'ring-2 ring-emerald-700 shadow-md' : ''}
        ${highlighted && !selected ? 'ring-2 ring-orange-500/50 shadow-md' : ''}
        hover:shadow-lg hover:-translate-y-0.5
      `}
    >
      {/* Top row: type badge + name + actions */}
      <div className="flex items-start gap-2">
        {/* Type icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-lg"
          style={{ backgroundColor: typeConfig.color + '18' }}
        >
          {typeConfig.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-stone-800 truncate">{spot.name}</h3>
            {spot.verified && (
              <span className="shrink-0 text-[10px] font-bold text-emerald-800 bg-emerald-50 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                <i className="bi bi-patch-check-fill text-[8px]"></i> ভেরিফাইড
              </span>
            )}
            {isNew && (
              <span className="shrink-0 text-[10px] font-bold text-orange-600 bg-orange-50 rounded-full px-1.5 py-0.5 animate-badge-bounce">
                নতুন
              </span>
            )}
          </div>

          {/* Area + Time */}
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-0.5 text-stone-400">
              <i className="bi bi-geo-alt text-xs"></i>
              <span className="text-[11px] truncate">{spot.area || spot.city}</span>
            </div>
            <span className="text-[11px] text-stone-400">•</span>
            <div className="flex items-center gap-0.5 text-stone-400">
              <i className="bi bi-clock text-xs"></i>
              <span className="text-[11px]">{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={handleFavorite}
            className="p-1.5 rounded-lg hover:bg-orange-50 transition-colors"
            aria-label={favorited ? 'পছন্দ সরান' : 'পছন্দ করুন'}
          >
            <i className={`bi ${favorited ? 'bi-heart-fill text-red-500' : 'bi-heart text-stone-400'} text-sm`}></i>
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
            aria-label="শেয়ার"
          >
            <i className="bi bi-share text-stone-400 text-sm"></i>
          </button>
        </div>
      </div>

      {/* Details row */}
      <div className="flex items-center gap-2 mt-2">
        {/* Type badge */}
        <span
          className="text-[10px] font-medium rounded-full px-2 py-0.5"
          style={{
            backgroundColor: typeConfig.color + '18',
            color: typeConfig.color,
          }}
        >
          {getSpotTypeLabel(spot.type)}
        </span>

        {/* Open days */}
        {sortedOpenDays.length > 0 && (
          <div className="flex items-center gap-1">
            {sortedOpenDays.slice(0, 4).map((day) => (
              <span key={day} className="text-[10px] text-stone-400 bg-stone-50 rounded px-1 py-0.5">
                {getDayLabel(day, true)}
              </span>
            ))}
            {sortedOpenDays.length > 4 && (
              <span className="text-[10px] text-stone-400">+{sortedOpenDays.length - 4}</span>
            )}
          </div>
        )}

        {/* Time */}
        <span className="text-[10px] text-stone-400 ml-auto">
          <i className="bi bi-clock text-[10px]"></i> {spot.openTime} - {spot.closeTime}
        </span>
      </div>

      {/* Vote row */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/50">
        {/* Vote buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleVote('true'); }}
            disabled={!!voted || isVoting}
            className={`
              vote-btn flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all
              ${voted === 'true'
                ? 'bg-emerald-800 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50'
              }
            `}
          >
            <i className="bi bi-hand-thumbs-up text-xs"></i>
            <span>{toBengaliNum(spot.positiveVotes)}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleVote('false'); }}
            disabled={!!voted || isVoting}
            className={`
              vote-btn flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all
              ${voted === 'false'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50'
              }
            `}
          >
            <i className="bi bi-hand-thumbs-down text-xs"></i>
            <span>{toBengaliNum(spot.negativeVotes)}</span>
          </button>
          {voted && (
            <span className="text-[10px] text-emerald-700"><i className="bi bi-check-circle-fill text-[10px]"></i> ভোট দেওয়া হয়েছে</span>
          )}
        </div>

        {/* Directions button */}
        <button
          onClick={handleDirections}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 transition-all hover:shadow-md"
        >
          <i className="bi bi-cursor-fill text-xs"></i>
          <span>ডিরেকশন</span>
        </button>
      </div>
    </div>
  );
}

// Helper: time ago
function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'এইমাত্র';
  if (minutes < 60) return `${minutes} মিনিট আগে`;
  if (hours < 24) return `${hours} ঘণ্টা আগে`;
  if (days < 7) return `${days} দিন আগে`;
  return new Date(timestamp).toLocaleDateString('bn-BD');
}
