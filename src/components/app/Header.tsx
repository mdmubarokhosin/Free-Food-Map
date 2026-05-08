'use client';


import { useLanguage } from '@/hooks/use-language';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/app/LanguageSwitcher';

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  totalSpots: number;
  verifiedSpots: number;
  onAddSpot: () => void;
  onToggleMobileMenu: () => void;
}

export default function Header({
  search,
  onSearchChange,
  totalSpots,
  verifiedSpots,
  onAddSpot,
  onToggleMobileMenu,
}: HeaderProps) {
  const { t, toBengaliNum } = useLanguage();

  return (
    <>
      {/* Main Header Bar */}
      <header className="absolute z-[1002] top-3 left-3 right-3 sm:left-[15px] sm:right-4">
        <div className="glass rounded-2xl shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-3 px-3 py-2">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 shrink-0 hover:scale-105 transition-transform">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center shadow-sm">
                <span className="text-lg">🍛</span>
              </div>
              <div className="hidden md:block">
                <h1 className="text-sm font-bold text-stone-800 leading-tight">ফ্রি ফুড ম্যাপ</h1>
                <p className="text-[10px] text-stone-400 leading-tight">সবার জন্য উন্মুক্ত</p>
              </div>
            </a>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-stone-200" />

            {/* Search Bar */}
            <div className="search-bar flex-1 flex items-center gap-2 bg-amber-50/50 rounded-xl px-3 py-2 border border-transparent">
              <i className="bi bi-search text-stone-400 text-sm shrink-0"></i>
              <input
                type="text"
                placeholder={t('searchByNameOrArea')}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 outline-none"
              />
              {search && (
                <button
                  onClick={() => onSearchChange('')}
                  className="text-stone-400 hover:text-stone-800 transition-colors"
                >
                  <i className="bi bi-x-lg text-xs"></i>
                </button>
              )}
            </div>

            {/* Live Badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-800 rounded-full px-2.5 py-1 shrink-0">
              <div className="live-dot" />
              <span className="text-xs font-semibold">লাইভ</span>
            </div>

            {/* Spot Counter */}
            <div className="hidden lg:flex items-center gap-1.5 bg-orange-50 text-stone-800 rounded-full px-2.5 py-1 shrink-0">
              <i className="bi bi-geo-alt text-orange-500 text-sm"></i>
              <span className="text-xs font-semibold">
                {toBengaliNum(totalSpots)} স্পট
              </span>
              <span className="text-[10px] text-stone-400">
                ({toBengaliNum(verifiedSpots)} <i className="bi bi-patch-check-fill text-[8px] text-emerald-500"></i>)
              </span>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={onToggleMobileMenu}
              className="sm:hidden p-2 rounded-xl hover:bg-emerald-50 transition-colors"
              aria-label="ফিল্টার"
            >
              <i className="bi bi-list text-stone-800 text-sm"></i>
            </button>

            {/* Add Spot Button (Desktop) */}
            <button
              onClick={onAddSpot}
              className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl px-3 py-2 text-xs font-semibold transition-all shadow-md hover:shadow-lg shrink-0"
            >
              <i className="bi bi-plus-lg text-sm"></i>
              <span>স্পট যোগ</span>
            </button>

            {/* Language */}
            <LanguageSwitcher />

            {/* Theme */}
            <ThemeToggle />
          </div>

          {/* Mobile: Live Badge + Counter Row */}
          <div className="flex sm:hidden items-center justify-between px-3 py-1.5 border-t border-stone-200/50">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 rounded-full px-2 py-0.5">
              <div className="live-dot w-1.5 h-1.5" />
              <span className="text-[10px] font-semibold">লাইভ</span>
            </div>
            <div className="flex items-center gap-1 text-stone-400">
              <i className="bi bi-geo-alt text-xs text-orange-500"></i>
              <span className="text-[10px] font-medium">
                {toBengaliNum(totalSpots)} স্পট • {toBengaliNum(verifiedSpots)} ভেরিফাইড
              </span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
