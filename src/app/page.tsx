"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { subscribeToSpots, voteSpot, createSpot } from "@/lib/firebase-service";
import type { Spot, SpotType } from "@/types";
import { SPOT_TYPE_CONFIG } from "@/types";
import Link from "next/link";

const SpotMap = dynamic(() => import("@/components/app/SpotMap"), { ssr: false });
const BottomSheet = dynamic(() => import("@/components/app/BottomSheet"), { ssr: false });
const AddSpotModal = dynamic(() => import("@/components/app/AddSpotModal"), { ssr: false });

// Helper: convert English numerals to Bengali numerals
function toBn(n: number): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/\d/g, (d) => bnDigits[parseInt(d)]);
}

export default function HomePage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, "true" | "false">>({});
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Load user votes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("free-food-map-votes");
      if (saved) setUserVotes(JSON.parse(saved));
    } catch {}
  }, []);

  // Show welcome modal on first visit
  useEffect(() => {
    const seen = localStorage.getItem("free-food-map-welcome");
    if (!seen) {
      setShowWelcome(true);
    }
  }, []);

  // Subscribe to real-time spots
  useEffect(() => {
    const unsub = subscribeToSpots((data) => {
      setSpots(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Filter spots by search
  const filteredSpots = useMemo(() => {
    if (!searchQuery.trim()) return spots;
    const q = searchQuery.toLowerCase();
    return spots.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    );
  }, [spots, searchQuery]);

  const verifiedCount = useMemo(
    () => spots.filter((s) => s.verified && s.active).length,
    [spots]
  );
  const totalCount = useMemo(() => spots.filter((s) => s.active).length, [spots]);

  // Handle vote
  const handleVote = useCallback(
    async (spotId: string, voteType: "true" | "false") => {
      if (userVotes[spotId]) return;
      try {
        await voteSpot(spotId, voteType);
        const newVotes = { ...userVotes, [spotId]: voteType };
        setUserVotes(newVotes);
        localStorage.setItem("free-food-map-votes", JSON.stringify(newVotes));
      } catch (err) {
        console.error("Vote failed:", err);
      }
    },
    [userVotes]
  );

  // Handle add spot
  const handleAddSpot = useCallback(
    async (data: {
      name: string; type: SpotType; address: string; area: string;
      city: string; lat: number; lng: number; notes?: string;
    }) => {
      try {
        const spotId = await createSpot({
          ...data,
          country: "বাংলাদেশ",
          openDays: ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"],
          openTime: "00:00",
          closeTime: "23:59",
        });
        setShowAddModal(false);
        if (spotId) {
          toast.success("স্পট সফলভাবে যোগ হয়েছে!", { description: "এডমিন যাচাইয়ের অপেক্ষায় আছে" });
        } else {
          toast.error("স্পট যোগ ব্যর্থ হয়েছে", { description: "আবার চেষ্টা করুন" });
        }
      } catch (err) {
        console.error("Create spot failed:", err);
        const msg = err instanceof Error ? err.message : "অজানা ত্রুটি";
        toast.error("স্পট যোগ ব্যর্থ হয়েছে", { description: msg });
      }
    },
    []
  );

  // Handle spot click (fly to on map)
  const handleSpotClick = useCallback((spot: Spot) => {
    setSelectedSpot(spot);
    setMapCenter({ lat: spot.lat, lng: spot.lng });
    setPanelExpanded(false);
    setTimeout(() => setMapCenter(undefined), 3000);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[rgb(250,248,245)]">
      {/* Full-screen Map (absolute inset-0) */}
      <div className="absolute inset-0 z-0">
        <SpotMap
          spots={filteredSpots}
          onSpotClick={handleSpotClick}
          center={mapCenter}
          onVote={handleVote}
          userVotes={userVotes}
          isLoading={loading}
        />
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-[rgb(250,248,245)]/85 backdrop-blur-md">
          <div className="relative mb-4">
            <div className="w-14 h-14 rounded-2xl gradient-primary-green flex items-center justify-center shadow-lg animate-float">
              <i className="bi bi-cup-hot text-white text-xl"></i>
            </div>
            <div className="absolute -inset-3 rounded-full border-2 border-green-200/30 animate-ping" style={{ animationDuration: '2s' }}></div>
          </div>
          <p className="text-sm font-semibold text-[#32221B]">ম্যাপ লোড হচ্ছে...</p>
          <p className="text-xs text-[#93796C] mt-1">স্পট খুঁজে আনা হচ্ছে</p>
        </div>
      )}

      {/* ===== Floating Header ===== */}
      <header className="absolute top-0 left-0 right-0 z-[1001] pointer-events-none">
        <div className="gradient-header-fade px-3 pt-3 pb-6">
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0 px-2.5 py-1.5 bg-white rounded-xl border-[1.5px] border-[#107539] shadow-md hover:shadow-lg transition-all duration-200">
              <div className="h-8 w-8 rounded-lg gradient-primary-green flex items-center justify-center">
                <i className="bi bi-cup-hot text-white text-xs"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold leading-none text-[#0B411F]">ফ্রি ফুড</span>
                <span className="text-[10px] font-bold leading-none text-[#107539]">ম্যাপ</span>
              </div>
            </div>

            {/* Search - Desktop only */}
            <div className="hidden lg:block flex-1 relative">
              <i className="bi bi-search text-sm text-[#107539] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="স্পট বা এলাকা খুঁজুন…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2.5 rounded-xl text-sm shadow-md focus:outline-none focus:ring-2 bg-white border border-[#D7EADE] text-foreground focus:ring-[#107539]/50"
              />
            </div>

            {/* Nav buttons - Desktop */}
            <nav className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
              <Link
                href="/donate"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl shadow-md bg-white border border-[#EAE2D7] transition-all active:scale-95 hover:shadow-lg hover:-translate-y-0.5"
              >
                <i className="bi bi-heart text-xs text-[#F99406]"></i>
                <span className="text-xs font-bold text-[#F99406]">দান করুন</span>
              </Link>
              <Link
                href="/dev-info"
                className="flex items-center gap-1.5 px-2 py-2 rounded-xl shadow-md bg-white border border-[#D7EADE] transition-all active:scale-95 hover:shadow-lg hover:-translate-y-0.5"
              >
                <i className="bi bi-info-circle text-xs text-[#107539]" />
                <span className="text-xs font-bold text-[#107539]">তথ্য</span>
              </Link>
              <Link
                href="/status"
                className="flex items-center justify-center px-2 py-2 rounded-xl shadow-md bg-white border border-[#D7EADE] transition-all active:scale-95 hover:shadow-lg hover:-translate-y-0.5"
              >
                <i className="bi bi-bar-chart text-xs text-[#107539]" />
              </Link>
            </nav>

            {/* Mobile right buttons */}
            <div className="flex lg:hidden items-center gap-1.5 flex-shrink-0 ml-auto">
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="flex items-center justify-center w-10 h-10 rounded-xl shadow-md bg-white border border-[#D7EADE] transition-all active:scale-95"
                aria-label="খুঁজুন"
              >
                <i className="bi bi-search text-sm text-[#107539]" />
              </button>
              <button
                onClick={() => setShowMobileDrawer(!showMobileDrawer)}
                className="flex items-center justify-center w-10 h-10 rounded-xl shadow-md bg-white border border-[#D7EADE] transition-all active:scale-95"
                aria-label="মেনু"
              >
                {showMobileDrawer ? (
                  <i className="bi bi-x-lg text-sm text-[#107539]" />
                ) : (
                  <i className="bi bi-list text-sm text-[#107539]" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          {showMobileSearch && (
            <div className="mt-2 px-1 pointer-events-auto">
              <div className="relative">
                <i className="bi bi-search text-sm text-[#107539] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="স্পট বা এলাকা খুঁজুন…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-8 py-2.5 rounded-xl text-sm shadow-md focus:outline-none focus:ring-2 bg-white border border-[#D7EADE] text-foreground focus:ring-[#107539]/50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Spots Badges Row */}
        <div className="px-3 flex items-center gap-2 pointer-events-auto">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full gradient-primary-green text-white text-[10px] font-bold shadow-sm">
            🍛 সর্বমোট স্পট: {toBn(totalCount)}টি
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#DBF0E3] text-[#107539] text-[10px] font-bold shadow-sm">
            ✓ নিশ্চিত: {toBn(verifiedCount)}টি
          </span>
        </div>
      </header>

      {/* ===== Mobile Side Drawer ===== */}
      {showMobileDrawer && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[1002] lg:hidden"
            onClick={() => setShowMobileDrawer(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 z-[1003] w-[280px] max-w-[85vw] bg-[rgb(250,248,245)] shadow-2xl animate-slide-up-mobile-drawer flex flex-col">
            {/* Drawer Header */}
            <div className="relative p-5 pb-6 gradient-primary-green overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              </div>
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                  <i className="bi bi-cup-hot-fill text-xl text-white"></i>
                </div>
                <div>
                  <span className="font-bold text-sm text-white block">ফ্রি ফুড ম্যাপ</span>
                  <p className="text-[11px] text-white/60">ফ্রি খাবারের স্পট খুঁজুন</p>
                </div>
              </div>
            </div>

            {/* Drawer Nav */}
            <nav className="flex-1 p-3 space-y-1">
              <Link
                href="/"
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#DBF0E3] transition-colors"
              >
                <i className="bi bi-house text-[#107539]"></i>
                <span className="text-sm font-medium">হোম</span>
              </Link>
              <Link
                href="/events"
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#DBF0E3] transition-colors"
              >
                <i className="bi bi-calendar3 text-[#107539]"></i>
                <span className="text-sm font-medium">ইভেন্ট</span>
              </Link>
              <Link
                href="/donate"
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#FBE9D0] transition-colors"
              >
                <i className="bi bi-heart text-[#F99406]"></i>
                <span className="text-sm font-medium text-[#F99406]">দান করুন</span>
              </Link>
              <Link
                href="/dev-info"
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#DBF0E3] transition-colors"
              >
                <i className="bi bi-info-circle text-[#107539]"></i>
                <span className="text-sm font-medium">তথ্য</span>
              </Link>
              <Link
                href="/status"
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#DBF0E3] transition-colors"
              >
                <i className="bi bi-bar-chart text-[#107539]"></i>
                <span className="text-sm font-medium">পরিসংখ্যান</span>
              </Link>
              <div className="border-t border-[#EAE2D7] pt-1 mt-1">
                <button
                  onClick={() => {
                    setShowMobileDrawer(false);
                    setShowAddModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl gradient-primary-green text-white hover:opacity-90 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <i className="bi bi-plus-lg text-xs"></i>
                  </div>
                  <span className="text-sm font-bold">স্পট যোগ করুন</span>
                </button>
              </div>
            </nav>

            <div className="p-3 border-t border-[#EAE2D7]">
              <Link
                href="/admin"
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <i className="bi bi-gear text-[#93796C]"></i>
                <span className="text-sm text-[#93796C]">এডমিন</span>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ===== Bottom Panel (Green Gradient) ===== */}
      <BottomSheet
        spots={filteredSpots}
        onAddClick={() => setShowAddModal(true)}
        onLike={(id) => handleVote(id, "true")}
        onDislike={(id) => handleVote(id, "false")}
        expanded={panelExpanded}
        onToggleExpand={() => setPanelExpanded(!panelExpanded)}
        onSpotClick={handleSpotClick}
        selectedSpotId={selectedSpot?.id || null}
        isLoading={loading}
      />

      {/* ===== FAB Button (Orange Gradient) ===== */}
      <button
        onClick={() => setShowAddModal(true)}
        className="absolute z-[1001] right-4 w-14 h-14 rounded-full gradient-orange-fab text-white shadow-2xl flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 no-print sm:right-6 sm:w-16 sm:h-16"
        style={{ bottom: panelExpanded ? 'calc(75vh + 12px)' : '235px' }}
        title="নতুন স্পট যোগ করুন"
      >
        <i className="bi bi-plus-lg text-lg sm:text-xl"></i>
      </button>

      {/* ===== Simple Footer ===== */}
      <div className="absolute z-[999] bottom-0 left-0 right-0 pointer-events-none pb-2 px-3">
        <div className="pointer-events-auto flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-800">
          <a href="/dev-info#about" className="hover:underline">আমাদের সম্পর্কে</a>
          <span className="text-emerald-600">·</span>
          <a href="/dev-info#how-it-works" className="hover:underline">কিভাবে কাজ করে</a>
          <span className="text-emerald-600">·</span>
          <a href="/dev-info#contact" className="hover:underline">যোগাযোগ</a>
          <span className="text-emerald-600">·</span>
          <span className="text-[#14522B] font-bold normal-case">© {new Date().getFullYear()} ফ্রি ফুড ম্যাপ</span>
        </div>
      </div>

      {/* ===== Add Spot Modal ===== */}
      <AddSpotModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSpot}
      />

      {/* ===== Welcome Modal ===== */}
      {showWelcome && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-md">
          <div className="relative w-[340px] max-w-[90vw] bg-white rounded-[2.5rem] p-8 text-center shadow-2xl animate-fade-in-scale overflow-hidden">
            {/* Decorative circle */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full gradient-primary-green opacity-10" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full gradient-orange-fab opacity-10" />
            
            <div className="relative">
              {/* Sparkle icon */}
              <div className="w-16 h-16 rounded-full gradient-primary-green flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i className="bi bi-stars text-white text-2xl"></i>
              </div>
              
              <h2 className="text-xl font-bold text-[#0B411F] mb-2">ফ্রি ফুড ম্যাপে স্বাগতম!</h2>
              <p className="text-sm text-[#93796C] leading-relaxed mb-6">
                আপনার এলাকায় ফ্রি খাবারের স্পট খুঁজুন অথবা নতুন স্পট যোগ করে সবাইকে সাহায্য করুন।
              </p>
              
              <button
                onClick={() => {
                  setShowWelcome(false);
                  localStorage.setItem("free-food-map-welcome", "seen");
                }}
                className="w-full py-3 rounded-2xl gradient-primary-green text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                শুরু করুন 🍛
              </button>
              
              <button
                onClick={() => {
                  setShowWelcome(false);
                  localStorage.setItem("free-food-map-welcome", "seen");
                }}
                className="mt-3 text-[#93796C] text-xs hover:text-[#0B411F] transition-colors"
              >
                পরে দেখবো
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
