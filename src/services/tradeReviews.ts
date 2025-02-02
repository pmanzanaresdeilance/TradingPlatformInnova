import { supabase } from '@/lib/supabase';

export interface TradeReview {
  id: string;
  user_id: string;
  reviewer_id?: string;
  image_url: string;
  description: string;
  pair: string;
  timeframe: string;
  status: 'pending' | 'reviewed';
  feedback?: string;
  outcome?: 'win' | 'loss' | 'pending';
  created_at: string;
  reviewed_at?: string;
}

export async function submitTradeReview(reviewData: Partial<TradeReview>) {
  const { data, error } = await supabase
    .from('trade_reviews')
    .insert(reviewData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchUserTradeReviews(userId: string) {
  const { data, error } = await supabase
    .from('trade_reviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Instructor functions
export async function fetchPendingTradeReviews() {
  const { data, error } = await supabase
    .from('trade_reviews')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function submitTradeReviewFeedback(
  reviewId: string,
  feedback: string,
  outcome: 'win' | 'loss'
) {
  const { data, error } = await supabase
    .from('trade_reviews')
    .update({
      feedback,
      outcome,
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),
      reviewer_id: supabase.auth.getUser().then(({ data }) => data.user?.id)
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
}