"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  verifyAdminPassword, fetchSpots, createSpot, updateSpot, deleteSpot,
  fetchEvents, createEvent, updateEvent, deleteEvent as deleteEventFn,
  fetchDonations, addDonation, updateDonation as updateDonationFn, deleteDonation as deleteDonationFn,
  fetchTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember as deleteTeamMemberFn,
  fetchReports, submitReport, updateReport, deleteReport as deleteReportFn,
  fetchSiteSettings, updateSiteSettings,
  fetchStats, fetchDonationStats, exportSpotsToCSV, bulkImportSpots,
  fetchNotifications, createNotification, deleteNotification as deleteNotificationFn,
  fetchReviews, deleteReview as deleteReviewFn,
} from "@/lib/firebase-service";
import type { Spot, SpotType, FoodEvent, Donation, TeamMember, Report, SiteSettings, AppStats, AppNotification } from "@/types";
import { SPOT_TYPE_CONFIG, SPOT_TYPE_LABELS, DAY_SHORT_LABELS, DAY_ORDER } from "@/types";

type Tab = "dashboard" | "spots" | "events" | "donations" | "team" | "reports" | "notifications" | "settings";

// ============================================
// MAIN ADMIN PAGE
// ============================================
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Modal states
  const [editModal, setEditModal] = useState<{ type: string; data: any } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string; extra?: string } | null>(null);

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
      toast.success("সফলভাবে লগইন হয়েছে!");
    } else {
      setLoginError("পাসওয়ার্ড ভুল হয়েছে");
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, e, d, t, r, n, st, set] = await Promise.all([
        fetchSpots(), fetchEvents(), fetchDonations(),
        fetchTeamMembers(), fetchReports(), fetchNotifications(), fetchStats(), fetchSiteSettings()
      ]);
      setSpots(s); setEvents(e); setDonations(d);
      setTeam(t); setReports(r); setNotifications(n); setStats(st); setSettings(set);
      setLastRefresh(new Date());
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
  const refreshNotifications = async () => { try { setNotifications(await fetchNotifications()); } catch { toast.error("নোটিফিকেশন রিফ্রেশ ব্যর্থ"); } };

  // ===================== LOGIN SCREEN =====================
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2e1a] via-[#0B411F] to-[#071a10]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#107539] rounded-full opacity-10 blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#F99406] rounded-full opacity-10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/[0.03] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/[0.05] rounded-full" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-10">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-2xl gradient-orange-fab flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-orange-500/20 ring-4 ring-white/[0.06] rotate-3 hover:rotate-0 transition-transform duration-500">
                <i className="bi bi-shield-lock-fill text-white text-3xl"></i>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#0B411F] animate-pulse" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Admin Panel</h1>
            <p className="text-sm text-white/40 mt-2 font-medium">ফ্রি ফুড ম্যাপ — কন্ট্রোল সেন্টার</p>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-7 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <i className="bi bi-key-fill absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm"></i>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড দিন"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white text-center text-lg tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-[#107539]/50 focus:border-[#107539]/50 placeholder:text-white/20 transition-all"
                  autoFocus
                />
              </div>
              {loginError && (
                <div className="flex items-center gap-2 text-red-400 text-sm justify-center animate-fade-in">
                  <i className="bi bi-exclamation-circle text-xs"></i>
                  {loginError}
                </div>
              )}
              <button type="submit" className="w-full py-3.5 rounded-2xl gradient-primary-green text-white font-bold text-sm tracking-wide hover:shadow-lg hover:shadow-[#107539]/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <i className="bi bi-box-arrow-in-right mr-2"></i>
                প্রবেশ করুন
              </button>
            </form>
            <div className="mt-5 pt-5 border-t border-white/[0.06] text-center">
              <p className="text-[10px] text-white/25">সুরক্ষিত অ্যাডমিন অ্যাক্সেস</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================== TAB CONFIG =====================
  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const activeNotifs = notifications.filter((n) => n.active).length;

  const tabs: { id: Tab; label: string; desc: string; icon: React.ReactNode; gradient: string; badge?: number }[] = [
    { id: "dashboard", label: "ড্যাশবোর্ড", desc: "সামগ্রিক তথ্য", icon: <i className="bi bi-grid-1x2-fill"></i>, gradient: "from-[#107539] to-[#1C9C4B]" },
    { id: "spots", label: "স্পট", desc: `${spots.length}টি স্পট`, icon: <i className="bi bi-geo-alt-fill"></i>, gradient: "from-emerald-600 to-green-600" },
    { id: "events", label: "ইভেন্ট", desc: `${events.length}টি ইভেন্ট`, icon: <i className="bi bi-calendar-event-fill"></i>, gradient: "from-violet-600 to-purple-600" },
    { id: "donations", label: "অনুদান", desc: `${donations.length}টি দান`, icon: <i className="bi bi-heart-fill"></i>, gradient: "from-rose-500 to-pink-600", badge: donations.filter(d => d.status === "pending").length || undefined },
    { id: "team", label: "টিম", desc: `${team.length}জন সদস্য`, icon: <i className="bi bi-people-fill"></i>, gradient: "from-amber-500 to-orange-600" },
    { id: "reports", label: "রিপোর্ট", desc: "সমস্যা রিপোর্ট", icon: <i className="bi bi-flag-fill"></i>, gradient: "from-red-500 to-orange-500", badge: pendingReports || undefined },
    { id: "notifications", label: "নোটিফিকেশন", desc: "ঘোষণা ব্যবস্থাপনা", icon: <i className="bi bi-bell-fill"></i>, gradient: "from-cyan-500 to-blue-500", badge: activeNotifs || undefined },
    { id: "settings", label: "সেটিংস", desc: "সাইট কনফিগারেশন", icon: <i className="bi bi-gear-wide-connected"></i>, gradient: "from-slate-600 to-gray-600" },
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
    a.href = url; a.download = `free-food-map-spots-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV এক্সপোর্ট সম্পন্ন");
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(spots, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `free-food-map-spots-${new Date().toISOString().split("T")[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON এক্সপোর্ট সম্পন্ন");
  };

  const handleExportAllData = () => {
    const allData = { spots, events, donations, team, reports, settings, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `free-food-map-full-backup-${new Date().toISOString().split("T")[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("সম্পূর্ণ ব্যাকআপ ডাউনলোড হয়েছে");
  };

  // ===================== MAIN LAYOUT =====================
  return (
    <div className="min-h-screen bg-[#F5F3EF] flex">
      {/* ---- DESKTOP SIDEBAR ---- */}
      <aside className={`bg-white border-r border-gray-200/80 flex-col ${sidebarOpen ? "w-[270px]" : "w-[72px]"} transition-all duration-300 shrink-0 hidden md:flex overflow-hidden sticky top-0 h-screen z-40`}>
        {/* Brand */}
        <div className={`p-5 border-b border-gray-100 flex items-center gap-3 ${sidebarOpen ? "" : "justify-center px-3"}`}>
          <div className="w-11 h-11 rounded-2xl gradient-orange-fab flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-orange-300/30 hover:rotate-3 transition-transform">
            <i className="bi bi-cup-hot-fill text-lg"></i>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <span className="font-black text-sm text-gray-900 block truncate tracking-tight">ফ্রি ফুড ম্যাপ</span>
              <span className="text-[10px] text-gray-400 font-medium">ADMIN CONTROL PANEL</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-auto custom-scrollbar">
          {sidebarOpen && <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] px-3 py-2">নেভিগেশন</p>}
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
              title={!sidebarOpen ? tab.label : undefined}
            >
              <span className={`text-[15px] shrink-0 w-7 text-center ${activeTab !== tab.id ? "group-hover:scale-110 transition-transform" : ""}`}>{tab.icon}</span>
              {sidebarOpen && (
                <div className="flex-1 text-left min-w-0">
                  <span className="block truncate font-semibold">{tab.label}</span>
                  <span className={`block truncate text-[10px] ${activeTab === tab.id ? "text-white/60" : "text-gray-400"}`}>{tab.desc}</span>
                </div>
              )}
              {sidebarOpen && tab.badge ? (
                <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${
                  activeTab === tab.id ? "bg-white/25 text-white" : "bg-red-100 text-red-600"
                }`}>{tab.badge}</span>
              ) : !sidebarOpen && tab.badge ? (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              ) : null}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-100 space-y-0.5">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all group">
            <span className="text-sm shrink-0 w-7 text-center group-hover:scale-110 transition-transform">
              <i className={`bi ${sidebarOpen ? "bi-chevron-double-left" : "bi-chevron-double-right"}`}></i>
            </span>
            {sidebarOpen && <span>সাইডবার সংকুচিত</span>}
          </button>
          <a href="/" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all group">
            <span className="text-sm shrink-0 w-7 text-center group-hover:scale-110 transition-transform"><i className="bi bi-house-fill"></i></span>
            {sidebarOpen && <span>ওয়েবসাইটে যান</span>}
          </a>
          <button onClick={() => { sessionStorage.removeItem("admin-auth"); setAuthenticated(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-all group">
            <span className="text-sm shrink-0 w-7 text-center group-hover:scale-110 transition-transform"><i className="bi bi-box-arrow-right"></i></span>
            {sidebarOpen && <span>লগআউট</span>}
          </button>
        </div>
      </aside>

      {/* ---- MOBILE HEADER ---- */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <button onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                className="w-10 h-10 rounded-xl gradient-primary-green flex items-center justify-center active:scale-95 transition-transform shadow-md shadow-[#107539]/20" aria-label="মেনু">
                <i className={`bi ${mobileDrawerOpen ? "bi-x-lg" : "bi-list"} text-base text-white`}></i>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl gradient-orange-fab flex items-center justify-center shadow-sm">
                  <i className="bi bi-cup-hot-fill text-white text-xs"></i>
                </div>
                <div>
                  <span className="font-black text-[13px] text-gray-900 block leading-tight">Admin Panel</span>
                  <span className="text-[10px] text-gray-400 block leading-tight">{tabs.find((t) => t.id === activeTab)?.label}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadData} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform" aria-label="রিফ্রেশ">
                <i className="bi bi-arrow-clockwise text-sm text-gray-500"></i>
              </button>
              <button onClick={() => { sessionStorage.removeItem("admin-auth"); setAuthenticated(false); }}
                className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center active:scale-95 transition-transform" aria-label="লগআউট">
                <i className="bi bi-box-arrow-right text-sm text-red-500"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---- MOBILE DRAWER ---- */}
      {mobileDrawerOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={() => setMobileDrawerOpen(false)} />
          <div className="md:hidden fixed top-0 left-0 bottom-0 z-[70] w-[300px] max-w-[85vw] bg-white shadow-2xl animate-slide-in-left flex flex-col">
            <div className="relative p-5 pb-6 gradient-primary-green overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
              </div>
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg border border-white/20">
                    <i className="bi bi-cup-hot-fill text-xl"></i>
                  </div>
                  <div>
                    <span className="font-black text-sm text-white block">ফ্রি ফুড ম্যাপ</span>
                    <p className="text-[10px] text-white/50 font-medium">ADMIN CONTROL PANEL</p>
                  </div>
                </div>
                <button onClick={() => setMobileDrawerOpen(false)} className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center active:scale-95 transition-transform">
                  <i className="bi bi-x-lg text-sm text-white"></i>
                </button>
              </div>
              <div className="relative mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: "স্পট", val: spots.length, icon: "bi-geo-alt" },
                  { label: "ভিউ", val: (stats?.totalViews || 0), icon: "bi-eye" },
                  { label: "দাতা", val: donations.length, icon: "bi-heart" },
                ].map(s => (
                  <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/10 text-center">
                    <p className="text-[9px] text-white/50 font-medium">{s.label}</p>
                    <p className="text-base font-black text-white">{typeof s.val === 'number' && s.val > 999 ? (s.val / 1000).toFixed(1) + 'K' : s.val}</p>
                  </div>
                ))}
              </div>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-auto custom-scrollbar">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                    activeTab === tab.id ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg` : "text-gray-600 hover:bg-gray-50"
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${activeTab === tab.id ? "bg-white/20" : "bg-gray-100"}`}>{tab.icon}</div>
                  <div className="flex-1 text-left">
                    <span className="block text-[13px] font-semibold">{tab.label}</span>
                    <span className={`block text-[10px] ${activeTab === tab.id ? "text-white/60" : "text-gray-400"}`}>{tab.desc}</span>
                  </div>
                  {tab.badge && <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${activeTab === tab.id ? "bg-white/25 text-white" : "bg-red-100 text-red-600"}`}>{tab.badge}</span>}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-gray-100 space-y-0.5">
              <a href="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all active:scale-[0.98]">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><i className="bi bi-house-fill text-sm"></i></div>
                <span className="text-[13px]">ওয়েবসাইটে যান</span>
              </a>
              <button onClick={() => { setMobileDrawerOpen(false); sessionStorage.removeItem("admin-auth"); setAuthenticated(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all active:scale-[0.98]">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><i className="bi bi-box-arrow-right text-sm"></i></div>
                <span className="text-[13px]">লগআউট</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---- MAIN CONTENT ---- */}
      <main className="flex-1 min-h-screen">
        {/* Top Bar */}
        <div className="hidden md:flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200/80 sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-black text-gray-900">{tabs.find(t => t.id === activeTab)?.label}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {lastRefresh ? `সর্বশেষ আপডেট: ${lastRefresh.toLocaleTimeString("bn-BD")}` : "লোড হচ্ছে..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="h-9 px-3 rounded-xl bg-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-all flex items-center gap-1.5">
              <i className="bi bi-arrow-clockwise text-[11px]"></i> রিফ্রেশ
            </button>
            {pendingReports > 0 && (
              <button onClick={() => setActiveTab("reports")} className="h-9 px-3 rounded-xl bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100 transition-all flex items-center gap-1.5 animate-fade-in">
                <i className="bi bi-flag-fill text-[11px]"></i> {pendingReports} রিপোর্ট
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-6 pt-20 md:pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="spinner"></div>
              <p className="text-sm text-gray-400">ডেটা লোড হচ্ছে...</p>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && <DashboardTab stats={stats} spots={spots} events={events} donations={donations} reports={reports} onRefresh={loadData} onSeedData={async () => {
                try {
                  const sampleSpots: Omit<Spot, 'id'>[] = [
                    { name: "কেন্দ্রীয় জামে মসজিদ ফ্রি ফুড ক্যাম্প", type: "daily_meal" as SpotType, address: "বায়তুল মোকাররম, ঢাকা", area: "পুরান ঢাকা", city: "ঢাকা", country: "বাংলাদেশ", lat: 23.7104, lng: 90.4074, openDays: DAY_ORDER, openTime: "12:00", closeTime: "14:00", notes: "প্রতিদিন দুপুরে ৫০০+ মানুষকে ফ্রি খাবার দেওয়া হয়", verified: true, active: true, createdAt: Date.now(), lastUpdated: Date.now(), startDate: null, endDate: null, autoDelete: false, viewCount: 120, directionCount: 45, positiveVotes: 12, negativeVotes: 1 },
                    { name: "গুলশান কমিউনিটি কিচেন", type: "weekly_meal" as SpotType, address: "গুলশান আব্দুল হাই রোড, ঢাকা", area: "গুলশান", city: "ঢাকা", country: "বাংলাদেশ", lat: 23.7937, lng: 90.4143, openDays: ["friday","saturday"], openTime: "13:00", closeTime: "15:00", notes: "শুক্র ও শনিবার বিকেলে ফ্রি খাবার বিতরণ", verified: true, active: true, createdAt: Date.now() - 86400000, lastUpdated: Date.now() - 86400000, startDate: null, endDate: null, autoDelete: false, viewCount: 89, directionCount: 32, positiveVotes: 8, negativeVotes: 0 },
                    { name: "মিরপুর স্যুপ কিচেন", type: "soup_kitchen" as SpotType, address: "মিরপুর ১০, ঢাকা", area: "মিরপুর", city: "ঢাকা", country: "বাংলাদেশ", lat: 23.8023, lng: 90.3658, openDays: DAY_ORDER, openTime: "18:00", closeTime: "21:00", notes: "প্রতিদিন রাতে স্যুপ ও রুটি বিতরণ", verified: true, active: true, createdAt: Date.now() - 172800000, lastUpdated: Date.now() - 172800000, startDate: null, endDate: null, autoDelete: false, viewCount: 67, directionCount: 28, positiveVotes: 6, negativeVotes: 2 },
                    { name: "উত্তরা গ্রোসারি ব্যাংক", type: "grocery" as SpotType, address: "উত্তরা সেক্টর ৭, ঢাকা", area: "উত্তরা", city: "ঢাকা", country: "বাংলাদেশ", lat: 23.8679, lng: 90.3928, openDays: ["saturday","wednesday"], openTime: "09:00", closeTime: "13:00", notes: "ফ্রি গ্রোসারি সামগ্রী বিতরণ", verified: false, active: true, createdAt: Date.now() - 259200000, lastUpdated: Date.now() - 259200000, startDate: null, endDate: null, autoDelete: false, viewCount: 43, directionCount: 15, positiveVotes: 4, negativeVotes: 1 },
                    { name: "চট্টগ্রাম সেন্ট্রাল ফুড ব্যাংক", type: "daily_meal" as SpotType, address: "এম এ আজিজ স্টেডিয়াম সংলগ্ন, চট্টগ্রাম", area: "আগ্রাবাদ", city: "চট্টগ্রাম", country: "বাংলাদেশ", lat: 22.3569, lng: 91.8317, openDays: DAY_ORDER, openTime: "12:00", closeTime: "13:30", notes: "প্রতিদিন দুপুরে ফ্রি খাবার বিতরণ", verified: true, active: true, createdAt: Date.now() - 432000000, lastUpdated: Date.now() - 432000000, startDate: null, endDate: null, autoDelete: false, viewCount: 56, directionCount: 20, positiveVotes: 7, negativeVotes: 0 },
                  ];
                  const count = await bulkImportSpots(sampleSpots); loadData(); toast.success(`${count}টি স্যাম্পল স্পট যোগ হয়েছে!`);
                } catch { toast.error("স্যাম্পল ডেটা যোগ ব্যর্থ"); }
              }} />}
              {activeTab === "spots" && <SpotsTab spots={spots} onRefresh={refreshSpots} onEdit={(s) => setEditModal({ type: "spot", data: s })} onDelete={(s) => setDeleteConfirm({ type: "spot", id: s.id, name: s.name })}
                onAdd={async (d) => { try { await createSpot(d); refreshSpots(); toast.success("নতুন স্পট যোগ হয়েছে"); } catch { toast.error("স্পট যোগ ব্যর্থ"); } }}
                onVerify={async (id, v) => { try { await updateSpot(id, { verified: v }); refreshSpots(); toast.success(v ? "নিশ্চিত করা হয়েছে" : "নিশ্চিততা সরানো হয়েছে"); } catch { toast.error("অপারেশন ব্যর্থ"); } }}
                onToggleActive={async (id, a) => { try { await updateSpot(id, { active: a }); refreshSpots(); toast.success(a ? "সক্রিয়" : "নিষ্ক্রিয়"); } catch { toast.error("অপারেশন ব্যর্থ"); } }}
              />}
              {activeTab === "events" && <EventsTab events={events} onRefresh={refreshEvents} onEdit={(e) => setEditModal({ type: "event", data: e })} onDelete={(e) => setDeleteConfirm({ type: "event", id: e.id, name: e.title })}
                onAdd={async (d) => { try { await createEvent(d as any); refreshEvents(); toast.success("ইভেন্ট তৈরি হয়েছে"); } catch { toast.error("ইভেন্ট তৈরি ব্যর্থ"); } }}
              />}
              {activeTab === "donations" && <DonationsTab donations={donations} onRefresh={refreshDonations} onDelete={(d) => setDeleteConfirm({ type: "donation", id: d.id, name: `${d.donorName} - ৳${d.amount}` })}
                onAdd={async (d) => { try { await addDonation(d); refreshDonations(); toast.success("অনুদান যোগ হয়েছে"); } catch { toast.error("অনুদান যোগ ব্যর্থ"); } }}
                onUpdateStatus={async (id, s) => { try { await updateDonationFn(id, { status: s as Donation["status"] }); refreshDonations(); toast.success("অনুদান আপডেট হয়েছে"); } catch { toast.error("আপডেট ব্যর্থ"); } }}
              />}
              {activeTab === "team" && <TeamTab team={team} onRefresh={refreshTeam} onEdit={(t) => setEditModal({ type: "team", data: t })} onDelete={(t) => setDeleteConfirm({ type: "team", id: t.id, name: t.name })}
                onAdd={async (d) => { try { await addTeamMember(d); refreshTeam(); toast.success("সদস্য যোগ হয়েছে"); } catch { toast.error("সদস্য যোগ ব্যর্থ"); } }}
              />}
              {activeTab === "reports" && <ReportsTab reports={reports} onRefresh={refreshReports}
                onUpdate={async (id, s, notes) => { try { await updateReport(id, { status: s as Report["status"], adminNotes: notes }); refreshReports(); toast.success("রিপোর্ট আপডেট হয়েছে"); } catch { toast.error("আপডেট ব্যর্থ"); } }}
                onDelete={(r) => setDeleteConfirm({ type: "report", id: r.id, name: r.spotName })}
              />}
              {activeTab === "notifications" && <NotificationsTab notifications={notifications} onRefresh={refreshNotifications}
                onAdd={async (d) => { try { await createNotification(d); refreshNotifications(); toast.success("নোটিফিকেশন তৈরি হয়েছে"); } catch { toast.error("তৈরি ব্যর্থ"); } }}
                onDelete={async (id) => { try { await deleteNotificationFn(id); refreshNotifications(); toast.success("নোটিফিকেশন মুছে ফেলা হয়েছে"); } catch { toast.error("মুছে ফেলা ব্যর্থ"); } }}
              />}
              {activeTab === "settings" && <SettingsTab settings={settings}
                onSave={async (d) => { try { await updateSiteSettings(d); setSettings({ ...settings!, ...d }); toast.success("সেটিংস সংরক্ষিত হয়েছে"); } catch { toast.error("সংরক্ষণ ব্যর্থ"); } }}
                onExportCSV={handleExportCSV} onExportJSON={handleExportJSON} onExportAll={handleExportAllData}
              />}
            </>
          )}
        </div>
      </main>

      {/* ---- EDIT MODAL ---- */}
      {editModal && <EditModal type={editModal.type} data={editModal.data} onClose={() => setEditModal(null)} onSave={async (data) => {
        try {
          if (editModal.type === "spot") { await updateSpot(editModal.data.id, data); refreshSpots(); toast.success("স্পট আপডেট হয়েছে"); }
          else if (editModal.type === "event") { await updateEvent(editModal.data.id, data); refreshEvents(); toast.success("ইভেন্ট আপডেট হয়েছে"); }
          else if (editModal.type === "team") { await updateTeamMember(editModal.data.id, data); refreshTeam(); toast.success("সদস্য আপডেট হয়েছে"); }
          setEditModal(null);
        } catch { toast.error("সংরক্ষণ ব্যর্থ"); }
      }} />}

      {/* ---- DELETE CONFIRMATION ---- */}
      {deleteConfirm && <DeleteConfirmDialog item={deleteConfirm} onCancel={() => setDeleteConfirm(null)} onConfirm={async () => {
        try {
          if (deleteConfirm.type === "spot") await deleteSpot(deleteConfirm.id);
          else if (deleteConfirm.type === "event") await deleteEventFn(deleteConfirm.id);
          else if (deleteConfirm.type === "donation") await deleteDonationFn(deleteConfirm.id);
          else if (deleteConfirm.type === "team") await deleteTeamMemberFn(deleteConfirm.id);
          else if (deleteConfirm.type === "report") await deleteReportFn(deleteConfirm.id);
          toast.success("সফলভাবে মুছে ফেলা হয়েছে");
        } catch { toast.error("মুছে ফেলতে সমস্যা"); }
        setDeleteConfirm(null); loadData();
      }} />}
    </div>
  );
}

// ============================================
// REUSABLE UI COMPONENTS
// ============================================
const AdminInput = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div>
    {label && <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>}
    <input {...props} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#107539]/20 focus:border-[#107539]/40 transition-all placeholder:text-gray-400" />
  </div>
);

