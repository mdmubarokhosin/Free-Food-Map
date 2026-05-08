'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Review } from '@/types';

interface ReviewsSectionProps {
  spotId: string;
  currentRating?: number;
  totalRatings?: number;
}

const STAR_VALUES = [1, 2, 3, 4, 5];

export default function ReviewsSection({
  spotId,
  currentRating = 0,
  totalRatings = 0,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews?spotId=${spotId}`);
        const data = await response.json();
        if (data.success) {
          setReviews(data.reviews);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [spotId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !userName.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotId,
          userName: userName.trim(),
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setReviews(prev => [data.review, ...prev]);
        setUserName('');
        setRating(0);
        setComment('');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <i className="bi bi-star-fill text-yellow-500 text-lg"></i>
          রেটিং ও রিভিউ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating Summary */}
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div className="text-3xl font-bold text-yellow-600">
            {currentRating > 0 ? currentRating.toFixed(1) : '-'}
          </div>
          <div>
            <div className="flex">
              {STAR_VALUES.map(star => (
                <i className={`bi ${star <= Math.round(currentRating) ? 'bi-star-fill text-yellow-500' : 'bi-star text-gray-300'} text-xs`}></i>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalRatings} টি রেটিং
            </p>
          </div>
        </div>

        {/* Add Review Form */}
        <form onSubmit={handleSubmit} className="space-y-3 p-3 border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="userName" className="text-sm">আপনার নাম</Label>
            <Input
              id="userName"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="নাম লিখুন"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">রেটিং দিন</Label>
            <div className="flex gap-1">
              {STAR_VALUES.map(star => (
                <button
                  key={star}
                  type="button"
                  className="p-1"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <i className={`bi ${star <= (hoverRating || rating) ? 'bi-star-fill text-yellow-500' : 'bi-star text-gray-300'} text-lg transition-colors`}></i>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm">মন্তব্য (ঐচ্ছিক)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="আপনার অভিজ্ঞতা শেয়ার করুন..."
              rows={2}
            />
          </div>

          <Button
            type="submit"
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            disabled={submitting || rating === 0 || !userName.trim()}
          >
            {submitting ? (
              <i className="bi bi-arrow-repeat text-sm animate-spin"></i>
            ) : (
              <>
                <i className="bi bi-send text-sm mr-1"></i>
                জমা দিন
              </>
            )}
          </Button>
        </form>

        {/* Reviews List */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <i className="bi bi-arrow-repeat text-base animate-spin text-green-600"></i>
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন!
          </p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {reviews.map(review => (
              <div key={review.id} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <i className="bi bi-person text-xs text-muted-foreground"></i>
                  <span className="font-medium text-sm">{review.userName}</span>
                  <div className="flex ml-auto">
                    {STAR_VALUES.map(star => (
                      <i className={`bi ${star <= review.rating ? 'bi-star-fill text-yellow-500' : 'bi-star text-gray-300'} text-xs`}></i>
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(review.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
