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
  const menuRef = useRef<HTMLDivElement>(null);

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

  function toBn(n: number): string {
    const d = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(n).replace(/[0-9]/g, (c) => d[parseInt(c)]);
  }

  // Compact mode: simple navbar for non-map pages
  if (compact) {
    return (
      <>
        <header className="sticky top-0 z-50 bg-[rgb(250,248,245)]/90 dark:bg-[#111111]/90 backdrop-blur-xl border-b border-[#EAE2D7]/60">
          <div className="container mx-auto px-3 sm:px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white border-[1.5px] border-[#107539] flex items-center justify-center shadow-md">
                  <div className="h-7 w-7 rounded-lg gradient-primary-green flex items-center justify-center">
                    <i className="bi bi-cup-hot text-white text-xs"></i>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-none text-[#0B411F]">ফ্রি ফুড</span>
                  <span className="text-xs font-bold leading-none text-[#107539]">ম্যাপ</span>
                </div>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/" className="px-3 py-2 rounded-lg text-sm font-medium text-[#93796C] hover:bg-[#DBF0E3] hover:text-[#107539] transition-all duration-200">
                  <i className="bi bi-house text-xs mr-1"></i>
                  হোম
                </Link>
                <Link href="/events" className="px-3 py-2 rounded-lg text-sm font-medium text-[#93796C] hover:bg-[#DBF0E3] hover:text-[#107539] transition-all duration-200">
                  <i className="bi bi-calendar3 text-xs mr-1"></i>
                  ইভেন্ট
                </Link>
                <Link href="/donate" className="px-3 py-2 rounded-lg text-sm font-medium text-[#93796C] hover:bg-[#FBE9D0] hover:text-[#F99406] transition-all duration-200">
                  <i className="bi bi-heart text-xs mr-1"></i>
                  দান করুন
                </Link>
                <Link href="/status" className="px-3 py-2 rounded-lg text-sm font-medium text-[#93796C] hover:bg-[#DBF0E3] hover:text-[#107539] transition-all duration-200">
                  <i className="bi bi-info-circle text-xs mr-1"></i>
                  তথ্য
                </Link>
                <Link href="/admin" className="px-3 py-2 rounded-lg text-sm font-medium text-[#93796C] hover:bg-secondary transition-all duration-200">
                  <i className="bi bi-gear text-xs mr-1"></i>
                  এডমিন
                </Link>
              </nav>

              {/* Mobile menu toggle */}
              <div className="md:hidden flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full gradient-primary-green text-white shadow-sm">
                  {toBn(totalSpots)} স্পট
                </span>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#EAE2D7] hover:bg-[#DBF0E3] transition-all duration-200"
                  aria-label="মেনু"
                >
                  {mobileMenuOpen ? (
                    <i className="bi bi-x-lg text-sm text-[#107539]" />
                  ) : (
                    <i className="bi bi-list text-sm text-[#107539]" />
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
              className="fixed top-14 right-3 z-[1003] w-56 bg-white rounded-xl shadow-xl border border-[#EAE2D7] overflow-hidden md:hidden animate-fade-in-scale"
            >
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#DBF0E3] transition-colors duration-200"
              >
                <i className="bi bi-house text-[#107539]"></i>
                <span className="text-sm font-medium">হোম</span>
              </Link>
              <Link
                href="/events"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#DBF0E3] transition-colors duration-200"
              >
                <i className="bi bi-calendar3 text-[#107539]"></i>
                <span className="text-sm font-medium">ইভেন্ট</span>
              </Link>
              <Link
                href="/donate"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#FBE9D0] transition-colors duration-200"
              >
                <i className="bi bi-heart text-[#F99406]"></i>
                <span className="text-sm font-medium text-[#F99406]">দান করুন</span>
              </Link>
              <Link
                href="/status"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#DBF0E3] transition-colors duration-200"
              >
                <i className="bi bi-info-circle text-[#107539]"></i>
                <span className="text-sm font-medium">তথ্য</span>
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors duration-200"
              >
                <i className="bi bi-gear text-[#93796C]"></i>
                <span className="text-sm font-medium">এডমিন</span>
              </Link>
            </div>
          </>
        )}
      </>
    );
  }

  // Full map mode navbar (homepage has its own header now - this is kept for compatibility)
  return null;
}
