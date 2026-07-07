'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MessageSquarePlus, ThumbsUp } from 'lucide-react';
import type { Review } from '@/types';

function InteractiveStars({ rating, onRate, readonly = false, size = 'md' }: {
  rating: number;
  onRate?: (r: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}) {
  const iconClass = size === 'md' ? 'h-6 w-6' : 'h-4 w-4';
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onRate?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform duration-150`}
          >
            <Star
              className={`${iconClass} ${filled ? 'fill-amber-400 text-amber-400' : 'text-amber-400/25'}`}
            />
          </button>
        );
      })}
    </div>
  );
}

export function ReviewsSection({ businessId }: { businessId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userReviewId, setUserReviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = () => {
    api.get<{ reviews: Review[]; averageRating: number; totalReviews: number; userReviewId: string | null }>(
      `/api/reviews?businessId=${businessId}`
    ).then((data) => {
      setReviews(data.reviews || []);
      setAvgRating(data.averageRating || 0);
      setTotalReviews(data.totalReviews || 0);
      setUserReviewId(data.userReviewId);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadReviews(); }, [businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/reviews', { businessId, rating: formRating, comment: formComment || undefined });
      toast.success('Review submitted!');
      setFormRating(0);
      setFormComment('');
      setShowForm(false);
      loadReviews();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { star, count, pct };
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="text-center sm:text-left shrink-0">
              <p className="text-5xl font-extrabold text-foreground">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</p>
              {avgRating > 0 && (
                <div className="mt-2">
                  <InteractiveStars rating={Math.round(avgRating)} readonly size="sm" />
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 space-y-2">
              {ratingDistribution.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm w-3 text-right">{star}</span>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Write Review Button */}
      {!userReviewId && (
        <Button
          onClick={() => setShowForm(!showForm)}
          className="w-full gap-2"
          variant={showForm ? 'outline' : 'default'}
        >
          <MessageSquarePlus className="h-4 w-4" />
          {showForm ? 'Cancel' : 'Write a Review'}
        </Button>
      )}

      {userReviewId && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm">
          <ThumbsUp className="h-4 w-4 shrink-0" />
          You have already reviewed this business
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <Card className="border-primary/20 animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Share Your Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-sm mb-2 block">Your Rating *</Label>
                <InteractiveStars rating={formRating} onRate={setFormRating} />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Your Review</Label>
                <Textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Tell others about your experience..."
                  rows={3}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">{formComment.length}/500</p>
              </div>
              <Button type="submit" disabled={submitting || formRating === 0} size="sm">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <MessageSquarePlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium">No reviews yet</p>
            <p className="text-sm mt-1">Be the first to share your experience!</p>
          </div>
        ) : (
          reviews.map((review, idx) => (
            <Card key={review.id} className="overflow-hidden animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {review.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{review.user?.name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-semibold">{review.rating}</span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}