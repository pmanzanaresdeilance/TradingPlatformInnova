import { supabase } from '@/lib/supabase';

export interface RankingStats {
  user_id: string;
  username: string;
  avatar_url?: string;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  points: number;
}

export async function fetchTopTraders(): Promise<RankingStats[]> {
  const { data, error } = await supabase
    .from('trading_stats')
    .select(`
      *,
      users_profiles:user_id (
        username,
        avatar_url
      )
    `)
    .order('win_rate', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}

export async function fetchUserRanking(userId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_user_ranking', { user_id: userId });

  if (error) throw error;
  return data;
}