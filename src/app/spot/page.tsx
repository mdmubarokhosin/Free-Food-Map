"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchSpot, fetchReviews, addReview, incrementViewCount } from "@/lib/firebase-service";
import type { Spot, Review } from "@/types";
import { SPOT_TYPE_CONFIG } from "@/types";

function SpotDetailContent() {
  const searchParams = useSearchParams();
  const spotId = searchParams.get("id") || "";
  const [spot, setSpot] = useState<Spot | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!spotId) return;
    (async () => {
      const [s, r] = await Promise.all([fetchSpot(spotId), fetchReviews(spotId)]);
      setSpot(s);
      setReviews(r);
      setLoading(false);
      incrementViewCount(spotId).catch(() => {});
    })();
  }, [spotId]);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotId || !reviewForm.name.trim()) return;
    setSubmitting(true);
    try {
      await addReview(spotId, {
        userName: reviewForm.name.trim(),
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });
      const updated = await fetchReviews(spotId);
      setReviews(updated);
      setReviewForm({ name: "", rating: 5, comment: "" });
    } catch {}
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;
  if (!spot) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">স্পট পাওয়া যায়নি</div>;

  const config = SPOT_TYPE_CONFIG[spot.type] || SPOT_TYPE_CONFIG.other;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="text-white py-10 px-4 text-center bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500">
        <span className="text-4xl">{config.emoji}</span>
        <h1 className="text-2xl font-bold mt-2">{spot.name}</h1>
        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">{config.label}</span>
          {spot.verified && <span className="px-2 py-0.5 rounded-full bg-green-500 text-xs font-bold flex items-center gap-1"><i className="bi bi-patch-check-fill text-[10px]"></i> নিশ্চিত</span>}
          {spot.active ? <span className="px-2 py-0.5 rounded-full bg-green-500/80 text-xs font-bold">সক্রিয়</span> : <span className="px-2 py-0.5 rounded-full bg-red-500/80 text-xs font-bold">নিষ্ক্রিয়</span>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground"><i className="bi bi-geo-alt"></i></span>
            <span className="text-foreground">{spot.address || spot.area || spot.city}, {spot.country}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground"><i className="bi bi-clock"></i></span>
            <span className="text-foreground">{spot.openTime} - {spot.closeTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground"><i className="bi bi-calendar3"></i></span>
            <span className="text-foreground">সপ্তাহের দিন: {spot.openDays.length === 7 ? "প্রতিদিন" : spot.openDays.join(", ")}</span>
          </div>
          {spot.notes && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground"><i className="bi bi-pencil-square"></i></span>
              <span className="text-foreground">{spot.notes}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground"><i className="bi bi-people"></i></span>
            <span className="text-foreground">ভোট: <i className="bi bi-hand-thumbs-up text-green-500"></i> {spot.positiveVotes} / <i className="bi bi-hand-thumbs-down text-red-500"></i> {spot.negativeVotes}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground"><i className="bi bi-eye"></i></span>
            <span className="text-foreground">{spot.viewCount || 0} বার দেখা হয়েছে</span>
          </div>
          {spot.lat && spot.lng && (
            <div className="pt-2 flex gap-2">
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold text-center hover:shadow-md transition-all">
                <i className="bi bi-cursor-fill"></i> দিকনির্দেশনা
              </a>
              <a href={`https://www.google.com/maps?q=${spot.lat},${spot.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold hover:shadow-md transition-all">
                <i className="bi bi-map"></i>
              </a>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-lg">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><i className="bi bi-chat-square-text"></i> রিভিউ ({reviews.length})</h2>

          {/* Rating Summary */}
          <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-secondary/30">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{avgRating}</p>
              <p className="text-sm text-muted-foreground">{reviews.length} রিভিউ</p>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-4 text-muted-foreground">{star}</span>
                    <i className="bi bi-star-fill text-yellow-500 text-xs"></i>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="w-6 text-right text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Review Form */}
          <form onSubmit={handleReview} className="space-y-3 mb-6 p-4 rounded-xl bg-secondary/20">
            <input placeholder="আপনার নাম *" value={reviewForm.name}
              onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })} required
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">রেটিং:</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                  className={`text-xl ${s <= reviewForm.rating ? "" : "opacity-30"}`}>
                  <i className="bi bi-star-fill text-yellow-500"></i>
                </button>
              ))}
            </div>
            <textarea placeholder="আপনার মতামত..." value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button type="submit" disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm disabled:opacity-50 hover:shadow-md transition-all">
              {submitting ? "সংরক্ষণ হচ্ছে..." : "রিভিউ দিন"}
            </button>
          </form>

          {/* Reviews List */}
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="p-3 rounded-xl border border-border/50 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold">
                      {review.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{review.userName}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: review.rating }, (_, i) => (
                          <i key={i} className="bi bi-star-fill text-yellow-500 text-[10px]"></i>
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{new Date(review.createdAt).toLocaleDateString("bn-BD")}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {review.comment && <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>}
              </div>
            ))}
            {reviews.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">এখনো কোন রিভিউ নেই</p>}
          </div>
        </div>

        <div className="text-center pb-8">
          <a href="/" className="text-sm text-primary hover:underline"><i className="bi bi-house-fill"></i> মূল পৃষ্ঠায় ফিরে যান</a>
        </div>
      </div>
    </div>
  );
}

export default function SpotDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>}>
      <SpotDetailContent />
    </Suspense>
  );
}
