import { supabase } from '@/lib/supabase';

export interface BacktestingVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail_url: string;
  views: number;
  category: string;
  fxreplay_link: string;
  required_membership: 'free' | 'premium' | 'elite';
  created_at: string;
}

export async function fetchBacktestingVideos(): Promise<BacktestingVideo[]> {
  const { data, error } = await supabase
    .from('backtesting_videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchBacktestingStats() {
  const { data, error } = await supabase
    .rpc('get_backtesting_stats');

  if (error) throw error;
  return data;
}