"use client";

import { useState, useEffect } from "react";
import { fetchDonations, fetchDonationStats } from "@/lib/firebase-service";
import type { Donation, DonationStats } from "@/types";

export default function DonatePage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats>({ total: 0, donors: 0, sponsoredSpots: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [d, s] = await Promise.all([fetchDonations(), fetchDonationStats()]);
      setDonations(d.filter((x) => x.status === "confirmed"));
      setStats(s);
      setLoading(false);
    })();
  }, []);

  const paymentMethods = [
    { name: "bKash", number: "০১XXXXXXXXX", color: "#E2136E", icon: <i className="bi bi-phone text-2xl text-pink-500"></i> },
    { name: "Nagad", number: "০১XXXXXXXXX", color: "#F6921E", icon: <i className="bi bi-phone text-2xl text-orange-500"></i> },
    { name: "Rocket", number: "০১XXXXXXXXX", color: "#8C3494", icon: <i className="bi bi-credit-card text-2xl text-purple-500"></i> },
    { name: "ব্যাংক ট্রান্সফার", number: "অ্যাকাউন্ট: XXXXXXXX", color: "#1a5276", icon: <i className="bi bi-bank text-2xl text-blue-600"></i> },
  ];

  const tiers = [
    { name: "বেসিক", range: "৳১০০ - ৳৪৯৯", color: "bg-gradient-to-r from-blue-500 to-blue-600", benefits: ["ধন্যবাদ মেসেজ", "ওয়েবসাইটে নাম"] },
    { name: "হেল্পার", range: "৳৫০০ - ৳১,৯৯৯", color: "bg-gradient-to-r from-emerald-500 to-green-600", benefits: ["সব বেসিক সুবিধা", "স্পট স্পন্সরশিপ"] },
    { name: "স্পন্সর", range: "৳২,০০০ - ৳৪,৯৯৯", color: "bg-gradient-to-r from-orange-500 to-amber-500", benefits: ["সব হেল্পার সুবিধা", "লোগো প্রদর্শন", "প্রায়োরিটি সাপোর্ট"], popular: true },
    { name: "মেজর", range: "৳৫,০০০+", color: "bg-gradient-to-r from-purple-500 to-violet-600", benefits: ["সব স্পন্সর সুবিধা", "বিশেষ রিপোর্ট", "টিমের সাথে মিটিং"] },
  ];

  const [copied, setCopied] = useState<string | null>(null);

  const copyNumber = (number: string, name: string) => {
    navigator.clipboard.writeText(number).catch(() => {});
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary-green text-white py-12 px-4 text-center relative overflow-hidden">
        <h1 className="text-3xl font-bold mb-2"><i className="bi bi-heart-fill"></i> অনুদান করুন</h1>
        <p className="text-white/80 max-w-md mx-auto">
          দরিদ্রদের জন্য বিনামূল্যে খাবার বিতরণে আমাদের সাথে যুক্ত হন। আপনার একটু সাহায্যে কারো অন্ন হতে পারে।
        </p>
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold">৳{stats.total.toLocaleString("bn-BD")}</p>
            <p className="text-xs text-white/70">মোট অনুদান</p>
          </div>
          <div className="w-px h-8 bg-white/30"></div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.donors.toLocaleString("bn-BD")}</p>
            <p className="text-xs text-white/70">দাতা</p>
          </div>
          <div className="w-px h-8 bg-white/30"></div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.sponsoredSpots}</p>
            <p className="text-xs text-white/70">স্পন্সরড স্পট</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Donation Tiers */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">অনুদানের স্তর</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tiers.map((tier) => (
              <div key={tier.name} className={`relative bg-card rounded-2xl p-5 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${tier.popular ? "border-2 border-orange-400 shadow-lg shadow-orange-100/50 ring-1 ring-orange-200/30" : "border-stone-200/60 dark:border-stone-700/40"}`}>
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full gradient-orange-fab text-white text-xs font-bold">
                    <i className="bi bi-star-fill text-[10px]"></i> জনপ্রিয়
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl ${tier.color} text-white flex items-center justify-center text-white font-bold`}>
                  {tier.name.charAt(0)}
                </div>
                <h3 className="text-lg font-bold text-foreground mt-3">{tier.name}</h3>
                <p className="text-sm text-orange-500 font-semibold">{tier.range}</p>
                <ul className="mt-3 space-y-1">
                  {tier.benefits.map((b, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <i className="bi bi-check-circle-fill text-emerald-500 text-xs"></i> {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">পেমেন্ট পদ্ধতি</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paymentMethods.map((pm) => (
              <div key={pm.name} className="bg-card rounded-xl p-4 border border-stone-200/60 dark:border-stone-700/40 flex items-center justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3">
                  {pm.icon}
                  <div>
                    <p className="text-sm font-bold text-foreground">{pm.name}</p>
                    <p className="text-xs text-muted-foreground">{pm.number}</p>
                  </div>
                </div>
                <button
                  onClick={() => copyNumber(pm.number, pm.name)}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  {copied === pm.name ? <span><i className="bi bi-check-circle text-emerald-500"></i> কপি হয়েছে</span> : <span><i className="bi bi-clipboard text-xs"></i> কপি</span>}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Donors */}
        {donations.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">সাম্প্রতিক দাতাগণ</h2>
            <div className="space-y-2">
              {donations.slice(0, 10).map((d) => (
                <div key={d.id} className="bg-card rounded-xl p-3 border border-stone-200/60 dark:border-stone-700/40 flex items-center justify-between hover:shadow-md transition-all duration-300">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.donorName}</p>
                    <p className="text-xs text-muted-foreground">{d.method} • {new Date(d.createdAt).toLocaleDateString("bn-BD")}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-bold">৳{d.amount.toLocaleString("bn-BD")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">সচরাচর জিজ্ঞাসা</h2>
          <div className="space-y-3">
            {[
              { q: "অনুদান কীভাবে ব্যবহৃত হয়?", a: "আপনার অনুদান সম্পূর্ণ বিনামূল্যে খাবার ক্রয়, রান্না এবং বিতরণে ব্যবহৃত হয়।" },
              { q: "আমি কি রসিদ পাব?", a: "হ্যাঁ, অনুদানের পর আপনি একটি ইমেইল রসিদ পাবেন।" },
              { q: "ট্রান্সপারেন্সি কীভাবে নিশ্চিত করা হয়?", a: "আমরা নিয়মিত আর্থিক রিপোর্ট প্রকাশ করি এবং প্রতিটি অনুদানের ব্যবহার ট্র্যাক করি।" },
            ].map((item, i) => (
              <div key={i} className="bg-card rounded-xl p-4 border border-stone-200/60 dark:border-stone-700/40 hover:shadow-md transition-all duration-300">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2"><i className="bi bi-question-circle text-orange-500"></i> {item.q}</h4>
                <p className="text-sm text-muted-foreground mt-1">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center pb-8">
          <a href="/" className="text-sm text-primary hover:underline"><i className="bi bi-house-fill"></i> মূল পৃষ্ঠায় ফিরে যান</a>
        </div>
      </div>
    </div>
  );
}
