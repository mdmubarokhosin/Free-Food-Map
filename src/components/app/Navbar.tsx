'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';


interface NavbarProps {
  onAddSpot?: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  totalSpots?: number;
  verifiedSpots?: number;
  /** When true, renders a clean non-map navbar (used on /events, /status, /donate, etc.) */
  compact?: boolean;
}

export default function Navbar({
  onAddSpot = () => {},
  search = '',
  onSearchChange = () => {},
  totalSpots = 0,
  verifiedSpots = 0,
  compact = false,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Bengali number converter
  function toBn(n: number): string {
    const d = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(n).replace(/[0-9]/g, (c) => d[parseInt(c)]);
  }

  // Compact mode: simple navbar for non-map pages
  if (compact) {
    return (
      <>
        <header className="sticky top-0 z-50 bg-[#FAFAF9]/90 dark:bg-[#111111]/90 backdrop-blur-xl border-b border-stone-200/60 dark:border-stone-700/40">
          <div className="container mx-auto px-3 sm:px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-200/30 ring-1 ring-white/50">
                  <i className="bi bi-cup-hot text-white text-sm"></i>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-none text-teal-700 dark:text-teal-400">ফ্রি ফুড</span>
                  <span className="text-xs font-bold leading-none text-teal-600 dark:text-teal-500">ম্যাপ</span>
                </div>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-700 dark:hover:text-teal-400 transition-all duration-200">
                  <i className="bi bi-house text-xs mr-1"></i>
                  হোম
                </Link>
                <Link href="/events" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-700 dark:hover:text-teal-400 transition-all duration-200">
                  <i className="bi bi-calendar3 text-xs mr-1"></i>
                  ইভেন্ট
                </Link>
                <Link href="/donate" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200">
                  <i className="bi bi-heart text-xs mr-1"></i>
                  দান করুন
                </Link>
                <Link href="/status" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-700 dark:hover:text-teal-400 transition-all duration-200">
                  <i className="bi bi-info-circle text-xs mr-1"></i>
                  তথ্য
                </Link>
                <Link href="/admin" className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-200">
                  <i className="bi bi-gear text-xs mr-1"></i>
                  এডমিন
                </Link>
              </nav>

              {/* Mobile menu toggle */}
              <div className="md:hidden flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm">
                  {toBn(totalSpots)} স্পট
                </span>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-200"
                  aria-label="মেনু"
                >
                  {mobileMenuOpen ? (
                    <i className="bi bi-x-lg text-sm text-teal-600" />
                  ) : (
                    <i className="bi bi-list text-sm text-teal-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/20 z-[1002] md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div
              ref={menuRef}
              className="fixed top-14 right-3 z-[1003] w-56 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200/60 dark:border-stone-700/40 overflow-hidden md:hidden animate-fade-in-scale"
            >
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors duration-200"
              >
                <i className="bi bi-house text-teal-600"></i>
                <span className="text-sm font-medium">হোম</span>
              </Link>
              <Link
                href="/events"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors duration-200"
              >
                <i className="bi bi-calendar3 text-teal-600"></i>
                <span className="text-sm font-medium">ইভেন্ট</span>
              </Link>
              <Link
                href="/donate"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
              >
                <i className="bi bi-heart text-orange-500"></i>
                <span className="text-sm font-medium text-orange-600">দান করুন</span>
              </Link>
              <Link
                href="/status"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors duration-200"
              >
                <i className="bi bi-info-circle text-teal-600"></i>
                <span className="text-sm font-medium">তথ্য</span>
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors duration-200"
              >
                <i className="bi bi-gear text-stone-400"></i>
                <span className="text-sm font-medium">এডমিন</span>
              </Link>
            </div>
          </>
        )}
      </>
    );
  }

  // Full map mode navbar (original)
  return (
    <>
      {/* Floating Header */}
      <header className="absolute top-0 left-0 right-0 z-[1001] px-3 pt-3 pb-2 bg-gradient-to-b from-[#FAFAF9]/95 via-[#FAFAF9]/60 to-transparent dark:from-[#111111]/95 dark:via-[#111111]/60 dark:to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl shadow-md flex-shrink-0 overflow-hidden bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border border-teal-600/30 dark:border-teal-400/20 hover:shadow-lg transition-all duration-200">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center">
              <i className="bi bi-cup-hot text-white text-xs"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold leading-none text-teal-700 dark:text-teal-400">ফ্রি ফুড</span>
              <span className="text-[10px] font-bold leading-none text-teal-600 dark:text-teal-500">ম্যাপ</span>
            </div>
          </Link>

          {/* Search bar - desktop only */}
          <div className="hidden lg:block flex-1 relative">
            <i className="bi bi-search text-sm text-teal-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="স্পট বা এলাকা খুঁজুন…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-8 py-2.5 rounded-xl text-sm shadow-md focus:outline-none focus:ring-2 bg-white border border-teal-200 text-foreground focus:ring-teal-500/50"
            />
          </div>

          {/* Nav buttons - desktop */}
          <nav className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
            <Link
              href="/donate"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl shadow-md bg-white border border-amber-200 transition-all active:scale-95 hover:shadow-lg hover:-translate-y-0.5"
            >
              <i className="bi bi-heart text-xs text-orange-500"></i>
              <span className="text-xs font-bold text-orange-500">দান করুন</span>
            </Link>
            <Link
              href="/dev-info"
              className="flex items-center gap-1.5 px-2 py-2 rounded-xl shadow-md bg-white border border-teal-200 transition-all active:scale-95 hover:shadow-lg hover:-translate-y-0.5"
            >
              <i className="bi bi-info-circle text-xs text-teal-600" />
              <span className="text-xs font-bold text-teal-600">তথ্য</span>
            </Link>
            <Link
              href="/status"
              className="flex items-center justify-center px-2 py-2 rounded-xl shadow-md bg-white border border-teal-200 transition-all active:scale-95 hover:shadow-lg hover:-translate-y-0.5"
            >
              <i className="bi bi-bar-chart text-xs text-teal-600" />
            </Link>
          </nav>

          {/* Mobile right buttons */}
          <div className="flex lg:hidden items-center gap-1.5 flex-shrink-0">
            {/* Mobile search toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-xl shadow-md bg-white border border-teal-200 transition-all active:scale-95"
              aria-label="খুঁজুন"
            >
              <i className="bi bi-search text-sm text-teal-600" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-xl shadow-md bg-white border border-teal-200 transition-all active:scale-95"
              aria-label="মেনু"
            >
              {mobileMenuOpen ? (
                <i className="bi bi-x-lg text-sm text-teal-600" />
              ) : (
                <i className="bi bi-list text-sm text-teal-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileSearchOpen && (
          <div className="mt-2 px-1 pointer-events-auto">
            <div className="relative">
              <i className="bi bi-search text-sm text-teal-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="স্পট বা এলাকা খুঁজুন…"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-8 py-2.5 rounded-xl text-sm shadow-md focus:outline-none focus:ring-2 bg-white border border-teal-200 text-foreground focus:ring-teal-500/50"
              />
            </div>
          </div>
        )}
      </header>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-[1002] lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            ref={menuRef}
            className="absolute top-[72px] right-3 z-[1003] w-52 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200/60 dark:border-stone-700/40 overflow-hidden lg:hidden animate-fade-in-scale"
          >
            <Link
              href="/donate"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                <i className="bi bi-heart text-xs text-orange-500" />
              </div>
              <span className="text-sm font-medium text-orange-600">দান করুন</span>
            </Link>
            <Link
              href="/dev-info"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                <i className="bi bi-info-circle text-xs text-teal-600" />
              </div>
              <span className="text-sm font-medium">তথ্য</span>
            </Link>
            <Link
              href="/status"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                <i className="bi bi-bar-chart text-xs text-teal-600" />
              </div>
              <span className="text-sm font-medium">পরিসংখ্যান</span>
            </Link>
            <div className="border-t border-stone-100 dark:border-stone-700/50">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onAddSpot();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                  <i className="bi bi-plus-lg text-xs text-white" />
                </div>
                <span className="text-sm font-bold text-teal-700 dark:text-teal-400">স্পট যোগ করুন</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
