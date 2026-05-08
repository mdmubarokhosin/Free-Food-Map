'use client';

import { SpotType, SPOT_TYPE_CONFIG } from '@/types';
import { useLanguage } from '@/hooks/use-language';
import { Badge } from '@/components/ui/badge';

interface FilterBarProps {
  filterType: SpotType | 'all';
  onFilterTypeChange: (type: SpotType | 'all') => void;
  showVerifiedOnly: boolean;
  onShowVerifiedOnlyChange: (value: boolean) => void;
  showOpenNow: boolean;
  onShowOpenNowChange: (value: boolean) => void;
  compact?: boolean;
}

export default function FilterBar({
  filterType,
  onFilterTypeChange,
  showVerifiedOnly,
  onShowVerifiedOnlyChange,
  showOpenNow,
  onShowOpenNowChange,
  compact = false,
}: FilterBarProps) {
  const { t, getSpotTypeLabel } = useLanguage();

  const types: (SpotType | 'all')[] = ['all', 'daily_meal', 'weekly_meal', 'grocery', 'soup_kitchen', 'other'];

  return (
    <div className="glass rounded-2xl shadow-lg p-3">
      {/* Type filters */}
      <div className={`flex gap-1.5 ${compact ? 'overflow-x-auto pb-1' : 'flex-wrap'}`}>
        {types.map((type) => (
          <button
            key={type}
            onClick={() => onFilterTypeChange(type)}
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 shrink-0
              ${filterType === type
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md hover:shadow-lg'
                : 'bg-white/80 text-stone-800 hover:bg-emerald-50 border border-stone-200 hover:shadow-md hover:scale-[1.02]'
              }
            `}
          >
            {type === 'all' ? (
              <i className="bi bi-grid text-xs"></i>
            ) : (
              <span>{SPOT_TYPE_CONFIG[type]?.emoji}</span>
            )}
            <span>{type === 'all' ? t('all') : getSpotTypeLabel(type)}</span>
          </button>
        ))}
      </div>

      {/* Toggle filters */}
      {!compact && (
        <div className="flex gap-2 mt-2 pt-2 border-t border-stone-200/50">
          <button
            onClick={() => onShowVerifiedOnlyChange(!showVerifiedOnly)}
            className={`
              flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150
              ${showVerifiedOnly
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                : 'bg-emerald-50/60 text-emerald-800 hover:bg-emerald-50 hover:shadow-md hover:scale-[1.02]'
              }
            `}
          >
            <i className="bi bi-check-circle text-xs"></i>
            <span>ভেরিফাইড</span>
          </button>
          <button
            onClick={() => onShowOpenNowChange(!showOpenNow)}
            className={`
              flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150
              ${showOpenNow
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                : 'bg-orange-50/60 text-orange-600 hover:bg-orange-50 hover:shadow-md hover:scale-[1.02]'
              }
            `}
          >
            <i className="bi bi-clock text-xs"></i>
            <span>খোলা আছে</span>
          </button>
        </div>
      )}

      {/* Compact toggle filters */}
      {compact && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onShowVerifiedOnlyChange(!showVerifiedOnly)}
            className={`
              flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-150
              ${showVerifiedOnly
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm'
                : 'bg-emerald-50/60 text-emerald-800'
              }
            `}
          >
            <i className="bi bi-check-circle text-[10px]"></i> ভেরিফাইড
          </button>
          <button
            onClick={() => onShowOpenNowChange(!showOpenNow)}
            className={`
              flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-150
              ${showOpenNow
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                : 'bg-orange-50/60 text-orange-600'
              }
            `}
          >
            <i className="bi bi-clock text-[10px]"></i> খোলা
          </button>
        </div>
      )}
    </div>
  );
}
