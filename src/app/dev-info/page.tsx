"use client";

import { useState, useEffect } from "react";
import { fetchTeamMembers, fetchStats } from "@/lib/firebase-service";
import type { TeamMember, AppStats } from "@/types";

export default function DevInfoPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [t, s] = await Promise.all([fetchTeamMembers(), fetchStats()]);
      setTeam(t);
      setStats(s);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-teal-700 via-emerald-600 to-teal-600 text-white py-12 px-4 text-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-orange-200/30 ring-4 ring-white/10">
          <i className="bi bi-cup-hot-fill text-3xl"></i>
        </div>
        <h1 className="text-3xl font-bold mb-2">ফ্রি ফুড ম্যাপ</h1>
        <p className="text-white/80 max-w-md mx-auto">
          বাংলাদেশে বিনামূল্যে খাবার বিতরণের স্থানগুলো খুঁজে বের করুন
        </p>
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats?.totalSpots?.toLocaleString("bn-BD") || 0}</p>
            <p className="text-xs text-white/70">স্পট</p>
          </div>
          <div className="w-px h-8 bg-white/30"></div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats?.verifiedSpots?.toLocaleString("bn-BD") || 0}</p>
            <p className="text-xs text-white/70">নিশ্চিত</p>
          </div>
          <div className="w-px h-8 bg-white/30"></div>
          <div className="text-center">
            <p className="text-2xl font-bold">4.8</p>
            <p className="text-xs text-white/70">রেটিং</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* About - anchor: about (moved to top) */}
        <div id="about" className="bg-card rounded-2xl p-6 border border-stone-200/60 dark:border-stone-700/40 text-center hover:shadow-lg transition-all duration-300">
          <h2 className="text-lg font-bold text-foreground mb-3">আমাদের সম্পর্কে</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ফ্রি ফুড ম্যাপ একটি কমিউনিটি-চালিত প্রকল্প যার লক্ষ্য হল বাংলাদেশে বিনামূল্যে খাবার বিতরণের
            স্থানগুলো সহজে খুঁজে পাওয়া। যেকেউ নতুন স্পট যোগ করতে পারে এবং কমিউনিটি ভোটিং এর মাধ্যমে
            স্পটগুলো যাচাই করা হয়। আমাদের লক্ষ্য হল কোনো মানুষ না খেয়ে থাকবে না।
          </p>
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium">Next.js 16</span>
            <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium">Firebase</span>
            <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium">Leaflet</span>
            <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium">Tailwind CSS</span>
          </div>
        </div>

        {/* How it Works - anchor: how-it-works */}
        <div id="how-it-works">
          <h2 className="text-xl font-bold text-foreground mb-4 text-center">বৈশিষ্ট্যসমূহ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: <i className="bi bi-geo-alt-fill text-2xl text-orange-500"></i>, title: "রিয়েল-টাইম লোকেশন", desc: "সরাসরি ম্যাপে ফ্রি ফুড স্পট দেখুন" },
              { icon: <i className="bi bi-patch-check-fill text-2xl text-emerald-500"></i>, title: "ভেরিফাইড স্পট", desc: "কমিউনিটি ভোটিং দিয়ে স্পট যাচাই" },
              { icon: <i className="bi bi-arrow-repeat text-2xl text-blue-500"></i>, title: "২৪/৭ আপডেট", desc: "নতুন স্পট রিয়েল-টাইমে যোগ হয়" },
              { icon: <i className="bi bi-star-fill text-2xl text-amber-500"></i>, title: "রিভিউ সিস্টেম", desc: "স্পট সম্পর্কে মতামত দিন ও পড়ুন" },
            ].map((f) => (
              <div key={f.title} className="bg-card rounded-xl p-4 border border-stone-200/60 dark:border-stone-700/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                {f.icon}
                <h3 className="text-sm font-bold text-foreground mt-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 text-center">আমাদের টিম</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {team.length > 0 ? team.map((member) => (
              <div key={member.id} className="bg-card rounded-xl p-4 border border-stone-200/60 dark:border-stone-700/40 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xl mx-auto">
                  {member.name.charAt(0)}
                </div>
                <h3 className="text-sm font-bold text-foreground mt-2">{member.name}</h3>
                <p className="text-xs text-muted-foreground">{member.role}</p>
                {member.social?.facebook && (
                  <a href={member.social.facebook} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-medium hover:bg-blue-500/20 transition-colors">
                    <i className="bi bi-facebook text-xs"></i> Facebook
                  </a>
                )}
              </div>
            )) : (
              <div className="col-span-2 text-center text-muted-foreground text-sm py-4">
                <p className="text-3xl mb-2"><i className="bi bi-people text-4xl text-stone-300"></i></p>
                টিম সদস্য শীঘ্রই যোগ হবে
              </div>
            )}
          </div>
        </div>

        {/* Contact - anchor: contact */}
        <div id="contact" className="text-center py-4">
          <a href="/" className="btn-accent text-base px-8 py-3.5">
            <i className="bi bi-cup-hot text-lg"></i> নতুন স্পট যোগ করুন
          </a>
        </div>

        <div className="text-center pb-8">
          <a href="/" className="text-sm text-primary hover:underline"><i className="bi bi-house-fill"></i> মূল পৃষ্ঠায় ফিরে যান</a>
        </div>
      </div>
    </div>
  );
}
