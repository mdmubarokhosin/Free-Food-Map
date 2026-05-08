"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { subscribeToSpots, voteSpot, createSpot } from "@/lib/firebase-service";
import type { Spot, SpotType } from "@/types";
import { SPOT_TYPE_CONFIG } from "@/types";

const SpotMap = dynamic(() => import("@/components/app/SpotMap"), { ssr: false });
const BottomSheet = dynamic(() => import("@/components/app/BottomSheet"), { ssr: false });
const AddSpotModal = dynamic(() => import("@/components/app/AddSpotModal"), { ssr: false });

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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-200/50">
                <i className="bi bi-cup-hot text-base"></i>
              </div>
              <h1 className="text-lg font-bold text-foreground hidden sm:block">
                ফ্রি ফুড ম্যাপ
              </h1>
            </a>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
              <input
                type="text"
                placeholder="এলাকা বা স্পট খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border-0 shadow-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-semibold">
              <span className="live-dot"></span>
              <span className="hidden sm:inline">সরাসরি</span>
            </div>

            {/* Admin link */}
            <a
              href="/admin"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
              title="এডমিন"
            >
              <i className="bi bi-gear-fill w-4 h-4 flex items-center justify-center text-sm"></i>
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
        <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shadow-lg shadow-orange-200">
            <i className="bi bi-geo-alt-fill text-sm"></i>
            <span>সর্বমোট: {activeCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold shadow-lg shadow-emerald-200">
            <i className="bi bi-patch-check-fill text-sm"></i>
            <span>নিশ্চিত: {verifiedCount}</span>
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
          className="absolute bottom-4 right-4 z-[1000] w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl flex items-center justify-center hover:shadow-2xl hover:shadow-orange-300 transition-all hover:scale-105 active:scale-95 no-print sm:bottom-6 sm:right-6 sm:w-16 sm:h-16 ring-4 ring-orange-200/50 animate-pulse-glow"
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

      {/* Floating Footer */}
      <footer className="glass fixed bottom-0 left-0 right-0 z-[999] py-2 text-center text-xs text-muted-foreground no-print pointer-events-none backdrop-blur-md bg-white/30 border-t border-white/20">
        <span className="inline-flex items-center gap-1.5">
          <i className="bi bi-cup-hot text-accent text-xs"></i>
          ফ্রি ফুড ম্যাপ &copy; {new Date().getFullYear()} — দরিদ্রদের জন্য বিনামূল্যে খাবার
        </span>
      </footer>
    </div>
  );
}