const AdminTextarea = ({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) => (
  <div>
    {label && <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>}
    <textarea {...props} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#107539]/20 focus:border-[#107539]/40 transition-all placeholder:text-gray-400" />
  </div>
);

const AdminSelect = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) => (
  <div>
    {label && <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>}
    <select {...props} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#107539]/20 focus:border-[#107539]/40 transition-all">
      {children}
    </select>
  </div>
);

const PageHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 mb-6">
    <div>
      <h2 className="text-xl font-black text-gray-900">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const StatCard = ({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) => (
  <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white shadow-sm`}>{icon}</div>
      <i className="bi bi-three-dots-vertical text-gray-300 group-hover:text-gray-500 transition-colors"></i>
    </div>
    <p className="text-2xl font-black text-gray-900">{typeof value === 'number' ? value.toLocaleString("bn-BD") : value}</p>
    <p className="text-[11px] text-gray-400 font-medium mt-0.5">{label}</p>
  </div>
);

const EmptyState = ({ icon, message }: { icon: string; message: string }) => (
  <div className="text-center py-12">
    <i className={`bi ${icon} text-4xl text-gray-200 mb-3 block`}></i>
    <p className="text-sm text-gray-400 font-medium">{message}</p>
  </div>
);

function DeleteConfirmDialog({ item, onCancel, onConfirm }: { item: { type: string; id: string; name: string; extra?: string }; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in-scale" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <i className="bi bi-trash3 text-2xl text-red-500"></i>
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-1">মুছে ফেলতে চান?</h3>
          <p className="text-sm text-gray-500 mb-1">&quot;{item.name}&quot;</p>
          {item.extra && <p className="text-xs text-red-400 mb-4">{item.extra}</p>}
          {!item.extra && <div className="mb-4" />}
          <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all min-h-[48px]">বাতিল</button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all min-h-[48px]">মুছুন</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD TAB
// ============================================
function DashboardTab({ stats, spots, events, donations, reports, onRefresh, onSeedData }: {
  stats: AppStats | null; spots: Spot[]; events: FoodEvent[]; donations: Donation[]; reports: Report[];
  onRefresh: () => void; onSeedData: () => void;
}) {
  const totalDonations = donations.filter(d => d.status === "confirmed").reduce((s, d) => s + d.amount, 0);
  const pendingReports = reports.filter(r => r.status === "pending").length;

  // Type distribution
  const typeMap = new Map<string, number>();
  spots.forEach(s => typeMap.set(s.type, (typeMap.get(s.type) || 0) + 1));
  const typeData = Array.from(typeMap.entries()).sort((a, b) => b[1] - a[1]);
  const maxTypeCount = typeData[0]?.[1] || 1;

  // City distribution
  const cityMap = new Map<string, number>();
  spots.forEach(s => cityMap.set(s.city, (cityMap.get(s.city) || 0) + 1));
  const cityData = Array.from(cityMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCityCount = cityData[0]?.[1] || 1;

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      {spots.length === 0 && (
        <div className="bg-gradient-to-r from-[#107539] to-[#1C9C4B] rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">শুরু করুন!</h3>
            <p className="text-xs text-white/60 mt-0.5">স্যাম্পল ডেটা যোগ করে ড্যাশবোর্ড দেখুন</p>
          </div>
          <button onClick={onSeedData} className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-xs font-bold hover:bg-white/30 transition-all border border-white/20">
            <i className="bi bi-magic mr-1"></i> স্যাম্পল ডেটা
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<i className="bi bi-geo-alt-fill text-base"></i>} value={stats?.totalSpots || 0} label="মোট স্পট" color="bg-gradient-to-br from-blue-500 to-blue-600" />
        <StatCard icon={<i className="bi bi-patch-check-fill text-base"></i>} value={stats?.verifiedSpots || 0} label="নিশ্চিত স্পট" color="bg-gradient-to-br from-emerald-500 to-green-600" />
        <StatCard icon={<i className="bi bi-eye-fill text-base"></i>} value={stats?.totalViews || 0} label="মোট ভিউ" color="bg-gradient-to-br from-violet-500 to-purple-600" />
        <StatCard icon={<i className="bi bi-heart-fill text-base"></i>} value={`৳${totalDonations.toLocaleString("bn-BD")}`} label="মোট অনুদান" color="bg-gradient-to-br from-rose-500 to-pink-600" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={<i className="bi bi-circle-fill text-base"></i>} value={stats?.activeSpots || 0} label="সক্রিয় স্পট" color="bg-gradient-to-br from-teal-500 to-cyan-600" />
        <StatCard icon={<i className="bi bi-star-fill text-base"></i>} value={stats?.totalReviews || 0} label="মোট রিভিউ" color="bg-gradient-to-br from-amber-500 to-orange-600" />
        <StatCard icon={<i className="bi bi-flag-fill text-base"></i>} value={pendingReports} label="অপেক্ষমান রিপোর্ট" color="bg-gradient-to-br from-red-500 to-red-600" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4">স্পট ধরন অনুযায়ী বিতরণ</h3>
          <div className="space-y-3">
            {typeData.map(([type, count]) => {
              const config = SPOT_TYPE_CONFIG[type as SpotType];
              const pct = Math.round((count / maxTypeCount) * 100);
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{config?.emoji || "🍲"}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">{config?.label || type}</span>
                      <span className="text-xs font-bold text-gray-500">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#107539] to-[#1C9C4B] transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {typeData.length === 0 && <p className="text-xs text-gray-400 text-center py-4">কোন ডেটা নেই</p>}
          </div>
        </div>

        {/* City Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4">শহর অনুযায়ী স্পট বিতরণ</h3>
          <div className="space-y-3">
            {cityData.map(([city, count]) => {
              const pct = Math.round((count / maxCityCount) * 100);
              return (
                <div key={city} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg gradient-orange-fab flex items-center justify-center text-white text-[10px] font-black shrink-0">
                    {city.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">{city || "অজানা"}</span>
                      <span className="text-xs font-bold text-gray-500">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full gradient-orange-fab transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {cityData.length === 0 && <p className="text-xs text-gray-400 text-center py-4">কোন ডেটা নেই</p>}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">সাম্প্রতিক স্পট</h3>
            <span className="text-[10px] text-gray-400 font-medium">{spots.length}টি মোট</span>
          </div>
          <div className="space-y-2">
            {spots.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                <span className="text-xl">{SPOT_TYPE_CONFIG[s.type]?.emoji || "🍲"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                  <p className="text-[11px] text-gray-400">{s.area || s.city}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {s.verified && <i className="bi bi-patch-check-fill text-emerald-500 text-xs"></i>}
                  {!s.active && <i className="bi bi-x-circle-fill text-red-400 text-xs"></i>}
                  {s.active && s.verified && <i className="bi bi-circle-fill text-emerald-400 text-[8px]"></i>}
                </div>
              </div>
            ))}
            {spots.length === 0 && <EmptyState icon="bi-geo-alt" message="কোন স্পট নেই" />}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">সাম্প্রতিক ইভেন্ট</h3>
            <span className="text-[10px] text-gray-400 font-medium">{events.length}টি মোট</span>
          </div>
          <div className="space-y-2">
            {events.slice(0, 5).map(e => (
              <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <i className="bi bi-calendar-event text-violet-600 text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{e.title}</p>
                  <p className="text-[11px] text-gray-400">{e.date} • {e.location}</p>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
            {events.length === 0 && <EmptyState icon="bi-calendar-x" message="কোন ইভেন্ট নেই" />}
          </div>
        </div>
      </div>

      {/* Pending Reports Alert */}
      {pendingReports > 0 && (
        <div className="bg-red-50 rounded-2xl p-5 border border-red-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <i className="bi bi-flag-fill text-red-500 text-xl"></i>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">{pendingReports}টি অপেক্ষমান রিপোর্ট আছে</p>
            <p className="text-xs text-red-500 mt-0.5">দ্রুত পর্যালোচনা করুন</p>
          </div>
          <button onClick={() => {/* navigate to reports - handled by parent */}} className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all shrink-0">
            রিপোর্ট দেখুন
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// STATUS BADGE
// ============================================
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    upcoming: { label: "আসন্ন", color: "bg-blue-50 text-blue-600 border-blue-100" },
    ongoing: { label: "চলমান", color: "bg-green-50 text-green-600 border-green-100" },
    completed: { label: "সম্পন্ন", color: "bg-gray-50 text-gray-500 border-gray-200" },
    cancelled: { label: "বাতিল", color: "bg-red-50 text-red-500 border-red-100" },
    pending: { label: "অপেক্ষমান", color: "bg-amber-50 text-amber-600 border-amber-100" },
    confirmed: { label: "নিশ্চিত", color: "bg-green-50 text-green-600 border-green-100" },
    processing: { label: "প্রক্রিয়াধীন", color: "bg-blue-50 text-blue-600 border-blue-100" },
    reviewing: { label: "পর্যালোচনা", color: "bg-blue-50 text-blue-600 border-blue-100" },
    resolved: { label: "সমাধান", color: "bg-green-50 text-green-600 border-green-100" },
    dismissed: { label: "বাতিল", color: "bg-gray-50 text-gray-500 border-gray-200" },
    info: { label: "তথ্য", color: "bg-blue-50 text-blue-600 border-blue-100" },
    warning: { label: "সতর্কতা", color: "bg-amber-50 text-amber-600 border-amber-100" },
    success: { label: "সাফল্য", color: "bg-green-50 text-green-600 border-green-100" },
    urgent: { label: "জরুরি", color: "bg-red-50 text-red-500 border-red-100" },
  };
  const config = map[status] || { label: status, color: "bg-gray-50 text-gray-500 border-gray-200" };
  return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${config.color}`}>{config.label}</span>;
}

