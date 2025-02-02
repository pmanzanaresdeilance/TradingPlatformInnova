import { supabase } from '@/lib/supabase';
import { TradingStats, MarketEvent } from '@/types';

export async function fetchUserStats(userId: string): Promise<TradingStats> {
  const { data, error } = await supabase
    .from('trading_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMarketUpdates(): Promise<MarketEvent[]> {
  const { data, error } = await supabase
    .from('market_updates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data;
}

export async function fetchCommunityHighlights() {
  const { data, error } = await supabase
    .from('community_posts')
    .select(`
      *,
      users_profiles:user_id (
        username,
        avatar_url,
        subscription_tier
      )
    `)
    .order('likes', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data;
}