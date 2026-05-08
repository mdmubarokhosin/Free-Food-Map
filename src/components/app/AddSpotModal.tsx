"use client";

import { useState, useCallback } from "react";
import type { SpotType } from "@/types";
import { SPOT_TYPE_CONFIG } from "@/types";

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    type: SpotType;
    address: string;
    area: string;
    city: string;
    lat: number;
    lng: number;
    notes?: string;
  }) => void;
}

export default function AddSpotModal({ isOpen, onClose, onAdd }: AddSpotModalProps) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [type, setType] = useState<SpotType>("daily_meal");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [notes, setNotes] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ name: string; lat: number; lng: number; display_name: string }>>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  // GPS Location
  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      alert("আপনার ব্রাউজারে লোকেশন সাপোর্ট নেই");
      return;
    }
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setSearching(false);
      },
      () => {
        // Fallback: IP-based location
        fetch("https://ipapi.co/json/")
          .then((r) => r.json())
          .then((d) => {
            setLat(d.latitude?.toFixed(6) || "");
            setLng(d.longitude?.toFixed(6) || "");
          })
          .catch(() => {})
          .finally(() => setSearching(false));
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  // Search location (Nominatim)
  const handleLocationSearch = useCallback(async () => {
    if (!locationSearch.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&countrycodes=bd&limit=5`
      );
      const data = await res.json();
      setSearchResults(data.map((r: Record<string, string>) => ({
        name: r.display_name?.split(",")[0] || "",
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        display_name: r.display_name || "",
      })));
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, [locationSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // Anti-spam
    if (!name.trim() || !area.trim() || !lat || !lng) return;

    setSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        type,
        address: area.trim(),
        area: area.trim(),
        city: "ঢাকা",
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        notes: notes.trim() || undefined,
      });
      // Reset
      setName("");
      setArea("");
      setType("daily_meal");
      setLat("");
      setLng("");
      setNotes("");
      setSearchResults([]);
      setLocationSearch("");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-0 sm:mx-4 mb-0 sm:mb-0 bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up sm:animate-fade-in-scale max-h-[90vh] overflow-y-auto custom-scrollbar border border-border/50" >
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 px-5 py-4 rounded-t-2xl sm:rounded-t-2xl relative overflow-hidden shadow-lg shadow-orange-200/30 dark:shadow-orange-900/30">
          <div className="absolute inset-0 opacity-10">
            <i className="bi bi-cup-hot-fill absolute top-2 right-4 text-6xl text-white rotate-12"></i>
          </div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <i className="bi bi-plus-circle-fill text-white text-sm"></i>
                </div>
                <h2 className="text-lg font-bold text-white">নতুন স্পট যোগ করুন</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <p className="text-white/80 text-xs mt-1 ml-10">বিনামূল্যে খাবার বিতরণের স্থান তথ্য দিন</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Honeypot - hidden anti-spam */}
          <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              <i className="bi bi-shop text-orange-400 mr-1"></i>
              স্থানের নাম <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <i className="bi bi-shop absolute left-3 top-1/2 -translate-y-1/2 text-orange-400"></i>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: মসজিদুল ফালাহ কমিউনিটি সেন্টার"
                maxLength={100}
                required
                className="form-input pl-9"
              />
            </div>
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              <i className="bi bi-pin-map text-orange-400 mr-1"></i>
              এলাকা / মহল্লা <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <i className="bi bi-pin-map absolute left-3 top-1/2 -translate-y-1/2 text-orange-400"></i>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="যেমন: ধানমন্ডি ২৭"
                maxLength={100}
                required
                className="form-input pl-9"
              />
            </div>
          </div>

          {/* Food Type */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              <i className="bi bi-list-ul text-orange-400 mr-1"></i>
              খাবারের ধরন <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <i className="bi bi-list-ul absolute left-3 top-1/2 -translate-y-1/2 text-orange-400"></i>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SpotType)}
                className="form-input pl-9 appearance-none"
              >
                {Object.entries(SPOT_TYPE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.emoji} {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              <i className="bi bi-geo-alt text-orange-400 mr-1"></i>
              লোকেশন <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="অক্ষাংশ (lat)"
                readOnly
                className="form-input"
              />
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="দ্রাঘিমাংশ (lng)"
                readOnly
                className="form-input"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGPS}
                disabled={searching}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {searching ? (
                  <div className="spinner w-4 h-4 border-2"></div>
                ) : (
                  <><i className="bi bi-crosshair"></i> GPS লোকেশন</>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = `https://www.google.com/maps?q=${lat},${lng}`;
                  window.open(url, "_blank");
                }}
                disabled={!lat || !lng}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                <i className="bi bi-map"></i>
              </button>
            </div>

            {/* Location search */}
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleLocationSearch())}
                placeholder="এলাকা খুঁজে লোকেশন বেছে নিন..."
                className="form-input text-xs py-2"
              />
              <button
                type="button"
                onClick={handleLocationSearch}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:shadow-md transition-all"
              >
                খুঁজুন
              </button>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setLat(r.lat.toFixed(6));
                      setLng(r.lng.toFixed(6));
                      setSearchResults([]);
                      if (!area) setArea(r.name);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-secondary transition-colors border border-border/50"
                  >
                    <i className="bi bi-geo-alt text-orange-500"></i> {r.display_name.length > 60 ? r.display_name.slice(0, 60) + "..." : r.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              <i className="bi bi-chat-left-text text-orange-400 mr-1"></i>
              বিবরণ (ঐচ্ছিক)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="অতিরিক্ত তথ্য..."
              rows={2}
              className="form-input resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !name.trim() || !area.trim() || !lat || !lng}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 text-white font-bold text-sm hover:shadow-xl hover:shadow-orange-200/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><div className="spinner w-4 h-4 border-2 border-white/30 border-t-white"></div> সংরক্ষণ হচ্ছে...</>
            ) : (
              <><i className="bi bi-check-circle text-sm"></i> স্পট যোগ করুন</>
            )}
          </button>

          <p className="text-center text-[11px] text-muted-foreground">
            স্পট যোগ করার পর এডমিন যাচাই করবেন
          </p>
        </form>
      </div>
    </div>
  );
}