// ============================================
// SPOTS TAB
// ============================================
function SpotsTab({ spots, onRefresh, onEdit, onDelete, onAdd, onVerify, onToggleActive }: {
  spots: Spot[]; onRefresh: () => void; onEdit: (s: Spot) => void; onDelete: (s: Spot) => void;
  onAdd: (d: any) => void; onVerify: (id: string, v: boolean) => void; onToggleActive: (id: string, a: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterVerified, setFilterVerified] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", type: "daily_meal" as SpotType, address: "", area: "", city: "ঢাকা", lat: "23.7596", lng: "90.379", notes: "", openTime: "00:00", closeTime: "23:59" });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ name: addForm.name, type: addForm.type, address: addForm.address, area: addForm.area, city: addForm.city, country: "বাংলাদেশ", lat: parseFloat(addForm.lat), lng: parseFloat(addForm.lng), openDays: DAY_ORDER, openTime: addForm.openTime, closeTime: addForm.closeTime, notes: addForm.notes || null });
    setShowAddForm(false);
    setAddForm({ name: "", type: "daily_meal", address: "", area: "", city: "ঢাকা", lat: "23.7596", lng: "90.379", notes: "", openTime: "00:00", closeTime: "23:59" });
  };

  const filtered = spots.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.area.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== "all" && s.type !== filterType) return false;
    if (filterVerified === "verified" && !s.verified) return false;
    if (filterVerified === "unverified" && s.verified) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <PageHeader title="স্পট ম্যানেজমেন্ট" subtitle={`${filtered.length} / ${spots.length} স্পট দেখানো হচ্ছে`}
        action={<div className="flex gap-2">
          <button onClick={onRefresh} className="h-10 px-3 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-1.5 min-h-[44px]"><i className="bi bi-arrow-clockwise text-[11px]"></i></button>
          <button onClick={() => setShowAddForm(!showAddForm)} className={`h-10 px-4 rounded-xl text-xs font-bold text-white transition-all whitespace-nowrap min-h-[44px] ${showAddForm ? "bg-gray-600 hover:bg-gray-700" : "gradient-primary-green hover:shadow-lg"}`}>
            {showAddForm ? <><i className="bi bi-x-lg mr-1"></i>বন্ধ</> : <><i className="bi bi-plus-lg mr-1"></i>নতুন স্পট</>}
          </button>
        </div>}
      />

      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4 animate-fade-in-scale shadow-sm">
          <div className="flex items-center gap-2 mb-1"><i className="bi bi-plus-circle text-[#107539]"></i><span className="text-sm font-bold text-gray-900">নতুন স্পট যোগ করুন</span></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput label="স্থানের নাম *" placeholder="যেমন: কেন্দ্রীয় জামে মসজিদ ফ্রি ফুড ক্যাম্প" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} required />
            <AdminSelect label="ধরন *" value={addForm.type} onChange={e => setAddForm({...addForm, type: e.target.value as SpotType})}>
              {Object.entries(SPOT_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </AdminSelect>
            <AdminInput label="এলাকা / মহল্লা *" placeholder="পুরান ঢাকা" value={addForm.area} onChange={e => setAddForm({...addForm, area: e.target.value})} required />
            <AdminInput label="শহর" placeholder="ঢাকা" value={addForm.city} onChange={e => setAddForm({...addForm, city: e.target.value})} />
            <AdminInput label="ঠিকানা" placeholder="বায়তুল মোকাররম, ঢাকা" value={addForm.address} onChange={e => setAddForm({...addForm, address: e.target.value})} />
            <AdminInput label="নোটস" placeholder="অতিরিক্ত তথ্য" value={addForm.notes} onChange={e => setAddForm({...addForm, notes: e.target.value})} />
            <AdminInput label="অক্ষাংশ (lat)" type="number" step="any" value={addForm.lat} onChange={e => setAddForm({...addForm, lat: e.target.value})} />
            <AdminInput label="দ্রাঘিমাংশ (lng)" type="number" step="any" value={addForm.lng} onChange={e => setAddForm({...addForm, lng: e.target.value})} />
            <AdminInput label="খোলার সময়" type="time" value={addForm.openTime} onChange={e => setAddForm({...addForm, openTime: e.target.value})} />
            <AdminInput label="বন্ধের সময়" type="time" value={addForm.closeTime} onChange={e => setAddForm({...addForm, closeTime: e.target.value})} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all min-h-[48px]">বাতিল</button>
            <button type="submit" className="flex-1 py-3 rounded-xl gradient-primary-green text-white font-bold text-sm hover:shadow-lg transition-all min-h-[48px]">স্পট যোগ করুন</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          <input type="text" placeholder="স্পট খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#107539]/20" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#107539]/20">
          <option value="all">সব ধরন</option>
          {Object.entries(SPOT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterVerified} onChange={e => setFilterVerified(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#107539]/20">
          <option value="all">সব অবস্থা</option>
          <option value="verified">নিশ্চিত</option>
          <option value="unverified">অনিশ্চিত</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hidden md:block shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">স্পট</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">ধরন</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">এলাকা</th>
              <th className="text-center px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">অবস্থা</th>
              <th className="text-center px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">পরিসংখ্যান</th>
              <th className="text-right px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(spot => (
              <tr key={spot.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{SPOT_TYPE_CONFIG[spot.type]?.emoji || "🍲"}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{spot.name}</p>
                      <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{spot.address}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-600">{SPOT_TYPE_CONFIG[spot.type]?.label}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{spot.area || spot.city}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => onVerify(spot.id, !spot.verified)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${spot.verified ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200 hover:border-amber-300"}`}>
                      {spot.verified ? <><i className="bi bi-check-lg text-[9px]"></i> নিশ্চিত</> : "অনিশ্চিত"}
                    </button>
                    <button onClick={() => onToggleActive(spot.id, !spot.active)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${spot.active ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-gray-100 text-gray-400 border border-gray-200"}`}>
                      {spot.active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-[11px]">
                    <span className="text-emerald-600 font-semibold"><i className="bi bi-hand-thumbs-up text-[9px]"></i> {spot.positiveVotes}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-red-400 font-semibold"><i className="bi bi-hand-thumbs-down text-[9px]"></i> {spot.negativeVotes}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-blue-500 font-semibold"><i className="bi bi-eye text-[9px]"></i> {spot.viewCount || 0}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onEdit(spot)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all" title="সম্পাদনা"><i className="bi bi-pencil text-xs"></i></button>
                    <button onClick={() => onDelete(spot)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all" title="মুছুন"><i className="bi bi-trash3 text-xs"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState icon="bi-geo-alt" message="কোন স্পট পাওয়া যায়নি" />}
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map(spot => (
          <div key={spot.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl">{SPOT_TYPE_CONFIG[spot.type]?.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{spot.name}</p>
                  <p className="text-[11px] text-gray-400">{spot.area || spot.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onEdit(spot)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"><i className="bi bi-pencil text-xs text-gray-400"></i></button>
                <button onClick={() => onDelete(spot)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50"><i className="bi bi-trash3 text-xs text-red-400"></i></button>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-gray-100 text-gray-600">{SPOT_TYPE_CONFIG[spot.type]?.label}</span>
              <button onClick={() => onVerify(spot.id, !spot.verified)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${spot.verified ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{spot.verified ? "✓ নিশ্চিত" : "? অনিশ্চিত"}</button>
              <button onClick={() => onToggleActive(spot.id, !spot.active)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${spot.active ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}`}>{spot.active ? "সক্রিয়" : "নিষ্ক্রিয়"}</button>
            </div>
            <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-400">
              <span className="text-emerald-500">👍 {spot.positiveVotes}</span>
              <span className="text-red-400">👎 {spot.negativeVotes}</span>
              <span className="text-blue-500">👁 {spot.viewCount || 0}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState icon="bi-geo-alt" message="কোন স্পট পাওয়া যায়নি" />}
      </div>
    </div>
  );
}

// ============================================
// EVENTS TAB
// ============================================
function EventsTab({ events, onRefresh, onEdit, onDelete, onAdd }: {
  events: FoodEvent[]; onRefresh: () => void; onEdit: (e: FoodEvent) => void; onDelete: (e: FoodEvent) => void; onAdd: (d: any) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", time: "", location: "", organizer: "", foodType: "", status: "upcoming" as string, lat: 23.7596, lng: 90.379 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, address: form.location, endDate: null, contactPhone: "", estimatedPeople: 0, image: "" });
    setShowForm(false);
    setForm({ title: "", description: "", date: "", time: "", location: "", organizer: "", foodType: "", status: "upcoming", lat: 23.7596, lng: 90.379 });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="ইভেন্ট ম্যানেজমেন্ট" subtitle={`${events.length}টি ইভেন্ট`}
        action={<div className="flex gap-2">
          <button onClick={onRefresh} className="h-10 px-3 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 min-h-[44px]"><i className="bi bi-arrow-clockwise text-[11px]"></i></button>
          <button onClick={() => setShowForm(!showForm)} className={`h-10 px-4 rounded-xl text-xs font-bold text-white transition-all whitespace-nowrap min-h-[44px] ${showForm ? "bg-gray-600" : "bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-lg"}`}>
            {showForm ? "বন্ধ" : "+ নতুন ইভেন্ট"}
          </button>
        </div>}
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4 animate-fade-in-scale shadow-sm">
          <AdminInput label="ইভেন্টের নাম *" placeholder="ফ্রি ফুড ফেস্টিভ্যাল" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <AdminTextarea label="বিবরণ" placeholder="ইভেন্ট সম্পর্কে বিস্তারিত..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <AdminInput label="তারিখ *" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
            <AdminInput label="সময়" type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
          </div>
          <AdminInput label="লোকেশন" placeholder="আয়োজনস্থল" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <AdminInput label="আয়োজক" placeholder="সংগঠকের নাম" value={form.organizer} onChange={e => setForm({...form, organizer: e.target.value})} />
            <AdminInput label="খাবারের ধরন" placeholder="বিরিয়ানি, খিচুড়ি..." value={form.foodType} onChange={e => setForm({...form, foodType: e.target.value})} />
          </div>
          <AdminSelect label="স্ট্যাটাস" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="upcoming">আসন্ন</option><option value="ongoing">চলমান</option><option value="completed">সম্পন্ন</option><option value="cancelled">বাতিল</option>
          </AdminSelect>
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm hover:shadow-lg transition-all min-h-[48px]">ইভেন্ট তৈরি করুন</button>
        </form>
      )}

      <div className="space-y-3">
        {events.map(event => (
          <div key={event.id} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="text-sm font-bold text-gray-900">{event.title}</h4>
                  <StatusBadge status={event.status} />
                </div>
                <p className="text-xs text-gray-500 mt-1"><i className="bi bi-calendar3 text-[10px] mr-1"></i>{event.date} {event.time ? `• ${event.time}` : ""} • {event.location}</p>
                <p className="text-xs text-gray-400 mt-0.5"><i className="bi bi-person text-[10px] mr-1"></i>{event.organizer}</p>
                {event.foodType && <p className="text-[11px] text-gray-400 mt-0.5">🍛 {event.foodType}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(event)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-blue-50"><i className="bi bi-pencil text-sm text-gray-400"></i></button>
                <button onClick={() => onDelete(event)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50"><i className="bi bi-trash3 text-sm text-red-400"></i></button>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && <EmptyState icon="bi-calendar-x" message="কোন ইভেন্ট নেই" />}
      </div>
    </div>
  );
}

// ============================================
// DONATIONS TAB
// ============================================
function DonationsTab({ donations, onRefresh, onDelete, onAdd, onUpdateStatus }: {
  donations: Donation[]; onRefresh: () => void; onDelete: (d: Donation) => void; onAdd: (d: any) => void; onUpdateStatus: (id: string, status: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ donorName: "", amount: "", method: "bKash", message: "" });
  const totalAmount = donations.filter(d => d.status === "confirmed").reduce((s, d) => s + d.amount, 0);
  const pendingAmount = donations.filter(d => d.status === "pending").reduce((s, d) => s + d.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, amount: Number(form.amount), currency: "BDT", spotId: undefined, spotName: undefined, donorPhone: undefined, transactionId: undefined, status: "confirmed" });
    setShowForm(false);
    setForm({ donorName: "", amount: "", method: "bKash", message: "" });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="অনুদান ম্যানেজমেন্ট"
        subtitle={`মোট: ৳${totalAmount.toLocaleString("bn-BD")} (${donations.length} জন দাতা)`}
        action={<div className="flex gap-2">
          <button onClick={onRefresh} className="h-10 px-3 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 min-h-[44px]"><i className="bi bi-arrow-clockwise text-[11px]"></i></button>
          <button onClick={() => setShowForm(!showForm)} className={`h-10 px-4 rounded-xl text-xs font-bold text-white transition-all whitespace-nowrap min-h-[44px] ${showForm ? "bg-gray-600" : "gradient-orange-fab hover:shadow-lg"}`}>
            {showForm ? "বন্ধ" : "+ নতুন অনুদান"}
          </button>
        </div>}
      />

      {/* Donation Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white">
          <p className="text-[10px] font-medium text-white/60 uppercase">নিশ্চিত</p>
          <p className="text-xl font-black mt-1">৳{totalAmount.toLocaleString("bn-BD")}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white">
          <p className="text-[10px] font-medium text-white/60 uppercase">অপেক্ষমান</p>
          <p className="text-xl font-black mt-1">৳{pendingAmount.toLocaleString("bn-BD")}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-[10px] font-medium text-gray-400 uppercase">দাতা</p>
          <p className="text-xl font-black text-gray-900 mt-1">{donations.length}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4 animate-fade-in-scale shadow-sm">
          <div className="flex items-center gap-2 mb-1"><i className="bi bi-heart text-rose-500"></i><span className="text-sm font-bold text-gray-900">নতুন অনুদান যোগ করুন</span></div>
          <div className="grid grid-cols-2 gap-4">
            <AdminInput label="দাতার নাম *" placeholder="নাম" value={form.donorName} onChange={e => setForm({...form, donorName: e.target.value})} required />
            <AdminInput label="পরিমাণ (৳) *" type="number" placeholder="1000" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
          </div>
          <AdminSelect label="পেমেন্ট মাধ্যম" value={form.method} onChange={e => setForm({...form, method: e.target.value})}>
            <option value="bKash">bKash</option><option value="Nagad">Nagad</option><option value="Rocket">Rocket</option><option value="Bank">ব্যাংক ট্রান্সফার</option><option value="Cash">নগদ</option>
          </AdminSelect>
          <AdminTextarea label="বার্তা (ঐচ্ছিক)" placeholder="দাতার বার্তা" value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={2} />
          <button type="submit" className="w-full py-3 rounded-xl gradient-orange-fab text-white font-bold text-sm hover:shadow-lg transition-all min-h-[48px]">সংরক্ষণ করুন</button>
        </form>
      )}

      <div className="space-y-2">
        {donations.map(d => (
          <div key={d.id} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gray-900">{d.donorName}</span>
                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold gradient-orange-fab text-white">৳{d.amount.toLocaleString("bn-BD")}</span>
                  <StatusBadge status={d.status} />
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                  <span><i className="bi bi-credit-card text-[9px]"></i> {d.method}</span>
                  <span>•</span>
                  <span>{new Date(d.createdAt).toLocaleDateString("bn-BD")}</span>
                </div>
                {d.message && <p className="text-xs text-gray-500 mt-1 italic">&quot;{d.message}&quot;</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {d.status === "pending" && (
                  <button onClick={() => onUpdateStatus(d.id, "confirmed")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-emerald-50" title="নিশ্চিত করুন"><i className="bi bi-check-circle text-sm text-emerald-500"></i></button>
                )}
                <button onClick={() => onDelete(d)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50"><i className="bi bi-trash3 text-sm text-red-400"></i></button>
              </div>
            </div>
          </div>
        ))}
        {donations.length === 0 && <EmptyState icon="bi-heart" message="কোন অনুদান নেই" />}
      </div>
    </div>
  );
}

// ============================================
// TEAM TAB
// ============================================
function TeamTab({ team, onRefresh, onEdit, onDelete, onAdd }: {
  team: TeamMember[]; onRefresh: () => void; onEdit: (t: TeamMember) => void; onDelete: (t: TeamMember) => void; onAdd: (d: any) => void;
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
      <PageHeader title="টিম সদস্য" subtitle={`${team.length}জন সদস্য`}
        action={<div className="flex gap-2">
          <button onClick={onRefresh} className="h-10 px-3 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 min-h-[44px]"><i className="bi bi-arrow-clockwise text-[11px]"></i></button>
          <button onClick={() => setShowForm(!showForm)} className={`h-10 px-4 rounded-xl text-xs font-bold text-white transition-all whitespace-nowrap min-h-[44px] ${showForm ? "bg-gray-600" : "bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg"}`}>
            {showForm ? "বন্ধ" : "+ নতুন সদস্য"}
          </button>
        </div>}
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4 animate-fade-in-scale shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <AdminInput label="নাম *" placeholder="সদস্যের নাম" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <AdminInput label="ভূমিকা *" placeholder="ডেভেলপার, ডিজাইনার..." value={form.role} onChange={e => setForm({...form, role: e.target.value})} required />
          </div>
          <AdminTextarea label="বায়ো" placeholder="সম্পর্কে সংক্ষিপ্ত..." value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <AdminInput label="ফোন" placeholder="+8801XXXXXXXXX" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <AdminInput label="Facebook URL" placeholder="https://facebook.com/..." value={form.facebook} onChange={e => setForm({...form, facebook: e.target.value})} />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm hover:shadow-lg transition-all min-h-[48px]">সদস্য যোগ করুন</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {team.map(member => (
          <div key={member.id} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl gradient-orange-fab flex items-center justify-center text-white font-black text-lg overflow-hidden shrink-0 shadow-lg shadow-orange-200/30">
                  {(member.avatar && member.avatar.startsWith("http")) ? <img src={member.avatar} alt="" className="w-full h-full object-cover" /> : member.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                  {member.phone && <p className="text-[11px] text-gray-400 mt-1"><i className="bi bi-telephone text-[9px]"></i> {member.phone}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(member)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50"><i className="bi bi-pencil text-xs text-gray-400"></i></button>
                <button onClick={() => onDelete(member)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50"><i className="bi bi-trash3 text-xs text-red-400"></i></button>
              </div>
            </div>
          </div>
        ))}
        {team.length === 0 && <EmptyState icon="bi-people" message="কোন সদস্য নেই" />}
      </div>
    </div>
  );
}

// ============================================
// REPORTS TAB
// ============================================
function ReportsTab({ reports, onRefresh, onUpdate, onDelete }: {
  reports: Report[]; onRefresh: () => void;
  onUpdate: (id: string, status: string, notes?: string) => void;
  onDelete: (r: Report) => void;
}) {
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState("all");

  const statusLabel = (s: string) => s === "pending" ? "অপেক্ষমান" : s === "reviewing" ? "পর্যালোচনা" : s === "resolved" ? "সমাধান" : "বাতিল";
  const filtered = reports.filter(r => filterStatus === "all" || r.status === filterStatus);

  return (
    <div className="space-y-4">
      <PageHeader title="রিপোর্ট ম্যানেজমেন্ট" subtitle={`${reports.filter(r => r.status === "pending").length}টি অপেক্ষমান`}
        action={<div className="flex gap-2">
          <button onClick={onRefresh} className="h-10 px-3 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 min-h-[44px]"><i className="bi bi-arrow-clockwise text-[11px]"></i></button>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none">
            <option value="all">সব রিপোর্ট</option>
            <option value="pending">অপেক্ষমান</option>
            <option value="reviewing">পর্যালোচনা</option>
            <option value="resolved">সমাধান</option>
            <option value="dismissed">বাতিল</option>
          </select>
        </div>}
      />

      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-bold text-gray-900">{r.spotName}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{r.description}</p>
                <p className="text-[11px] text-gray-400 mt-1"><i className="bi bi-clock text-[9px]"></i> {new Date(r.createdAt).toLocaleDateString("bn-BD")} • {r.type}</p>
                {r.adminNotes && <p className="text-xs text-blue-600 mt-2 bg-blue-50 rounded-lg px-3 py-2"><i className="bi bi-chat-dots text-[10px]"></i> {r.adminNotes}</p>}
                {r.status === "pending" || r.status === "reviewing" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <input type="text" placeholder="নোট লিখুন..." value={noteInput[r.id] || ""} onChange={e => setNoteInput({...noteInput, [r.id]: e.target.value})}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#107539]/20" />
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {(r.status === "pending" || r.status === "reviewing") && (
                  <div className="flex flex-col gap-1">
                    <button onClick={() => onUpdate(r.id, "reviewing", noteInput[r.id])} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-blue-50" title="পর্যালোচনা"><i className="bi bi-eye text-sm text-blue-500"></i></button>
                    <button onClick={() => onUpdate(r.id, "resolved", noteInput[r.id])} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-emerald-50" title="সমাধান"><i className="bi bi-check-circle text-sm text-emerald-500"></i></button>
                    <button onClick={() => onUpdate(r.id, "dismissed", noteInput[r.id])} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50" title="বাতিল"><i className="bi bi-x-circle text-sm text-gray-400"></i></button>
                  </div>
                )}
                <button onClick={() => onDelete(r)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50"><i className="bi bi-trash3 text-sm text-red-400"></i></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState icon="bi-flag" message="কোন রিপোর্ট নেই" />}
      </div>
    </div>
  );
}

// ============================================
// NOTIFICATIONS TAB
// ============================================
function NotificationsTab({ notifications, onRefresh, onAdd, onDelete }: {
  notifications: AppNotification[]; onRefresh: () => void;
  onAdd: (d: any) => void; onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info" as string, active: true, expiresAt: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, expiresAt: form.expiresAt ? new Date(form.expiresAt).getTime() : undefined });
    setShowForm(false);
    setForm({ title: "", message: "", type: "info", active: true, expiresAt: "" });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="নোটিফিকেশন ম্যানেজমেন্ট" subtitle={`${notifications.filter(n => n.active).length}টি সক্রিয়`}
        action={<div className="flex gap-2">
          <button onClick={onRefresh} className="h-10 px-3 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 min-h-[44px]"><i className="bi bi-arrow-clockwise text-[11px]"></i></button>
          <button onClick={() => setShowForm(!showForm)} className={`h-10 px-4 rounded-xl text-xs font-bold text-white transition-all whitespace-nowrap min-h-[44px] ${showForm ? "bg-gray-600" : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg"}`}>
            {showForm ? "বন্ধ" : "+ নতুন নোটিফিকেশন"}
          </button>
        </div>}
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4 animate-fade-in-scale shadow-sm">
          <AdminInput label="শিরোনাম *" placeholder="ঘোষণার শিরোনাম" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <AdminTextarea label="বার্তা *" placeholder="নোটিফিকেশন বার্তা" value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={3} required />
          <div className="grid grid-cols-2 gap-4">
            <AdminSelect label="ধরন" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="info">তথ্য</option><option value="warning">সতর্কতা</option><option value="success">সাফল্য</option><option value="urgent">জরুরি</option>
            </AdminSelect>
            <AdminInput label="মেয়াদ উত্তীর্ণ (ঐচ্ছিক)" type="datetime-local" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm hover:shadow-lg transition-all min-h-[48px]">নোটিফিকেশন তৈরি করুন</button>
        </form>
      )}

      <div className="space-y-3">
        {notifications.map(n => (
          <div key={n.id} className={`bg-white rounded-2xl p-4 border shadow-sm transition-all ${n.active ? "border-blue-200" : "border-gray-100 opacity-60"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-bold text-gray-900">{n.title}</span>
                  <StatusBadge status={n.type} />
                  {!n.active && <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-400 border border-gray-200">নিষ্ক্রিয়</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                <p className="text-[11px] text-gray-400 mt-1"><i className="bi bi-clock text-[9px]"></i> {new Date(n.createdAt).toLocaleDateString("bn-BD")}</p>
              </div>
              <button onClick={() => onDelete(n.id)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50 shrink-0"><i className="bi bi-trash3 text-sm text-red-400"></i></button>
            </div>
          </div>
        ))}
        {notifications.length === 0 && <EmptyState icon="bi-bell" message="কোন নোটিফিকেশন নেই" />}
      </div>
    </div>
  );
}

// ============================================
// SETTINGS TAB
// ============================================
function SettingsTab({ settings, onSave, onExportCSV, onExportJSON, onExportAll }: {
  settings: SiteSettings | null; onSave: (d: Partial<SiteSettings>) => void;
  onExportCSV: () => void; onExportJSON: () => void; onExportAll: () => void;
}) {
  const [form, setForm] = useState({
    siteName: settings?.siteName || "",
    siteDescription: settings?.siteDescription || "",
    contactEmail: settings?.contactEmail || "",
    contactPhone: settings?.contactPhone || "",
    facebookUrl: settings?.facebookUrl || "",
    twitterUrl: settings?.twitterUrl || "",
    donationEnabled: settings?.donationEnabled ?? true,
    donationMessage: settings?.donationMessage || "",
    maintenanceMode: settings?.maintenanceMode || false,
    maintenanceMessage: settings?.maintenanceMessage || "",
    mapCenterLat: settings?.mapCenterLat?.toString() || "23.7596",
    mapCenterLng: settings?.mapCenterLng?.toString() || "90.379",
    mapZoom: settings?.mapZoom?.toString() || "11",
    defaultCity: settings?.defaultCity || "ঢাকা",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      siteName: form.siteName, siteDescription: form.siteDescription,
      contactEmail: form.contactEmail, contactPhone: form.contactPhone,
      facebookUrl: form.facebookUrl, twitterUrl: form.twitterUrl,
      donationEnabled: form.donationEnabled, donationMessage: form.donationMessage,
      maintenanceMode: form.maintenanceMode, maintenanceMessage: form.maintenanceMessage,
      mapCenterLat: parseFloat(form.mapCenterLat), mapCenterLng: parseFloat(form.mapCenterLng),
      mapZoom: parseInt(form.mapZoom), defaultCity: form.defaultCity,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="সেটিংস" subtitle="সাইট কনফিগারেশন পরিচালনা" />

      {/* General Settings */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-5"><i className="bi bi-gear text-gray-400"></i><h3 className="text-sm font-bold text-gray-900">সাধারণ সেটিংস</h3></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput label="সাইটের নাম" placeholder="ফ্রি ফুড ম্যাপ" value={form.siteName} onChange={e => setForm({...form, siteName: e.target.value})} />
            <AdminInput label="ডিফল্ট শহর" placeholder="ঢাকা" value={form.defaultCity} onChange={e => setForm({...form, defaultCity: e.target.value})} />
          </div>
          <AdminTextarea label="সাইটের বিবরণ" placeholder="সাইট সম্পর্কে সংক্ষিপ্ত..." value={form.siteDescription} onChange={e => setForm({...form, siteDescription: e.target.value})} rows={2} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput label="যোগাযোগ ইমেইল" type="email" placeholder="info@freefoodmap.com" value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} />
            <AdminInput label="যোগাযোগ ফোন" placeholder="+8801XXXXXXXXX" value={form.contactPhone} onChange={e => setForm({...form, contactPhone: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput label="Facebook URL" placeholder="https://facebook.com/..." value={form.facebookUrl} onChange={e => setForm({...form, facebookUrl: e.target.value})} />
            <AdminInput label="Twitter URL" placeholder="https://twitter.com/..." value={form.twitterUrl} onChange={e => setForm({...form, twitterUrl: e.target.value})} />
          </div>

          {/* Map Settings */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4"><i className="bi bi-map text-gray-400"></i><h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">ম্যাপ সেটিংস</h4></div>
            <div className="grid grid-cols-3 gap-4">
              <AdminInput label="অক্ষাংশ (lat)" type="number" step="any" value={form.mapCenterLat} onChange={e => setForm({...form, mapCenterLat: e.target.value})} />
              <AdminInput label="দ্রাঘিমাংশ (lng)" type="number" step="any" value={form.mapCenterLng} onChange={e => setForm({...form, mapCenterLng: e.target.value})} />
              <AdminInput label="জুম লেভেল" type="number" min="1" max="18" value={form.mapZoom} onChange={e => setForm({...form, mapZoom: e.target.value})} />
            </div>
          </div>

          {/* Donation Settings */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4"><i className="bi bi-heart text-gray-400"></i><h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">অনুদান সেটিংস</h4></div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-3">
              <div><p className="text-sm font-semibold text-gray-800">অনুদান সক্রিয়</p><p className="text-[11px] text-gray-400">ব্যবহারকারীরা অনুদান করতে পারবে</p></div>
              <button type="button" onClick={() => setForm({...form, donationEnabled: !form.donationEnabled})}
                className={`w-12 h-7 rounded-full transition-all ${form.donationEnabled ? "bg-[#107539]" : "bg-gray-300"} relative`}>
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${form.donationEnabled ? "left-5.5" : "left-0.5"}`} />
              </button>
            </div>
            {form.donationEnabled && <AdminTextarea label="অনুদান বার্তা" placeholder="অনুদান পৃষ্ঠায় দেখানো হবে" value={form.donationMessage} onChange={e => setForm({...form, donationMessage: e.target.value})} rows={2} />}
          </div>

          {/* Maintenance Mode */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4"><i className="bi bi-tools text-gray-400"></i><h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">মেইনটেন্যান্স</h4></div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-3">
              <div><p className="text-sm font-semibold text-gray-800">মেইনটেন্যান্স মোড</p><p className="text-[11px] text-gray-400">সাইট অফলাইনে যাবে</p></div>
              <button type="button" onClick={() => setForm({...form, maintenanceMode: !form.maintenanceMode})}
                className={`w-12 h-7 rounded-full transition-all ${form.maintenanceMode ? "bg-red-500" : "bg-gray-300"} relative`}>
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${form.maintenanceMode ? "left-5.5" : "left-0.5"}`} />
              </button>
            </div>
            {form.maintenanceMode && <AdminTextarea label="মেইনটেন্যান্স বার্তা" placeholder="সাইট বন্ধের কারণ..." value={form.maintenanceMessage} onChange={e => setForm({...form, maintenanceMessage: e.target.value})} rows={2} />}
          </div>

          <button type="submit" className="w-full py-3.5 rounded-xl gradient-primary-green text-white font-bold text-sm hover:shadow-lg hover:shadow-[#107539]/20 transition-all min-h-[52px]">
            <i className="bi bi-check-circle mr-2"></i>সব সেটিংস সংরক্ষণ করুন
          </button>
        </form>
      </div>

      {/* Export / Backup */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4"><i className="bi bi-download text-gray-400"></i><h3 className="text-sm font-bold text-gray-900">এক্সপোর্ট ও ব্যাকআপ</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button onClick={onExportCSV} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all text-center group">
            <i className="bi bi-filetype-csv text-2xl text-emerald-500 mb-2 block"></i>
            <p className="text-xs font-bold text-gray-700">CSV এক্সপোর্ট</p>
            <p className="text-[10px] text-gray-400 mt-0.5">শুধু স্পট ডেটা</p>
          </button>
          <button onClick={onExportJSON} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all text-center group">
            <i className="bi bi-filetype-json text-2xl text-amber-500 mb-2 block"></i>
            <p className="text-xs font-bold text-gray-700">JSON এক্সপোর্ট</p>
            <p className="text-[10px] text-gray-400 mt-0.5">শুধু স্পট ডেটা</p>
          </button>
          <button onClick={onExportAll} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-all text-center group">
            <i className="bi bi-cloud-download text-2xl text-blue-500 mb-2 block"></i>
            <p className="text-xs font-bold text-gray-700">সম্পূর্ণ ব্যাকআপ</p>
            <p className="text-[10px] text-gray-400 mt-0.5">সব ডেটা + সেটিংস</p>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EDIT MODAL
// ============================================
function EditModal({ type, data, onClose, onSave }: { type: string; data: any; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);
  const titleMap: Record<string, string> = { spot: "স্পট সম্পাদনা", event: "ইভেন্ট সম্পাদনা", team: "সদস্য সম্পাদনা" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id, createdAt, updatedAt, ...cleanData } = form;
      await onSave(cleanData);
    } catch { toast.error("সংরক্ষণ ব্যর্থ"); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in-scale max-h-[90vh] md:max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 pb-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-black text-gray-900">{titleMap[type] || "সম্পাদনা"}</h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"><i className="bi bi-x-lg text-gray-400"></i></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 pt-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {type === "spot" && (
            <>
              <AdminInput label="নাম *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <AdminSelect label="ধরন" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  {Object.entries(SPOT_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                </AdminSelect>
                <AdminInput label="শহর" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
              </div>
              <AdminInput label="এলাকা" value={form.area} onChange={e => setForm({...form, area: e.target.value})} />
              <AdminInput label="ঠিকানা" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              <AdminTextarea label="নোটস" value={form.notes || ""} onChange={e => setForm({...form, notes: e.target.value})} rows={2} />
              <div className="grid grid-cols-2 gap-4">
                <AdminInput label="অক্ষাংশ" type="number" step="any" value={form.lat} onChange={e => setForm({...form, lat: parseFloat(e.target.value) || 0})} />
                <AdminInput label="দ্রাঘিমাংশ" type="number" step="any" value={form.lng} onChange={e => setForm({...form, lng: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <AdminInput label="খোলার সময়" type="time" value={form.openTime} onChange={e => setForm({...form, openTime: e.target.value})} />
                <AdminInput label="বন্ধের সময়" type="time" value={form.closeTime} onChange={e => setForm({...form, closeTime: e.target.value})} />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-semibold text-gray-700">নিশ্চিত</span>
                <button type="button" onClick={() => setForm({...form, verified: !form.verified})}
                  className={`w-12 h-7 rounded-full transition-all ${form.verified ? "bg-[#107539]" : "bg-gray-300"} relative`}>
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${form.verified ? "left-5.5" : "left-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-semibold text-gray-700">সক্রিয়</span>
                <button type="button" onClick={() => setForm({...form, active: !form.active})}
                  className={`w-12 h-7 rounded-full transition-all ${form.active ? "bg-blue-500" : "bg-gray-300"} relative`}>
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${form.active ? "left-5.5" : "left-0.5"}`} />
                </button>
              </div>
            </>
          )}
          {type === "event" && (
            <>
              <AdminInput label="শিরোনাম *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              <AdminTextarea label="বিবরণ" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
              <div className="grid grid-cols-2 gap-4">
                <AdminInput label="তারিখ" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                <AdminInput label="সময়" type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
              </div>
              <AdminInput label="লোকেশন" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
              <AdminInput label="আয়োজক" value={form.organizer} onChange={e => setForm({...form, organizer: e.target.value})} />
              <AdminSelect label="স্ট্যাটাস" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="upcoming">আসন্ন</option><option value="ongoing">চলমান</option><option value="completed">সম্পন্ন</option><option value="cancelled">বাতিল</option>
              </AdminSelect>
            </>
          )}
          {type === "team" && (
            <>
              <AdminInput label="নাম *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <AdminInput label="ভূমিকা" value={form.role} onChange={e => setForm({...form, role: e.target.value})} />
              <AdminTextarea label="বায়ো" value={form.bio || ""} onChange={e => setForm({...form, bio: e.target.value})} rows={2} />
              <AdminInput label="ফোন" value={form.phone || ""} onChange={e => setForm({...form, phone: e.target.value})} />
              <AdminInput label="Facebook URL" value={form.social?.facebook || ""} onChange={e => setForm({...form, social: {...(form.social || {}), facebook: e.target.value}})} />
              <AdminInput label="অ্যাভাটার URL" value={form.avatar || ""} onChange={e => setForm({...form, avatar: e.target.value})} />
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-semibold text-gray-700">সক্রিয়</span>
                <button type="button" onClick={() => setForm({...form, active: !form.active})}
                  className={`w-12 h-7 rounded-full transition-all ${form.active ? "bg-blue-500" : "bg-gray-300"} relative`}>
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${form.active ? "left-5.5" : "left-0.5"}`} />
                </button>
              </div>
            </>
          )}
        </form>
        <div className="p-5 pt-4 border-t border-gray-100 shrink-0 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all min-h-[48px]">বাতিল</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 rounded-xl gradient-primary-green text-white font-bold text-sm hover:shadow-lg transition-all min-h-[48px] disabled:opacity-50">
            {saving ? "সংরক্ষণ হচ্ছে..." : "আপডেট করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
