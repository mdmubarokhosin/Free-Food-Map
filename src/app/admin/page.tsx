"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  verifyAdminPassword, updateAdminPassword,
  fetchSpots, createSpot, updateSpot, deleteSpot,
  fetchEvents, createEvent, updateEvent, deleteEvent as deleteEventFn,
  fetchDonations, addDonation, updateDonation as updateDonationFn, deleteDonation as deleteDonationFn,
  fetchTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember as deleteTeamMemberFn,
  fetchReports, updateReport, deleteReport as deleteReportFn,
  fetchSiteSettings, updateSiteSettings,
  fetchStats, exportSpotsToCSV, bulkImportSpots,
  fetchNotifications, createNotification, deleteNotification as deleteNotificationFn,
  updateNotification as updateNotificationFn,
  fetchSetting, updateSetting, fetchSettingsGroup, updateSettingsGroup,
} from "@/lib/firebase-service";
import { uploadImageToGitHub } from "@/lib/github-upload";
import { testBohudurConnection } from "@/lib/bohudur-payment";
import type { Spot, SpotType, FoodEvent, Donation, TeamMember, Report, SiteSettings, AppStats, AppNotification } from "@/types";
import { SPOT_TYPE_CONFIG, DAY_SHORT_LABELS, DAY_ORDER } from "@/types";

type Tab = "dashboard" | "spots" | "events" | "donations" | "team" | "reports" | "notifications" | "settings";

