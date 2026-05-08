"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { subscribeToSpots, voteSpot, createSpot } from "@/lib/firebase-service";
import type { Spot, SpotType } from "@/types";
import { SPOT_TYPE_CONFIG } from "@/types";

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

  // Load user votes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("free-food-map-votes");
      if (saved) setUserVotes(JSON.parse(saved));
    } catch {}
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
  const activeCount = useMemo(() => spots.filter((s) => s.active).length, [spots]);
  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return spots.filter((s) => s.createdAt >= today.getTime()).length;
  }, [spots]);

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
        await createSpot({
          ...data,
          country: "বাংলাদেশ",
          openDays: ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"],
          openTime: "00:00",
          closeTime: "23:59",
        });
        setShowAddModal(false);
      } catch (err) {
        console.error("Create spot failed:", err);
      }
    },
    []
  );

  // Handle spot click (fly to on map)
  const handleSpotClick = useCallback((spot: Spot) => {
    setSelectedSpot(spot);
    setMapCenter({ lat: spot.lat, lng: spot.lng });
    setPanelExpanded(false);
    // Clear center after 3s to allow user interaction
    setTimeout(() => setMapCenter(undefined), 3000);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="glass gradient-header relative z-[1000] px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <a href="/" className="flex items-center gap-2 hover:scale-105 transition-transform">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 via-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-teal-200/50">
                <i className="bi bi-cup-hot text-base"></i>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-[#111827] leading-tight">
                  ফ্রি ফুড ম্যাপ
                </h1>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  আপনার শহরে সারাবছর ফ্রি খাবারের স্পট খুঁজুন ও যুক্ত করুন।
                </p>
              </div>
            </a>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-white text-sm"></i>
              <input
                type="text"
                placeholder="এলাকা বা স্পট খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 border-0 shadow-lg text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200/60">
              <span className="live-dot"></span>
              <span className="hidden sm:inline">সরাসরি</span>
            </div>

            {/* Admin link */}
            <a
              href="/admin"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/60 hover:bg-teal-100 transition-colors"
              title="এডমিন"
            >
              <i className="bi bi-gear-fill text-sm"></i>
              <span className="hidden sm:inline text-xs font-medium">এডমিন</span>
            </a>
          </div>
        </div>
      </header>

      {/* Map Area */}
      <div className="relative flex-1">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="relative mb-3">
              <div className="spinner"></div>
              <i className="bi bi-cup-hot absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent text-sm"></i>
            </div>
            <p className="text-sm text-muted-foreground font-medium">ম্যাপ লোড হচ্ছে...</p>
            <p className="text-xs text-muted-foreground/70 mt-1">স্পট খুঁজে আনা হচ্ছে</p>
          </div>
        )}

        {/* Spot Counter Overlay */}
        <div className="absolute top-3 left-3 z-[1000]">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-sm font-semibold shadow-md border border-teal-200/60">
            <i className="bi bi-geo-alt-fill text-sm text-teal-600"></i>
            <span>সর্বমোট: {toBn(activeCount)} | নতুন: {toBn(todayCount)} | নিশ্চিত: {toBn(verifiedCount)}</span>
          </div>
        </div>

        {/* Map */}
        <SpotMap
          spots={filteredSpots}
          onSpotClick={handleSpotClick}
          center={mapCenter}
          onVote={handleVote}
          userVotes={userVotes}
          isLoading={loading}
        />

        {/* Bottom Sheet */}
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

        {/* FAB Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="absolute bottom-4 right-4 z-[1000] w-14 h-14 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-xl flex items-center justify-center hover:shadow-2xl hover:shadow-teal-300/50 transition-all hover:scale-105 active:scale-95 no-print sm:bottom-6 sm:right-6 sm:w-16 sm:h-16 ring-4 ring-teal-200/50 animate-pulse-glow"
          title="নতুন স্পট যোগ করুন"
        >
          <i className="bi bi-plus-lg text-lg sm:text-xl"></i>
        </button>
      </div>

      {/* Add Spot Modal */}
      <AddSpotModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSpot}
      />

      {/* Footer Bar */}
      <footer className="relative z-[999] py-2.5 px-4 no-print bg-[#111827] border-t border-[#1F2937]">
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
            <i className="bi bi-cup-hot text-teal-400 text-xs"></i>
            <span>ফ্রি ফুড ম্যাপ &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF] flex-wrap">
            <a href="/dev-info" className="hover:text-teal-300 hover:underline transition-colors">আমাদের সম্পর্কে</a>
            <span className="text-[#374151]">|</span>
            <a href="/dev-info" className="hover:text-teal-300 hover:underline transition-colors">কিভাবে কাজ করে</a>
            <span className="text-[#374151]">|</span>
            <a href="/dev-info" className="hover:text-teal-300 hover:underline transition-colors">যোগাযোগ</a>
            <span className="text-[#374151]">|</span>
            <a href="/admin" className="hover:text-teal-300 hover:underline transition-colors">এডমিন লগইন</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
