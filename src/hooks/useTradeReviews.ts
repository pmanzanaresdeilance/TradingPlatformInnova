import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserTradeReviews, fetchPendingTradeReviews } from '@/services/tradeReviews';
import { TradeReview } from '@/services/tradeReviews';

export function useTradeReviews(isInstructor = false) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<TradeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadReviews = async () => {
      try {
        setLoading(true);
        const data = isInstructor
          ? await fetchPendingTradeReviews()
          : await fetchUserTradeReviews(user.id);
        setReviews(data);
      } catch (err) {
        setError('Failed to load trade reviews');
      } finally {
        setLoading(false);
      }
    };

    loadReviews();

    // Set up real-time subscription
    const subscription = supabase
      .channel('trade_reviews_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_reviews',
          filter: isInstructor
            ? `status=eq.pending`
            : `user_id=eq.${user.id}`
        },
        (payload) => {
          loadReviews();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, isInstructor]);

  return { reviews, loading, error };
}