// ============================================
// MODAL COMPONENT
// ============================================
function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col animate-fade-in-scale`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-black text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <i className="bi bi-x-lg text-xs text-gray-500"></i>
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto custom-scrollbar flex-1">{children}</div>
      </div>
    </div>
  );
}

// ============================================
// FORM COMPONENTS
// ============================================
const FInput = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div>
    {label && <label className="block text-xs font-bold text-gray-500 mb-1.5">{label}</label>}
    <input {...props} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#107539]/20 focus:border-[#107539]/40 transition-all placeholder:text-gray-400" />
  </div>
);

const FTextarea = ({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) => (
  <div>
    {label && <label className="block text-xs font-bold text-gray-500 mb-1.5">{label}</label>}
    <textarea {...props} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#107539]/20 focus:border-[#107539]/40 transition-all placeholder:text-gray-400" />
  </div>
);

const FSelect = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) => (
  <div>
    {label && <label className="block text-xs font-bold text-gray-500 mb-1.5">{label}</label>}
    <select {...props} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#107539]/20 focus:border-[#107539]/40 transition-all">{children}</select>
  </div>
);

// ============================================
// DELETE CONFIRM
// ============================================
function DeleteConfirm({ item, onCancel, onConfirm }: { item: { name: string; extra?: string }; onCancel: () => void; onConfirm: () => void }) {
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
            <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">বাতিল</button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all">মুছুন</button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [spotModal, setSpotModal] = useState<{ open: boolean; data?: Spot }>({ open: false });
  const [eventModal, setEventModal] = useState<{ open: boolean; data?: FoodEvent }>({ open: false });
  const [donationModal, setDonationModal] = useState<{ open: boolean; data?: Donation }>({ open: false });
  const [teamModal, setTeamModal] = useState<{ open: boolean; data?: TeamMember }>({ open: false });
  const [reportModal, setReportModal] = useState<{ open: boolean; data?: Report }>({ open: false });
  const [notifModal, setNotifModal] = useState<{ open: boolean; data?: AppNotification }>({ open: false });
  const [deleteItem, setDeleteItem] = useState<{ type: string; id: string; name: string; extra?: string } | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem("admin-auth");
    if (auth === "true") setAuthenticated(true);
  }, []);

  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const isValid = await verifyAdminPassword(password);
      if (isValid) {
        sessionStorage.setItem("admin-auth", "true");
        setAuthenticated(true);
        toast.success("সফলভাবে লগইন হয়েছে!");
      } else {
        setLoginError("পাসওয়ার্ড ভুল হয়েছে");
      }
    } catch {
      setLoginError("লগইনে সমস্যা হয়েছে");
    } finally {
      setLoginLoading(false);
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

  const refreshAll = () => { loadData(); };
  const refreshSpots = async () => { try { setSpots(await fetchSpots()); } catch { toast.error("স্পট রিফ্রেশ ব্যর্থ"); } };
  const refreshEvents = async () => { try { setEvents(await fetchEvents()); } catch { toast.error("ইভেন্ট রিফ্রেশ ব্যর্থ"); } };
  const refreshDonations = async () => { try { setDonations(await fetchDonations()); } catch { toast.error("অনুদান রিফ্রেশ ব্যর্থ"); } };
  const refreshTeam = async () => { try { setTeam(await fetchTeamMembers()); } catch { toast.error("টিম রিফ্রেশ ব্যর্থ"); } };
  const refreshReports = async () => { try { setReports(await fetchReports()); } catch { toast.error("রিপোর্ট রিফ্রেশ ব্যর্থ"); } };
  const refreshNotifs = async () => { try { setNotifications(await fetchNotifications()); } catch { toast.error("নোটিফিকেশন রিফ্রেশ ব্যর্থ"); } };

  // ===================== LOGIN SCREEN =====================
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
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
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="পাসওয়ার্ড দিন"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white text-center text-lg tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-[#107539]/50 focus:border-[#107539]/50 placeholder:text-white/20 transition-all" autoFocus />
              </div>
              {loginError && (
                <div className="flex items-center gap-2 text-red-400 text-sm justify-center animate-fade-in">
                  <i className="bi bi-exclamation-circle text-xs"></i>{loginError}
                </div>
              )}
              <button type="submit" disabled={loginLoading} className="w-full py-3.5 rounded-2xl gradient-primary-green text-white font-bold text-sm tracking-wide hover:shadow-lg hover:shadow-[#107539]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                {loginLoading ? <><div className="spinner spinner-sm inline-block mr-2 border-2 border-white/30 border-t-white"></div>যাচাই হচ্ছে...</> : <><i className="bi bi-box-arrow-in-right mr-2"></i>প্রবেশ করুন</>}
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
  const pendingReports = reports.filter(r => r.status === "pending").length;
  const activeNotifs = notifications.filter(n => n.active).length;
  const pendingDonations = donations.filter(d => d.status === "pending").length;

  const tabs: { id: Tab; label: string; desc: string; icon: React.ReactNode; gradient: string; badge?: number }[] = [
    { id: "dashboard", label: "ড্যাশবোর্ড", desc: "সামগ্রিক তথ্য", icon: <i className="bi bi-speedometer2"></i>, gradient: "from-[#107539] to-[#1C9C4B]" },
    { id: "spots", label: "স্পট", desc: `${spots.length}টি স্পট`, icon: <i className="bi bi-geo-alt-fill"></i>, gradient: "from-emerald-600 to-teal-500" },
    { id: "events", label: "ইভেন্ট", desc: `${events.length}টি ইভেন্ট`, icon: <i className="bi bi-calendar-event-fill"></i>, gradient: "from-violet-600 to-purple-500" },
    { id: "donations", label: "অনুদান", desc: `${donations.length}টি দান`, icon: <i className="bi bi-heart-fill"></i>, gradient: "from-rose-500 to-pink-600", badge: pendingDonations || undefined },
    { id: "team", label: "টিম", desc: `${team.length}জন সদস্য`, icon: <i className="bi bi-people-fill"></i>, gradient: "from-amber-500 to-orange-500" },
    { id: "reports", label: "রিপোর্ট", desc: "সমস্যা রিপোর্ট", icon: <i className="bi bi-flag-fill"></i>, gradient: "from-red-500 to-orange-500", badge: pendingReports || undefined },
    { id: "notifications", label: "নোটিফিকেশন", desc: "ঘোষণা ব্যবস্থাপনা", icon: <i className="bi bi-bell-fill"></i>, gradient: "from-cyan-500 to-blue-600", badge: activeNotifs || undefined },
    { id: "settings", label: "সেটিংস", desc: "সাইট কনফিগারেশন", icon: <i className="bi bi-gear-wide-connected"></i>, gradient: "from-slate-600 to-gray-700" },
  ];

  const handleTabChange = (tabId: Tab) => { setActiveTab(tabId); setMobileDrawerOpen(false); };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      if (deleteItem.type === "spot") await deleteSpot(deleteItem.id);
      else if (deleteItem.type === "event") await deleteEventFn(deleteItem.id);
      else if (deleteItem.type === "donation") await deleteDonationFn(deleteItem.id);
      else if (deleteItem.type === "team") await deleteTeamMemberFn(deleteItem.id);
      else if (deleteItem.type === "report") await deleteReportFn(deleteItem.id);
      else if (deleteItem.type === "notification") await deleteNotificationFn(deleteItem.id);
      toast.success("সফলভাবে মুছে ফেলা হয়েছে");
      refreshAll();
    } catch { toast.error("মুছে ফেলতে সমস্যা"); }
    setDeleteItem(null);
  };

  // ===================== MAIN LAYOUT =====================
  return (
    <div className="min-h-screen bg-[#F5F3EF] flex">
      {/* DESKTOP SIDEBAR */}
      <aside className={`bg-white border-r border-gray-200/80 flex-col ${sidebarOpen ? "w-[260px]" : "w-[72px]"} transition-all duration-300 shrink-0 hidden md:flex overflow-hidden sticky top-0 h-screen z-40`}>
        <div className={`p-4 border-b border-gray-100 flex items-center gap-3 ${sidebarOpen ? "" : "justify-center px-3"}`}>
          <div className="w-10 h-10 rounded-2xl gradient-orange-fab flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-orange-300/30 hover:rotate-3 transition-transform">
            <i className="bi bi-cup-hot-fill text-lg"></i>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <span className="font-black text-sm text-gray-900 block truncate">ফ্রি ফুড ম্যাপ</span>
              <span className="text-[10px] text-gray-400 font-medium">ADMIN PANEL v2.0</span>
            </div>
          )}
        </div>
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-auto custom-scrollbar">
          {sidebarOpen && <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] px-3 py-2">মেনু</p>}
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative ${
                activeTab === tab.id ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg` : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`} title={!sidebarOpen ? tab.label : undefined}>
              <span className={`text-[15px] shrink-0 w-7 text-center ${activeTab !== tab.id ? "group-hover:scale-110 transition-transform" : ""}`}>{tab.icon}</span>
              {sidebarOpen && (
                <div className="flex-1 text-left min-w-0">
                  <span className="block truncate font-semibold">{tab.label}</span>
                  <span className={`block truncate text-[10px] ${activeTab === tab.id ? "text-white/60" : "text-gray-400"}`}>{tab.desc}</span>
                </div>
              )}
              {sidebarOpen && tab.badge ? (
                <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${activeTab === tab.id ? "bg-white/25 text-white" : "bg-red-100 text-red-600"}`}>{tab.badge}</span>
              ) : !sidebarOpen && tab.badge ? (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              ) : null}
            </button>
          ))}
        </nav>
        <div className="p-2.5 border-t border-gray-100 space-y-0.5">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all group">
            <span className="text-sm shrink-0 w-7 text-center group-hover:scale-110 transition-transform"><i className={`bi ${sidebarOpen ? "bi-chevron-double-left" : "bi-chevron-double-right"}`}></i></span>
            {sidebarOpen && <span>সংকুচিত</span>}
          </button>
          <a href="/" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all group">
            <span className="text-sm shrink-0 w-7 text-center group-hover:scale-110 transition-transform"><i className="bi bi-house-fill"></i></span>
            {sidebarOpen && <span>ওয়েবসাইটে যান</span>}
          </a>
          <button onClick={() => { sessionStorage.removeItem("admin-auth"); setAuthenticated(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-all group">
            <span className="text-sm shrink-0 w-7 text-center group-hover:scale-110 transition-transform"><i className="bi bi-box-arrow-right"></i></span>
            {sidebarOpen && <span>লগআউট</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <button onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)} className="w-10 h-10 rounded-xl gradient-primary-green flex items-center justify-center active:scale-95 transition-transform shadow-md shadow-[#107539]/20" aria-label="মেনু">
                <i className={`bi ${mobileDrawerOpen ? "bi-x-lg" : "bi-list"} text-base text-white`}></i>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl gradient-orange-fab flex items-center justify-center shadow-sm"><i className="bi bi-cup-hot-fill text-white text-xs"></i></div>
                <div>
                  <span className="font-black text-[13px] text-gray-900 block leading-tight">Admin Panel</span>
                  <span className="text-[10px] text-gray-400 block leading-tight">{tabs.find(t => t.id === activeTab)?.label}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refreshAll} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform" aria-label="রিফ্রেশ"><i className="bi bi-arrow-clockwise text-sm text-gray-500"></i></button>
              <button onClick={() => { sessionStorage.removeItem("admin-auth"); setAuthenticated(false); }} className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center active:scale-95 transition-transform" aria-label="লগআউট"><i className="bi bi-box-arrow-right text-sm text-red-500"></i></button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
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
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg border border-white/20"><i className="bi bi-cup-hot-fill text-xl"></i></div>
                  <div><span className="font-black text-sm text-white block">ফ্রি ফুড ম্যাপ</span><p className="text-[10px] text-white/50 font-medium">ADMIN PANEL v2.0</p></div>
                </div>
                <button onClick={() => setMobileDrawerOpen(false)} className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center active:scale-95 transition-transform"><i className="bi bi-x-lg text-sm text-white"></i></button>
              </div>
              <div className="relative mt-4 grid grid-cols-3 gap-2">
                {[{ label: "স্পট", val: spots.length }, { label: "ভিউ", val: stats?.totalViews || 0 }, { label: "দাতা", val: donations.length }].map(s => (
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${activeTab === tab.id ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg` : "text-gray-600 hover:bg-gray-50"}`}>
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
              <button onClick={() => { setMobileDrawerOpen(false); sessionStorage.removeItem("admin-auth"); setAuthenticated(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all active:scale-[0.98]">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><i className="bi bi-box-arrow-right text-sm"></i></div>
                <span className="text-[13px]">লগআউট</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-screen">
        <div className="hidden md:flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-200/80 sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-black text-gray-900">{tabs.find(t => t.id === activeTab)?.label}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{lastRefresh ? `সর্বশেষ আপডেট: ${lastRefresh.toLocaleTimeString("bn-BD")}` : "লোড হচ্ছে..."}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refreshAll} className="h-9 px-3 rounded-xl bg-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-all flex items-center gap-1.5">
              <i className="bi bi-arrow-clockwise text-[11px]"></i> রিফ্রেশ
            </button>
            {pendingReports > 0 && (
              <button onClick={() => setActiveTab("reports")} className="h-9 px-3 rounded-xl bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100 transition-all flex items-center gap-1.5 animate-fade-in">
                <i className="bi bi-flag-fill text-[11px]"></i> {pendingReports} পেন্ডিং
              </button>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 pt-20 md:pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3"><div className="spinner"></div><p className="text-sm text-gray-400">ডেটা লোড হচ্ছে...</p></div>
          ) : (
            <>
              {activeTab === "dashboard" && <DashboardTab stats={stats} spots={spots} events={events} donations={donations} reports={reports} onRefresh={refreshAll} onSeedData={async () => {
                try {
                  const sampleSpots: Omit<Spot, 'id'>[] = [
                    { name: "কেন্দ্রীয় জামে মসজিদ ফ্রি ফুড ক্যাম্প", type: "daily_meal" as SpotType, address: "বায়তুল মোকাররম, ঢাকা", area: "পুরান ঢাকা", city: "ঢাকা", country: "বাংলাদেশ", lat: 23.7104, lng: 90.4074, openDays: DAY_ORDER, openTime: "12:00", closeTime: "14:00", notes: "প্রতিদিন দুপুরে ৫০০+ মানুষকে ফ্রি খাবার দেওয়া হয়", verified: true, active: true, createdAt: Date.now(), lastUpdated: Date.now(), startDate: null, endDate: null, autoDelete: false, viewCount: 120, directionCount: 45, positiveVotes: 12, negativeVotes: 1 },
                    { name: "গুলশান কমিউনিটি কিচেন", type: "weekly_meal" as SpotType, address: "গুলশান আব্দুল হাই রোড, ঢাকা", area: "গুলশান", city: "ঢাকা", country: "বাংলাদেশ", lat: 23.7937, lng: 90.4143, openDays: ["friday","saturday"], openTime: "13:00", closeTime: "15:00", notes: "শুক্র ও শনিবার বিকেলে ফ্রি খাবার বিতরণ", verified: true, active: true, createdAt: Date.now() - 86400000, lastUpdated: Date.now() - 86400000, startDate: null, endDate: null, autoDelete: false, viewCount: 89, directionCount: 32, positiveVotes: 8, negativeVotes: 0 },
                    { name: "মিরপুর স্যুপ কিচেন", type: "soup_kitchen" as SpotType, address: "মিরপুর ১০, ঢাকা", area: "মিরপুর", city: "ঢাকা", country: "বাংলাদেশ", lat: 23.8023, lng: 90.3658, openDays: DAY_ORDER, openTime: "18:00", closeTime: "21:00", notes: "প্রতিদিন রাতে স্যুপ ও রুটি বিতরণ", verified: true, active: true, createdAt: Date.now() - 172800000, lastUpdated: Date.now() - 172800000, startDate: null, endDate: null, autoDelete: false, viewCount: 67, directionCount: 28, positiveVotes: 6, negativeVotes: 2 },
                    { name: "উত্তরা গ্রোসারি ব্যাংক", type: "grocery" as SpotType, address: "উত্তরা সেক্টর ৭, ঢাকা", area: "উত্তরা", city: "ঢাকা", country: "বাংলাদেশ", lat: 23.8679, lng: 90.3928, openDays: ["saturday","wednesday"], openTime: "09:00", closeTime: "13:00", notes: "ফ্রি গ্রোসারি সামগ্রী বিতরণ", verified: false, active: true, createdAt: Date.now() - 259200000, lastUpdated: Date.now() - 259200000, startDate: null, endDate: null, autoDelete: false, viewCount: 43, directionCount: 15, positiveVotes: 4, negativeVotes: 1 },
                    { name: "চট্টগ্রাম সেন্ট্রাল ফুড ব্যাংক", type: "daily_meal" as SpotType, address: "এম এ আজিজ স্টেডিয়াম সংলগ্ন, চট্টগ্রাম", area: "আগ্রাবাদ", city: "চট্টগ্রাম", country: "বাংলাদেশ", lat: 22.3569, lng: 91.8317, openDays: DAY_ORDER, openTime: "12:00", closeTime: "13:30", notes: "প্রতিদিন দুপুরে ফ্রি খাবার বিতরণ", verified: true, active: true, createdAt: Date.now() - 432000000, lastUpdated: Date.now() - 432000000, startDate: null, endDate: null, autoDelete: false, viewCount: 56, directionCount: 20, positiveVotes: 7, negativeVotes: 0 },
                  ];
                  const count = await bulkImportSpots(sampleSpots); refreshAll(); toast.success(`${count}টি স্যাম্পল স্পট যোগ হয়েছে!`);
                } catch { toast.error("স্যাম্পল ডেটা যোগ ব্যর্থ"); }
              }} />}

              {activeTab === "spots" && <SpotsTab spots={spots}
                onAdd={() => setSpotModal({ open: true })}
                onEdit={(s) => setSpotModal({ open: true, data: s })}
                onDelete={(s) => setDeleteItem({ type: "spot", id: s.id, name: s.name })}
                onVerify={async (id, v) => { try { await updateSpot(id, { verified: v }); refreshSpots(); toast.success(v ? "নিশ্চিত করা হয়েছে" : "নিশ্চিততা সরানো হয়েছে"); } catch { toast.error("ব্যর্থ"); } }}
                onToggleActive={async (id, a) => { try { await updateSpot(id, { active: a }); refreshSpots(); toast.success(a ? "সক্রিয়" : "নিষ্ক্রিয়"); } catch { toast.error("ব্যর্থ"); } }}
              />}

              {activeTab === "events" && <EventsTab events={events}
                onAdd={() => setEventModal({ open: true })}
                onEdit={(e) => setEventModal({ open: true, data: e })}
                onDelete={(e) => setDeleteItem({ type: "event", id: e.id, name: e.title })}
              />}

              {activeTab === "donations" && <DonationsTab donations={donations}
                onAdd={() => setDonationModal({ open: true })}
                onEdit={(d) => setDonationModal({ open: true, data: d })}
                onDelete={(d) => setDeleteItem({ type: "donation", id: d.id, name: `${d.donorName} - ৳${d.amount}` })}
                onUpdateStatus={async (id, s) => { try { await updateDonationFn(id, { status: s }); refreshDonations(); toast.success("অনুদান আপডেট হয়েছে"); } catch { toast.error("আপডেট ব্যর্থ"); } }}
              />}

              {activeTab === "team" && <TeamTab team={team}
                onAdd={() => setTeamModal({ open: true })}
                onEdit={(t) => setTeamModal({ open: true, data: t })}
                onDelete={(t) => setDeleteItem({ type: "team", id: t.id, name: t.name })}
                onToggleActive={async (id, a) => { try { await updateTeamMember(id, { active: a }); refreshTeam(); toast.success(a ? "সক্রিয়" : "নিষ্ক্রিয়"); } catch { toast.error("ব্যর্থ"); } }}
              />}

              {activeTab === "reports" && <ReportsTab reports={reports}
                onEdit={(r) => setReportModal({ open: true, data: r })}
                onDelete={(r) => setDeleteItem({ type: "report", id: r.id, name: r.spotName })}
              />}

              {activeTab === "notifications" && <NotificationsTab notifications={notifications}
                onAdd={() => setNotifModal({ open: true })}
                onEdit={(n) => setNotifModal({ open: true, data: n })}
                onDelete={(id, name) => setDeleteItem({ type: "notification", id, name })}
                onToggle={async (id, active) => { try { await updateNotificationFn(id, { active }); refreshNotifs(); toast.success(active ? "সক্রিয় করা হয়েছে" : "নিষ্ক্রিয় করা হয়েছে"); } catch { toast.error("ব্যর্থ"); } }}
              />}

              {activeTab === "settings" && <SettingsTab settings={settings}
                onSave={async (d) => { try { await updateSiteSettings(d); setSettings({ ...settings!, ...d }); toast.success("সেটিংস সংরক্ষিত হয়েছে"); } catch { toast.error("সংরক্ষণ ব্যর্থ"); } }}
              />}
            </>
          )}
        </div>
      </main>

      {/* MODALS */}
      <SpotFormModal modal={spotModal} onClose={() => setSpotModal({ open: false })} onSave={async (data) => {
        try {
          if (spotModal.data) { await updateSpot(spotModal.data.id, data); toast.success("স্পট আপডেট হয়েছে"); }
          else { await createSpot(data); toast.success("নতুন স্পট যোগ হয়েছে"); }
          refreshSpots(); setSpotModal({ open: false });
        } catch { toast.error("সংরক্ষণ ব্যর্থ"); }
      }} />

      <EventFormModal modal={eventModal} onClose={() => setEventModal({ open: false })} onSave={async (data) => {
        try {
          if (eventModal.data) { await updateEvent(eventModal.data.id, data); toast.success("ইভেন্ট আপডেট হয়েছে"); }
          else { await createEvent(data as any); toast.success("ইভেন্ট তৈরি হয়েছে"); }
          refreshEvents(); setEventModal({ open: false });
        } catch { toast.error("সংরক্ষণ ব্যর্থ"); }
      }} />

      <DonationFormModal modal={donationModal} onClose={() => setDonationModal({ open: false })} onSave={async (data) => {
        try {
          if (donationModal.data) { await updateDonationFn(donationModal.data.id, data); toast.success("অনুদান আপডেট হয়েছে"); }
          else { await addDonation(data); toast.success("অনুদান যোগ হয়েছে"); }
          refreshDonations(); setDonationModal({ open: false });
        } catch { toast.error("সংরক্ষণ ব্যর্থ"); }
      }} />

      <TeamFormModal modal={teamModal} onClose={() => setTeamModal({ open: false })} onSave={async (data) => {
        try {
          if (teamModal.data) { await updateTeamMember(teamModal.data.id, data); toast.success("সদস্য আপডেট হয়েছে"); }
          else { await addTeamMember(data); toast.success("সদস্য যোগ হয়েছে"); }
          refreshTeam(); setTeamModal({ open: false });
        } catch { toast.error("সংরক্ষণ ব্যর্থ"); }
      }} />

      <ReportFormModal modal={reportModal} onClose={() => setReportModal({ open: false })} onSave={async (data) => {
        try {
          if (reportModal.data) { await updateReport(reportModal.data.id, data); toast.success("রিপোর্ট আপডেট হয়েছে"); }
          refreshReports(); setReportModal({ open: false });
        } catch { toast.error("আপডেট ব্যর্থ"); }
      }} />

      <NotifFormModal modal={notifModal} onClose={() => setNotifModal({ open: false })} onSave={async (data) => {
        try {
          if (notifModal.data) { await updateNotificationFn(notifModal.data.id, data); toast.success("নোটিফিকেশন আপডেট হয়েছে"); }
          else { await createNotification(data); toast.success("নোটিফিকেশন তৈরি হয়েছে"); }
          refreshNotifs(); setNotifModal({ open: false });
        } catch { toast.error("সংরক্ষণ ব্যর্থ"); }
      }} />

      {deleteItem && <DeleteConfirm item={deleteItem} onCancel={() => setDeleteItem(null)} onConfirm={handleDelete} />}
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
  const pendingReportsCount = reports.filter(r => r.status === "pending").length;

  const typeMap = new Map<string, number>();
  spots.forEach(s => typeMap.set(s.type, (typeMap.get(s.type) || 0) + 1));
  const typeData = Array.from(typeMap.entries()).sort((a, b) => b[1] - a[1]);
  const maxTypeCount = typeData[0]?.[1] || 1;

  const cityMap = new Map<string, number>();
  spots.forEach(s => cityMap.set(s.city, (cityMap.get(s.city) || 0) + 1));
  const cityData = Array.from(cityMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCityCount = cityData[0]?.[1] || 1;

  // Recent activity
  const recentActivity: { type: string; label: string; time: number; icon: string; color: string }[] = [];
  spots.slice(0, 3).forEach(s => recentActivity.push({ type: "spot", label: `নতুন স্পট: ${s.name}`, time: s.createdAt, icon: "bi-geo-alt-fill", color: "text-emerald-600" }));
  events.slice(0, 2).forEach(e => recentActivity.push({ type: "event", label: `ইভেন্ট: ${e.title}`, time: e.createdAt, icon: "bi-calendar-event-fill", color: "text-violet-600" }));
  donations.slice(0, 2).forEach(d => recentActivity.push({ type: "donation", label: `অনুদান: ৳${d.amount}`, time: d.createdAt, icon: "bi-heart-fill", color: "text-rose-500" }));
  reports.slice(0, 2).forEach(r => recentActivity.push({ type: "report", label: `রিপোর্ট: ${r.type}`, time: r.createdAt, icon: "bi-flag-fill", color: "text-red-500" }));
  recentActivity.sort((a, b) => b.time - a.time);

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "এইমাত্র";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} মিনিট আগে`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ঘন্টা আগে`;
    return `${Math.floor(diff / 86400000)} দিন আগে`;
  };

  return (
    <div className="space-y-6">
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: "bi-geo-alt-fill", value: stats?.totalSpots || 0, label: "মোট স্পট", gradient: "from-blue-500 to-blue-600" },
          { icon: "bi-patch-check-fill", value: stats?.verifiedSpots || 0, label: "নিশ্চিত স্পট", gradient: "from-emerald-500 to-green-600" },
          { icon: "bi-eye-fill", value: stats?.totalViews || 0, label: "মোট ভিউ", gradient: "from-violet-500 to-purple-600" },
          { icon: "bi-currency-exchange", value: `৳${totalDonations.toLocaleString("bn-BD")}`, label: "মোট অনুদান", gradient: "from-rose-500 to-pink-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shadow-sm mb-3`}>
              <i className={`bi ${s.icon} text-base`}></i>
            </div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "সক্রিয় স্পট", value: stats?.activeSpots || 0, icon: "bi-check-circle-fill", color: "text-green-600" },
          { label: "মোট রিভিউ", value: stats?.totalReviews || 0, icon: "bi-chat-dots-fill", color: "text-blue-600" },
          { label: "ইভেন্ট", value: events.length, icon: "bi-calendar-check-fill", color: "text-violet-600" },
          { label: "পেন্ডিং রিপোর্ট", value: pendingReportsCount, icon: "bi-exclamation-triangle-fill", color: pendingReportsCount > 0 ? "text-red-500" : "text-green-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-3.5 border border-gray-100 flex items-center gap-3">
            <i className={`bi ${s.icon} ${s.color} text-lg`}></i>
            <div><p className="text-lg font-black text-gray-900">{s.value}</p><p className="text-[10px] text-gray-400 font-medium">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-black text-gray-900 mb-4"><i className="bi bi-pie-chart-fill text-emerald-600 mr-1.5"></i>স্পট টাইপ বিতরণ</h3>
          {typeData.length === 0 ? <p className="text-xs text-gray-400 text-center py-6">কোনো ডেটা নেই</p> : (
            <div className="space-y-3">
              {typeData.map(([type, count]) => {
                const cfg = SPOT_TYPE_CONFIG[type as SpotType];
                return (
                  <div key={type}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-700">{cfg?.emoji} {cfg?.label || type}</span>
                      <span className="text-xs font-bold text-gray-500">{count}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700`} style={{ width: `${(count / maxTypeCount) * 100}%`, background: cfg?.color || '#107539' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* City Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-black text-gray-900 mb-4"><i className="bi bi-buildings text-blue-600 mr-1.5"></i>শহর অনুযায়ী স্পট</h3>
          {cityData.length === 0 ? <p className="text-xs text-gray-400 text-center py-6">কোনো ডেটা নেই</p> : (
            <div className="space-y-3">
              {cityData.map(([city, count]) => (
                <div key={city}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-700">{city}</span>
                    <span className="text-xs font-bold text-gray-500">{count}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700" style={{ width: `${(count / maxCityCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="text-sm font-black text-gray-900 mb-4"><i className="bi bi-clock-history text-amber-500 mr-1.5"></i>সাম্প্রতিক কার্যক্রম</h3>
        {recentActivity.length === 0 ? <p className="text-xs text-gray-400 text-center py-6">কোনো কার্যক্রম নেই</p> : (
          <div className="space-y-2">
            {recentActivity.slice(0, 8).map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 ${item.color}`}><i className={`bi ${item.icon} text-sm`}></i></div>
                <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-700 truncate">{item.label}</p></div>
                <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(item.time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// SPOTS TAB
// ============================================
function SpotsTab({ spots, onAdd, onEdit, onDelete, onVerify, onToggleActive }: {
  spots: Spot[]; onAdd: () => void; onEdit: (s: Spot) => void; onDelete: (s: Spot) => void;
  onVerify: (id: string, v: boolean) => void; onToggleActive: (id: string, a: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "verified" | "unverified" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "views" | "votes">("newest");

  const filtered = spots
    .filter(s => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.city.toLowerCase().includes(search.toLowerCase()) && !s.area.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== "all" && s.type !== filterType) return false;
      if (filterStatus === "verified" && !s.verified) return false;
      if (filterStatus === "unverified" && s.verified) return false;
      if (filterStatus === "active" && !s.active) return false;
      if (filterStatus === "inactive" && s.active) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return b.createdAt - a.createdAt;
      if (sortBy === "oldest") return a.createdAt - b.createdAt;
      if (sortBy === "name") return a.name.localeCompare(b.name, "bn");
      if (sortBy === "views") return (b.viewCount || 0) - (a.viewCount || 0);
      if (sortBy === "votes") return b.positiveVotes - a.positiveVotes;
      return 0;
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-gray-900">স্পট ব্যবস্থাপনা</h2>
          <p className="text-xs text-gray-400 mt-0.5">মোট {spots.length}টি স্পট</p>
        </div>
        <button onClick={onAdd} className="h-10 px-4 rounded-xl gradient-primary-green text-white text-xs font-bold hover:shadow-lg hover:shadow-[#107539]/20 transition-all flex items-center gap-1.5">
          <i className="bi bi-plus-lg"></i> নতুন স্পট
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="স্পট খুঁজুন..."
            className="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#107539]/20 focus:border-[#107539]/40 placeholder:text-gray-400" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none">
            <option value="all">সব টাইপ</option>
            {Object.entries(SPOT_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none">
            <option value="all">সব স্ট্যাটাস</option>
            <option value="verified">নিশ্চিত</option>
            <option value="unverified">অনিশ্চিত</option>
            <option value="active">সক্রিয়</option>
            <option value="inactive">নিষ্ক্রিয়</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none">
            <option value="newest">নতুন আগে</option>
            <option value="oldest">পুরনো আগে</option>
            <option value="name">নাম</option>
            <option value="views">ভিউ</option>
            <option value="votes">ভোট</option>
          </select>
        </div>
        <p className="text-[10px] text-gray-400">{filtered.length}টি প্রদর্শিত হচ্ছে</p>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16"><i className="bi bi-geo-alt text-5xl text-gray-200 mb-3 block"></i><p className="text-sm text-gray-400">কোনো স্পট পাওয়া যায়নি</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(spot => {
            const cfg = SPOT_TYPE_CONFIG[spot.type];
            return (
              <div key={spot.id} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{cfg?.emoji}</span>
                      <h3 className="text-sm font-bold text-gray-900 truncate">{spot.name}</h3>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate"><i className="bi bi-pin-map mr-1"></i>{spot.area}, {spot.city}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {spot.verified ? <span className="status-open text-[9px]"><i className="bi bi-patch-check-fill mr-0.5"></i>নিশ্চিত</span> : <span className="status-closing text-[9px]"><i className="bi bi-patch-exclamation mr-0.5"></i>অপেক্ষমান</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3 text-[11px] text-gray-500">
                  <span><i className="bi bi-eye mr-0.5"></i>{spot.viewCount || 0}</span>
                  <span><i className="bi bi-hand-thumbs-up mr-0.5"></i>{spot.positiveVotes}</span>
                  <span><i className="bi bi-hand-thumbs-down mr-0.5"></i>{spot.negativeVotes}</span>
                  <span><i className="bi bi-chat mr-0.5"></i>{spot.totalRatings || 0}</span>
                  {spot.rating && <span><i className="bi bi-star-fill text-amber-400 mr-0.5"></i>{spot.rating}</span>}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button onClick={() => onEdit(spot)} className="h-7 px-2.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-all"><i className="bi bi-pencil mr-0.5"></i>সম্পাদনা</button>
                  <button onClick={() => onVerify(spot.id, !spot.verified)} className={`h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all ${spot.verified ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                    <i className={`bi ${spot.verified ? "bi-patch-exclamation" : "bi-patch-check-fill"} mr-0.5`}></i>{spot.verified ? "অনিশ্চিত" : "নিশ্চিত"}
                  </button>
                  <button onClick={() => onToggleActive(spot.id, !spot.active)} className={`h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all ${spot.active ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                    <i className={`bi ${spot.active ? "bi-pause-circle" : "bi-play-circle"} mr-0.5`}></i>{spot.active ? "নিষ্ক্রিয়" : "সক্রিয়"}
                  </button>
                  <button onClick={() => onDelete(spot)} className="h-7 px-2.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold hover:bg-red-100 transition-all ml-auto"><i className="bi bi-trash3"></i></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// EVENTS TAB
// ============================================
function EventsTab({ events, onAdd, onEdit, onDelete }: {
  events: FoodEvent[]; onAdd: () => void; onEdit: (e: FoodEvent) => void; onDelete: (e: FoodEvent) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const statusColors: Record<string, string> = { upcoming: "bg-blue-100 text-blue-700", ongoing: "bg-green-100 text-green-700", completed: "bg-gray-100 text-gray-600", cancelled: "bg-red-100 text-red-600" };
  const statusLabels: Record<string, string> = { upcoming: "আসন্ন", ongoing: "চলমান", completed: "সম্পন্ন", cancelled: "বাতিল" };

  const filtered = events
    .filter(e => {
      if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.organizer.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== "all" && e.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-gray-900">ইভেন্ট ব্যবস্থাপনা</h2>
          <p className="text-xs text-gray-400 mt-0.5">মোট {events.length}টি ইভেন্ট</p>
        </div>
        <button onClick={onAdd} className="h-10 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-xs font-bold hover:shadow-lg transition-all flex items-center gap-1.5">
          <i className="bi bi-plus-lg"></i> নতুন ইভেন্ট
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ইভেন্ট খুঁজুন..."
          className="flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40 placeholder:text-gray-400" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none">
          <option value="all">সব স্ট্যাটাস</option>
          <option value="upcoming">আসন্ন</option>
          <option value="ongoing">চলমান</option>
          <option value="completed">সম্পন্ন</option>
          <option value="cancelled">বাতিল</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16"><i className="bi bi-calendar-x text-5xl text-gray-200 mb-3 block"></i><p className="text-sm text-gray-400">কোনো ইভেন্ট পাওয়া যায়নি</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(event => (
            <div key={event.id} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{event.title}</h3>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColors[event.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[event.status] || event.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                    <span><i className="bi bi-calendar3 mr-1"></i>{event.date}</span>
                    <span><i className="bi bi-clock mr-1"></i>{event.time}</span>
                    <span><i className="bi bi-person mr-1"></i>{event.organizer}</span>
                    <span><i className="bi bi-geo-alt mr-1"></i>{event.location}</span>
                    <span><i className="bi bi-egg-fried mr-1"></i>{event.foodType}</span>
                    {event.estimatedPeople && <span><i className="bi bi-people mr-1"></i>{event.estimatedPeople} জন</span>}
                  </div>
                  {event.description && <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{event.description}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => onEdit(event)} className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all"><i className="bi bi-pencil text-xs"></i></button>
                  <button onClick={() => onDelete(event)} className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-all"><i className="bi bi-trash3 text-xs"></i></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// DONATIONS TAB
// ============================================
function DonationsTab({ donations, onAdd, onEdit, onDelete, onUpdateStatus }: {
  donations: Donation[]; onAdd: () => void; onEdit: (d: Donation) => void; onDelete: (d: Donation) => void;
  onUpdateStatus: (id: string, status: Donation["status"]) => void;
}) {
  const totalAmount = donations.reduce((s, d) => s + d.amount, 0);
  const confirmed = donations.filter(d => d.status === "confirmed");
  const pending = donations.filter(d => d.status === "pending");
  const totalConfirmed = confirmed.reduce((s, d) => s + d.amount, 0);

  const statusColors: Record<string, string> = { pending: "bg-amber-100 text-amber-700", confirmed: "bg-green-100 text-green-700", processing: "bg-blue-100 text-blue-700" };
  const statusLabels: Record<string, string> = { pending: "পেন্ডিং", confirmed: "নিশ্চিত", processing: "প্রক্রিয়াধীন" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-gray-900">অনুদান ব্যবস্থাপনা</h2>
          <p className="text-xs text-gray-400 mt-0.5">মোট {donations.length}টি অনুদান</p>
        </div>
        <button onClick={onAdd} className="h-10 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold hover:shadow-lg transition-all flex items-center gap-1.5">
          <i className="bi bi-plus-lg"></i> নতুন অনুদান
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <p className="text-xs text-gray-400 font-medium mb-1">মোট অনুদান</p>
          <p className="text-xl font-black text-gray-900">৳{totalAmount.toLocaleString("bn-BD")}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <p className="text-xs text-gray-400 font-medium mb-1">নিশ্চিত</p>
          <p className="text-xl font-black text-green-600">৳{totalConfirmed.toLocaleString("bn-BD")}</p>
          <p className="text-[10px] text-gray-400">{confirmed.length}টি</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <p className="text-xs text-gray-400 font-medium mb-1">পেন্ডিং</p>
          <p className="text-xl font-black text-amber-600">{pending.length}</p>
        </div>
      </div>

      {donations.length === 0 ? (
        <div className="text-center py-16"><i className="bi bi-heart text-5xl text-gray-200 mb-3 block"></i><p className="text-sm text-gray-400">কোনো অনুদান নেই</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>দাতা</th>
                  <th>পরিমাণ</th>
                  <th>পদ্ধতি</th>
                  <th>স্ট্যাটাস</th>
                  <th>তারিখ</th>
                  <th>পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div>
                        <p className="font-semibold text-gray-800">{d.donorName}</p>
                        {d.message && <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{d.message}</p>}
                      </div>
                    </td>
                    <td className="font-bold text-gray-900">৳{d.amount.toLocaleString("bn-BD")}</td>
                    <td className="text-gray-500">{d.method}</td>
                    <td>
                      <select value={d.status} onChange={e => onUpdateStatus(d.id, e.target.value as Donation["status"])}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border-0 cursor-pointer ${statusColors[d.status]}`}>
                        <option value="pending">পেন্ডিং</option>
                        <option value="confirmed">নিশ্চিত</option>
                        <option value="processing">প্রক্রিয়াধীন</option>
                      </select>
                    </td>
                    <td className="text-gray-400 text-[11px]">{new Date(d.createdAt).toLocaleDateString("bn-BD")}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(d)} className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all"><i className="bi bi-pencil text-[10px]"></i></button>
                        <button onClick={() => onDelete(d)} className="h-7 w-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-all"><i className="bi bi-trash3 text-[10px]"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// TEAM TAB
// ============================================
function TeamTab({ team, onAdd, onEdit, onDelete, onToggleActive }: {
  team: TeamMember[]; onAdd: () => void; onEdit: (t: TeamMember) => void; onDelete: (t: TeamMember) => void;
  onToggleActive: (id: string, a: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-gray-900">টিম ব্যবস্থাপনা</h2>
          <p className="text-xs text-gray-400 mt-0.5">মোট {team.length}জন সদস্য</p>
        </div>
        <button onClick={onAdd} className="h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold hover:shadow-lg transition-all flex items-center gap-1.5">
          <i className="bi bi-plus-lg"></i> নতুন সদস্য
        </button>
      </div>

      {team.length === 0 ? (
        <div className="text-center py-16"><i className="bi bi-people text-5xl text-gray-200 mb-3 block"></i><p className="text-sm text-gray-400">কোনো সদস্য নেই</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {team.sort((a, b) => a.order - b.order).map(member => (
            <div key={member.id} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start gap-3 mb-3">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-lg shrink-0">
                    {member.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{member.name}</h3>
                    {member.active ? <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" /> : <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">{member.role}</p>
                </div>
              </div>
              {member.bio && <p className="text-[11px] text-gray-400 mb-3 line-clamp-2">{member.bio}</p>}
              <div className="flex items-center gap-1.5">
                <button onClick={() => onEdit(member)} className="h-7 px-2.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-all"><i className="bi bi-pencil mr-0.5"></i>সম্পাদনা</button>
                <button onClick={() => onToggleActive(member.id, !member.active)} className={`h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all ${member.active ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                  {member.active ? <><i className="bi bi-pause-circle mr-0.5"></i>নিষ্ক্রিয়</> : <><i className="bi bi-play-circle mr-0.5"></i>সক্রিয়</>}
                </button>
                <button onClick={() => onDelete(member)} className="h-7 px-2.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold hover:bg-red-100 transition-all ml-auto"><i className="bi bi-trash3"></i></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// REPORTS TAB
// ============================================
function ReportsTab({ reports, onEdit, onDelete }: {
  reports: Report[]; onEdit: (r: Report) => void; onDelete: (r: Report) => void;
}) {
  const [filterStatus, setFilterStatus] = useState("all");
  const statusColors: Record<string, string> = { pending: "bg-amber-100 text-amber-700", reviewing: "bg-blue-100 text-blue-700", resolved: "bg-green-100 text-green-700", dismissed: "bg-gray-100 text-gray-600" };
  const statusLabels: Record<string, string> = { pending: "পেন্ডিং", reviewing: "পর্যালোচনাধীন", resolved: "সমাধান হয়েছে", dismissed: "বাতিল" };

  const filtered = filterStatus === "all" ? reports : reports.filter(r => r.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-gray-900">রিপোর্ট ব্যবস্থাপনা</h2>
          <p className="text-xs text-gray-400 mt-0.5">মোট {reports.length}টি রিপোর্ট</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "সব" },
          { value: "pending", label: "পেন্ডিং", count: reports.filter(r => r.status === "pending").length },
          { value: "reviewing", label: "পর্যালোচনাধীন", count: reports.filter(r => r.status === "reviewing").length },
          { value: "resolved", label: "সমাধান", count: reports.filter(r => r.status === "resolved").length },
          { value: "dismissed", label: "বাতিল", count: reports.filter(r => r.status === "dismissed").length },
        ].map(f => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === f.value ? "gradient-primary-green text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {f.label} {f.count !== undefined && `(${f.count})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16"><i className="bi bi-flag text-5xl text-gray-200 mb-3 block"></i><p className="text-sm text-gray-400">কোনো রিপোর্ট নেই</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.sort((a, b) => b.createdAt - a.createdAt).map(report => (
            <div key={report.id} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-gray-900">{report.spotName}</h3>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColors[report.status]}`}>{statusLabels[report.status]}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                    <span><i className="bi bi-tag mr-1"></i>{report.type}</span>
                    {report.reporterName && <span><i className="bi bi-person mr-1"></i>{report.reporterName}</span>}
                    <span><i className="bi bi-clock mr-1"></i>{new Date(report.createdAt).toLocaleDateString("bn-BD")}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">{report.description}</p>
                  {report.adminNotes && <div className="mt-2 p-2.5 bg-blue-50 rounded-lg"><p className="text-[11px] text-blue-700 font-medium"><i className="bi bi-chat-left-text mr-1"></i>এডমিন নোট: {report.adminNotes}</p></div>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => onEdit(report)} className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all"><i className="bi bi-pencil text-xs"></i></button>
                  <button onClick={() => onDelete(report)} className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-all"><i className="bi bi-trash3 text-xs"></i></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// NOTIFICATIONS TAB
// ============================================
function NotificationsTab({ notifications, onAdd, onEdit, onDelete, onToggle }: {
  notifications: AppNotification[]; onAdd: () => void; onEdit: (n: AppNotification) => void;
  onDelete: (id: string, name: string) => void; onToggle: (id: string, active: boolean) => void;
}) {
  const typeColors: Record<string, string> = { info: "bg-blue-100 text-blue-700", warning: "bg-amber-100 text-amber-700", success: "bg-green-100 text-green-700", urgent: "bg-red-100 text-red-700" };
  const typeLabels: Record<string, string> = { info: "তথ্য", warning: "সতর্কতা", success: "সাফল্য", urgent: "জরুরি" };
  const typeIcons: Record<string, string> = { info: "bi-info-circle-fill", warning: "bi-exclamation-triangle-fill", success: "bi-check-circle-fill", urgent: "bi-bell-fill" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-gray-900">নোটিফিকেশন ব্যবস্থাপনা</h2>
          <p className="text-xs text-gray-400 mt-0.5">মোট {notifications.length}টি নোটিফিকেশন</p>
        </div>
        <button onClick={onAdd} className="h-10 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold hover:shadow-lg transition-all flex items-center gap-1.5">
          <i className="bi bi-plus-lg"></i> নতুন নোটিফিকেশন
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16"><i className="bi bi-bell text-5xl text-gray-200 mb-3 block"></i><p className="text-sm text-gray-400">কোনো নোটিফিকেশন নেই</p></div>
      ) : (
        <div className="space-y-3">
          {notifications.sort((a, b) => b.createdAt - a.createdAt).map(notif => (
            <div key={notif.id} className={`bg-white rounded-2xl p-4 border hover:shadow-lg transition-all duration-200 ${notif.active ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${typeColors[notif.type] || "bg-gray-100 text-gray-600"} flex items-center justify-center shrink-0`}>
                  <i className={`bi ${typeIcons[notif.type] || "bi-bell"} text-sm`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{notif.title}</h3>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${typeColors[notif.type]}`}>{typeLabels[notif.type]}</span>
                    {notif.active && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5"><i className="bi bi-clock mr-1"></i>{new Date(notif.createdAt).toLocaleDateString("bn-BD")}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => onToggle(notif.id, !notif.active)} className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${notif.active ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                    <i className={`bi ${notif.active ? "bi-toggle-on text-base" : "bi-toggle-off text-base"}`}></i>
                  </button>
                  <button onClick={() => onEdit(notif)} className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-all"><i className="bi bi-pencil text-xs"></i></button>
                  <button onClick={() => onDelete(notif.id, notif.title)} className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-all"><i className="bi bi-trash3 text-xs"></i></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// SETTINGS TAB
// ============================================
function SettingsTab({ settings, onSave }: {
  settings: SiteSettings | null; onSave: (d: Partial<SiteSettings>) => void;
}) {
  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Password change state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  // GitHub settings
  const [ghToken, setGhToken] = useState("");
  const [ghOwner, setGhOwner] = useState("mdmubarokhosin");
  const [ghRepo, setGhRepo] = useState("Free-Food-Map");
  const [ghLoading, setGhLoading] = useState(false);

  // Bohudur settings
  const [bohudurKey, setBohudurKey] = useState("");
  const [bohudurShowKey, setBohudurShowKey] = useState(false);
  const [bohudurLoading, setBohudurLoading] = useState(false);
  const [bohudurTestLoading, setBohudurTestLoading] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  // Load additional settings
  useEffect(() => {
    const loadExtra = async () => {
      const [ghSettings, bkSettings] = await Promise.all([
        fetchSettingsGroup("settings/github"),
        fetchSetting<string>("settings/bohudur/apiKey"),
      ]);
      if (ghSettings.token) setGhToken(ghSettings.token);
      if (ghSettings.owner) setGhOwner(ghSettings.owner);
      if (ghSettings.repo) setGhRepo(ghSettings.repo);
      if (bkSettings) setBohudurKey(bkSettings);
      setSettingsLoaded(true);
    };
    loadExtra();
  }, []);

  if (!settings || !form.siteName || !settingsLoaded) return <div className="text-center py-16"><div className="spinner mx-auto"></div></div>;

  const handleExportCSV = () => {
    if (!form.siteName) return;
    const csv = "export,data\nsite_name," + form.siteName;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `settings-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV এক্সপোর্ট সম্পন্ন");
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(form, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `settings-${new Date().toISOString().split("T")[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON এক্সপোর্ট সম্পন্ন");
  };

  const handlePasswordChange = async () => {
    if (!currentPwd || !newPwd) { toast.error("সব ফিল্ড পূরণ করুন"); return; }
    if (newPwd !== confirmPwd) { toast.error("নতুন পাসওয়ার্ড মিলছে না"); return; }
    if (newPwd.length < 6) { toast.error("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"); return; }
    setPwdLoading(true);
    try {
      await updateAdminPassword(currentPwd, newPwd);
      toast.success("পাসওয়ার্ড সফলভাবে আপডেট হয়েছে");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "পাসওয়ার্ড আপডেট ব্যর্থ");
    } finally { setPwdLoading(false); }
  };

  const handleGitHubSave = async () => {
    setGhLoading(true);
    try {
      await updateSettingsGroup("settings/github", { token: ghToken, owner: ghOwner, repo: ghRepo });
      toast.success("GitHub সেটিংস সংরক্ষিত হয়েছে");
    } catch { toast.error("সংরক্ষণ ব্যর্থ"); } finally { setGhLoading(false); }
  };

  const handleBohudurSave = async () => {
    setBohudurLoading(true);
    try {
      await updateSetting("settings/bohudur/apiKey", bohudurKey);
      toast.success("Bohudur সেটিংস সংরক্ষিত হয়েছে");
    } catch { toast.error("সংরক্ষণ ব্যর্থ"); } finally { setBohudurLoading(false); }
  };

  const handleBohudurTest = async () => {
    if (!bohudurKey) { toast.error("API Key দিন"); return; }
    setBohudurTestLoading(true);
    try {
      const result = await testBohudurConnection(bohudurKey);
      if (result.success) { toast.success(result.message); } else { toast.error(result.message); }
    } catch { toast.error("কানেকশন পরীক্ষা ব্যর্থ"); } finally { setBohudurTestLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-gray-900">সেটিংস</h2>
        <p className="text-xs text-gray-400 mt-0.5">সাইট কনফিগারেশন পরিবর্তন করুন</p>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2"><i className="bi bi-shield-lock mr-1.5 text-red-500"></i>পাসওয়ার্ড পরিবর্তন</h3>
        <div className="space-y-3">
          <div className="relative">
            <FInput label="বর্তমান পাসওয়ার্ড" type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="বর্তমান পাসওয়ার্ড" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FInput label="নতুন পাসওয়ার্ড" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="কমপক্ষে ৬ অক্ষর" />
            <FInput label="নতুন পাসওয়ার্ড নিশ্চিত করুন" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="আবার লিখুন" />
          </div>
          <button onClick={handlePasswordChange} disabled={pwdLoading} className="h-10 px-6 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all disabled:opacity-50">
            {pwdLoading ? <><div className="spinner spinner-sm inline-block mr-2 border-2 border-white/30 border-t-white"></div>আপডেট হচ্ছে...</> : <><i className="bi bi-key mr-1.5"></i>পাসওয়ার্ড আপডেট করুন</>}
          </button>
        </div>
      </div>

      {/* GitHub Image Upload Settings */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2"><i className="bi bi-github mr-1.5 text-gray-800"></i>GitHub ইমেজ আপলোড সেটিংস</h3>
        <p className="text-[11px] text-gray-400">স্পট ইমেজ GitHub রিপোতে আপলোড হবে</p>
        <div className="space-y-3">
          <FInput label="GitHub Personal Access Token" type="password" value={ghToken} onChange={e => setGhToken(e.target.value)} placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FInput label="Repository Owner" value={ghOwner} onChange={e => setGhOwner(e.target.value)} placeholder="mdmubarokhosin" />
            <FInput label="Repository Name" value={ghRepo} onChange={e => setGhRepo(e.target.value)} placeholder="Free-Food-Map" />
          </div>
          <button onClick={handleGitHubSave} disabled={ghLoading} className="h-10 px-6 rounded-xl bg-gray-800 text-white text-xs font-bold hover:bg-gray-900 transition-all disabled:opacity-50">
            {ghLoading ? <><div className="spinner spinner-sm inline-block mr-2 border-2 border-white/30 border-t-white"></div>সংরক্ষণ হচ্ছে...</> : <><i className="bi bi-check-lg mr-1.5"></i>সংরক্ষণ করুন</>}
          </button>
        </div>
      </div>

      {/* Bohudur Payment Settings */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2"><i className="bi bi-credit-card-2-front mr-1.5 text-orange-500"></i>Bohudur পেমেন্ট সেটিংস</h3>
        <p className="text-[11px] text-gray-400">অনুদান পেমেন্ট গেটওয়ে কনফিগারেশন</p>
        <div className="space-y-3">
          <div className="relative">
            <FInput label="API Key" type={bohudurShowKey ? "text" : "password"} value={bohudurKey} onChange={e => setBohudurKey(e.target.value)} placeholder="Bohudur API Key" />
            <button type="button" onClick={() => setBohudurShowKey(!bohudurShowKey)} className="absolute right-3 top-7 text-gray-400 hover:text-gray-600">
              <i className={`bi ${bohudurShowKey ? "bi-eye-slash" : "bi-eye"} text-sm`}></i>
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleBohudurSave} disabled={bohudurLoading} className="h-10 px-6 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-all disabled:opacity-50">
              {bohudurLoading ? <><div className="spinner spinner-sm inline-block mr-2 border-2 border-white/30 border-t-white"></div>সংরক্ষণ হচ্ছে...</> : <><i className="bi bi-check-lg mr-1.5"></i>সংরক্ষণ করুন</>}
            </button>
            <button onClick={handleBohudurTest} disabled={bohudurTestLoading} className="h-10 px-4 rounded-xl border border-orange-300 text-xs font-bold text-orange-600 hover:bg-orange-50 transition-all disabled:opacity-50">
              {bohudurTestLoading ? <><div className="spinner spinner-sm inline-block mr-2 border-2 border-orange-300 border-t-orange-500"></div>পরীক্ষা হচ্ছে...</> : <><i className="bi bi-lightning mr-1.5"></i>কানেকশন পরীক্ষা করুন</>}
            </button>
          </div>
        </div>
      </div>

      {/* General Site Settings */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2"><i className="bi bi-globe mr-1.5 text-emerald-600"></i>সাধারণ সেটিংস</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FInput label="সাইটের নাম" value={form.siteName || ""} onChange={e => setForm({ ...form, siteName: e.target.value })} />
          <FInput label="ডিফল্ট শহর" value={form.defaultCity || ""} onChange={e => setForm({ ...form, defaultCity: e.target.value })} />
        </div>
        <FTextarea label="সাইট বিবরণ" value={form.siteDescription || ""} onChange={e => setForm({ ...form, siteDescription: e.target.value })} rows={2} />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2"><i className="bi bi-telephone mr-1.5 text-blue-600"></i>যোগাযোগ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FInput label="ইমেইল" type="email" value={form.contactEmail || ""} onChange={e => setForm({ ...form, contactEmail: e.target.value })} />
          <FInput label="ফোন" value={form.contactPhone || ""} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FInput label="ফেসবুক URL" value={form.facebookUrl || ""} onChange={e => setForm({ ...form, facebookUrl: e.target.value })} />
          <FInput label="টুইটার URL" value={form.twitterUrl || ""} onChange={e => setForm({ ...form, twitterUrl: e.target.value })} />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2"><i className="bi bi-heart mr-1.5 text-rose-500"></i>অনুদান</h3>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div><p className="text-sm font-semibold text-gray-700">অনুদান সক্রিয়</p><p className="text-[11px] text-gray-400">অনুদান পৃষ্ঠা দেখান/লুকান</p></div>
          <button onClick={() => setForm({ ...form, donationEnabled: !form.donationEnabled })}
            className={`w-12 h-7 rounded-full transition-all ${form.donationEnabled ? "bg-green-500" : "bg-gray-300"} relative`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-all ${form.donationEnabled ? "left-6" : "left-1"}`} />
          </button>
        </div>
        <FTextarea label="অনুদান বার্তা" value={form.donationMessage || ""} onChange={e => setForm({ ...form, donationMessage: e.target.value })} rows={2} />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2"><i className="bi bi-wrench mr-1.5 text-slate-600"></i>রক্ষণাবেক্ষণ</h3>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div><p className="text-sm font-semibold text-gray-700">মেইনটেন্যান্স মোড</p><p className="text-[11px] text-gray-400">সাইট অফলাইনে রাখুন</p></div>
          <button onClick={() => setForm({ ...form, maintenanceMode: !form.maintenanceMode })}
            className={`w-12 h-7 rounded-full transition-all ${form.maintenanceMode ? "bg-red-500" : "bg-gray-300"} relative`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-all ${form.maintenanceMode ? "left-6" : "left-1"}`} />
          </button>
        </div>
        {form.maintenanceMode && <FTextarea label="মেইনটেন্যান্স বার্তা" value={form.maintenanceMessage || ""} onChange={e => setForm({ ...form, maintenanceMessage: e.target.value })} rows={2} />}
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2"><i className="bi bi-map mr-1.5 text-emerald-600"></i>ম্যাপ সেটিংস</h3>
        <div className="grid grid-cols-3 gap-4">
          <FInput label="মানচিত্র অক্ষাংশ" type="number" step="0.0001" value={form.mapCenterLat || 23.7596} onChange={e => setForm({ ...form, mapCenterLat: parseFloat(e.target.value) })} />
          <FInput label="মানচিত্র দ্রাঘিমাংশ" type="number" step="0.0001" value={form.mapCenterLng || 90.379} onChange={e => setForm({ ...form, mapCenterLng: parseFloat(e.target.value) })} />
          <FInput label="জুম লেভেল" type="number" min="1" max="18" value={form.mapZoom || 11} onChange={e => setForm({ ...form, mapZoom: parseInt(e.target.value) })} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => onSave(form)} className="h-10 px-6 rounded-xl gradient-primary-green text-white text-xs font-bold hover:shadow-lg hover:shadow-[#107539]/20 transition-all">
          <i className="bi bi-check-lg mr-1.5"></i>সংরক্ষণ করুন
        </button>
        <button onClick={handleExportJSON} className="h-10 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">
          <i className="bi bi-download mr-1.5"></i>JSON এক্সপোর্ট
        </button>
        <button onClick={handleExportCSV} className="h-10 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all">
          <i className="bi bi-filetype-csv mr-1.5"></i>CSV এক্সপোর্ট
        </button>
      </div>
    </div>
  );
}

// ============================================
// FORM MODALS
// ============================================

// SPOT FORM
function SpotFormModal({ modal, onClose, onSave }: { modal: { open: boolean; data?: Spot }; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    name: "", type: "daily_meal" as SpotType, address: "", area: "", city: "ঢাকা", country: "বাংলাদেশ",
    lat: 23.7596, lng: 90.379, openDays: [...DAY_ORDER] as string[], openTime: "12:00", closeTime: "14:00",
    notes: "", startDate: "", endDate: "", autoDelete: false, image: "",
  });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useState<HTMLInputElement | null>(null)[0];

  useEffect(() => {
    if (modal.data) {
      setForm({
        name: modal.data.name, type: modal.data.type, address: modal.data.address, area: modal.data.area,
        city: modal.data.city, country: modal.data.country, lat: modal.data.lat, lng: modal.data.lng,
        openDays: modal.data.openDays, openTime: modal.data.openTime, closeTime: modal.data.closeTime,
        notes: modal.data.notes || "", startDate: modal.data.startDate || "", endDate: modal.data.endDate || "",
        autoDelete: modal.data.autoDelete, image: (modal.data as any).image || "",
      });
      if ((modal.data as any).image) setImagePreview((modal.data as any).image);
    } else {
      setImagePreview(null);
    }
  }, [modal.data]);

  const toggleDay = (day: string) => {
    setForm(f => ({ ...f, openDays: f.openDays.includes(day) ? f.openDays.filter(d => d !== day) : [...f.openDays, day] }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('শুধুমাত্র ইমেজ ফাইল আপলোড করুন'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('ফাইল সাইজ ৫MB এর বেশি হতে পারবে না'); return; }
    // Show preview
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    // Upload
    setUploadingImage(true);
    try {
      const url = await uploadImageToGitHub(file);
      setForm(f => ({ ...f, image: url }));
      toast.success('ইমেজ আপলোড সফল!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ইমেজ আপলোড ব্যর্থ');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.city) { toast.error("নাম, ঠিকানা ও শহর আবশ্যক"); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <Modal open={modal.open} onClose={onClose} title={modal.data ? "স্পট সম্পাদনা" : "নতুন স্পট যোগ করুন"} maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Image Upload */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5"><i className="bi bi-image mr-1.5 text-emerald-600"></i>স্পট ইমেজ</label>
          <div className="relative">
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <img src={imagePreview} alt="প্রিভিউ" className="w-full h-40 object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <label className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors">
                    <i className="bi bi-pencil-fill text-white text-xs"></i>
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                  <button onClick={() => { setImagePreview(null); setForm(f => ({ ...f, image: '' })); }}
                    className="w-8 h-8 rounded-lg bg-red-500/80 backdrop-blur-sm flex items-center justify-center hover:bg-red-600 transition-colors">
                    <i className="bi bi-trash3 text-white text-xs"></i>
                  </button>
                </div>
                {uploadingImage && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><div className="spinner spinner-sm border-2 border-white/30 border-t-white"></div></div>}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all">
                {uploadingImage ? <div className="spinner spinner-sm border-2 border-gray-300 border-t-[#107539] mb-2"></div> : <><i className="bi bi-cloud-arrow-up text-2xl text-gray-300 mb-2"></i><span className="text-xs text-gray-400 font-medium">ক্লিক করে ইমেজ আপলোড করুন</span></>}
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" disabled={uploadingImage} />
              </label>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FInput label="স্পটের নাম *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="যেমন: কেন্দ্রীয় জামে মসজিদ ফ্রি ফুড" />
          <FSelect label="স্পট টাইপ" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as SpotType })}>
            {Object.entries(SPOT_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
          </FSelect>
        </div>
        <FInput label="ঠিকানা *" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="সম্পূর্ণ ঠিকানা" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FInput label="এলাকা" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="যেমন: গুলশান" />
          <FInput label="শহর *" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="ঢাকা" />
          <FInput label="দেশ" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FInput label="অক্ষাংশ" type="number" step="0.0001" value={form.lat} onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) || 0 })} />
          <FInput label="দ্রাঘিমাংশ" type="number" step="0.0001" value={form.lng} onChange={e => setForm({ ...form, lng: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">খোলার দিন</label>
          <div className="flex flex-wrap gap-1.5">
            {DAY_ORDER.map(day => (
              <button key={day} onClick={() => toggleDay(day)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${form.openDays.includes(day) ? "gradient-primary-green text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {DAY_SHORT_LABELS[day]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FInput label="খোলার সময়" type="time" value={form.openTime} onChange={e => setForm({ ...form, openTime: e.target.value })} />
          <FInput label="বন্ধের সময়" type="time" value={form.closeTime} onChange={e => setForm({ ...form, closeTime: e.target.value })} />
        </div>
        <FTextarea label="নোটস" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="অতিরিক্ত তথ্য..." rows={3} />
        <button onClick={handleSubmit} disabled={saving} className="w-full py-3 rounded-xl gradient-primary-green text-white text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50">
          {saving ? <><div className="spinner spinner-sm inline-block mr-2"></div>সংরক্ষণ হচ্ছে...</> : modal.data ? "আপডেট করুন" : "স্পট যোগ করুন"}
        </button>
      </div>
    </Modal>
  );
}

// EVENT FORM
function EventFormModal({ modal, onClose, onSave }: { modal: { open: boolean; data?: FoodEvent }; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    title: "", description: "", date: "", endDate: "", time: "", location: "", address: "",
    lat: 23.7596, lng: 90.379, organizer: "", contactPhone: "", foodType: "", estimatedPeople: 0,
    status: "upcoming" as FoodEvent["status"],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (modal.data) {
      setForm({
        title: modal.data.title, description: modal.data.description, date: modal.data.date,
        endDate: modal.data.endDate || "", time: modal.data.time, location: modal.data.location,
        address: modal.data.address, lat: modal.data.lat, lng: modal.data.lng,
        organizer: modal.data.organizer, contactPhone: modal.data.contactPhone || "",
        foodType: modal.data.foodType, estimatedPeople: modal.data.estimatedPeople || 0,
        status: modal.data.status,
      });
    }
  }, [modal.data]);

  const handleSubmit = async () => {
    if (!form.title || !form.date || !form.organizer) { toast.error("শিরোনাম, তারিখ ও আয়োজক আবশ্যক"); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <Modal open={modal.open} onClose={onClose} title={modal.data ? "ইভেন্ট সম্পাদনা" : "নতুন ইভেন্ট"} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <FInput label="ইভেন্ট শিরোনাম *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <FTextarea label="বিবরণ" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FInput label="তারিখ *" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <FInput label="সমাপ্তি তারিখ" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          <FInput label="সময়" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
          <FInput label="খাবারের ধরন" value={form.foodType} onChange={e => setForm({ ...form, foodType: e.target.value })} placeholder="যেমন: বিরিয়ানি, খিচুড়ি" />
          <FInput label="আনুমানিক লোকসংখ্যা" type="number" value={form.estimatedPeople} onChange={e => setForm({ ...form, estimatedPeople: parseInt(e.target.value) || 0 })} />
          <FSelect label="স্ট্যাটাস" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
            <option value="upcoming">আসন্ন</option>
            <option value="ongoing">চলমান</option>
            <option value="completed">সম্পন্ন</option>
            <option value="cancelled">বাতিল</option>
          </FSelect>
        </div>
        <FInput label="স্থানের নাম" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        <FInput label="ঠিকানা" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <FInput label="অক্ষাংশ" type="number" step="0.0001" value={form.lat} onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) || 0 })} />
          <FInput label="দ্রাঘিমাংশ" type="number" step="0.0001" value={form.lng} onChange={e => setForm({ ...form, lng: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FInput label="আয়োজক *" value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} />
          <FInput label="যোগাযোগ নম্বর" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
        </div>
        <button onClick={handleSubmit} disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50">
          {saving ? <><div className="spinner spinner-sm inline-block mr-2"></div>সংরক্ষণ হচ্ছে...</> : modal.data ? "আপডেট করুন" : "ইভেন্ট তৈরি করুন"}
        </button>
      </div>
    </Modal>
  );
}

// DONATION FORM
function DonationFormModal({ modal, onClose, onSave }: { modal: { open: boolean; data?: Donation }; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    donorName: "", donorPhone: "", amount: 0, currency: "BDT", method: "bkash",
    spotId: "", spotName: "", message: "", status: "pending" as Donation["status"], transactionId: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (modal.data) {
      setForm({
        donorName: modal.data.donorName, donorPhone: modal.data.donorPhone || "",
        amount: modal.data.amount, currency: modal.data.currency, method: modal.data.method,
        spotId: modal.data.spotId || "", spotName: modal.data.spotName || "",
        message: modal.data.message || "", status: modal.data.status, transactionId: modal.data.transactionId || "",
      });
    }
  }, [modal.data]);

  const handleSubmit = async () => {
    if (!form.donorName || form.amount <= 0) { toast.error("দাতার নাম ও পরিমাণ আবশ্যক"); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <Modal open={modal.open} onClose={onClose} title={modal.data ? "অনুদান সম্পাদনা" : "নতুন অনুদান"}>
      <div className="space-y-4">
        <FInput label="দাতার নাম *" value={form.donorName} onChange={e => setForm({ ...form, donorName: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <FInput label="পরিমাণ (৳) *" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
          <FSelect label="পদ্ধতি" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
            <option value="bkash">বিকাশ</option>
            <option value="nagad">নগদ</option>
            <option value="rocket">রকেট</option>
            <option value="bank">ব্যাংক ট্রান্সফার</option>
            <option value="cash">নগদ</option>
            <option value="other">অন্যান্য</option>
          </FSelect>
        </div>
        <FInput label="ফোন নম্বর" value={form.donorPhone} onChange={e => setForm({ ...form, donorPhone: e.target.value })} />
        <FSelect label="স্ট্যাটাস" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
          <option value="pending">পেন্ডিং</option>
          <option value="confirmed">নিশ্চিত</option>
          <option value="processing">প্রক্রিয়াধীন</option>
        </FSelect>
        <FInput label="ট্রানজাকশন আইডি" value={form.transactionId} onChange={e => setForm({ ...form, transactionId: e.target.value })} />
        <FInput label="স্পট নাম (ঐচ্ছিক)" value={form.spotName} onChange={e => setForm({ ...form, spotName: e.target.value })} />
        <FTextarea label="বার্তা" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={2} />
        <button onClick={handleSubmit} disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50">
          {saving ? <><div className="spinner spinner-sm inline-block mr-2"></div>সংরক্ষণ হচ্ছে...</> : modal.data ? "আপডেট করুন" : "অনুদান যোগ করুন"}
        </button>
      </div>
    </Modal>
  );
}

// TEAM FORM
function TeamFormModal({ modal, onClose, onSave }: { modal: { open: boolean; data?: TeamMember }; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    name: "", role: "", bio: "", avatar: "", phone: "", email: "",
    facebook: "", twitter: "", github: "", linkedin: "", order: 0, active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (modal.data) {
      setForm({
        name: modal.data.name, role: modal.data.role, bio: modal.data.bio || "",
        avatar: modal.data.avatar || "", phone: modal.data.phone || "", email: modal.data.email || "",
        facebook: modal.data.social?.facebook || "", twitter: modal.data.social?.twitter || "",
        github: modal.data.social?.github || "", linkedin: modal.data.social?.linkedin || "",
        order: modal.data.order, active: modal.data.active,
      });
    }
  }, [modal.data]);

  const handleSubmit = async () => {
    if (!form.name || !form.role) { toast.error("নাম ও পদবি আবশ্যক"); return; }
    setSaving(true);
    try {
      await onSave({
        name: form.name, role: form.role, bio: form.bio, avatar: form.avatar,
        phone: form.phone, email: form.email,
        social: { facebook: form.facebook, twitter: form.twitter, github: form.github, linkedin: form.linkedin },
        order: form.order, active: form.active,
      });
    } finally { setSaving(false); }
  };

  return (
    <Modal open={modal.open} onClose={onClose} title={modal.data ? "সদস্য সম্পাদনা" : "নতুন সদস্য"} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FInput label="নাম *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <FInput label="পদবি *" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
        </div>
        <FTextarea label="বায়ো" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={2} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FInput label="আভাটার URL" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} />
          <FInput label="ক্রম (Order)" type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
          <FInput label="ফোন" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <FInput label="ইমেইল" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FInput label="ফেসবুক" value={form.facebook} onChange={e => setForm({ ...form, facebook: e.target.value })} placeholder="facebook.com/username" />
          <FInput label="টুইটার" value={form.twitter} onChange={e => setForm({ ...form, twitter: e.target.value })} placeholder="twitter.com/username" />
          <FInput label="গিটহাব" value={form.github} onChange={e => setForm({ ...form, github: e.target.value })} placeholder="github.com/username" />
          <FInput label="লিংকডইন" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="linkedin.com/in/username" />
        </div>
        <button onClick={handleSubmit} disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50">
          {saving ? <><div className="spinner spinner-sm inline-block mr-2"></div>সংরক্ষণ হচ্ছে...</> : modal.data ? "আপডেট করুন" : "সদস্য যোগ করুন"}
        </button>
      </div>
    </Modal>
  );
}

// REPORT FORM
function ReportFormModal({ modal, onClose, onSave }: { modal: { open: boolean; data?: Report }; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({ status: "pending" as Report["status"], adminNotes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (modal.data) {
      setForm({ status: modal.data.status, adminNotes: modal.data.adminNotes || "" });
    }
  }, [modal.data]);

  const handleSubmit = async () => {
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <Modal open={modal.open} onClose={onClose} title="রিপোর্ট আপডেট">
      <div className="space-y-4">
        {modal.data && (
          <div className="bg-gray-50 rounded-xl p-3.5 space-y-1.5">
            <p className="text-sm font-bold text-gray-900">{modal.data.spotName}</p>
            <p className="text-xs text-gray-500"><i className="bi bi-tag mr-1"></i>{modal.data.type}</p>
            <p className="text-xs text-gray-500">{modal.data.description}</p>
          </div>
        )}
        <FSelect label="স্ট্যাটাস" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Report["status"] })}>
          <option value="pending">পেন্ডিং</option>
          <option value="reviewing">পর্যালোচনাধীন</option>
          <option value="resolved">সমাধান হয়েছে</option>
          <option value="dismissed">বাতিল</option>
        </FSelect>
        <FTextarea label="এডমিন নোট" value={form.adminNotes} onChange={e => setForm({ ...form, adminNotes: e.target.value })} rows={3} placeholder="নোট লিখুন..." />
        <button onClick={handleSubmit} disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50">
          {saving ? <><div className="spinner spinner-sm inline-block mr-2"></div>আপডেট হচ্ছে...</> : "আপডেট করুন"}
        </button>
      </div>
    </Modal>
  );
}

// NOTIFICATION FORM
function NotifFormModal({ modal, onClose, onSave }: { modal: { open: boolean; data?: AppNotification }; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    title: "", message: "", type: "info" as AppNotification["type"], active: true, expiresAt: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (modal.data) {
      setForm({
        title: modal.data.title, message: modal.data.message, type: modal.data.type,
        active: modal.data.active, expiresAt: modal.data.expiresAt ? new Date(modal.data.expiresAt).toISOString().split("T")[0] : "",
      });
    }
  }, [modal.data]);

  const handleSubmit = async () => {
    if (!form.title || !form.message) { toast.error("শিরোনাম ও বার্তা আবশ্যক"); return; }
    setSaving(true);
    try {
      await onSave({
        title: form.title, message: form.message, type: form.type, active: form.active,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).getTime() : undefined,
      });
    } finally { setSaving(false); }
  };

  const typeColors: Record<string, string> = { info: "text-blue-600", warning: "text-amber-600", success: "text-green-600", urgent: "text-red-600" };

  return (
    <Modal open={modal.open} onClose={onClose} title={modal.data ? "নোটিফিকেশন সম্পাদনা" : "নতুন নোটিফিকেশন"}>
      <div className="space-y-4">
        <FInput label="শিরোনাম *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <FTextarea label="বার্তা *" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} />
        <div className="grid grid-cols-2 gap-4">
          <FSelect label="টাইপ" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as AppNotification["type"] })}>
            <option value="info">তথ্য</option>
            <option value="warning">সতর্কতা</option>
            <option value="success">সাফল্য</option>
            <option value="urgent">জরুরি</option>
          </FSelect>
          <FInput label="মেয়াদ উত্তীর্ণ" type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div><p className="text-sm font-semibold text-gray-700">সক্রিয়</p><p className="text-[11px] text-gray-400">নোটিফিকেশন প্রদর্শিত হবে</p></div>
          <button onClick={() => setForm({ ...form, active: !form.active })}
            className={`w-12 h-7 rounded-full transition-all ${form.active ? "bg-green-500" : "bg-gray-300"} relative`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-all ${form.active ? "left-6" : "left-1"}`} />
          </button>
        </div>
        <button onClick={handleSubmit} disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50">
          {saving ? <><div className="spinner spinner-sm inline-block mr-2"></div>সংরক্ষণ হচ্ছে...</> : modal.data ? "আপডেট করুন" : "নোটিফিকেশন তৈরি করুন"}
        </button>
      </div>
    </Modal>
  );
}
