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
        <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-3 sm:px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center">
                  <span className="text-lg">🍽️</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-none text-emerald-700 dark:text-emerald-400">ফ্রি ফুড</span>
                  <span className="text-xs font-bold leading-none text-emerald-600 dark:text-emerald-500">ম্যাপ</span>
                </div>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <i className="bi bi-house text-xs mr-1"></i>
                  হোম
                </Link>
                <Link href="/events" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <i className="bi bi-calendar3 text-xs mr-1"></i>
                  ইভেন্ট
                </Link>
                <Link href="/donate" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <i className="bi bi-heart text-xs mr-1"></i>
                  দান করুন
                </Link>
                <Link href="/status" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <i className="bi bi-info-circle text-xs mr-1"></i>
                  তথ্য
                </Link>
                <Link href="/admin" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <i className="bi bi-gear text-xs mr-1"></i>
                  এডমিন
                </Link>
              </nav>

              {/* Mobile menu toggle */}
              <div className="md:hidden flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-green-500 text-white">
                  {toBn(totalSpots)} স্পট
                </span>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  {mobileMenuOpen ? (
                    <i className="bi bi-x-lg text-sm text-emerald-600" />
                  ) : (
                    <i className="bi bi-list text-sm text-emerald-600" />
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
              className="fixed top-14 right-3 z-[1003] w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden md:hidden"
            >
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors"
              >
                <i className="bi bi-house text-emerald-600"></i>
                <span className="text-sm font-medium">হোম</span>
              </Link>
              <Link
                href="/events"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors"
              >
                <i className="bi bi-calendar3 text-emerald-600"></i>
                <span className="text-sm font-medium">ইভেন্ট</span>
              </Link>
              <Link
                href="/donate"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors"
              >
                <i className="bi bi-heart text-red-500"></i>
                <span className="text-sm font-medium text-red-600">দান করুন</span>
              </Link>
              <Link
                href="/status"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors"
              >
                <i className="bi bi-info-circle text-emerald-600"></i>
                <span className="text-sm font-medium">তথ্য</span>
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                <i className="bi bi-gear text-gray-500"></i>
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
      <header className="absolute top-0 left-0 right-0 z-[1001] px-3 pt-3 pb-2 bg-gradient-to-b from-white/95 via-white/60 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 px-2 py-1 rounded-xl shadow-md flex-shrink-0 overflow-hidden bg-white border border-emerald-600 hover:shadow-lg transition-all">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center">
              <span className="text-lg">🍽️</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold leading-none text-emerald-700">ফ্রি ফুড</span>
              <span className="text-[10px] font-bold leading-none text-emerald-600">ম্যাপ</span>
            </div>
          </Link>

          {/* Search bar - desktop only */}
          <div className="hidden lg:block flex-1 relative">
            <i className="bi bi-search text-sm text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="স্পট বা এলাকা খুঁজুন…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-8 py-2.5 rounded-xl text-sm shadow-md focus:outline-none focus:ring-2 bg-white border border-green-200 text-green-900 focus:ring-emerald-500/50"
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
              className="flex items-center gap-1.5 px-2 py-2 rounded-xl shadow-md bg-white border border-green-200 transition-all active:scale-95 hover:shadow-lg hover:-translate-y-0.5"
            >
              <i className="bi bi-book text-xs text-emerald-600" />
              <span className="text-xs font-bold text-emerald-600">ব্লগ</span>
            </Link>
            <Link
              href="/status"
              className="flex items-center justify-center px-2 py-2 rounded-xl shadow-md bg-white border border-green-200 transition-all active:scale-95 hover:shadow-lg hover:-translate-y-0.5"
            >
              <i className="bi bi-info-circle text-xs text-emerald-600" />
            </Link>
          </nav>

          {/* Mobile right buttons */}
          <div className="flex lg:hidden items-center gap-1.5 flex-shrink-0">
            {/* Mobile search toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-xl shadow-md bg-white border border-green-200 transition-all active:scale-95"
            >
              <i className="bi bi-search text-sm text-emerald-600" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-xl shadow-md bg-white border border-green-200 transition-all active:scale-95"
            >
              {mobileMenuOpen ? (
                <i className="bi bi-x-lg text-sm text-emerald-600" />
              ) : (
                <i className="bi bi-list text-sm text-emerald-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileSearchOpen && (
          <div className="mt-2 px-1 pointer-events-auto">
            <div className="relative">
              <i className="bi bi-search text-sm text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="স্পট বা এলাকা খুঁজুন…"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-8 py-2.5 rounded-xl text-sm shadow-md focus:outline-none focus:ring-2 bg-white border border-green-200 text-green-900 focus:ring-emerald-500/50"
              />
            </div>
          </div>
        )}

        {/* Stats badges */}
        <div className="flex items-center gap-2 mt-2 px-1 pointer-events-auto">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full shadow-sm bg-gradient-to-r from-emerald-600 to-green-500 text-white">
            🍛 সর্বমোট স্পট: {toBn(totalSpots)}টি
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full shadow-sm bg-emerald-50 text-emerald-700">
            <i className="bi bi-patch-check-fill text-[10px]"></i> নিশ্চিত: {toBn(verifiedSpots)}টি
          </span>
        </div>

        {/* Info bar - food related info */}
        <div className="mt-2 px-1 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-md bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 border border-emerald-500">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex flex-col items-center flex-shrink-0">
                <span className="text-[10px] text-white/70 font-medium leading-none">ফ্রি ফুড</span>
                <span className="text-lg font-black text-white leading-tight">🍽️</span>
                <span className="text-[9px] text-white/60 leading-none">(ম্যাপ)</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <i className="bi bi-geo-alt-fill text-base text-white"></i>
                <div className="flex flex-col">
                  <span className="text-[9px] text-white/70 leading-none">সক্রিয় স্পট</span>
                  <span className="text-sm font-bold text-white leading-tight">{toBn(totalSpots)}টি</span>
                </div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <i className="bi bi-check-circle-fill text-base text-yellow-300"></i>
                <div className="flex flex-col">
                  <span className="text-[9px] text-white/70 leading-none">ভেরিফাইড</span>
                  <span className="text-sm font-bold text-yellow-200 leading-tight">{toBn(verifiedSpots)}টি</span>
                </div>
              </div>
            </div>
            <i className="bi bi-hand-index text-lg text-white/60 flex-shrink-0"></i>
          </div>
        </div>
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
            className="absolute top-[180px] right-3 z-[1003] w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden lg:hidden"
          >
            <Link
              href="/donate"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <i className="bi bi-heart text-xs text-red-500" />
              </div>
              <span className="text-sm font-medium text-red-600">দান করুন</span>
            </Link>
            <Link
              href="/dev-info"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <i className="bi bi-book text-xs text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-gray-800">ব্লগ</span>
            </Link>
            <Link
              href="/status"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <i className="bi bi-info-circle text-xs text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-gray-800">তথ্য</span>
            </Link>
            <div className="border-t border-gray-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onAddSpot();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <i className="bi bi-plus-lg text-xs text-white" />
                </div>
                <span className="text-sm font-bold text-emerald-700">স্পট যোগ করুন</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
