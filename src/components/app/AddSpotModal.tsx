"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
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
  }) => void | Promise<void>;
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
  const [error, setError] = useState("");

  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("আপনার ব্রাউজারে লোকেশন সাপোর্ট নেই");
      return;
    }
    setSearching(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setSearching(false);
        toast.success("লোকেশন পাওয়া গেছে");
      },
      () => {
        fetch("https://ipapi.co/json/")
          .then((r) => r.json())
          .then((d) => {
            if (d.latitude && d.longitude) {
              setLat(d.latitude.toFixed(6));
              setLng(d.longitude.toFixed(6));
              toast.success("আইপি থেকে লোকেশন পাওয়া গেছে");
            } else {
              toast.error("লোকেশন পাওয়া যায়নি। এলাকা সার্চ ব্যবহার করুন।");
            }
          })
          .catch(() => {
            toast.error("লোকেশন পাওয়া যায়নি। ম্যানুয়ালি দিন।");
          })
          .finally(() => setSearching(false));
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  const handleLocationSearch = useCallback(async () => {
    if (!locationSearch.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&countrycodes=bd&limit=5`
      );
      const data = await res.json();
      if (data.length === 0) {
        toast.error("কোনো লোকেশন পাওয়া যায়নি");
        setSearchResults([]);
      } else {
        setSearchResults(data.map((r: Record<string, string>) => ({
          name: r.display_name?.split(",")[0] || "",
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          display_name: r.display_name || "",
        })));
      }
    } catch {
      toast.error("সার্চ ব্যর্থ হয়েছে");
      setSearchResults([]);
    }
    setSearching(false);
  }, [locationSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    setError("");

    // Validation
    if (!name.trim()) {
      setError("স্থানের নাম দিন");
      return;
    }
    if (!area.trim()) {
      setError("এলাকা / মহল্লা দিন");
      return;
    }
    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      setError("লোকেশন নির্বাচন করুন (GPS বা সার্চ ব্যবহার করুন)");
      return;
    }

    setSubmitting(true);
    try {
      const result = onAdd({
        name: name.trim(),
        type,
        address: area.trim(),
        area: area.trim(),
        city: "ঢাকা",
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        notes: notes.trim() || undefined,
      });
      // Support both sync and async onAdd
      if (result instanceof Promise) {
        await result;
      }
      // Success — reset form and close
      setName("");
      setArea("");
      setType("daily_meal");
      setLat("");
      setLng("");
      setNotes("");
      setSearchResults([]);
      setLocationSearch("");
      setError("");
    } catch (err) {
      console.error("AddSpotModal error:", err);
      const msg = err instanceof Error ? err.message : "অজানা ত্রুটি";
      setError(msg);
      toast.error("স্পট যোগ ব্যর্থ হয়েছে", { description: msg });
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
      <div className="relative w-full max-w-lg mx-0 sm:mx-4 mb-0 bg-white rounded-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-slide-up sm:animate-fade-in-scale max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full gradient-primary-green opacity-10" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full gradient-orange-fab opacity-10" />

        <div className="relative p-6 sm:p-8">
          {/* Close button */}
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#EAE2D7] text-[#93796C] flex items-center justify-center hover:bg-[#D7EADE] transition-colors">
            <i className="bi bi-x-lg text-sm"></i>
          </button>

          {/* Centered icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full gradient-primary-green flex items-center justify-center shadow-lg">
              <i className="bi bi-plus-lg text-white text-2xl"></i>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-[#0B411F]">নতুন স্পট যোগ করুন</h2>
            <p className="text-xs text-[#93796C] mt-1">বিনামূল্যে খাবার বিতরণের স্থান তথ্য দিন</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 animate-fade-in">
              <i className="bi bi-exclamation-circle-fill text-red-500 text-sm"></i>
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-[#0B411F] mb-1">
                <i className="bi bi-shop text-[#107539] mr-1"></i>
                স্থানের নাম <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="যেমন: মসজিদুল ফালাহ কমিউনিটি সেন্টার"
                maxLength={100}
                required
                className="form-input"
              />
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-semibold text-[#0B411F] mb-1">
                <i className="bi bi-pin-map text-[#107539] mr-1"></i>
                এলাকা / মহল্লা <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => { setArea(e.target.value); setError(""); }}
                placeholder="যেমন: ধানমন্ডি ২৭"
                maxLength={100}
                required
                className="form-input"
              />
            </div>

            {/* Food Type */}
            <div>
              <label className="block text-sm font-semibold text-[#0B411F] mb-1">
                <i className="bi bi-list-ul text-[#107539] mr-1"></i>
                খাবারের ধরন <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SpotType)}
                className="form-input appearance-none"
              >
                {Object.entries(SPOT_TYPE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.emoji} {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-[#0B411F] mb-1">
                <i className="bi bi-geo-alt text-[#107539] mr-1"></i>
                লোকেশন <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={lat}
                  readOnly
                  placeholder="অক্ষাংশ (lat)"
                  className={`form-input ${lat ? "border-green-400 bg-green-50/50" : ""}`}
                />
                <input
                  type="text"
                  value={lng}
                  readOnly
                  placeholder="দ্রাঘিমাংশ (lng)"
                  className={`form-input ${lng ? "border-green-400 bg-green-50/50" : ""}`}
                />
              </div>
              {lat && lng && (
                <div className="flex items-center gap-1 mb-2 text-[10px] text-green-600 animate-fade-in">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>লোকেশন নির্বাচিত হয়েছে</span>
                </div>
              )}
              {!lat && !lng && (
                <div className="flex items-center gap-1 mb-2 text-[10px] text-amber-600">
                  <i className="bi bi-exclamation-circle"></i>
                  <span>নিচের বাটন থেকে লোকেশন নির্বাচন করুন</span>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGPS}
                  disabled={searching}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl gradient-primary-green hover:opacity-90 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-md"
                >
                  {searching ? (
                    <div className="spinner spinner-sm border-2 border-white/30 border-t-white"></div>
                  ) : (
                    <><i className="bi bi-crosshair"></i> GPS লোকেশন</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (lat && lng) {
                      const url = `https://www.google.com/maps?q=${lat},${lng}`;
                      window.open(url, "_blank");
                    }
                  }}
                  disabled={!lat || !lng}
                  className="px-3 py-2 rounded-xl bg-secondary text-sm font-semibold transition-all disabled:opacity-50 hover:bg-[#EAE2D7]"
                >
                  <i className="bi bi-map"></i>
                </button>
              </div>

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
                  disabled={searching}
                  className="px-3 py-2 rounded-lg gradient-primary-green text-white text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {searching ? <div className="spinner spinner-sm border-2 border-white/30 border-t-white"></div> : "খুঁজুন"}
                </button>
              </div>

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
                        setError("");
                        if (!area) setArea(r.name);
                        toast.success("লোকেশন নির্বাচিত হয়েছে");
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#DBF0E3] transition-colors border border-[#EAE2D7]"
                    >
                      <i className="bi bi-geo-alt text-[#107539]"></i> {r.display_name.length > 60 ? r.display_name.slice(0, 60) + "..." : r.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-[#0B411F] mb-1">
                <i className="bi bi-chat-left-text text-[#107539] mr-1"></i>
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
              className="w-full py-3 rounded-2xl gradient-primary-green hover:opacity-90 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><div className="spinner spinner-sm border-2 border-white/30 border-t-white"></div> সংরক্ষণ হচ্ছে...</>
              ) : (
                <><i className="bi bi-check-circle text-sm"></i> স্পট যোগ করুন</>
              )}
            </button>

            <p className="text-center text-[11px] text-[#93796C]">
              স্পট যোগ করার পর এডমিন যাচাই করবেন
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
