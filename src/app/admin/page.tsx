"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  verifyAdminPassword, fetchSpots, createSpot, updateSpot, deleteSpot,
  fetchEvents, createEvent, updateEvent, deleteEvent as deleteEventFn,
  fetchDonations, addDonation, updateDonation as updateDonationFn, deleteDonation as deleteDonationFn,
  fetchTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember as deleteTeamMemberFn,
  fetchReports, submitReport, updateReport, deleteReport as deleteReportFn,
  fetchSiteSettings, updateSiteSettings,
  fetchStats, fetchDonationStats, exportSpotsToCSV, bulkImportSpots,
} from "@/lib/firebase-service";
import type { Spot, SpotType, FoodEvent, Donation, TeamMember, Report, SiteSettings, AppStats, DonationStats } from "@/types";
import { SPOT_TYPE_CONFIG, SPOT_TYPE_LABELS } from "@/types";

type Tab = "dashboard" | "spots" | "events" | "donations" | "team" | "reports" | "settings";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Data states
  const [spots, setSpots] = useState<Spot[]>([]);
  const [events, setEvents] = useState<FoodEvent[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [editModal, setEditModal] = useState<{ type: string; data: any } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null);

  // Check auth on mount
  useEffect(() => {
    const auth = sessionStorage.getItem("admin-auth");
    if (auth === "true") setAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(password)) {
      sessionStorage.setItem("admin-auth", "true");
      setAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("পাসওয়ার্ড ভুল হয়েছে");
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, e, d, t, r, st, set] = await Promise.all([
        fetchSpots(), fetchEvents(), fetchDonations(),
        fetchTeamMembers(), fetchReports(), fetchStats(), fetchSiteSettings()
      ]);
      setSpots(s); setEvents(e); setDonations(d);
      setTeam(t); setReports(r); setStats(st); setSettings(set);
    } catch (err) {
      console.error("Load data error:", err);
      toast.error("ডেটা লোড করতে সমস্যা হয়েছে। Firebase সংযোগ পরীক্ষা করুন।");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated, loadData]);

  const refreshSpots = async () => { try { setSpots(await fetchSpots()); } catch { toast.error("স্পট রিফ্রেশ ব্যর্থ"); } };
  const refreshEvents = async () => { try { setEvents(await fetchEvents()); } catch { toast.error("ইভেন্ট রিফ্রেশ ব্যর্থ"); } };
  const refreshDonations = async () => { try { setDonations(await fetchDonations()); } catch { toast.error("অনুদান রিফ্রেশ ব্যর্থ"); } };
  const refreshTeam = async () => { try { setTeam(await fetchTeamMembers()); } catch { toast.error("টিম রিফ্রেশ ব্যর্থ"); } };
  const refreshReports = async () => { try { setReports(await fetchReports()); } catch { toast.error("রিপোর্ট রিফ্রেশ ব্যর্থ"); } };

  // Login Screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-teal-950 to-stone-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl shadow-orange-500/25 ring-4 ring-white/5">
              <i className="bi bi-shield-lock-fill text-white text-3xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-white">এডমিন প্যানেল</h1>
            <p className="text-sm text-white/60 mt-1">ফ্রি ফুড ম্যাপ</p>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড দিন"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-white/30"
                autoFocus
              />
              {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
              <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all">
                প্রবেশ করুন
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  const tabs: { id: Tab; label: string; desc: string; icon: React.ReactNode; gradient: string; dot: string }[] = [
    { id: "dashboard", label: "ড্যাশবোর্ড", desc: "সামগ্রিক তথ্য", icon: <i className="bi bi-grid-1x2-fill"></i>, gradient: "from-blue-500 to-cyan-500", dot: "bg-blue-400" },
    { id: "spots", label: "স্পট ম্যানেজমেন্ট", desc: "ফ্রি ফুড স্পট", icon: <i className="bi bi-geo-alt-fill"></i>, gradient: "from-emerald-500 to-green-500", dot: "bg-emerald-400" },
    { id: "events", label: "ইভেন্ট", desc: "ফুড ইভেন্ট", icon: <i className="bi bi-calendar-event"></i>, gradient: "from-purple-500 to-violet-500", dot: "bg-purple-400" },
    { id: "donations", label: "অনুদান", desc: "দাতা তালিকা", icon: <i className="bi bi-heart-fill"></i>, gradient: "from-pink-500 to-rose-500", dot: "bg-pink-400" },
    { id: "team", label: "টিম", desc: "সদস্য পরিচালনা", icon: <i className="bi bi-people-fill"></i>, gradient: "from-amber-500 to-orange-500", dot: "bg-amber-400" },
    { id: "reports", label: "রিপোর্ট", desc: "সমস্যা রিপোর্ট", icon: <i className="bi bi-exclamation-triangle-fill"></i>, gradient: "from-red-500 to-orange-500", dot: "bg-red-400" },
    { id: "settings", label: "সেটিংস", desc: "সাইট কনফিগারেশন", icon: <i className="bi bi-gear-fill"></i>, gradient: "from-slate-500 to-gray-500", dot: "bg-slate-400" },
  ];

  const handleTabChange = (tabId: Tab) => {
    setActiveTab(tabId);
    setMobileDrawerOpen(false);
  };

  const handleExportCSV = () => {
    const csv = exportSpotsToCSV(spots);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `free-food-map-spots-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(spots, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `free-food-map-spots-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`admin-sidebar bg-background border-r border-border flex-col ${sidebarOpen ? "w-64" : "w-[68px]"} transition-all duration-300 shrink-0 hidden md:flex overflow-hidden`}>
        <div className={`p-4 border-b border-border flex items-center gap-3 ${sidebarOpen ? "" : "justify-center"}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-orange-200/50 dark:shadow-orange-900/30">
            <i className="bi bi-cup-hot-fill text-base"></i>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <span className="font-bold text-sm text-foreground block truncate">ফ্রি ফুড ম্যাপ</span>
              <span className="text-[10px] text-muted-foreground">এডমিন কন্ট্রোল প্যানেল</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2.5 space-y-1 overflow-auto custom-scrollbar">
          <p className={`text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-1.5 ${sidebarOpen ? "" : "hidden"}`}>মেনু</p>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg dark:shadow-black/20`
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              title={!sidebarOpen ? tab.label : undefined}
            >
              {activeTab === tab.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white/60" />
              )}
              <span className={`text-base shrink-0 w-6 text-center ${activeTab !== tab.id ? "group-hover:scale-110 transition-transform" : ""}`}>{tab.icon}</span>
              {sidebarOpen && (
                <div className="flex-1 text-left min-w-0">
                  <span className="block truncate text-[13px]">{tab.label}</span>
                  <span className={`block truncate text-[10px] ${activeTab === tab.id ? "text-white/70" : "text-muted-foreground/70"}`}>{tab.desc}</span>
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-2.5 border-t border-border space-y-1">
          <button
            onClick={() => { sessionStorage.removeItem("admin-auth"); setAuthenticated(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all group ${sidebarOpen ? "" : "justify-center"}`}
            title={!sidebarOpen ? "লগআউট" : undefined}
          >
            <span className="text-base shrink-0 group-hover:scale-110 transition-transform"><i className="bi bi-box-arrow-right"></i></span>
            {sidebarOpen && <span>লগআউট</span>}
          </button>
          <a
            href="/"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-all group ${sidebarOpen ? "" : "justify-center"}`}
            title={!sidebarOpen ? "ওয়েবসাইটে যান" : undefined}
          >
            <span className="text-base shrink-0 group-hover:scale-110 transition-transform"><i className="bi bi-house-fill"></i></span>
            {sidebarOpen && <span>ওয়েবসাইটে যান</span>}
          </a>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="bg-card/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center active:scale-95 transition-transform shadow-md shadow-emerald-200/50 dark:shadow-emerald-900/30"
                aria-label="মেনু"
              >
                <i className={`bi ${mobileDrawerOpen ? "bi-x-lg" : "bi-list"} text-base text-white`}></i>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                  <i className="bi bi-cup-hot-fill text-white text-xs"></i>
                </div>
                <div>
                  <span className="font-bold text-[13px] text-foreground block leading-tight">এডমিন প্যানেল</span>
                  <span className="text-[10px] text-muted-foreground block leading-tight">
                    {tabs.find((t) => t.id === activeTab)?.label}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { sessionStorage.removeItem("admin-auth"); setAuthenticated(false); }}
              className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center active:scale-95 transition-transform border border-destructive/20"
              aria-label="লগআউট"
            >
              <i className="bi bi-box-arrow-right text-sm text-destructive"></i>
            </button>
          </div>
        </div>
      </div>

      {mobileDrawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="md:hidden fixed top-0 left-0 bottom-0 z-[70] w-[300px] max-w-[85vw] bg-background shadow-2xl animate-slide-up-mobile-drawer flex flex-col">
            <div className="relative p-5 pb-6 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
              </div>

              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg border border-white/30">
                    <i className="bi bi-cup-hot-fill text-xl"></i>
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white block">ফ্রি ফুড ম্যাপ</span>
                    <p className="text-[11px] text-white/60">এডমিন কন্ট্রোল প্যানেল</p>
                  </div>
                </div>
                <button onClick={() => setMobileDrawerOpen(false)} className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform">
                  <i className="bi bi-x-lg text-sm text-white"></i>
                </button>
              </div>

              <div className="relative mt-4 flex items-center gap-2">
                <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                  <p className="text-[10px] text-white/60">স্পট</p>
                  <p className="text-sm font-bold text-white">{spots.length}</p>
                </div>
                <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                  <p className="text-[10px] text-white/60">ভিউ</p>
                  <p className="text-sm font-bold text-white">{(stats?.totalViews || 0).toLocaleString("bn-BD")}</p>
                </div>
                <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                  <p className="text-[10px] text-white/60">দাতা</p>
                  <p className="text-sm font-bold text-white">{donations.length}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-auto custom-scrollbar">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2">নেভিগেশন</p>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg dark:shadow-black/20 relative overflow-hidden`
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {activeTab === tab.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-white/60" />
                  )}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                    activeTab === tab.id
                      ? "bg-white/20"
                      : "bg-secondary"
                  }`}>
                    {tab.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="block text-[13px] font-semibold">{tab.label}</span>
                    <span className={`block text-[10px] ${activeTab === tab.id ? "text-white/70" : "text-muted-foreground/70"}`}>{tab.desc}</span>
                  </div>
                  {activeTab === tab.id && (
                    <i className="bi bi-chevron-left text-white/50 text-xs" />
                  )}
                </button>
              ))}
            </nav>

            <div className="p-3 border-t border-border space-y-1">
              <a
                href="/"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-all active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm shrink-0">
                  <i className="bi bi-house-fill"></i>
                </div>
                <span className="text-[13px]">ওয়েবসাইটে যান</span>
              </a>
              <button
                onClick={() => { setMobileDrawerOpen(false); sessionStorage.removeItem("admin-auth"); setAuthenticated(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-sm shrink-0">
                  <i className="bi bi-box-arrow-right"></i>
                </div>
                <span className="text-[13px]">লগআউট</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 pt-20 md:pt-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <DashboardTab stats={stats} spots={spots} donations={donations} reports={reports} onSeedData={async () => {
                try {
                  const sampleSpots: Omit<Spot, 'id'>[] = [
                    { name: "কেন্দ্রীয় জামে মসজিদ ফ্রি ফুড ক্যাম্প", type: "daily_meal" as SpotType, address: "বায়তুল মোকাররম, ঢাকা", area: "পুরান ঢাকা", city: "ঢাকা", country: "বাংলাদেশ", lat: 23.7104, lng: 90.4074, openDays: ["saturday","sunday","monday","tuesday","wednesday","thursday","friday"], openTime: "12:00", closeTime: "14:00", notes: "প্রতিদিন দুপুরে ৫০০+ মানুষকে ফ্রি খাবার দেওয়া হয়", verified: true, active: true, createdAt: Date.now(), lastUpdated: Date.now(), startDate: null, endDate: null, autoDelete: false, viewCount: 120, directionCount: 45, positiveVotes: 12, negativeVotes: 1 },
                    { name: "গুলশান সোসাইটি কমিউনিটি কিচেন", type: "weekly_meal" as SpotType, address: "গুলশান আব্দুল হাই রোড, ঢাকা", area: "গুলশান", city: "ঢাকা", country: "বাংলাদেশ", lat: 23.7937, lng: 90.4143, openDays: ["friday","saturday"], openTime: "13:00", closeTime: "15:00", notes: "শুক্র ও শনিবার বিকেলে ফ্রি খাবার বিতরণ", verified: true, active: true, createdAt: Date.now() - 86400000, lastUpdated: Date.now() - 86400000, startDate: null, endDate: null, autoDelete: false, viewCount: 89, directionCount: 32, positiveVotes: 8, negativeVotes: 0 },
                    { name: "মিরপুর স্যুপ কিচেন", type: "soup_kitchen" as SpotType, address: "মিরপুর ১০, ঢাকা", area: "মিরপুর", city: "ঢাকা", country: "বাংলাদেশ", lat: 23.8023, lng: 90.3658, openDays: ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"], openTime: "18:00", closeTime: "21:00", notes: "প্রতিদিন রাতে স্যুপ ও রুটি বিতরণ করা হয়", verified: true, active: true, createdAt: Date.now() - 172800000, lastUpdated: Date.now() - 172800000, startDate: null, endDate: null, autoDelete: false, viewCount: 67, directionCount: 28, positiveVotes: 6, negativeVotes: 2 },
                    { name: "উত্তরা গ্রোসারি ব্যাংক", type: "grocery" as SpotType, address: "উত্তরা সেক্টর ৭, ঢাকা", area: "উত্তরা", city: "ঢাকা", country: "বাংলাদেশ", lat: 23.8679, lng: 90.3928, openDays: ["saturday","wednesday"], openTime: "09:00", closeTime: "13:00", notes: "সপ্তাহে দুইদিন ফ্রি গ্রোসারি সামগ্রী বিতরণ", verified: false, active: true, createdAt: Date.now() - 259200000, lastUpdated: Date.now() - 259200000, startDate: null, endDate: null, autoDelete: false, viewCount: 43, directionCount: 15, positiveVotes: 4, negativeVotes: 1 },
                    { name: "মোহাম্মদপুর ফ্রি মিল কেন্দ্র", type: "daily_meal" as SpotType, address: "মোহাম্মদপুর বাস স্ট্যান্ড সংলগ্ন, ঢাকা", area: "মোহাম্মদপুর", city: "ঢাকা", country: "বাংলাদেশ", lat: 23.7564, lng: 90.3563, openDays: ["friday"], openTime: "11:00", closeTime: "14:00", notes: "শুক্রবার জুমার পর ফ্রি খাবার", verified: true, active: true, createdAt: Date.now() - 345600000, lastUpdated: Date.now() - 345600000, startDate: null, endDate: null, autoDelete: false, viewCount: 95, directionCount: 38, positiveVotes: 10, negativeVotes: 0 },
                    { name: "চট্টগ্রাম সেন্ট্রাল ফুড ব্যাংক", type: "daily_meal" as SpotType, address: "এম এ আজিজ স্টেডিয়াম সংলগ্ন, চট্টগ্রাম", area: "আগ্রাবাদ", city: "চট্টগ্রাম", country: "বাংলাদেশ", lat: 22.3569, lng: 91.8317, openDays: ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"], openTime: "12:00", closeTime: "13:30", notes: "প্রতিদিন দুপুরে ফ্রি খাবার বিতরণ", verified: true, active: true, createdAt: Date.now() - 432000000, lastUpdated: Date.now() - 432000000, startDate: null, endDate: null, autoDelete: false, viewCount: 56, directionCount: 20, positiveVotes: 7, negativeVotes: 0 },
                  ];
                  const count = await bulkImportSpots(sampleSpots);
                  loadData();
                  toast.success(`${count}টি স্যাম্পল স্পট যোগ হয়েছে!`);
                } catch (err) {
                  console.error("Seed error:", err);
                  toast.error("স্যাম্পল ডেটা যোগ ব্যর্থ। Firebase রুলস চেক করুন।");
                }
              }} />
            )}
            {activeTab === "spots" && (
              <SpotsTab
                spots={spots} onRefresh={refreshSpots}
                onEdit={(s) => setEditModal({ type: "spot", data: s })}
                onDelete={(s) => setDeleteConfirm({ type: "spot", id: s.id, name: s.name })}
                onAdd={async (d) => { try { await createSpot(d); refreshSpots(); toast.success("নতুন স্পট যোগ হয়েছে"); } catch { toast.error("স্পট যোগ ব্যর্থ"); } }}
                onVerify={async (id, v) => { try { await updateSpot(id, { verified: v }); refreshSpots(); toast.success(v ? "স্পট নিশ্চিত করা হয়েছে" : "নিশ্চিততা সরানো হয়েছে"); } catch { toast.error("অপারেশন ব্যর্থ"); } }}
                onToggleActive={async (id, a) => { try { await updateSpot(id, { active: a }); refreshSpots(); toast.success(a ? "স্পট সক্রিয় করা হয়েছে" : "স্পট নিষ্ক্রিয় করা হয়েছে"); } catch { toast.error("অপারেশন ব্যর্থ"); } }}
              />
            )}
            {activeTab === "events" && (
              <EventsTab
                events={events} onRefresh={refreshEvents}
                onEdit={(e) => setEditModal({ type: "event", data: e })}
                onDelete={(e) => setDeleteConfirm({ type: "event", id: e.id, name: e.title })}
                onAdd={async (d) => { try { await createEvent(d as any); refreshEvents(); toast.success("ইভেন্ট তৈরি হয়েছে"); } catch { toast.error("ইভেন্ট তৈরি ব্যর্থ"); } }}
              />
            )}
            {activeTab === "donations" && (
              <DonationsTab
                donations={donations} onRefresh={refreshDonations}
                onDelete={(d) => setDeleteConfirm({ type: "donation", id: d.id, name: `${d.donorName} - ৳${d.amount}` })}
                onAdd={async (d) => { try { await addDonation(d); refreshDonations(); toast.success("অনুদান যোগ হয়েছে"); } catch { toast.error("অনুদান যোগ ব্যর্থ"); } }}
                onUpdateStatus={async (id, s) => { try { await updateDonationFn(id, { status: s as Donation["status"] }); refreshDonations(); toast.success("অনুদান আপডেট হয়েছে"); } catch { toast.error("অনুদান আপডেট ব্যর্থ"); } }}
              />
            )}
            {activeTab === "team" && (
              <TeamTab
                team={team} onRefresh={refreshTeam}
                onEdit={(t) => setEditModal({ type: "team", data: t })}
                onDelete={(t) => setDeleteConfirm({ type: "team", id: t.id, name: t.name })}
                onAdd={async (d) => { try { await addTeamMember(d); refreshTeam(); toast.success("সদস্য যোগ হয়েছে"); } catch { toast.error("সদস্য যোগ ব্যর্থ"); } }}
              />
            )}
            {activeTab === "reports" && (
              <ReportsTab
                reports={reports} onRefresh={refreshReports}
                onUpdate={async (id, s) => { try { await updateReport(id, { status: s as Report["status"] }); refreshReports(); toast.success("রিপোর্ট আপডেট হয়েছে"); } catch { toast.error("রিপোর্ট আপডেট ব্যর্থ"); } }}
                onDelete={(r) => setDeleteConfirm({ type: "report", id: r.id, name: r.spotName })}
                onAdd={async (d) => { try { await submitReport(d); refreshReports(); toast.success("রিপোর্ট যোগ হয়েছে"); } catch { toast.error("রিপোর্ট যোগ ব্যর্থ"); } }}
              />
            )}
            {activeTab === "settings" && (
              <SettingsTab
                settings={settings}
                onSave={async (d) => { try { await updateSiteSettings(d); setSettings({ ...settings!, ...d }); toast.success("সেটিংস সংরক্ষিত হয়েছে"); } catch { toast.error("সেটিংস সংরক্ষণ ব্যর্থ"); } }}
                onExportCSV={handleExportCSV}
                onExportJSON={handleExportJSON}
              />
            )}
          </>
        )}
      </main>

      {/* Edit Modal - Full screen on mobile */}
      {editModal && (
        <EditModal
          type={editModal.type}
          data={editModal.data}
          onClose={() => setEditModal(null)}
          onSave={async (data) => {
            try {
              if (editModal.type === "spot") {
                await updateSpot(editModal.data.id, data);
                refreshSpots();
                toast.success("স্পট আপডেট হয়েছে");
              } else if (editModal.type === "event") {
                await updateEvent(editModal.data.id, data);
                refreshEvents();
                toast.success("ইভেন্ট আপডেট হয়েছে");
              } else if (editModal.type === "team") {
                await updateTeamMember(editModal.data.id, data);
                refreshTeam();
                toast.success("সদস্য আপডেট হয়েছে");
              }
              setEditModal(null);
            } catch (err) {
              console.error("Save error:", err);
              toast.error("সংরক্ষণ ব্যর্থ হয়েছে");
            }
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[3000] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-t-2xl md:rounded-2xl p-6 w-full md:max-w-sm md:mx-4 shadow-xl animate-slide-up">
            <div className="text-center">
              <div className="text-4xl mb-3"><i className="bi bi-exclamation-triangle-fill text-destructive"></i></div>
              <h3 className="text-lg font-bold text-foreground mb-1">মুছে ফেলতে চান?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                &quot;{deleteConfirm.name}&quot; স্থায়ীভাবে মুছে যাবে।
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors min-h-[44px]">
                  বাতিল
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (deleteConfirm.type === "spot") await deleteSpot(deleteConfirm.id);
                      else if (deleteConfirm.type === "event") await deleteEventFn(deleteConfirm.id);
                      else if (deleteConfirm.type === "donation") await deleteDonationFn(deleteConfirm.id);
                      else if (deleteConfirm.type === "team") await deleteTeamMemberFn(deleteConfirm.id);
                      else if (deleteConfirm.type === "report") await deleteReportFn(deleteConfirm.id);
                      toast.success("সফলভাবে মুছে ফেলা হয়েছে");
                    } catch (err) {
                      console.error("Delete error:", err);
                      toast.error("মুছে ফেলতে সমস্যা হয়েছে");
                    }
                    setDeleteConfirm(null);
                    loadData();
                  }}
                  className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:opacity-90 transition-colors min-h-[44px]"
                >
                  মুছুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// DASHBOARD TAB
// ============================================
function DashboardTab({ stats, spots, donations, reports, onSeedData }: { stats: AppStats | null; spots: Spot[]; donations: Donation[]; reports: Report[]; onSeedData: () => void }) {
  const cards = [
    { label: "মোট স্পট", value: stats?.totalSpots || 0, icon: <i className="bi bi-geo-alt-fill text-xl"></i>, gradient: "from-blue-50 to-blue-100/50 border-blue-200/50 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50", color: "bg-blue-500" },
    { label: "নিশ্চিত স্পট", value: stats?.verifiedSpots || 0, icon: <i className="bi bi-patch-check-fill text-xl text-green-500"></i>, gradient: "from-green-50 to-green-100/50 border-green-200/50 dark:from-green-900/30 dark:to-green-800/20 dark:border-green-800/50", color: "bg-green-500" },
    { label: "সক্রিয় স্পট", value: stats?.activeSpots || 0, icon: <i className="bi bi-circle-fill text-xl text-emerald-500"></i>, gradient: "from-emerald-50 to-emerald-100/50 border-emerald-200/50 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50", color: "bg-emerald-500" },
    { label: "মোট ভিউ", value: stats?.totalViews || 0, icon: <i className="bi bi-eye text-xl text-purple-500"></i>, gradient: "from-purple-50 to-purple-100/50 border-purple-200/50 dark:from-purple-900/30 dark:to-purple-800/20 dark:border-purple-800/50", color: "bg-purple-500" },
    { label: "রিভিউ", value: stats?.totalReviews || 0, icon: <i className="bi bi-star-fill text-xl text-amber-500"></i>, gradient: "from-amber-50 to-amber-100/50 border-amber-200/50 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50", color: "bg-amber-500" },
    { label: "অনুদান", value: donations.length, icon: <i className="bi bi-heart-fill text-xl text-pink-500"></i>, gradient: "from-pink-50 to-pink-100/50 border-pink-200/50 dark:from-pink-900/30 dark:to-pink-800/20 dark:border-pink-800/50", color: "bg-pink-500" },
    { label: "রিপোর্ট", value: reports.filter((r) => r.status === "pending").length, icon: <i className="bi bi-exclamation-triangle-fill text-xl text-red-500"></i>, gradient: "from-red-50 to-red-100/50 border-red-200/50 dark:from-red-900/30 dark:to-red-800/20 dark:border-red-800/50", color: "bg-red-500" },
  ];

  // City distribution
  const cityMap = new Map<string, number>();
  spots.forEach((s) => cityMap.set(s.city, (cityMap.get(s.city) || 0) + 1));
  const cityData = Array.from(cityMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-foreground">ড্যাশবোর্ড</h2>
        {spots.length === 0 && (
          <button onClick={onSeedData} className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold hover:shadow-md transition-all whitespace-nowrap">
            <i className="bi bi-magic"></i> স্যাম্পল ডেটা
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className={`admin-card bg-gradient-to-br ${c.gradient} border rounded-xl p-3 sm:p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl sm:text-2xl">{c.icon}</span>
              <span className={`w-2 h-2 rounded-full ${c.color}`}></span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{c.value.toLocaleString("bn-BD")}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* City Distribution */}
      <div className="bg-card rounded-xl p-4 sm:p-5 border border-border">
        <h3 className="text-sm font-bold text-foreground mb-4">শহর অনুযায়ী স্পট বিতরণ</h3>
        <div className="space-y-2">
          {cityData.map(([city, count]) => {
            const maxCount = cityData[0]?.[1] || 1;
            const pct = Math.round((count / maxCount) * 100);
            return (
              <div key={city} className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-foreground w-20 sm:w-24 truncate">{city || "অজানা"}</span>
                <div className="flex-1 h-5 sm:h-6 bg-secondary rounded-lg overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg transition-all" style={{ width: `${pct}%` }}></div>
                </div>
                <span className="text-xs sm:text-sm font-bold text-foreground w-6 sm:w-8 text-right">{count}</span>
              </div>
            );
          })}
          {cityData.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">কোন ডেটা নেই</p>}
        </div>
      </div>

      {/* Recent Spots */}
      <div className="bg-card rounded-xl p-4 sm:p-5 border border-border">
        <h3 className="text-sm font-bold text-foreground mb-4">সাম্প্রতিক স্পট</h3>
        <div className="space-y-2">
          {spots.slice(0, 5).map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors">
              <span className="text-xl">{SPOT_TYPE_CONFIG[s.type]?.emoji || <i className="bi bi-cup-hot text-xl"></i>}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.area || s.city}</p>
              </div>
              <div className="flex items-center gap-1">
                {s.verified && <i className="bi bi-check-circle-fill text-green-500 text-xs"></i>}
                {!s.active && <i className="bi bi-x-circle-fill text-red-500 text-xs"></i>}
              </div>
            </div>
          ))}
          {spots.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">কোন স্পট নেই</p>}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SPOTS TAB
// ============================================
function SpotsTab({ spots, onRefresh, onEdit, onDelete, onAdd, onVerify, onToggleActive }: {
  spots: Spot[]; onRefresh: () => void;
  onEdit: (s: Spot) => void; onDelete: (s: Spot) => void;
  onAdd: (d: any) => void;
  onVerify: (id: string, v: boolean) => void; onToggleActive: (id: string, a: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterVerified, setFilterVerified] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", type: "daily_meal" as SpotType, address: "", area: "", city: "ঢাকা", lat: "23.7596", lng: "90.379", notes: "", openTime: "00:00", closeTime: "23:59" });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: addForm.name, type: addForm.type, address: addForm.address,
      area: addForm.area, city: addForm.city, country: "বাংলাদেশ",
      lat: parseFloat(addForm.lat), lng: parseFloat(addForm.lng),
      openDays: ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"],
      openTime: addForm.openTime, closeTime: addForm.closeTime,
      notes: addForm.notes || null,
    });
    setShowAddForm(false);
    setAddForm({ name: "", type: "daily_meal", address: "", area: "", city: "ঢাকা", lat: "23.7596", lng: "90.379", notes: "", openTime: "00:00", closeTime: "23:59" });
  };

  const filtered = spots.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.area.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== "all" && s.type !== filterType) return false;
    if (filterVerified === "verified" && !s.verified) return false;
    if (filterVerified === "unverified" && s.verified) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-foreground">স্পট ম্যানেজমেন্ট</h2>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="px-3 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors min-h-[44px]">
            <i className="bi bi-arrow-clockwise text-xs"></i>
          </button>
          <button onClick={() => setShowAddForm(!showAddForm)} className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold hover:shadow-md transition-all whitespace-nowrap min-h-[44px]">
            {showAddForm ? "বন্ধ" : "+ নতুন"}
          </button>
        </div>
      </div>

      {/* Add Spot Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-card rounded-xl p-4 sm:p-5 border border-border space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="স্থানের নাম *" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required
              className="px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <select value={addForm.type} onChange={(e) => setAddForm({ ...addForm, type: e.target.value as SpotType })}
              className="px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm">
              {Object.entries(SPOT_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
            <input placeholder="এলাকা / মহল্লা *" value={addForm.area} onChange={(e) => setAddForm({ ...addForm, area: e.target.value })} required
              className="px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input placeholder="শহর" value={addForm.city} onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
              className="px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input placeholder="ঠিকানা" value={addForm.address} onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
              className="px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input placeholder="নোটস" value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              className="px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input placeholder="অক্ষাংশ (lat)" value={addForm.lat} onChange={(e) => setAddForm({ ...addForm, lat: e.target.value })} type="number" step="any"
              className="px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input placeholder="দ্রাঘিমাংশ (lng)" value={addForm.lng} onChange={(e) => setAddForm({ ...addForm, lng: e.target.value })} type="number" step="any"
              className="px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input placeholder="খোলার সময়" value={addForm.openTime} onChange={(e) => setAddForm({ ...addForm, openTime: e.target.value })} type="time"
              className="px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm" />
            <input placeholder="বন্ধের সময়" value={addForm.closeTime} onChange={(e) => setAddForm({ ...addForm, closeTime: e.target.value })} type="time"
              className="px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors min-h-[44px]">বাতিল</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm hover:shadow-md transition-all min-h-[44px]">স্পট যোগ করুন</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text" placeholder="খুঁজুন..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm flex-1 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none">
          <option value="all">সব ধরন</option>
          {Object.entries(SPOT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterVerified} onChange={(e) => setFilterVerified(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none">
          <option value="all">সব অবস্থা</option>
          <option value="verified">নিশ্চিত</option>
          <option value="unverified">অনিশ্চিত</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-semibold text-foreground">নাম</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">ধরন</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground">এলাকা</th>
                <th className="text-center px-4 py-3 font-semibold text-foreground">অবস্থা</th>
                <th className="text-center px-4 py-3 font-semibold text-foreground">ভোট</th>
                <th className="text-right px-4 py-3 font-semibold text-foreground">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((spot) => (
                <tr key={spot.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground truncate max-w-[200px]">{spot.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{spot.address}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary">
                      {SPOT_TYPE_CONFIG[spot.type]?.emoji} {SPOT_TYPE_CONFIG[spot.type]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{spot.area || spot.city}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onVerify(spot.id, !spot.verified)}
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${spot.verified ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground"}`}
                      >
                        {spot.verified ? <i className="bi bi-check text-[10px]"></i> : "?"}
                      </button>
                      <button
                        onClick={() => onToggleActive(spot.id, !spot.active)}
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${spot.active ? "bg-blue-500 text-white" : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"}`}
                      >
                        {spot.active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-green-600 dark:text-green-400"><i className="bi bi-hand-thumbs-up text-[10px]"></i>{spot.positiveVotes}</span>
                    {" / "}
                    <span className="text-red-500"><i className="bi bi-hand-thumbs-down text-[10px]"></i>{spot.negativeVotes}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEdit(spot)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="সম্পাদনা"><i className="bi bi-pencil text-xs"></i></button>
                      <button onClick={() => onDelete(spot)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="মুছুন"><i className="bi bi-trash3 text-xs"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">কোন স্পট পাওয়া যায়নি</div>
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((spot) => (
          <div key={spot.id} className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl shrink-0">{SPOT_TYPE_CONFIG[spot.type]?.emoji || <i className="bi bi-cup-hot text-xl"></i>}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{spot.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{spot.area || spot.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onEdit(spot)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary"><i className="bi bi-pencil text-sm"></i></button>
                <button onClick={() => onDelete(spot)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-destructive/10"><i className="bi bi-trash3 text-sm text-destructive"></i></button>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary">
                {SPOT_TYPE_CONFIG[spot.type]?.label}
              </span>
              <button onClick={() => onVerify(spot.id, !spot.verified)} className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${spot.verified ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground"}`}>
                {spot.verified ? "✓ নিশ্চিত" : "? অনিশ্চিত"}
              </button>
              <button onClick={() => onToggleActive(spot.id, !spot.active)} className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${spot.active ? "bg-blue-500 text-white" : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"}`}>
                {spot.active ? "সক্রিয়" : "নিষ্ক্রিয়"}
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="text-green-600 dark:text-green-400">👍 {spot.positiveVotes}</span>
              <span className="text-red-500">👎 {spot.negativeVotes}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">কোন স্পট পাওয়া যায়নি</div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">মোট {filtered.length} / {spots.length} স্পট</p>
    </div>
  );
}

// ============================================
// EVENTS TAB
// ============================================
function EventsTab({ events, onRefresh, onEdit, onDelete, onAdd }: {
  events: FoodEvent[]; onRefresh: () => void;
  onEdit: (e: FoodEvent) => void; onDelete: (e: FoodEvent) => void;
  onAdd: (d: any) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", time: "", location: "", organizer: "", foodType: "", status: "upcoming" as string, lat: 23.7596, lng: 90.379 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, address: form.location, endDate: null, contactPhone: "", estimatedPeople: 0, image: "" });
    setShowForm(false);
    setForm({ title: "", description: "", date: "", time: "", location: "", organizer: "", foodType: "", status: "upcoming", lat: 23.7596, lng: 90.379 });
  };

  const statusLabel = (s: string) =>
    s === "upcoming" ? "আসন্ন" : s === "ongoing" ? "চলমান" : s === "completed" ? "সম্পন্ন" : "বাতিল";
  const statusColor = (s: string) =>
    s === "upcoming" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
    s === "ongoing" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
    s === "completed" ? "bg-gray-500/10 text-gray-500" :
    "bg-red-500/10 text-red-600 dark:text-red-400";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-foreground">ইভেন্ট ম্যানেজমেন্ট</h2>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="px-3 py-2 rounded-lg bg-secondary text-sm font-medium min-h-[44px]"><i className="bi bi-arrow-clockwise text-xs"></i></button>
          <button onClick={() => setShowForm(!showForm)} className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold hover:shadow-md transition-all whitespace-nowrap min-h-[44px]">
            {showForm ? "বন্ধ" : "+ নতুন"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-4 sm:p-5 border border-border space-y-3 animate-fade-in">
          <input placeholder="ইভেন্টের নাম *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <textarea placeholder="বিবরণ" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required
              className="px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm" />
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm" />
          </div>
          <input placeholder="লোকেশন" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input placeholder="আয়োজক" value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input placeholder="খাবারের ধরন" value={form.foodType} onChange={(e) => setForm({ ...form, foodType: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm">
            <option value="upcoming">আসন্ন</option>
            <option value="ongoing">চলমান</option>
            <option value="completed">সম্পন্ন</option>
            <option value="cancelled">বাতিল</option>
          </select>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm hover:shadow-md transition-all min-h-[44px]">ইভেন্ট তৈরি করুন</button>
        </form>
      )}

      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.id} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-foreground">{event.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(event.status)}`}>
                  {statusLabel(event.status)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1"><i className="bi bi-calendar3 text-xs"></i> {event.date} {event.time ? `• ${event.time}` : ""} • {event.location}</p>
              <p className="text-xs text-muted-foreground">{event.organizer}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => onEdit(event)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary"><i className="bi bi-pencil text-sm"></i></button>
              <button onClick={() => onDelete(event)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-destructive/10"><i className="bi bi-trash3 text-sm text-destructive"></i></button>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">কোন ইভেন্ট নেই</p>}
      </div>
    </div>
  );
}

// ============================================
// DONATIONS TAB
// ============================================
function DonationsTab({ donations, onRefresh, onDelete, onAdd, onUpdateStatus }: {
  donations: Donation[]; onRefresh: () => void;
  onDelete: (d: Donation) => void; onAdd: (d: any) => void;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ donorName: "", amount: "", method: "bKash", message: "", status: "confirmed" as string });
  const totalAmount = donations.filter(d => d.status === "confirmed").reduce((s, d) => s + d.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, amount: Number(form.amount), currency: "BDT", spotId: undefined, spotName: undefined, donorPhone: undefined, transactionId: undefined });
    setShowForm(false);
    setForm({ donorName: "", amount: "", method: "bKash", message: "", status: "confirmed" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-foreground">অনুদান</h2>
          <p className="text-sm text-muted-foreground">মোট: ৳{totalAmount.toLocaleString("bn-BD")} ({donations.length} জন দাতা)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="px-3 py-2 rounded-lg bg-secondary text-sm font-medium min-h-[44px]"><i className="bi bi-arrow-clockwise text-xs"></i></button>
          <button onClick={() => setShowForm(!showForm)} className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold hover:shadow-md transition-all whitespace-nowrap min-h-[44px]">
            {showForm ? "বন্ধ" : "+ নতুন"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-4 sm:p-5 border border-border space-y-3 animate-fade-in">
          <input placeholder="দাতার নাম *" value={form.donorName} onChange={(e) => setForm({ ...form, donorName: e.target.value })} required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="number" placeholder="পরিমাণ (৳) *" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm">
            <option value="bKash">bKash</option>
            <option value="Nagad">Nagad</option>
            <option value="Rocket">Rocket</option>
            <option value="Bank">ব্যাংক ট্রান্সফার</option>
            <option value="Cash">নগদ</option>
          </select>
          <textarea placeholder="বার্তা" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm hover:shadow-md transition-all min-h-[44px]">সংরক্ষণ করুন</button>
        </form>
      )}

      <div className="space-y-2">
        {donations.map((d) => (
          <div key={d.id} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">{d.donorName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400">৳{d.amount.toLocaleString("bn-BD")}</span>
                <span className="text-xs text-muted-foreground">({d.method})</span>
              </div>
              {d.message && <p className="text-xs text-muted-foreground mt-1">{d.message}</p>}
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(d.createdAt).toLocaleDateString("bn-BD")}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {d.status === "pending" && (
                <button onClick={() => onUpdateStatus(d.id, "confirmed")} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30" title="নিশ্চিত করুন"><i className="bi bi-check-circle text-sm text-green-500"></i></button>
              )}
              <button onClick={() => onDelete(d)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-destructive/10"><i className="bi bi-trash3 text-sm text-destructive"></i></button>
            </div>
          </div>
        ))}
        {donations.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">কোন অনুদান নেই</p>}
      </div>
    </div>
  );
}

// ============================================
// TEAM TAB
// ============================================
function TeamTab({ team, onRefresh, onEdit, onDelete, onAdd }: {
  team: TeamMember[]; onRefresh: () => void;
  onEdit: (t: TeamMember) => void; onDelete: (t: TeamMember) => void;
  onAdd: (d: any) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", bio: "", avatar: "", phone: "", email: "", facebook: "", order: 0, active: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, social: { facebook: form.facebook } });
    setShowForm(false);
    setForm({ name: "", role: "", bio: "", avatar: "", phone: "", email: "", facebook: "", order: 0, active: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-foreground">টিম সদস্য</h2>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="px-3 py-2 rounded-lg bg-secondary text-sm font-medium min-h-[44px]"><i className="bi bi-arrow-clockwise text-xs"></i></button>
          <button onClick={() => setShowForm(!showForm)} className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold hover:shadow-md transition-all whitespace-nowrap min-h-[44px]">
            {showForm ? "বন্ধ" : "+ নতুন"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-4 sm:p-5 border border-border space-y-3 animate-fade-in">
          <input placeholder="নাম *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input placeholder="ভূমিকা *" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <textarea placeholder="বায়ো" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm resize-none" />
          <input placeholder="Facebook URL" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm" />
          <input placeholder="ফোন" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm" />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm hover:shadow-md transition-all min-h-[44px]">সদস্য যোগ করুন</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {team.map((member) => (
          <div key={member.id} className="bg-card rounded-xl p-4 border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                  {(member.avatar && member.avatar.startsWith("http")) ? (
                    <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                  {member.phone && <p className="text-xs text-muted-foreground mt-0.5"><i className="bi bi-telephone text-xs"></i> {member.phone}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onEdit(member)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary"><i className="bi bi-pencil text-sm"></i></button>
                <button onClick={() => onDelete(member)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-destructive/10"><i className="bi bi-trash3 text-sm text-destructive"></i></button>
              </div>
            </div>
          </div>
        ))}
        {team.length === 0 && <p className="text-center text-muted-foreground text-sm py-8 col-span-2">কোন সদস্য নেই</p>}
      </div>
    </div>
  );
}

// ============================================
// REPORTS TAB
// ============================================
function ReportsTab({ reports, onRefresh, onUpdate, onDelete, onAdd }: {
  reports: Report[]; onRefresh: () => void;
  onUpdate: (id: string, status: string) => void;
  onDelete: (r: Report) => void;
  onAdd: (d: any) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ spotId: "", spotName: "", type: "incorrect_info", description: "", reporterName: "", reporterContact: "" });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ spotId: form.spotId, spotName: form.spotName, type: form.type, description: form.description, reporterName: form.reporterName || undefined, reporterContact: form.reporterContact || undefined });
    setShowForm(false);
    setForm({ spotId: "", spotName: "", type: "incorrect_info", description: "", reporterName: "", reporterContact: "" });
  };

  const statusLabel = (s: string) => s === "pending" ? "অপেক্ষমান" : s === "reviewing" ? "পর্যালোচনা" : s === "resolved" ? "সমাধান" : "বাতিল";
  const statusColor = (s: string) => s === "pending" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : s === "reviewing" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : s === "resolved" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-gray-500/10 text-gray-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-foreground">রিপোর্ট</h2>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="px-3 py-2 rounded-lg bg-secondary text-sm font-medium min-h-[44px]"><i className="bi bi-arrow-clockwise text-xs"></i> রিফ্রেশ</button>
          <button onClick={() => setShowForm(!showForm)} className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold hover:shadow-md transition-all whitespace-nowrap min-h-[44px]">
            {showForm ? "বন্ধ" : "+ নতুন"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddSubmit} className="bg-card rounded-xl p-4 sm:p-5 border border-border space-y-3 animate-fade-in">
          <input placeholder="স্পটের নাম *" value={form.spotName} onChange={(e) => setForm({ ...form, spotName: e.target.value })} required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input placeholder="স্পট ID" value={form.spotId} onChange={(e) => setForm({ ...form, spotId: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm">
            <option value="incorrect_info">ভুল তথ্য</option>
            <option value="closed">স্থান বন্ধ</option>
            <option value="inappropriate">অনুপযুক্ত বিষয়বস্তু</option>
            <option value="duplicate">অনুলিপি</option>
            <option value="other">অন্যান্য</option>
          </select>
          <textarea placeholder="বিবরণ *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input placeholder="রিপোর্টারের নাম" value={form.reporterName} onChange={(e) => setForm({ ...form, reporterName: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm" />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm hover:shadow-md transition-all min-h-[44px]">রিপোর্ট যোগ করুন</button>
        </form>
      )}

      <div className="space-y-2">
        {reports.map((r) => (
          <div key={r.id} className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-foreground">{r.spotName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(r.status)}`}>{statusLabel(r.status)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.createdAt).toLocaleDateString("bn-BD")}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {r.status === "pending" && (
                  <>
                    <button onClick={() => onUpdate(r.id, "reviewing")} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30" title="পর্যালোচনা"><i className="bi bi-eye text-sm text-blue-500"></i></button>
                    <button onClick={() => onUpdate(r.id, "resolved")} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30" title="সমাধান"><i className="bi bi-check-circle text-sm text-green-500"></i></button>
                    <button onClick={() => onUpdate(r.id, "dismissed")} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="বাতিল"><i className="bi bi-x-circle text-sm text-gray-400"></i></button>
                  </>
                )}
                {r.status === "reviewing" && (
                  <>
                    <button onClick={() => onUpdate(r.id, "resolved")} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30" title="সমাধান"><i className="bi bi-check-circle text-sm text-green-500"></i></button>
                    <button onClick={() => onUpdate(r.id, "dismissed")} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="বাতিল"><i className="bi bi-x-circle text-sm text-gray-400"></i></button>
                  </>
                )}
                <button onClick={() => onDelete(r)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-destructive/10"><i className="bi bi-trash3 text-sm text-destructive"></i></button>
              </div>
            </div>
          </div>
        ))}
        {reports.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">কোন রিপোর্ট নেই</p>}
      </div>
    </div>
  );
}

// ============================================
// SETTINGS TAB
// ============================================
function SettingsTab({ settings, onSave, onExportCSV, onExportJSON }: {
  settings: SiteSettings | null;
  onSave: (d: Partial<SiteSettings>) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
}) {
  const [form, setForm] = useState({
    contactEmail: settings?.contactEmail || "",
    contactPhone: settings?.contactPhone || "",
    facebookUrl: settings?.facebookUrl || "",
    maintenanceMode: settings?.maintenanceMode || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">সেটিংস</h2>
      <form onSubmit={handleSubmit} className="bg-card rounded-xl p-4 sm:p-5 border border-border space-y-3">
        <input placeholder="যোগাযোগ ইমেইল" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <input placeholder="যোগাযোগ ফোন" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <input placeholder="Facebook URL" value={form.facebookUrl} onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <div className="flex items-center gap-2">
          <input type="checkbox" id="maintenance" checked={form.maintenanceMode} onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })} className="rounded" />
          <label htmlFor="maintenance" className="text-sm text-foreground">মেইনটেন্যান্স মোড</label>
        </div>
        <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm hover:shadow-md transition-all min-h-[44px]">সংরক্ষণ করুন</button>
      </form>

      <div className="bg-card rounded-xl p-4 sm:p-5 border border-border space-y-3">
        <h3 className="text-sm font-bold text-foreground">এক্সপোর্ট</h3>
        <div className="flex gap-2">
          <button onClick={onExportCSV} className="flex-1 px-3 py-2.5 rounded-xl bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors min-h-[44px]">
            <i className="bi bi-filetype-csv text-xs"></i> CSV
          </button>
          <button onClick={onExportJSON} className="flex-1 px-3 py-2.5 rounded-xl bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors min-h-[44px]">
            <i className="bi bi-filetype-json text-xs"></i> JSON
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EDIT MODAL - Full screen on mobile
// ============================================
function EditModal({ type, data, onClose, onSave }: {
  type: string; data: any; onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id, createdAt, updatedAt, ...cleanData } = form;
      await onSave(cleanData);
    } catch (err) {
      console.error("Edit save error:", err);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-t-2xl md:rounded-2xl w-full md:max-w-lg md:mx-4 shadow-xl animate-slide-up max-h-[90vh] md:max-h-[80vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-4 pb-3 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">
            {type === "spot" ? "স্পট সম্পাদনা" : type === "event" ? "ইভেন্ট সম্পাদনা" : "সদস্য সম্পাদনা"}
          </h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary"><i className="bi bi-x-lg"></i></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 pt-3 space-y-3">
          {type === "spot" && (
            <>
              <input placeholder="নাম *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input placeholder="শহর" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input placeholder="এলাকা" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm">
                {Object.entries(SPOT_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
              </select>
              <textarea placeholder="ঠিকানা" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input placeholder="নোটস" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value || null })} className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </>
          )}
          {type === "event" && (
            <>
              <input placeholder="শিরোনাম *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <textarea placeholder="বিবরণ" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input placeholder="লোকেশন" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm" />
              <input type="time" value={form.time || ""} onChange={(e) => setForm({ ...form, time: e.target.value })} className="px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm" />
              <input placeholder="আয়োজক" value={form.organizer || ""} onChange={(e) => setForm({ ...form, organizer: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <select value={form.status || "upcoming"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm">
                <option value="upcoming">আসন্ন</option>
                <option value="ongoing">চলমান</option>
                <option value="completed">সম্পন্ন</option>
                <option value="cancelled">বাতিল</option>
              </select>
            </>
          )}
          {type === "team" && (
            <>
              <input placeholder="নাম *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input placeholder="ভূমিকা *" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <textarea placeholder="বায়ো" value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm resize-none" />
              <input placeholder="Facebook URL" value={form.social?.facebook || ""} onChange={(e) => setForm({ ...form, social: { ...form.social, facebook: e.target.value } })} className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm" />
              <input placeholder="ইমেইল" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm" />
              <input placeholder="ফোন" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm" />
            </>
          )}
          <div className="flex gap-2 pt-2 pb-safe">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors min-h-[44px]">বাতিল</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm hover:shadow-md transition-all disabled:opacity-50 min-h-[44px]">
              {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
